import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../../types/state';
import { DRAW_PILE_X, DRAW_PILE_Y, DRAW_CARD_W, DRAW_CARD_H } from '../constants';
import { drawVisual, updateDrawVisual } from '../state';
import { CORE_CARDS } from '../../../content/cards';

// Draw pile viewer state
let showDrawPile = false;

export function isDrawPileVisible(): boolean {
  return showDrawPile;
}

export function toggleDrawPile(): void {
  showDrawPile = !showDrawPile;
}

export function closeDrawPile(): void {
  showDrawPile = false;
}

/** Get card name by ID */
function getCardName(cardId: string): string {
  const card = CORE_CARDS.find(c => c.id === cardId);
  return card?.name || cardId;
}

/** Render visual draw pile with stacked cardbacks and beam glow */
export function renderDrawPile(
  display: typeof MakkoEngine.display,
  run: RunState,
  now: number,
): void {
  const drawCount = run.deck.length;

  // Update draw visual state
  updateDrawVisual(drawCount, now);

  // Draw stacked cardbacks or empty placeholder
  if (drawCount > 0) {
    const asset = MakkoEngine.staticAsset(drawVisual.cardBackAsset);
    if (asset) {
      const maxVisibleCards = Math.min(drawCount, 8);
      for (let i = 0; i < maxVisibleCards; i++) {
        const offsetX = i * 2;
        const offsetY = i * 2;
        const cardX = DRAW_PILE_X + offsetX;
        const cardY = DRAW_PILE_Y + offsetY;

        // Calculate contain scaling for the cardback
        const scaleX = DRAW_CARD_W / asset.width;
        const scaleY = DRAW_CARD_H / asset.height;
        const scale = Math.min(scaleX, scaleY);

        const drawWidth = asset.width * scale;
        const drawHeight = asset.height * scale;
        const drawX = cardX + (DRAW_CARD_W - drawWidth) / 2;
        const drawY = cardY + (DRAW_CARD_H - drawHeight) / 2;

        display.drawImage(asset.image, drawX, drawY, drawWidth, drawHeight);
      }
    }
  } else {
    // Empty placeholder
    display.drawRect(DRAW_PILE_X, DRAW_PILE_Y, DRAW_CARD_W, DRAW_CARD_H, {
      fill: '#1a202c',
      stroke: '#4a5568',
      lineWidth: 2,
    });
    display.drawText('EMPTY', DRAW_PILE_X + DRAW_CARD_W / 2, DRAW_PILE_Y + DRAW_CARD_H / 2, {
      font: 'bold 10px monospace',
      fill: '#64748b',
      align: 'center',
      baseline: 'middle',
    });
  }

  // Draw beam glow overlay (always visible, dim when empty)
  const beamGlowAlpha = drawCount > 0 ? drawVisual.beamGlow : 0.15;
  const beamColor = drawCount > 0 ? '#22d3ee' : '#475569';
  const beamCenterX = DRAW_PILE_X + DRAW_CARD_W / 2;
  const beamTopY = DRAW_PILE_Y - 10;
  const beamBottomY = DRAW_PILE_Y + DRAW_CARD_H + 10;

  // Main beam line
  display.drawLine(beamCenterX, beamTopY, beamCenterX, beamBottomY, {
    stroke: beamColor,
    lineWidth: 3,
    alpha: beamGlowAlpha,
  });

  // Glow effect (wider line)
  display.drawLine(beamCenterX, beamTopY - 3, beamCenterX, beamBottomY + 3, {
    stroke: beamColor,
    lineWidth: 8,
    alpha: beamGlowAlpha * 0.5,
  });

  // Draw count badge at bottom-right of pile
  const badgeX = DRAW_PILE_X + DRAW_CARD_W + 5;
  const badgeY = DRAW_PILE_Y + DRAW_CARD_H - 15;
  const badgeRadius = 12;

  // Badge background (dim when empty)
  display.drawCircle(badgeX, badgeY, badgeRadius, {
    fill: drawCount > 0 ? '#22d3ee' : '#4a5568',
    alpha: 0.9,
  });

  // Count text
  display.drawText(String(drawCount), badgeX, badgeY + 1, {
    font: 'bold 11px monospace',
    fill: '#0d1117',
    align: 'center',
    baseline: 'middle',
  });

  // Label
  display.drawText('DRAW', DRAW_PILE_X + DRAW_CARD_W / 2, DRAW_PILE_Y - 8, {
    font: '10px monospace',
    fill: '#94a3b8',
    align: 'center',
    baseline: 'bottom',
  });
}

/** Handle click on draw pile */
export function handleDrawPileClick(mx: number, my: number): boolean {
  const hit = mx >= DRAW_PILE_X && mx <= DRAW_PILE_X + DRAW_CARD_W + 20 &&
              my >= DRAW_PILE_Y && my <= DRAW_PILE_Y + DRAW_CARD_H + 20;
  if (hit) {
    toggleDrawPile();
    return true;
  }
  return false;
}

/** Render the draw pile overlay */
export function renderDrawPileOverlay(
  display: typeof MakkoEngine.display,
  run: RunState,
): void {
  if (!showDrawPile || run.deck.length === 0) return;

  const overlayX = DRAW_PILE_X - 320;
  const overlayY = DRAW_PILE_Y - 200;
  const overlayW = 300;
  const lineHeight = 24;
  const overlayH = Math.min(300, 40 + run.deck.length * lineHeight);

  // Background
  display.drawRect(overlayX, overlayY, overlayW, overlayH, {
    fill: '#0d1117',
    stroke: '#4a5568',
    lineWidth: 2,
  });

  // Header
  display.drawText('DRAW PILE', overlayX + overlayW / 2, overlayY + 20, {
    font: 'bold 16px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'middle',
  });

  // List cards (alphabetically for draw pile)
  const sorted = [...run.deck].sort();
  const maxDisplay = 12;
  const visible = sorted.slice(0, maxDisplay);

  for (let i = 0; i < visible.length; i++) {
    const cardName = getCardName(visible[i]);
    display.drawText(`• ${cardName}`, overlayX + 20, overlayY + 50 + i * lineHeight, {
      font: '14px monospace',
      fill: '#a0aec0',
      align: 'left',
      baseline: 'middle',
    });
  }

  if (sorted.length > maxDisplay) {
    display.drawText(`... and ${sorted.length - maxDisplay} more`, overlayX + overlayW / 2, overlayY + overlayH - 15, {
      font: '12px monospace',
      fill: '#718096',
      align: 'center',
      baseline: 'middle',
    });
  }
}
