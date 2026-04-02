import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../../types/state';
import { DRAW_PILE_X, DRAW_PILE_Y, DRAW_CARD_W, ROOM_X, ROOM_Y, ROOM_W, ROOM_H } from '../constants';

/** Render deck beam pad - idle teleport beam effect at deck position */
export function renderDeckBeamPad(
  display: typeof MakkoEngine.display,
  run: RunState,
  now: number,
): void {
  // Only visible when deck has cards
  if (run.deck.length === 0) return;

  // Position: at draw pile
  const x = DRAW_PILE_X + DRAW_CARD_W / 2;
  const y = DRAW_PILE_Y - 15;
  const beamHeight = 40;

  // Pulsing alpha 0.1-0.2 over 3 seconds
  const pulseCycle = 3000;
  const pulseProgress = (now % pulseCycle) / pulseCycle;
  const pulse = Math.sin(pulseProgress * Math.PI * 2);
  const alpha = 0.15 + pulse * 0.05;

  // Beam color (cyan sci-fi)
  const beamColor = '#22d3ee';

  // Draw vertical beam line
  display.drawLine(x, y, x, y + beamHeight, {
    stroke: beamColor,
    lineWidth: 2,
    alpha,
  });

  // Add subtle glow (wider line with lower alpha)
  display.drawLine(x, y - 2, x, y + beamHeight + 2, {
    stroke: beamColor,
    lineWidth: 6,
    alpha: alpha * 0.3,
  });
}

/** Render deck empty warning if both piles are empty */
export function renderDeckEmptyWarning(
  display: typeof MakkoEngine.display,
  run: RunState,
): void {
  if (run.deck.length > 0 || run.discardPile.length > 0) return;

  const centerX = ROOM_X + ROOM_W / 2;
  const centerY = ROOM_Y + ROOM_H / 2;

  display.drawText('⚠ Deck exhausted', centerX, centerY, {
    font: 'bold 20px monospace',
    fill: '#fc8181',
    align: 'center',
    baseline: 'middle',
  });
}
