// Shared panel design system — consistent styling across all hub panels

import type { Display2D } from '@makko/engine';

// ── Accent colors per panel ──────────────────────────────────────
export const ACCENT_CYAN    = '#00e5ff';
export const ACCENT_PURPLE  = '#b388ff';
export const ACCENT_ORANGE  = '#ffab40';
export const ACCENT_GREEN   = '#69f0ae';
export const ACCENT_TEAL    = '#1de9b6';

// ── Semantic palette ─────────────────────────────────────────────
export const BG_PANEL       = '#080e1a';
export const BG_CARD        = '#111b2e';
export const BG_CARD_HOVER  = '#182640';
export const BORDER_DEFAULT = '#1e3050';

export const TEXT_PRIMARY   = '#e8edf5';
export const TEXT_SECONDARY = '#8899b0';
export const TEXT_DIM       = '#4a5f7a';

// ── Variant colors for buttons ───────────────────────────────────
const BTN_SUCCESS      = '#2e7d32';
const BTN_SUCCESS_HOV  = '#388e3c';
const BTN_DANGER       = '#b71c1c';
const BTN_DANGER_HOV   = '#c62828';
const BTN_CLOSE        = '#37474f';
const BTN_CLOSE_HOV    = '#455a64';

// ── Button variant type ──────────────────────────────────────────
export type ButtonVariant = 'primary' | 'success' | 'danger' | 'close';

// ── Panel background ─────────────────────────────────────────────
export function drawPanelBg(
  display: Display2D,
  _x: number, _y: number, _w: number, _h: number,
  accentColor: string,
  scale: number, sx: number, sy: number, sw: number, sh: number
): void {
  // Dark fill
  display.drawRect(sx, sy, sw, sh, { fill: BG_PANEL });

  // Accent top bar (4px)
  const barH = 4 * scale;
  display.drawRect(sx, sy, sw, barH, { fill: accentColor });

  // Subtle border
  display.drawRect(sx, sy, sw, sh, { stroke: BORDER_DEFAULT, lineWidth: 1 });
}

// ── Section header with accent underline ─────────────────────────
export function drawSectionHeader(
  display: Display2D,
  text: string,
  x: number, y: number,
  accentColor: string,
  scale: number,
  _sx: number, _sy: number, _sw: number
): void {
  const fontSize = Math.round(46 * scale);
  // Use explicit baseline and alignment for consistent positioning
  display.drawText(text, x, y, {
    font: `bold ${fontSize}px sans-serif`,
    fill: TEXT_PRIMARY,
    align: 'left',
    baseline: 'top',
  });

  // Underline beneath text - use consistent math for alignment
  const metrics = display.measureText(text, { font: `bold ${fontSize}px sans-serif` });
  const lineY = Math.round(y + fontSize + 12 * scale);
  const lineX1 = Math.round(x);
  const lineX2 = Math.round(x + metrics.width);
  display.drawLine(lineX1, lineY, lineX2, lineY, {
    stroke: accentColor,
    lineWidth: Math.max(1, Math.round(2 * scale)),
  });
}

// ── Styled button ────────────────────────────────────────────────
export function drawPanelBtn(
  display: Display2D,
  label: string,
  x: number, y: number, w: number, h: number,
  hover: boolean,
  variant: ButtonVariant,
  scale: number,
  sx: number, sy: number, sw: number, sh: number,
  accentColor: string = ACCENT_CYAN
): void {
  let bg: string;
  let bgHover: string;

  switch (variant) {
    case 'primary':
      bg = dimColor(accentColor, 0.5);
      bgHover = accentColor;
      break;
    case 'success':
      bg = BTN_SUCCESS;
      bgHover = BTN_SUCCESS_HOV;
      break;
    case 'danger':
      bg = BTN_DANGER;
      bgHover = BTN_DANGER_HOV;
      break;
    case 'close':
      bg = BTN_CLOSE;
      bgHover = BTN_CLOSE_HOV;
      break;
  }

  const fill = hover ? bgHover : bg;
  const borderLight = hover ? TEXT_PRIMARY : BORDER_DEFAULT;

  display.drawRoundRect(x, y, w, h, 6 * scale, {
    fill,
    stroke: borderLight,
    lineWidth: 1,
  });

  const fontSize = Math.round(32 * scale);
  display.drawText(label, x + w / 2, y + h / 2, {
    font: `bold ${fontSize}px sans-serif`,
    fill: TEXT_PRIMARY,
    align: 'center',
    baseline: 'middle',
  });
}

// ── Empty state ──────────────────────────────────────────────────
export function drawEmptyState(
  display: Display2D,
  text: string,
  x: number, y: number, w: number,
  scale: number,
  _sx: number, _sy: number
): void {
  const fontSize = Math.round(30 * scale);
  display.drawText(text, x + w / 2, y, {
    font: `${fontSize}px sans-serif`,
    fill: TEXT_DIM,
    align: 'center',
    baseline: 'middle',
  });
}

// ── Internal helpers ─────────────────────────────────────────────

export const ACCENT_GOLD = '#fbd38d';

/** Darken a hex color by a 0-1 factor (0 = black, 1 = unchanged). */
function dimColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  return `rgb(${dr},${dg},${db})`;
}
