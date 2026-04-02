import { MakkoEngine } from '@makko/engine';
import { TacticCard } from '../../content/cards';
import {
  CARD_PANEL_X, CARD_PANEL_Y, CARD_PANEL_W, CARD_PANEL_H, CARD_PANEL_RADIUS,
  CARD_W, CARD_H, CARD_XS,
  CARD_PADDING,
} from './constants';
import { isCardLocked } from './helpers';
import { setBounds } from '../tutorial-bounds';
import {
  pressedIndex, setPressedIndex, resetPressedIndex,
  getCardAlpha, initializeCardAlpha, fadeOutCard, setCardTargetAlpha,
} from './state';
import { DiveAction } from './types';
import { drawCardArt, drawCardBack } from '../card-art-map';
import { setCardDrawnCallback } from './animation-bridge';

interface CardRenderConfig {
  mx: number;
  my: number;
  lockedCardId?: string;
  isTutorialLocked?: boolean;
  now: number;
  /** Current run energy for affordability check */
  currentEnergy?: number;
  /** Whether reserve burn is available (at max energy) */
  reserveBurnAvailable?: boolean;
  /** Current energy max for display */
  maxEnergy?: number;
}

/** Card type classification for visual theming */
type CardType = 'info' | 'action' | 'mixed';

/** Determine card type based on its effects */
function getCardType(card: TacticCard): CardType {
  const infoCards = ['diagnostic', 'deep_scan', 'tactical_assessment', 'emergency_telemetry', 'analyze'];
  const hasInfoEffect = infoCards.includes(card.id) || 
    card.description.toLowerCase().includes('reveal') ||
    card.description.toLowerCase().includes('scan');
  
  const hasActionEffect = 
    card.description.toLowerCase().includes('scrap') ||
    card.description.toLowerCase().includes('hull') ||
    card.description.toLowerCase().includes('shield') ||
    card.description.toLowerCase().includes('extract') ||
    card.description.toLowerCase().includes('₡');
  
  if (hasInfoEffect && hasActionEffect) return 'mixed';
  if (hasInfoEffect) return 'info';
  return 'action';
}

/** Get info reveal description for tooltip */
function getInfoRevealDescription(card: TacticCard, isOvercharged: boolean): string {
  switch (card.id) {
    case 'diagnostic':
      return isOvercharged 
        ? 'Reveals: Exact hull value + next danger type & magnitude'
        : 'Reveals: Hull status bracket (Critical/Damaged/Stressed/Stable)';
    case 'deep_scan':
      return 'Reveals: Hull value + next danger type';
    case 'tactical_assessment':
      return 'Reveals: Hull value + salvage value + danger type';
    case 'emergency_telemetry':
      return isOvercharged
        ? 'Reveals: Exact hull + 2-round danger forecast'
        : 'Reveals: Hull status bracket';
    case 'analyze':
      return 'Reveals: Next danger reduced by 50%';
    default:
      if (card.description.toLowerCase().includes('reveal')) {
        return 'Reveals: Information about current situation';
      }
      return '';
  }
}

/** Get alpha based on card energy affordability */
function getAffordabilityAlpha(card: TacticCard, currentEnergy: number | undefined, reserveBurnAvailable: boolean): number {
  if (currentEnergy === undefined) return 1;
  const cost = card.energyCost ?? 0;
  const effectiveCost = reserveBurnAvailable ? Math.max(0, cost - 1) : cost;
  return effectiveCost > currentEnergy ? 0.5 : 1;
}

