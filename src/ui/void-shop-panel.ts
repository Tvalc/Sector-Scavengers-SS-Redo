// Void Shop Panel — standalone hero-style panel for purchasing void cards.

import { MakkoEngine } from '@makko/engine';
import type { MetaState } from '../types/state';
import { VOID_SHOP_CARDS, VoidShopCard } from '../content/void-shop';
import { ALL_CARDS, TacticCard } from '../content/cards';
import { feedbackLayer } from './feedback-layer';
import {
  LEFT_ZONE,
  RIGHT_ZONE,
  ACCENT,
  GOLD,
  SUCCESS,
  ERROR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  BG,
  BG_PANEL,
  BORDER_DEFAULT,
  isOver,
  wrapText,
  renderNavigation,
  renderTopBar,
  renderHeroFrame,
  renderPrimaryButton,
} from './panel-layout';
import { renderCard } from './dive-renderer/cards';
import { CARD_W, CARD_H } from './dive-renderer/constants';

// ── Colors ─────────────────────────────────────────────────────────────────
const VOID_ECHO_COLOR = '#a78bfa';

// ── State ────────────────────────────────────────────────────────────────────
let currentCardPage = 0;

/** Reset the void shop page when opening the panel. */
export function resetVoidShopPage(): void {
  currentCardPage = 0;
}

// ── Action Types ───────────────────────────────────────────────────────────
export type VoidShopAction =
  | { type: 'BUY_VOID_SHOP_CARD'; shopCardId: string }
  | { type: 'CLOSE_VOID_SHOP' };

// ── Helper Functions ─────────────────────────────────────────────────────────

function getCardState(
  shopCard: VoidShopCard,
  purchasedIds: string[],
  voidEcho: number
): 'purchased' | 'available' | 'unaffordable' {
  if (purchasedIds.includes(shopCard.id)) return 'purchased';
  if (voidEcho < shopCard.cost) return 'unaffordable';
  return 'available';
}

function getTacticCardForShopCard(shopCard: VoidShopCard): TacticCard | undefined {
  return ALL_CARDS.find((c) => c.id === shopCard.cardId);
}

// ── Main Render Function ────────────────────────────────────────────────────

export function renderVoidShopPanel(
  meta: MetaState,
  mx: number,
  my: number,
  _dt: number
): VoidShopAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: VoidShopAction | null = null;

  // Full screen clear
  display.clear(BG);

  // Ensure page is in valid range
  const totalCards = VOID_SHOP_CARDS.length;
  // Allow any page initially, clamp only if out of bounds
  if (currentCardPage < 0) currentCardPage = totalCards - 1;
  if (currentCardPage >= totalCards) currentCardPage = 0;

  const currentShopCard = VOID_SHOP_CARDS[currentCardPage];
  const state = getCardState(currentShopCard, meta.purchasedVoidShopCards, meta.voidEcho);
  const tacticCard = getTacticCardForShopCard(currentShopCard);

  // ── Top Bar ─────────────────────────────────────────────────────────────────
  const topAction = renderTopBar(
    display,
    input,
    mx,
    my,
    'VOID SHOP',
    currentCardPage,
    totalCards,
    { pageLabel: 'Card' }
  );
  if (topAction === 'CLOSE') {
    action = { type: 'CLOSE_VOID_SHOP' };
  }

  // ── Navigation (process first so clicks aren't blocked by other zones) ───
  const navAction = renderNavigation(display, input, mx, my, currentCardPage, totalCards);
  if (navAction !== null) {
    currentCardPage = navAction;
  }

  // ── Left Zone: Large Card Visual ─────────────────────────────────────────
  renderLeftZone(display, currentShopCard, tacticCard, meta.voidEcho, state);

  // ── Right Zone: Card Details & Actions ─────────────────────────────────────
  const rightAction = renderRightZone(
    display,
    input,
    mx,
    my,
    currentShopCard,
    tacticCard,
    meta,
    state
  );
  if (rightAction) action = rightAction;

  // ── Keyboard Input ─────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    action = { type: 'CLOSE_VOID_SHOP' };
  }

  return action;
}

// ── Left Zone Renderer ───────────────────────────────────────────────────────

