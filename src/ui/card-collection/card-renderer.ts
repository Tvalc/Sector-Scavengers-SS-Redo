// Card Collection Panel - Card Rendering
// Uses shared renderCard from dive-renderer for all card display

import { MakkoEngine } from '@makko/engine';
import { CardUnlockInfo, CardCollectionContext } from './types';
import { CARD_W, CARD_H } from './constants';
import { renderCard } from '../dive-renderer/cards';

/** Render a full-size card (280x400) - uses shared renderCard */
export function renderFullSizeCard(
  display: typeof MakkoEngine.display,
  info: CardUnlockInfo,
  context: CardCollectionContext,
  x: number,
  y: number,
  isHovered: boolean,
): void {
  const { card, unlocked, hidden } = info;

  if (hidden && !unlocked) {
    renderMysteryCard(display, x, y, isHovered);
    return;
  }

  const isLocked = !unlocked && context === 'meta';

  // Use shared renderCard at full size
  renderCard(
    display,
    card,
    x,
    y,
    isHovered,
    isLocked,
    false, // isTargetCard
    0, // now (no pulse animation needed)
    false, // useIntroDesc
    undefined, // currentEnergy
    CARD_W,
    CARD_H,
  );
}

/** Render a card for the hub (220x300) - uses shared renderCard */
export function renderHubCard(
  display: typeof MakkoEngine.display,
  info: CardUnlockInfo,
  x: number,
  y: number,
  isHovered: boolean,
): void {
  const HUB_CARD_W = 220;
  const HUB_CARD_H = 300;
  const { card } = info;

  // Use shared renderCard at hub size
  renderCard(
    display,
    card,
    x,
    y,
    isHovered,
    false, // isLocked
    false, // isTargetCard
    0, // now
    false, // useIntroDesc
    undefined, // currentEnergy
    HUB_CARD_W,
    HUB_CARD_H,
  );
}

/** Render a compact card for preview mode (200x280px) - uses shared renderCard */
export function renderCompactCard(
  display: typeof MakkoEngine.display,
  info: CardUnlockInfo,
  x: number,
  y: number,
  _options?: {
    showUnlockBadge?: boolean;
  },
): void {
  const COMPACT_W = 200;
  const COMPACT_H = 280;
  const { card } = info;

  // Use shared renderCard at compact size
  renderCard(
    display,
    card,
    x,
    y,
    false, // isHovered
    false, // isLocked
    false, // isTargetCard
    0, // now
    false, // useIntroDesc
    undefined, // currentEnergy
    COMPACT_W,
    COMPACT_H,
  );
}

/** Render mystery card for hidden content - not handled by shared renderer */
export function renderMysteryCard(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  isHovered: boolean,
): void {
  display.drawRoundRect(x, y, CARD_W, CARD_H, 12, {
    fill: '#0d1117',
    stroke: isHovered ? '#4a5568' : '#2d3748',
    lineWidth: isHovered ? 4 : 3,
  });

  display.drawRoundRect(x + 20, y + 20, CARD_W - 40, CARD_H - 40, 10, {
    fill: '#1a202c',
    stroke: '#2d3748',
    lineWidth: 2,
  });

  display.drawText('???', x + CARD_W / 2, y + CARD_H / 2 - 40, {
    font: 'bold 96px sans-serif',
    fill: '#4a5568',
    align: 'center',
    baseline: 'middle',
  });

  display.drawText('HIDDEN', x + CARD_W / 2, y + CARD_H / 2 + 40, {
    font: 'bold 36px sans-serif',
    fill: '#4a5568',
    align: 'center',
    baseline: 'middle',
  });

  display.drawText('Discover through play', x + CARD_W / 2, y + CARD_H - 60, {
    font: '28px sans-serif',
    fill: '#64748b',
    align: 'center',
    baseline: 'middle',
  });
}
