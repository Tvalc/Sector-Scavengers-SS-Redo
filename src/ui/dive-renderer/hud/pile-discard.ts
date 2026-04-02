import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../../types/state';
import { DISCARD_PILE_X, DISCARD_PILE_Y, DISCARD_CARD_W, DISCARD_CARD_H } from '../constants';
import { discardVisual, updateDiscardVisual } from '../state';
import { CORE_CARDS } from '../../../content/cards';

// Discard pile viewer state
let showDiscardPile = false;

export function isDiscardPileVisible(): boolean {
  return showDiscardPile;
}

export function toggleDiscardPile(): void {
  showDiscardPile = !showDiscardPile;
}

export function closeDiscardPile(): void {
  showDiscardPile = false;
}

/** Get card name by ID */
function getCardName(cardId: string): string {
  const card = CORE_CARDS.find(c => c.id === cardId);
  return card?.name || cardId;
}

/** Render visual discard pile with stacked cardbacks and beam glow */
export function renderDiscardPile(
  display: typeof MakkoEngine.display,
  run: RunState,
  now: number,
): void {
  const discardCount = run.discardPile.length;

  // Update discard visual state
  updateDiscardVisual(discardCount, now);

  // Draw stacked cardbacks or empty placeholder
  if (discardCount > 0) {
    const asset = MakkoEngine.staticAsset(discardVisual.cardBackAsset);
    if (asset) {
      const maxVisibleCards = Math.min(discardCount, 8);
      for (let i = 0; i < maxVisibleCards; i++) {
        const offsetX = i * 2;
        const offsetY = i * 2;
        const cardX = DISCARD_PILE_X + offsetX;
        const cardY = DISCARD_PILE_Y + offsetY;

        // Calculate contain scaling for the cardback
        const scaleX = DISCARD_CARD_W / asset.width;
        const scaleY = DISCARD_CARD_H / asset.height;
        const scale = Math.min(scaleX, scaleY);

        const drawWidth = asset.width * scale;
        const drawHeight = asset.height * scale;
        const drawX = cardX + (DISCARD_CARD_W - drawWidth) / 2;
        const drawY = cardY + (DISCARD_CARD_H - drawHeight) / 2;

        display.drawImage(asset.image, drawX, drawY, drawWidth, drawHeight);
      }
    }
  } else {
    // Empty placeholder
    display.drawRect(DISCARD_PILE_X, DISCARD_PILE_Y, DISCARD_CARD_W, DISCARD_CARD_H, {
      fill: '#1a202c',
      stroke: '#4a5568',
      lineWidth: 2,
    });
    display.drawText('EMPTY', DISCARD_PILE_X + DISCARD_CARD_W / 2, DISCARD_PILE_Y + DISCARD_CARD_H / 2, {
      font: 'bold 10px monospace',
      fill: '#64748b',
      align: 'center',
      baseline: 'middle',
    });
  }

  // Draw beam glow overlay (always visible, dim when empty)
  const beamGlowAlpha = discardCount > 0 ? discardVisual.beamGlow : 0.15;
  const beamColor = discardCount > 0 ? '#22d3ee' : '#475569';
  const beamCenterX = DISCARD_PILE_X + DISCARD_CARD_W / 2;
  const beamTopY = DISCARD_PILE_Y - 10;
  const beamBottomY = DISCARD_PILE_Y + DISCARD_CARD_H + 10;

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
  const badgeX = DISCARD_PILE_X + DISCARD_CARD_W + 5;
  const badgeY = DISCARD_PILE_Y + DISCARD_CARD_H - 15;
  const badgeRadius = 12;

  // Badge background (dim when empty)
  display.drawCircle(badgeX, badgeY, badgeRadius, {
    fill: discardCount > 0 ? '#22d3ee' : '#4a5568',
    alpha: 0.9,
  });

  // Count text
  display.drawText(String(discardCount), badgeX, badgeY + 1, {
    font: 'bold 11px monospace',
    fill: '#0d1117',
    align: 'center',
    baseline: 'middle',
  });

  // Label
  display.drawText('DISCARD', DISCARD_PILE_X + DISCARD_CARD_W / 2, DISCARD_PILE_Y - 8, {
    font: '10px monospace',
    fill: '#94a3b8',
    align: 'center',
    baseline: 'bottom',
  });
}

/** Handle click on discard pile */
export function handleDiscardPileClick(mx: number, my: number): boolean {
  const hit = mx >= DISCARD_PILE_X && mx <= DISCARD_PILE_X + DISCARD_CARD_W + 20 &&
              my >= DISCARD_PILE_Y && my <= DISCARD_PILE_Y + DISCARD_CARD_H + 20;
  if (hit) {
    toggleDiscardPile();
    return true;
  }
  return false;
}

/** Render the discard pile overlay */
export function renderDiscardPileOverlay(
  display: typeof MakkoEngine.display,
  run: RunState,
): void {
  if (!showDiscardPile || run.discardPile.length === 0) return;

  // Position to the left of discard pile
  const overlayW = 360;
  const overlayX = DISCARD_PILE_X - overlayW - 10;
  const overlayY = DISCARD_PILE_Y - 200;
  const lineHeight = 24;
  const overlayH = Math.min(280, 40 + run.discardPile.length * lineHeight);

  // Background
  display.drawRect(overlayX, overlayY, overlayW, overlayH, {
    fill: '#0d1117',
    stroke: '#4a5568',
    lineWidth: 2,
  });

  // Header
  display.drawText('DISCARD PILE', overlayX + overlayW / 2, overlayY + 20, {
    font: 'bold 16px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'middle',
  });

  // List cards (most recent first)
  const reversed = [...run.discardPile].reverse();
  const maxDisplay = 10;
  const visible = reversed.slice(0, maxDisplay);

  for (let i = 0; i < visible.length; i++) {
    const cardName = getCardName(visible[i]);
    display.drawText(`• ${cardName}`, overlayX + 20, overlayY + 50 + i * lineHeight, {
      font: '14px monospace',
      fill: '#a0aec0',
      align: 'left',
      baseline: 'middle',
    });
  }

  if (reversed.length > maxDisplay) {
    display.drawText(`... and ${reversed.length - maxDisplay} more`, overlayX + overlayW / 2, overlayY + overlayH - 15, {
      font: '12px monospace',
      fill: '#718096',
      align: 'center',
      baseline: 'middle',
    });
  }
}