/** Render energy cost badge with overcharge, surge, and info card support */
function drawEnergyCostBadge(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  card: TacticCard,
  cardType: CardType,
  isAffordable: boolean,
  isOverchargeAffordable: boolean,
  reserveBurnAvailable: boolean,
  alpha: number,
  badgeSize: number = 24,
): void {
  const baseCost = card.energyCost ?? 0;
  const hasOvercharge = card.overchargeEffect !== undefined;
  const isSurge = card.isSurge ?? false;
  const hasRefund = card.energyRefund !== undefined;
  
  const badgeX = x + Math.round(badgeSize * 0.3);
  const badgeY = y + Math.round(badgeSize * 0.3);

  // Determine badge colors based on card type and affordability
  let badgeColor = isAffordable ? '#1e3a5f' : '#1a2535';
  let strokeColor = isAffordable ? '#22d3ee' : '#475569';
  let textColor = isAffordable ? '#22d3ee' : '#64748b';
  
  // Info cards use blue theming
  if (cardType === 'info' || cardType === 'mixed') {
    badgeColor = isAffordable ? '#1a3a5c' : '#1a2535';
    strokeColor = isAffordable ? '#60a5fa' : '#475569';
    textColor = isAffordable ? '#60a5fa' : '#64748b';
  }
  
  if (isSurge) {
    badgeColor = '#0f3d1f'; // Dark green for surge
    strokeColor = '#22c55e'; // Green stroke
    textColor = '#22c55e';
  } else if (!isAffordable) {
    badgeColor = '#3d1f1f'; // Dark red for unaffordable
    strokeColor = '#ef4444'; // Red stroke
    textColor = '#ef4444';
  }

  display.drawRoundRect(badgeX, badgeY, badgeSize, badgeSize, 4, {
    fill: badgeColor,
    stroke: strokeColor,
    lineWidth: Math.max(1, Math.round(badgeSize / 16)),
    alpha,
  });

  // Cost text
  const fontSize = Math.max(9, Math.round(badgeSize * 0.45));

  // Build cost display string
  let costText: string;
  if (isSurge) {
    costText = `+${baseCost || 1}⚡`;
  } else if (hasOvercharge) {
    costText = `${baseCost}+1`;
  } else {
    costText = String(baseCost);
  }

  display.drawText(costText, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 1, {
    font: `bold ${fontSize}px sans-serif`,
    fill: textColor,
    align: 'center',
    baseline: 'middle',
    alpha,
  });

  // Reserve burn discount indicator (ghost badge)
  if (reserveBurnAvailable && !isSurge && baseCost > 0) {
    display.drawRoundRect(badgeX + 2, badgeY + badgeSize - 8, badgeSize - 4, 8, 2, {
      fill: cardType === 'info' ? '#60a5fa' : '#22d3ee',
      alpha: alpha * 0.3,
    });
    display.drawText('-1⚡', badgeX + badgeSize / 2, badgeY + badgeSize - 4, {
      font: 'bold 7px sans-serif',
      fill: cardType === 'info' ? '#60a5fa' : '#22d3ee',
      align: 'center',
      baseline: 'middle',
      alpha: alpha * 0.8,
    });
  }

  // Refund indicator badge (small icon in corner)
  if (hasRefund) {
    const refundAmount = card.energyRefund?.amount ?? 1;
    const refundX = badgeX + badgeSize - 10;
    const refundY = badgeY - 2;
    
    display.drawCircle(refundX, refundY, 6, {
      fill: '#f59e0b',
      alpha: alpha * 0.9,
    });
    display.drawText(`↻${refundAmount}`, refundX, refundY, {
      font: 'bold 7px sans-serif',
      fill: '#0f172a',
      align: 'center',
      baseline: 'middle',
      alpha,
    });
  }
}

/** Render info reveal indicator icon */
function drawInfoRevealIcon(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  card: TacticCard,
  isOverchargeAvailable: boolean,
  alpha: number,
): void {
  const iconSize = 20;
  const iconX = x + CARD_W - iconSize - 8;
  const iconY = y + 8;
  
  // Only show for info cards
  const infoReveal = getInfoRevealDescription(card, false);
  if (!infoReveal) return;

  // Background circle for eye icon
  display.drawCircle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, {
    fill: isOverchargeAvailable ? '#1e3a5f' : '#1e40af',
    stroke: isOverchargeAvailable ? '#60a5fa' : '#3b82f6',
    lineWidth: 1,
    alpha,
  });

  // Eye icon (using unicode)
  display.drawText(isOverchargeAvailable ? '👁+' : '👁', iconX + iconSize / 2, iconY + iconSize / 2 + 1, {
    font: 'bold 11px sans-serif',
    fill: '#60a5fa',
    align: 'center',
    baseline: 'middle',
    alpha,
  });
}

