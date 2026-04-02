// Salvage Market panel — sell salvage, pay debt, manage hub inventory.
// Rebel economy framing: shadowy, unregistered, where Nexus "chooses not to know."

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import { SalvageTier, SALVAGE_DEFS } from '../content/salvage';
import { SALVAGE_MARKET_LISTINGS, canAffordListing, isHardwareOwned } from '../content/salvage-market';
import { HARDWARE_ITEMS } from '../content/hardware';
import {
  getRandomMarketTitle,
  getRandomTraderIntro,
  getRandomAmbientFlavor,
  getHardwareTraderNote,
  REBEL_MARKET_COLORS,
} from '../content/salvage-market-narrative';
import { drawDimOverlay, PanelAnimator } from './panel-overlay';
import { feedbackLayer } from './feedback-layer';
import {
  drawPanelBg,
  drawSectionHeader,
  drawPanelBtn,
  drawEmptyState,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_DIM,
  BORDER_DEFAULT,
} from './shared-panel-style';
import { setBounds } from './tutorial-bounds';

export type PanelContext = 'meta' | 'dive';

export type SalvageMarketAction =
  | { type: 'BUY_MARKET_ITEM'; hardwareId: string }
  | { type: 'CLOSE_MARKET' };

// ── Panel geometry (90% of 1920×1080 with 20px margin) ──────────────────────
export const PX = 110;
export const PY = 65;
export const PW = 1700;
export const PH = 950;
export const PAD = 40;

// ── Button sizes ─────────────────────────────────────────────────────────────
const SELL1_W = 140;
const SELL1_H = 44;
const ACTION_BTN_W = 240;
const ACTION_BTN_H = 50;
const CLOSE_W = 140;
const CLOSE_H = 46;

// Tier display order
const TIER_ORDER: SalvageTier[] = ['scrap', 'components', 'relic', 'medtech'];

// Module state
let currentSalvagePage = 0;

// Module-level press tracking (survives frame boundaries)
let pressedBtn: string | null = null;

// Market narrative state — randomized per session
let marketTitle = getRandomMarketTitle();
let traderIntro = getRandomTraderIntro();
let ambientFlavor = getRandomAmbientFlavor();

/** Reset the market narrative state when opening panel. */
export function resetMarketNarrative(): void {
  marketTitle = getRandomMarketTitle();
  traderIntro = getRandomTraderIntro();
  ambientFlavor = getRandomAmbientFlavor();
}

/** Reset the salvage market page when opening the panel. */
export function resetSalvagePage(): void {
  currentSalvagePage = 0;
  resetMarketNarrative();
}

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

function registerBtn(
  id: string,
  mx: number,
  my: number,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const input = MakkoEngine.input;
  const over = isOver(mx, my, x, y, w, h);
  if (input.isMousePressed(0) && over) pressedBtn = id;
  if (input.isMouseReleased(0)) {
    const wasPressed = pressedBtn === id;
    if (id === pressedBtn) pressedBtn = null;
    return wasPressed && over;
  }
  return false;
}

function getDebtThermometerColor(ratio: number): string {
  if (ratio > 0.5) return REBEL_MARKET_COLORS.accentGlow;
  if (ratio > 0.25) return '#f6ad55';
  return '#fc8181';
}

