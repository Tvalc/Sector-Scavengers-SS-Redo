// Card Rendering Helpers

import { MakkoEngine } from '@makko/engine';
import { getCardUnlockInfo } from '../../card-collection/unlock-logic';
import { drawCardArt, drawCardBack } from '../../card-art-map';

type CardInfo = ReturnType<typeof getCardUnlockInfo>;

export function renderCompactCardHorizontal(
  display: typeof MakkoEngine.display,
  info: CardInfo,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const { card } = info;

  // Try to draw real card art filling the entire card area
  const hasArt = drawCardArt(display, card.id, x, y, w, h);

  if (!hasArt) {
    // Fallback: use card back image
    drawCardBack(display, x, y, w, h);
  }
}