/** Render info reveal tooltip */
function drawInfoRevealTooltip(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  card: TacticCard,
  isOverchargeAvailable: boolean,
  alpha: number,
): void {
  const tooltipWidth = 220;
  const tooltipHeight = 50;
  const tooltipX = x + CARD_W / 2 - tooltipWidth / 2;
  const tooltipY = y - tooltipHeight - 10;

  const revealDesc = getInfoRevealDescription(card, isOverchargeAvailable && card.overchargeEffect !== undefined);
  if (!revealDesc) return;

  // Tooltip background
  display.drawRoundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8, {
    fill: '#0d1117',
    stroke: '#60a5fa',
    lineWidth: 1,
    alpha: alpha * 0.95,
  });

  // Title
  display.drawText('INFORMATION', tooltipX + tooltipWidth / 2, tooltipY + 10, {
    font: 'bold 10px sans-serif',
    fill: '#60a5fa',
    align: 'center',
    baseline: 'top',
    alpha,
  });

  // Effect description (split into two lines if needed)
  const maxChars = 35;
  if (revealDesc.length > maxChars) {
    const mid = Math.floor(revealDesc.length / 2);
    const splitIndex = revealDesc.indexOf(' ', mid);
    const line1 = revealDesc.substring(0, splitIndex);
    const line2 = revealDesc.substring(splitIndex + 1);
    
    display.drawText(line1, tooltipX + tooltipWidth / 2, tooltipY + 24, {
      font: '9px sans-serif',
      fill: '#e2e8f0',
      align: 'center',
      baseline: 'top',
      alpha: alpha * 0.9,
    });
    display.drawText(line2, tooltipX + tooltipWidth / 2, tooltipY + 36, {
      font: '9px sans-serif',
      fill: '#e2e8f0',
      align: 'center',
      baseline: 'top',
      alpha: alpha * 0.9,
    });
  } else {
    display.drawText(revealDesc, tooltipX + tooltipWidth / 2, tooltipY + 28, {
      font: '9px sans-serif',
      fill: '#e2e8f0',
      align: 'center',
      baseline: 'top',
      alpha: alpha * 0.9,
    });
  }
}

/** Render overcharge tooltip */
function drawOverchargeTooltip(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  card: TacticCard,
  alpha: number,
): void {
  if (!card.overchargeEffect) return;

  const tooltipWidth = 200;
  const tooltipHeight = 60;
  const tooltipX = x + CARD_W / 2 - tooltipWidth / 2;
  const tooltipY = y - tooltipHeight - 10;

  // Tooltip background
  display.drawRoundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8, {
    fill: '#0d1117',
    stroke: '#22d3ee',
    lineWidth: 1,
    alpha: alpha * 0.95,
  });

  // Title
  display.drawText('OVERCHARGE (+1⚡)', tooltipX + tooltipWidth / 2, tooltipY + 12, {
    font: 'bold 11px sans-serif',
    fill: '#22d3ee',
    align: 'center',
    baseline: 'top',
    alpha,
  });

  // Effect description
  const desc = card.overchargeEffect.description;
  display.drawText(desc, tooltipX + tooltipWidth / 2, tooltipY + 30, {
    font: '10px sans-serif',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'top',
    alpha: alpha * 0.9,
  });

  // Shift+Click hint
  display.drawText('Hold Shift+Click', tooltipX + tooltipWidth / 2, tooltipY + 48, {
    font: '9px sans-serif',
    fill: '#94a3b8',
    align: 'center',
    baseline: 'top',
    alpha: alpha * 0.7,
  });
}

/** Determine which card is at the given mouse position */
function cardAt(mx: number, my: number, draftLength: number): number {
  const cardY = CARD_PANEL_Y + (CARD_PANEL_H - CARD_H) / 2;
  for (let i = 0; i < draftLength; i++) {
    const cx = CARD_XS[i];
    if (mx >= cx && mx <= cx + CARD_W && my >= cardY && my <= cardY + CARD_H) {
      return i;
    }
  }
  return -1;
}

/** Calculate proportional card layout constants based on card size */
function getCardLayoutConstants(cardWidth: number, cardHeight: number): {
  padding: number;
  badgeSize: number;
} {
  const baseW = 280;
  const baseH = 360;
  const scaleW = cardWidth / baseW;
  const scaleH = cardHeight / baseH;
  const scale = Math.min(scaleW, scaleH);

  return {
    padding: Math.round(CARD_PADDING * scale),
    badgeSize: Math.round(24 * scale),
  };
}