export function renderSalvageMarket(
  meta: MetaState,
  mx: number,
  my: number,
  animator?: PanelAnimator,
  context: PanelContext = 'meta',
): SalvageMarketAction | null {
  const panelAnimator = animator ?? new PanelAnimator(200);
  panelAnimator.open(); // Ensure animator is in open state if not provided
  const display = MakkoEngine.display;
  const now = performance.now();

  // Clear pressedBtn on any release (safety valve for missed releases)
  if (MakkoEngine.input.isMouseReleased(0) && pressedBtn !== null) {
    // Will be cleared per-button in registerBtn; nothing extra needed
  }

  // ── Dim overlay (drawn before panel) ─────────────────────────────────────
  drawDimOverlay(display, 0.70);

  // ── Animation scale (centered on panel) ────────────────────────────────────
  const scale = panelAnimator.getScale(now);
  const cx = PX + PW / 2;
  const cy = PY + PH / 2;

  // Compute scaled panel rect
  const scaledW = PW * scale;
  const scaledH = PH * scale;
  const scaledX = cx - scaledW / 2;
  const scaledY = cy - scaledH / 2;

  // ── Panel background (scaled) with rebel market styling ──────────────────
  display.pushClipRect(scaledX, scaledY, scaledW, scaledH);
  drawPanelBg(display, PX, PY, PW, PH, REBEL_MARKET_COLORS.border, scale, scaledX, scaledY, scaledW, scaledH);

  // Content offset for scaling - apply to all content coordinates
  const contentX = scaledX + PAD * scale;
  const contentY = scaledY + PAD * scale;
  const contentW = scaledW - PAD * 2 * scale;
  // Helper for scaled coordinates
  const sx = (x: number) => scaledX + (x - PX) * scale;
  const sy = (y: number) => scaledY + (y - PY) * scale;
  const sw = (w: number) => w * scale;
  const sh = (h: number) => h * scale;

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerY = PY + PAD + 20;
  // Rebel market title — atmospheric, unregistered
  display.drawText(marketTitle, sx(PX + PW / 2), sy(headerY), {
    font: `bold ${Math.floor(56 * scale)}px monospace`,
    fill: REBEL_MARKET_COLORS.accentGlow,
    align: 'center',
    baseline: 'top',
  });

  // ── Trader Intro ────────────────────────────────────────────────────────────
  const introY = headerY + 70;
  display.drawText(traderIntro, sx(PX + PW / 2), sy(introY), {
    font: `${Math.floor(24 * scale)}px monospace`,
    fill: REBEL_MARKET_COLORS.textMuted,
    align: 'center',
    baseline: 'top',
  });

  // Echo display in header
  display.drawText(
    `⬡ ${meta.voidEcho}`,
    sx(PX + PW - PAD),
    sy(headerY + 60),
    { font: `bold ${Math.floor(40 * scale)}px monospace`, fill: '#9f7aea', align: 'right', baseline: 'top' },
  );

  // Horizontal separator
  const separatorY = context === 'dive' ? headerY + 80 : headerY + 50;
  display.drawLine(sx(PX + PAD), sy(separatorY), sx(PX + PW - PAD), sy(separatorY), {
    stroke: BORDER_DEFAULT, lineWidth: 1,
  });

  // ── Column headers ──────────────────────────────────────────────────────────
  const listStartY = PY + 200; // Adjusted for trader intro text
  const colHeaders = ['ITEM', 'QTY', 'VALUE EA.', 'TOTAL'];
  const colX = [PX + PAD, PX + PAD + 300, PX + PAD + 420, PX + PAD + 580];
  for (let i = 0; i < colHeaders.length; i++) {
    drawSectionHeader(
      display, colHeaders[i],
      sx(colX[i]), sy(listStartY - 30),
      REBEL_MARKET_COLORS.accent, scale,
      scaledX, scaledY, scaledW,
    );
  }

  // ── Inventory rows (display only, no sell buttons) ─────────────────────────
  let action: SalvageMarketAction | null = null;
  let rowY = listStartY;
  let rowIndex = 0;

  for (const tier of TIER_ORDER) {
    const entry = meta.hubInventory.find((e) => e.tier === tier && e.quantity > 0);
    if (!entry) continue;

    const def = SALVAGE_DEFS[tier];

    // Alternating row background with rebel market colors
    const rowBg = rowIndex % 2 === 0 ? REBEL_MARKET_COLORS.bgCard : REBEL_MARKET_COLORS.bgDark;
    display.drawRect(sx(PX + PAD), sy(rowY), sw(PW - PAD * 2), sh(60), { fill: rowBg });

    // Tier label (keeps tier-specific color)
    display.drawText(def.label, sx(PX + PAD + 10), sy(rowY + 15), {
      font: `${Math.floor(32 * scale)}px monospace`, fill: def.color, align: 'left', baseline: 'middle',
    });

    // Quantity
    display.drawText(`×${entry.quantity}`, sx(PX + PAD + 300), sy(rowY + 15), {
      font: `bold ${Math.floor(32 * scale)}px monospace`, fill: TEXT_PRIMARY, align: 'left', baseline: 'middle',
    });

    // Used for (building material)
    display.drawText('Build material', sx(PX + PAD + 450), sy(rowY + 15), {
      font: `${Math.floor(28 * scale)}px monospace`, fill: TEXT_DIM, align: 'left', baseline: 'middle',
    });

    rowY += 60;
    rowIndex++;
  }

  // Empty state
  if (meta.hubInventory.filter((e) => e.quantity > 0).length === 0) {
    drawEmptyState(
      display, 'No salvage in inventory.',
      sx(PX + PAD), sy(listStartY + 80), sw(PW - PAD * 2),
      scale,
      scaledX, scaledY,
    );
  }
  setBounds('salvage-inventory', { x: PX + PAD, y: listStartY, w: PW - PAD * 2, h: rowY - listStartY });

  // ── Hardware Market section ────────────────────────────────────────────────
  const hwSectionY = rowY + 40;
  const HW_ROW_H = 110; // Increased height for trader notes
  const HW_COL_W = 400;
  const HW_GAP = 16;
  const hwCols = 2;

  drawSectionHeader(
    display, 'HARDWARE EXCHANGE',
    sx(PX + PAD), sy(hwSectionY),
    REBEL_MARKET_COLORS.accent, scale,
    scaledX, scaledY, scaledW,
  );

  let hwRowY = hwSectionY + 40;
  let hwIndex = 0;

  for (const listing of SALVAGE_MARKET_LISTINGS) {
    const item = HARDWARE_ITEMS.find((i) => i.id === listing.hardwareId);
    if (!item) continue;

    const col = hwIndex % hwCols;
    const row = Math.floor(hwIndex / hwCols);
    const hwX = PX + PAD + col * (HW_COL_W + HW_GAP);
    const hwY = hwRowY + row * (HW_ROW_H + HW_GAP);

    // Check ownership and affordability
    const owned = isHardwareOwned(
      listing.hardwareId,
      meta.equippedItems,
      meta.itemInventory,
    );
    const canAfford = canAffordListing(
      listing,
      meta.voidEcho,
      meta.hubInventory,
    );

    // Card background with rebel market styling
    const cardBg = owned ? REBEL_MARKET_COLORS.bgDark : canAfford ? REBEL_MARKET_COLORS.bgCard : '#1a1510';
    const borderColor = owned ? '#2d3748' : canAfford ? REBEL_MARKET_COLORS.borderHighlight : '#553322';
    display.drawRect(sx(hwX), sy(hwY), sw(HW_COL_W), sh(HW_ROW_H), {
      fill: cardBg,
      stroke: borderColor,
      lineWidth: 1,
    });

    // Item name
    display.drawText(item.name, sx(hwX + 12), sy(hwY + 8), {
      font: `bold ${Math.floor(34 * scale)}px monospace`,
      fill: owned ? '#4a5568' : TEXT_PRIMARY,
      align: 'left',
      baseline: 'top',
    });

    // Effect description (truncated)
    const shortDesc = item.description.length > 40
      ? item.description.slice(0, 37) + '...'
      : item.description;
    display.drawText(shortDesc, sx(hwX + 12), sy(hwY + 38), {
      font: `${Math.floor(26 * scale)}px monospace`,
      fill: owned ? '#4a5568' : TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });

    // Trader note — narrative description of why scavengers want this item
    const traderNote = getHardwareTraderNote(item.id);
    const shortNote = traderNote.length > 55
      ? traderNote.slice(0, 52) + '...'
      : traderNote;
    display.drawText(shortNote, sx(hwX + 12), sy(hwY + 64), {
      font: `${Math.floor(22 * scale)}px monospace`,
      fill: REBEL_MARKET_COLORS.textMuted,
      align: 'left',
      baseline: 'top',
    });

    // Cost display (echo + salvage)
    const salvageDef = SALVAGE_DEFS[listing.salvageTier];
    const costText = owned
      ? 'OWNED'
      : `⬡${listing.echoCost} + ${listing.salvageCost} ${salvageDef.label}`;
    display.drawText(costText, sx(hwX + HW_COL_W - 12), sy(hwY + 10), {
      font: `${Math.floor(30 * scale)}px monospace`,
      fill: owned ? '#4a5568' : '#9f7aea',
      align: 'right',
      baseline: 'top',
    });

    // Purchase button (only for affordable, unowned items)
    if (!owned) {
      const buyW = 80;
      const buyH = 28;
      const buyX = hwX + HW_COL_W - buyW - 12;
      const buyY = hwY + HW_ROW_H - buyH - 8;
      const buyHover = canAfford && isOver(mx, my, sx(buyX), sy(buyY), sw(buyW), sh(buyH));

      if (canAfford) {
        drawPanelBtn(
          display, '[Buy]',
          sx(buyX), sy(buyY), sw(buyW), sh(buyH),
          buyHover, 'success', scale,
          scaledX, scaledY, scaledW, scaledH,
        );
        if (registerBtn(`buy_hw_${listing.hardwareId}`, mx, my, sx(buyX), sy(buyY), sw(buyW), sh(buyH))) {
          action = { type: 'BUY_MARKET_ITEM', hardwareId: listing.hardwareId };
          feedbackLayer.spawn('PURCHASED', sx(buyX + buyW / 2), sy(buyY - 10), REBEL_MARKET_COLORS.accentGlow);
        }
      } else {
        // Disabled button
        display.drawRoundRect(sx(buyX), sy(buyY), sw(buyW), sh(buyH), 6 * scale, {
          fill: '#1a202c',
          stroke: '#4a5568',
          lineWidth: 1,
        });
        display.drawText('[Buy]', sx(buyX + buyW / 2), sy(buyY + buyH / 2), {
          font: `${Math.floor(30 * scale)}px monospace`,
          fill: '#4a5568',
          align: 'center',
          baseline: 'middle',
        });
      }
    }

    hwIndex++;
  }

  // Calculate where the debt section starts based on hardware rows
  const hwRows = Math.ceil(SALVAGE_MARKET_LISTINGS.length / hwCols);
  const hwTotalHeight = hwRows * (HW_ROW_H + HW_GAP) + 80;

  // ── Section spacing ─────────────────────────────────────────────────────────
  const actionSectionY = hwSectionY + hwTotalHeight + 40;

  // ── Build material info ───────────────────────────────────────────────────
  const infoX = PX + PAD;
  const infoY = actionSectionY;
  display.drawText('Salvage is used for module upgrades and ship repairs', sx(infoX), sy(infoY), {
    font: `${Math.floor(28 * scale)}px monospace`,
    fill: TEXT_DIM,
    align: 'left',
    baseline: 'top',
  });

  // ── Ambient Flavor ────────────────────────────────────────────────────────
  // Atmospheric description of the market at bottom of panel
  const flavorY = PY + PH - PAD - 80;
  display.drawText(ambientFlavor, sx(PX + PW / 2), sy(flavorY), {
    font: `${Math.floor(22 * scale)}px monospace`,
    fill: REBEL_MARKET_COLORS.textMuted,
    align: 'center',
    baseline: 'top',
  });

  // ── Close button ────────────────────────────────────────────────────────────
  const closeX = PX + PW - PAD - CLOSE_W;
  const closeY = PY + PH - PAD - CLOSE_H;
  const closeHover = isOver(mx, my, sx(closeX), sy(closeY), sw(CLOSE_W), sh(CLOSE_H));
  drawPanelBtn(
    display, '[Close]',
    sx(closeX), sy(closeY), sw(CLOSE_W), sh(CLOSE_H),
    closeHover, 'close', scale,
    scaledX, scaledY, scaledW, scaledH,
    REBEL_MARKET_COLORS.accent
  );
  if (registerBtn('close_market', mx, my, sx(closeX), sy(closeY), sw(CLOSE_W), sh(CLOSE_H))) {
    action = { type: 'CLOSE_MARKET' };
  }

  // Pop clip rect
  display.popClip();

  return action;
}

// ── Tutorial highlight bounds getters ────────────────────────────────────────

export function getSalvageInventoryBounds(): { x: number; y: number; w: number; h: number } {
  const listStartY = PY + 150;
  return { x: PX + PAD, y: listStartY, w: PW - PAD * 2, h: 300 };
}
