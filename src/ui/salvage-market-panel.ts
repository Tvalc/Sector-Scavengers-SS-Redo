// Salvage Market panel — sell salvage, pay debt, manage hub inventory.

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import { SalvageTier, SALVAGE_DEFS } from '../content/salvage';

export type SalvageMarketAction =
  | { type: 'SELL_SALVAGE'; tier: SalvageTier }
  | { type: 'SELL_ALL_LOW_TIER' }
  | { type: 'PAY_DEBT'; amount: number }
  | { type: 'CLOSE_MARKET' };

// ── Panel geometry ────────────────────────────────────────────────────────────
const PX = 510;
const PY = 240;
const PW = 900;
const PH = 600;
const PAD = 30;

// ── Button sizes ──────────────────────────────────────────────────────────────
const SELL1_W = 100;
const SELL1_H = 36;
const ACTION_BTN_W = 200;
const ACTION_BTN_H = 40;
const CLOSE_W = 120;
const CLOSE_H = 40;

// Tier display order
const TIER_ORDER: SalvageTier[] = ['scrap', 'components', 'relic', 'medtech'];

// Module-level press tracking (survives frame boundaries)
let pressedBtn: string | null = null;

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

export function renderSalvageMarket(
  meta: MetaState,
  mx: number,
  my: number,
): SalvageMarketAction | null {
  const display = MakkoEngine.display;

  // Clear pressedBtn on any release (safety valve for missed releases)
  if (MakkoEngine.input.isMouseReleased(0) && pressedBtn !== null) {
    // Will be cleared per-button in registerBtn; nothing extra needed
  }

  // ── Panel background ────────────────────────────────────────────────────────
  display.drawRect(PX, PY, PW, PH, { fill: '#0d1117', stroke: '#2d3748', lineWidth: 2 });

  // ── Header ──────────────────────────────────────────────────────────────────
  display.drawText('SALVAGE MARKET', PX + PW / 2, PY + PAD + 10, {
    font: 'bold 30px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'top',
  });

  // Sub-header
  display.drawText(
    `Credits: \u20a1${meta.credits}  |  Debt: \u20a1${meta.debt}`,
    PX + PW / 2,
    PY + PAD + 50,
    { font: '18px monospace', fill: '#a0aec0', align: 'center', baseline: 'top' },
  );

  // Column headers
  const listStartY = 340;
  display.drawText('ITEM', PX + PAD, listStartY - 24, {
    font: '14px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
  });
  display.drawText('QTY', PX + PAD + 180, listStartY - 24, {
    font: '14px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
  });
  display.drawText('VALUE EA.', PX + PAD + 260, listStartY - 24, {
    font: '14px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
  });
  display.drawText('TOTAL', PX + PAD + 420, listStartY - 24, {
    font: '14px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
  });

  // Separator
  display.drawLine(PX + PAD, listStartY - 6, PX + PW - PAD, listStartY - 6, {
    stroke: '#2d3748', lineWidth: 1,
  });

  // ── Inventory rows ──────────────────────────────────────────────────────────
  let action: SalvageMarketAction | null = null;
  let rowY = listStartY;

  for (const tier of TIER_ORDER) {
    const entry = meta.hubInventory.find((e) => e.tier === tier && e.quantity > 0);
    if (!entry) continue;

    const def = SALVAGE_DEFS[tier];
    const total = entry.quantity * entry.valueEach;

    // Tier label
    display.drawText(def.label, PX + PAD, rowY + 9, {
      font: '20px monospace', fill: def.color, align: 'left', baseline: 'top',
    });

    // Quantity
    display.drawText(`×${entry.quantity}`, PX + PAD + 180, rowY + 9, {
      font: '20px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
    });

    // Value each
    display.drawText(`\u20a1${entry.valueEach}`, PX + PAD + 260, rowY + 9, {
      font: '20px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
    });

    // Total
    display.drawText(`\u20a1${total}`, PX + PAD + 420, rowY + 9, {
      font: '20px monospace', fill: '#68d391', align: 'left', baseline: 'top',
    });

    // [Sell 1] button
    const sellBtnX = PX + PW - PAD - SELL1_W;
    const sellBtnY = rowY + 6;
    const sellHover = isOver(mx, my, sellBtnX, sellBtnY, SELL1_W, SELL1_H);
    display.drawRect(sellBtnX, sellBtnY, SELL1_W, SELL1_H, {
      fill: sellHover ? '#276749' : '#1a3a2a',
      stroke: '#276749',
      lineWidth: 1,
    });
    display.drawText('[Sell 1]', sellBtnX + SELL1_W / 2, sellBtnY + SELL1_H / 2, {
      font: '16px monospace', fill: '#ffffff', align: 'center', baseline: 'middle',
    });
    if (registerBtn(`sell_${tier}`, mx, my, sellBtnX, sellBtnY, SELL1_W, SELL1_H)) {
      action = { type: 'SELL_SALVAGE', tier };
    }

    rowY += 56;
  }

  // Empty state
  if (meta.hubInventory.filter((e) => e.quantity > 0).length === 0) {
    display.drawText('No salvage in inventory.', PX + PW / 2, listStartY + 60, {
      font: '20px monospace', fill: '#4a5568', align: 'center', baseline: 'top',
    });
  }

  // ── Sell All Scrap button ────────────────────────────────────────────────────
  const scrapEntry = meta.hubInventory.find((e) => e.tier === 'scrap' && e.quantity > 0);
  const hasScrap = scrapEntry !== undefined;
  const sellAllX = PX + PAD;
  const sellAllY = PY + PH - 180;
  const sellAllHover = hasScrap && isOver(mx, my, sellAllX, sellAllY, ACTION_BTN_W, ACTION_BTN_H);
  display.drawRect(sellAllX, sellAllY, ACTION_BTN_W, ACTION_BTN_H, {
    fill: sellAllHover ? '#276749' : hasScrap ? '#1a3a2a' : '#111',
    stroke: hasScrap ? '#276749' : '#2d3748',
    lineWidth: 1,
  });
  display.drawText('[Sell All Scrap]', sellAllX + ACTION_BTN_W / 2, sellAllY + ACTION_BTN_H / 2, {
    font: '16px monospace',
    fill: hasScrap ? '#ffffff' : '#4a5568',
    align: 'center',
    baseline: 'middle',
  });
  if (hasScrap && registerBtn('sell_all_scrap', mx, my, sellAllX, sellAllY, ACTION_BTN_W, ACTION_BTN_H)) {
    action = { type: 'SELL_ALL_LOW_TIER' };
  }

  // ── Pay Debt button ──────────────────────────────────────────────────────────
  const payDebtY = sellAllY + ACTION_BTN_H + 14;
  const debtPayAmount = meta.debt < 500 && meta.credits >= meta.debt ? meta.debt : 500;
  const canPayDebt = meta.credits >= debtPayAmount && meta.debt > 0;
  const payDebtX = PX + PAD;
  const payDebtLabel = meta.debt < 500 && meta.credits >= meta.debt
    ? `[Pay \u20a1${meta.debt}]`
    : '[Pay \u20a1500 Debt]';
  const payDebtHover = canPayDebt && isOver(mx, my, payDebtX, payDebtY, ACTION_BTN_W, ACTION_BTN_H);
  display.drawRect(payDebtX, payDebtY, ACTION_BTN_W, ACTION_BTN_H, {
    fill: payDebtHover ? '#7b341e' : canPayDebt ? '#4a1e0e' : '#111',
    stroke: canPayDebt ? '#c05621' : '#2d3748',
    lineWidth: 1,
  });
  display.drawText(payDebtLabel, payDebtX + ACTION_BTN_W / 2, payDebtY + ACTION_BTN_H / 2, {
    font: '16px monospace',
    fill: canPayDebt ? '#ffffff' : '#4a5568',
    align: 'center',
    baseline: 'middle',
  });
  if (canPayDebt && registerBtn('pay_debt', mx, my, payDebtX, payDebtY, ACTION_BTN_W, ACTION_BTN_H)) {
    action = { type: 'PAY_DEBT', amount: debtPayAmount };
  }

  // ── Close button ─────────────────────────────────────────────────────────────
  const closeX = PX + PW - PAD - CLOSE_W;
  const closeY = PY + PH - PAD - CLOSE_H;
  const closeHover = isOver(mx, my, closeX, closeY, CLOSE_W, CLOSE_H);
  display.drawRect(closeX, closeY, CLOSE_W, CLOSE_H, {
    fill: closeHover ? '#2d3748' : '#1a202c',
    stroke: '#4a5568',
    lineWidth: 1,
  });
  display.drawText('[Close]', closeX + CLOSE_W / 2, closeY + CLOSE_H / 2, {
    font: '18px monospace', fill: '#a0aec0', align: 'center', baseline: 'middle',
  });
  if (registerBtn('close_market', mx, my, closeX, closeY, CLOSE_W, CLOSE_H)) {
    action = { type: 'CLOSE_MARKET' };
  }

  return action;
}