/** Render a single card with its current alpha */
export function renderCard(
  display: typeof MakkoEngine.display,
  card: TacticCard,
  cx: number,
  cy: number,
  isHovered: boolean,
  isLocked: boolean,
  isTargetCard: boolean,
  now: number,
  useIntroDesc: boolean = false,
  currentEnergy?: number,
  cardWidth: number = CARD_W,
  cardHeight: number = CARD_H,
  alphaOverride?: number,
  reserveBurnAvailable: boolean = false,
  maxEnergy: number = 5,
): void {
  const cardAlpha = getCardAlpha(card.id);
  if (cardAlpha <= 0.01) return;

  let alpha = alphaOverride ?? 1;
  let offsetY = 0;

  if (isTargetCard) {
    alpha = 1;
    offsetY = -10;
  } else if (isLocked) {
    alpha = 0.75;
  } else if (isHovered) {
    alpha = 1;
    offsetY = -15;
  }

  const cardType = getCardType(card);
  const baseCost = card.energyCost ?? 0;
  const hasOvercharge = card.overchargeEffect !== undefined;
  const effectiveBaseCost = reserveBurnAvailable ? Math.max(0, baseCost - 1) : baseCost;
  const effectiveOverchargeCost = hasOvercharge ? effectiveBaseCost + 1 : effectiveBaseCost;
  
  const isBaseAffordable = currentEnergy === undefined || effectiveBaseCost <= (currentEnergy ?? 0);
  const isOverchargeAffordable = currentEnergy === undefined || effectiveOverchargeCost <= (currentEnergy ?? 0);
  
  const affordabilityAlpha = currentEnergy === undefined 
    ? 1 
    : (isBaseAffordable ? 1 : 0.5);
  const finalAlpha = alpha * affordabilityAlpha * cardAlpha;

  const drawY = cy + offsetY;

  // Card art
  const hasArt = drawCardArt(display, card.id, cx, drawY, cardWidth, cardHeight, finalAlpha);
  if (!hasArt) {
    drawCardBack(display, cx, drawY, cardWidth, cardHeight, finalAlpha);
  }

  // Energy cost badge
  if (currentEnergy !== undefined) {
    const layout = getCardLayoutConstants(cardWidth, cardHeight);
    drawEnergyCostBadge(
      display, cx, drawY, card, cardType,
      isBaseAffordable, isOverchargeAffordable, 
      reserveBurnAvailable, finalAlpha, layout.badgeSize
    );
  }

  // Info reveal icon
  drawInfoRevealIcon(display, cx, drawY, card, isOverchargeAffordable, finalAlpha);

  // Info reveal tooltip on hover (takes precedence over overcharge tooltip for info cards)
  if (isHovered) {
    const infoReveal = getInfoRevealDescription(card, false);
    if (infoReveal && cardType !== 'action') {
      drawInfoRevealTooltip(display, cx, drawY, card, isOverchargeAffordable, alpha);
    } else if (card.overchargeEffect && isOverchargeAffordable) {
      drawOverchargeTooltip(display, cx, drawY, card, alpha);
    }
  }

  // Target card pulse effect
  if (isTargetCard) {
    const pulse = Math.sin((now % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
    display.drawRoundRect(cx - 2, drawY - 2, cardWidth + 4, cardHeight + 4, 8, {
      stroke: '#22d3ee',
      lineWidth: 2 + pulse * 2,
      alpha: 0.5,
    });
  }

  // Unaffordable overlay
  if (currentEnergy !== undefined && !isBaseAffordable) {
    display.drawRoundRect(cx, drawY, cardWidth, cardHeight, 8, {
      fill: '#000000',
      alpha: 0.3,
    });
  }
}

/** Register card bounds for tutorial highlighting */
function registerCardBounds(draft: TacticCard[]): void {
  const cardY = CARD_PANEL_Y + (CARD_PANEL_H - CARD_H) / 2;
  for (let i = 0; i < Math.min(draft.length, 3); i++) {
    const highlightKey = `card-${draft[i].id}`;
    setBounds(highlightKey, { x: CARD_XS[i], y: cardY, w: CARD_W, h: CARD_H });
  }
}

/** Register the card draw callback */
export function registerCardDrawAnimationHandler(): void {
  setCardDrawnCallback((cardId: string, _slotIndex: number) => {
    initializeCardAlpha(cardId);
  });
}

/** Render the card panel and all cards, handle input */
export function renderCardPanel(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  draft: TacticCard[],
  config: CardRenderConfig,
): DiveAction | null {
  const { 
    mx, my, lockedCardId, isTutorialLocked, now, 
    currentEnergy, reserveBurnAvailable = false, maxEnergy = 5 
  } = config;
  const cardY = CARD_PANEL_Y + (CARD_PANEL_H - CARD_H) / 2;

  // Reset faded card alphas
  for (const card of draft) {
    const cardAlpha = getCardAlpha(card.id);
    if (cardAlpha < 0.5) {
      setCardTargetAlpha(card.id, 1);
    }
  }

  // Empty hand message
  if (draft.length === 0) {
    const centerX = CARD_PANEL_X + CARD_PANEL_W / 2;
    const centerY = CARD_PANEL_Y + CARD_PANEL_H / 2;
    display.drawText('NO CARDS AVAILABLE', centerX, centerY - 12, {
      font: 'bold 18px monospace',
      fill: '#fc8181',
      align: 'center',
      baseline: 'middle',
    });
    display.drawText('Round will advance automatically', centerX, centerY + 14, {
      font: '14px monospace',
      fill: '#718096',
      align: 'center',
      baseline: 'middle',
    });
    return null;
  }

  registerCardBounds(draft);

  // Handle input
  const isShiftHeld = input.isKeyDown('ShiftLeft') || input.isKeyDown('ShiftRight');
  
  if (input.isMousePressed(0)) {
    setPressedIndex(cardAt(mx, my, draft.length));
  }

  // Render each card
  let clicked: DiveAction | null = null;
  let clickedIndex = -1;
  let isOvercharge = false;

  for (let i = 0; i < draft.length; i++) {
    const card = draft[i];
    const cx = CARD_XS[i];
    const isHovered = cardAt(mx, my, draft.length) === i;
    const isLocked = isCardLocked(card.id, lockedCardId, isTutorialLocked);
    const isTargetCard = lockedCardId === card.id;

    const baseCost = card.energyCost ?? 0;
    const hasOvercharge = card.overchargeEffect !== undefined;
    const effectiveBaseCost = reserveBurnAvailable ? Math.max(0, baseCost - 1) : baseCost;
    const effectiveOverchargeCost = hasOvercharge ? effectiveBaseCost + 1 : effectiveBaseCost;
    
    const isBaseAffordable = currentEnergy === undefined || effectiveBaseCost <= (currentEnergy ?? 0);
    const isOverchargeAffordable = currentEnergy === undefined || effectiveOverchargeCost <= (currentEnergy ?? 0);

    const cardAlpha = getCardAlpha(card.id);
    if (cardAlpha <= 0.01) {
      if (input.isMouseReleased(0) && pressedIndex === i && isHovered && !isLocked) {
        // Check if shift is held for overcharge
        const wantOvercharge = isShiftHeld && hasOvercharge && isOverchargeAffordable;
        if (!wantOvercharge && !isBaseAffordable) continue;
        
        clicked = { cardId: card.id, overcharge: wantOvercharge };
        clickedIndex = i;
        isOvercharge = wantOvercharge;
      }
      continue;
    }

    renderCard(
      display, card, cx, cardY, 
      isHovered, isLocked, isTargetCard, now, false, 
      currentEnergy, CARD_W, CARD_H, undefined, reserveBurnAvailable, maxEnergy
    );

    if (input.isMouseReleased(0) && pressedIndex === i && isHovered && !isLocked) {
      // Check if shift is held for overcharge
      const wantOvercharge = isShiftHeld && hasOvercharge && isOverchargeAffordable;
      if (!wantOvercharge && !isBaseAffordable) continue;
      
      clicked = { cardId: card.id, overcharge: wantOvercharge };
      clickedIndex = i;
      isOvercharge = wantOvercharge;
    }
  }

  if (clicked && clickedIndex >= 0) {
    fadeOutCard(clicked.cardId);
  }

  if (input.isMouseReleased(0)) {
    resetPressedIndex();
  }

  return clicked;
}
