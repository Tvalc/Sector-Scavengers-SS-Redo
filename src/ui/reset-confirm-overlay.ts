/**
 * Reset Confirm Overlay — full-screen confirmation dialog for save wipe.
 */

import { MakkoEngine } from '@makko/engine';

// ── Layout Constants ──────────────────────────────────────────────────────────

const PANEL_X = 660;
const PANEL_Y = 340;
const PANEL_W = 600;
const PANEL_H = 400;
const PANEL_RADIUS = 8;

const BTN_W = 220;
const BTN_H = 56;
const BTN_CANCEL_X = 700;
const BTN_CONFIRM_X = 1000;
const BTN_Y = 660;

// ── Main Export ───────────────────────────────────────────────────────────────

export function renderResetConfirmOverlay(mx: number, my: number): 'CONFIRM' | 'CANCEL' | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  // Track press state for each button
  let cancelPressed = false;
  let confirmPressed = false;

  // ── Full-screen backdrop ────────────────────────────────────────────────────
  display.drawRect(0, 0, display.width, display.height, {
    fill: '#000000',
    alpha: 0.75,
  });

  // ── Center panel ─────────────────────────────────────────────────────────────
  display.drawRoundRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, PANEL_RADIUS, {
    fill: '#0d1420',
    stroke: '#e53e3e',
    lineWidth: 2,
  });

  // ── Title ────────────────────────────────────────────────────────────────────
  display.drawText('WIPE ALL PROGRESS?', display.width / 2, 400, {
    font: 'bold 30px monospace',
    fill: '#e53e3e',
    align: 'center',
    baseline: 'middle',
  });

  // ── Warning text block ───────────────────────────────────────────────────────
  const warningLines = [
    'This will permanently delete your save.',
    'Credits, unlocks, survivors, and all',
    'meta progress will be lost forever.',
  ];

  const warningY = 460;
  const warningLH = 28;
  for (let i = 0; i < warningLines.length; i++) {
    display.drawText(warningLines[i], display.width / 2, warningY + i * warningLH, {
      font: '20px monospace',
      fill: '#a0aec0',
      align: 'center',
      baseline: 'top',
    });
  }

  // ── CANCEL button ────────────────────────────────────────────────────────────
  const cancelHover = isOver(mx, my, BTN_CANCEL_X, BTN_Y, BTN_W, BTN_H);
  if (input.isMousePressed(0) && cancelHover) {
    cancelPressed = true;
  }
  const cancelReleased = input.isMouseReleased(0) && cancelHover && cancelPressed;

  display.drawRect(BTN_CANCEL_X, BTN_Y, BTN_W, BTN_H, {
    fill: cancelPressed ? '#0d1420' : cancelHover ? '#1e2a3a' : '#1a2030',
    stroke: cancelHover ? '#4a5568' : '#2d3748',
    lineWidth: 1,
  });
  display.drawText('CANCEL', BTN_CANCEL_X + BTN_W / 2, BTN_Y + BTN_H / 2, {
    font: '18px monospace',
    fill: cancelHover ? '#e2e8f0' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
  });

  // ── CONFIRM button ───────────────────────────────────────────────────────────
  const confirmHover = isOver(mx, my, BTN_CONFIRM_X, BTN_Y, BTN_W, BTN_H);
  if (input.isMousePressed(0) && confirmHover) {
    confirmPressed = true;
  }
  const confirmReleased = input.isMouseReleased(0) && confirmHover && confirmPressed;

  display.drawRect(BTN_CONFIRM_X, BTN_Y, BTN_W, BTN_H, {
    fill: confirmPressed ? '#1a0a0a' : confirmHover ? '#4a1a1a' : '#3e0a0a',
    stroke: confirmHover ? '#fc8181' : '#e53e3e',
    lineWidth: 1,
  });
  display.drawText('WIPE SAVE', BTN_CONFIRM_X + BTN_W / 2, BTN_Y + BTN_H / 2, {
    font: '18px monospace',
    fill: '#e53e3e',
    align: 'center',
    baseline: 'middle',
  });

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  // (Escape key handled by game.ts)

  // ── Return action ─────────────────────────────────────────────────────────────
  if (cancelReleased) return 'CANCEL';
  if (confirmReleased) return 'CONFIRM';

  return null;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}
