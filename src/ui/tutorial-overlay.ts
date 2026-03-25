// Non-blocking tutorial guidance banner rendered above game content.
// Sits at the bottom of the screen; does not intercept clicks above y=980.

import { MakkoEngine } from '@makko/engine';
import { TUTORIAL_MESSAGES } from '../tutorial/tutorial-controller';

// ── Layout ────────────────────────────────────────────────────────────────────
const BANNER_X = 0;
const BANNER_Y = 980;
const BANNER_W = 1920;
const BANNER_H = 80;

const BTN_X = 1720;
const BTN_Y = 990;
const BTN_W = 180;
const BTN_H = 56;

// Press-tracking (module-level — survives frame boundaries)
let pressedSkip = false;

function isOverSkip(mx: number, my: number): boolean {
  return mx >= BTN_X && mx <= BTN_X + BTN_W && my >= BTN_Y && my <= BTN_Y + BTN_H;
}

/**
 * Render a semi-transparent guidance banner for the given tutorial step.
 * Returns `true` if the [Skip Tutorial] button was clicked this frame.
 * This does NOT intercept input above y=980 — card clicks remain unaffected.
 */
export function renderTutorialOverlay(step: number, mx: number, my: number): boolean {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  const message = TUTORIAL_MESSAGES[step] ?? '';

  // ── Background banner ──────────────────────────────────────────────────────
  display.drawRect(BANNER_X, BANNER_Y, BANNER_W, BANNER_H, {
    fill: '#0a0d14',
    alpha: 0.88,
  });

  // Subtle top border
  display.drawLine(BANNER_X, BANNER_Y, BANNER_X + BANNER_W, BANNER_Y, {
    stroke: '#4a5568',
    lineWidth: 1,
  });

  // ── Step indicator ─────────────────────────────────────────────────────────
  display.drawText(`Tutorial  ${step} / 5`, 60, BANNER_Y + BANNER_H / 2, {
    font: '18px monospace',
    fill: '#718096',
    align: 'left',
    baseline: 'middle',
  });

  // ── Guidance text ──────────────────────────────────────────────────────────
  display.drawText(message, 960, BANNER_Y + BANNER_H / 2, {
    font: 'bold 22px monospace',
    fill: '#f6e05e',
    align: 'center',
    baseline: 'middle',
  });

  // ── Skip button ────────────────────────────────────────────────────────────
  const hover = isOverSkip(mx, my);
  display.drawRoundRect(BTN_X, BTN_Y, BTN_W, BTN_H, 6, {
    fill: hover ? '#2d3748' : '#1a202c',
    stroke: hover ? '#718096' : '#4a5568',
    lineWidth: 1,
  });
  display.drawText('[Skip Tutorial]', BTN_X + BTN_W / 2, BTN_Y + BTN_H / 2, {
    font: '16px monospace',
    fill: hover ? '#a0aec0' : '#718096',
    align: 'center',
    baseline: 'middle',
  });

  // ── Click detection ────────────────────────────────────────────────────────
  if (input.isMousePressed(0) && isOverSkip(mx, my)) {
    pressedSkip = true;
  }

  let clicked = false;
  if (input.isMouseReleased(0)) {
    if (pressedSkip && isOverSkip(mx, my)) {
      clicked = true;
    }
    pressedSkip = false;
  }

  return clicked;
}
