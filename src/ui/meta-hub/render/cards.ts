import { MakkoEngine } from '@makko/engine';
import { ALL_CARDS } from '../../../content/cards';
import { drawCardArt } from '../../card-art-map';
import { CARD_PREVIEW } from '../core/constants';
import { LocalDivePrepState } from '../core/types';

export function renderCardPreviews(
  display: typeof MakkoEngine.display,
  localDivePrep: LocalDivePrepState | null,
): void {
  const cards = localDivePrep?.selectedCards ?? ['scavenge', 'repair', 'extract'];
  const { w, h, y } = CARD_PREVIEW;

  // 10% smaller cards
  const cardW = w * 0.9;
  const cardH = h * 0.9;

  // Card array order: [scavenge, repair, extract] at indices [0, 1, 2]
  const xPositions = [
    790,   // scavenge
    1050,  // repair
    1320   // extract
  ];

  for (let i = 0; i < cards.length; i++) {
    const cardId = cards[i];

    const cx = xPositions[i];
    const cy = y + 10;

    // Render card art directly (no alpha tracking for hub previews)
    const hasArt = drawCardArt(display, cardId, cx, cy, cardW, cardH, 1);
    
    // Fallback: draw a placeholder frame if no art
    if (!hasArt) {
      display.drawRoundRect(cx, cy, cardW, cardH, 8, {
        fill: '#1a202c',
        stroke: '#4a5568',
        lineWidth: 2,
      });
      display.drawText(cardId, cx + cardW / 2, cy + cardH / 2, {
        font: 'bold 20px monospace',
        fill: '#a0aec0',
        align: 'center',
        baseline: 'middle',
      });
    }
  }
}

// renderMiniCard removed - no longer using placeholder cards