function renderLeftZone(
  display: typeof MakkoEngine.display,
  shopCard: VoidShopCard,
  tacticCard: TacticCard | undefined,
  voidEcho: number,
  state: 'purchased' | 'available' | 'unaffordable'
): void {
  // Background panel
  display.drawRect(LEFT_ZONE.x, LEFT_ZONE.y, LEFT_ZONE.w, LEFT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  // Void Echo count at top
  let y = LEFT_ZONE.y + 30;

  display.drawRoundRect(LEFT_ZONE.x + 30, y, 200, 44, 8, {
    fill: '#1a1040',
    stroke: VOID_ECHO_COLOR,
    lineWidth: 2,
  });
  display.drawText(`Void Echo: ${voidEcho}`, LEFT_ZONE.x + 30 + 100, y + 22, {
    font: 'bold 28px monospace',
    fill: VOID_ECHO_COLOR,
    align: 'center',
    baseline: 'middle',
  });
  y += 70;

  // Large card frame
  const frameX = LEFT_ZONE.x + 30;
  const frameY = y;
  const frameW = LEFT_ZONE.w - 60;
  const frameH = 520;

  renderHeroFrame(display, frameX, frameY, frameW, frameH, { stroke: VOID_ECHO_COLOR });

  // Render large card visualization
  if (tacticCard) {
    const cardX = frameX + (frameW - CARD_W) / 2;
    const cardY = frameY + (frameH - CARD_H) / 2;
    renderCard(display, tacticCard, cardX, cardY, state === 'available', false, false, 0, false, undefined, CARD_W, CARD_H);
  } else {
    // Fallback if card not found
    display.drawText('Card Preview', frameX + frameW / 2, frameY + frameH / 2 - 30, {
      font: 'bold 44px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    display.drawText(shopCard.name, frameX + frameW / 2, frameY + frameH / 2 + 20, {
      font: '32px monospace',
      fill: VOID_ECHO_COLOR,
      align: 'center',
      baseline: 'middle',
    });
  }

  y += frameH + 40;

  // Purchase status badge
  const badgeW = 200;
  const badgeH = 48;
  const badgeX = LEFT_ZONE.x + (LEFT_ZONE.w - badgeW) / 2;

  let badgeFill: string;
  let badgeStroke: string;
  let badgeText: string;
  let badgeTextColor: string;

  if (state === 'purchased') {
    badgeFill = '#1a1040';
    badgeStroke = GOLD;
    badgeText = '✓ PURCHASED';
    badgeTextColor = GOLD;
  } else if (state === 'available') {
    badgeFill = '#0f3a2a';
    badgeStroke = SUCCESS;
    badgeText = 'AVAILABLE';
    badgeTextColor = SUCCESS;
  } else {
    badgeFill = '#1a202c';
    badgeStroke = ERROR;
    badgeText = 'NEED ECHO';
    badgeTextColor = ERROR;
  }

  display.drawRoundRect(badgeX, y, badgeW, badgeH, 8, {
    fill: badgeFill,
    stroke: badgeStroke,
    lineWidth: 2,
  });
  display.drawText(badgeText, badgeX + badgeW / 2, y + badgeH / 2, {
    font: 'bold 28px monospace',
    fill: badgeTextColor,
    align: 'center',
    baseline: 'middle',
  });

  y += 70;

  // Cost display
  display.drawText(`${shopCard.cost}`, LEFT_ZONE.x + LEFT_ZONE.w / 2 - 20, y, {
    font: 'bold 56px monospace',
    fill: state === 'unaffordable' ? ERROR : VOID_ECHO_COLOR,
    align: 'right',
    baseline: 'top',
  });
  display.drawText('VOID ECHO', LEFT_ZONE.x + LEFT_ZONE.w / 2 + 20, y + 15, {
    font: '24px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
}

// ── Right Zone Renderer ────────────────────────────────────────────────────

function renderRightZone(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  shopCard: VoidShopCard,
  tacticCard: TacticCard | undefined,
  meta: MetaState,
  state: 'purchased' | 'available' | 'unaffordable'
): VoidShopAction | null {
  let action: VoidShopAction | null = null;

  // Background panel
  display.drawRect(RIGHT_ZONE.x, RIGHT_ZONE.y, RIGHT_ZONE.w, RIGHT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  let y = RIGHT_ZONE.y + 40;

  // ── Card Name ────────────────────────────────────────────────────────────
  display.drawText(shopCard.name.toUpperCase(), RIGHT_ZONE.x + 40, y, {
    font: 'bold 56px monospace',
    fill: VOID_ECHO_COLOR,
    align: 'left',
    baseline: 'top',
  });
  y += 70;

  // ── Description Section ───────────────────────────────────────────────────
  display.drawText('DESCRIPTION', RIGHT_ZONE.x + 40, y, {
    font: 'bold 30px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  const descLines = wrapText(shopCard.description, RIGHT_ZONE.w - 80, '30px monospace');
  for (const line of descLines) {
    display.drawText(line, RIGHT_ZONE.x + 60, y, {
      font: '30px monospace',
      fill: TEXT_PRIMARY,
      align: 'left',
      baseline: 'top',
    });
    y += 38;
  }
  y += 30;

  // ── Effect Section ───────────────────────────────────────────────────────
  display.drawText('EFFECT', RIGHT_ZONE.x + 40, y, {
    font: 'bold 30px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  // Effect description with emphasis
  const effectText = tacticCard?.description ?? shopCard.description;
  const effectLines = wrapText(effectText, RIGHT_ZONE.w - 100, '28px monospace');

  display.drawRoundRect(RIGHT_ZONE.x + 40, y - 10, RIGHT_ZONE.w - 80, effectLines.length * 34 + 40, 8, {
    fill: '#0f172a',
    stroke: VOID_ECHO_COLOR,
    lineWidth: 2,
  });

  for (const line of effectLines.slice(0, 4)) {
    display.drawText(line, RIGHT_ZONE.x + 60, y, {
      font: '28px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'top',
    });
    y += 38;
  }
  y += 50;

  // ── Unlocks Section ──────────────────────────────────────────────────────
  display.drawText('UNLOCKS', RIGHT_ZONE.x + 40, y, {
    font: 'bold 30px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  const unlocksText = `Adds "${shopCard.name}" to your deck permanently`;
  const unlocksLines = wrapText(unlocksText, RIGHT_ZONE.w - 80, '28px monospace');
  for (const line of unlocksLines) {
    display.drawText(line, RIGHT_ZONE.x + 60, y, {
      font: '28px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });
    y += 36;
  }
  y += 50;

  // ── Buy Button (only if available) ───────────────────────────────────────
  if (state === 'available') {
    const btnW = 240;
    const btnH = 56;
    const btnX = RIGHT_ZONE.x + 40;
    const btnY = y;

    const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

    display.drawRoundRect(btnX, btnY, btnW, btnH, 8, {
      fill: btnHover ? '#1e4a3a' : '#0f3a2a',
      stroke: btnHover ? SUCCESS : ACCENT,
      lineWidth: 2,
    });

    display.drawText('BUY CARD', btnX + btnW / 2, btnY + btnH / 2 - 8, {
      font: 'bold 32px monospace',
      fill: SUCCESS,
      align: 'center',
      baseline: 'middle',
    });

    display.drawText(`${shopCard.cost} Void Echo`, btnX + btnW / 2, btnY + btnH / 2 + 18, {
      font: '26px monospace',
      fill: VOID_ECHO_COLOR,
      align: 'center',
      baseline: 'middle',
    });

    if (btnHover && input.isMouseReleased(0)) {
      action = { type: 'BUY_VOID_SHOP_CARD', shopCardId: shopCard.id };
      feedbackLayer.spawn('CARD UNLOCKED', btnX + btnW / 2, btnY - 20, GOLD);
    }
  } else if (state === 'purchased') {
    // Already purchased message
    display.drawRoundRect(RIGHT_ZONE.x + 40, y, 240, 56, 8, {
      fill: '#1a1040',
      stroke: GOLD,
      lineWidth: 2,
    });
    display.drawText('✓ OWNED', RIGHT_ZONE.x + 40 + 120, y + 28, {
      font: 'bold 32px monospace',
      fill: GOLD,
      align: 'center',
      baseline: 'middle',
    });
  } else if (state === 'unaffordable') {
    // Unaffordable message
    display.drawRoundRect(RIGHT_ZONE.x + 40, y, 240, 56, 8, {
      fill: '#1a202c',
      stroke: ERROR,
      lineWidth: 2,
    });
    display.drawText('NEED ECHO', RIGHT_ZONE.x + 40 + 120, y + 28, {
      font: 'bold 32px monospace',
      fill: ERROR,
      align: 'center',
      baseline: 'middle',
    });
  }

  // ── Cost Summary at Bottom ───────────────────────────────────────────────
  y = RIGHT_ZONE.y + RIGHT_ZONE.h - 100;

  display.drawText('COST', RIGHT_ZONE.x + 40, y, {
    font: 'bold 28px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 35;

  display.drawText(`${shopCard.cost}`, RIGHT_ZONE.x + 40, y, {
    font: 'bold 48px monospace',
    fill: state === 'unaffordable' ? ERROR : VOID_ECHO_COLOR,
    align: 'left',
    baseline: 'top',
  });
  display.drawText('/ Void Echo', RIGHT_ZONE.x + 100, y + 8, {
    font: '26px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });

  // Your current echo
  display.drawText(`You have: ${meta.voidEcho}`, RIGHT_ZONE.x + RIGHT_ZONE.w - 40, y + 8, {
    font: '26px monospace',
    fill: meta.voidEcho >= shopCard.cost ? SUCCESS : ERROR,
    align: 'right',
    baseline: 'top',
  });

  return action;
}
