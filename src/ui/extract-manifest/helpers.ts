// Extract Manifest — Helper Functions

import { MakkoEngine } from '@makko/engine';
import { COLORS } from './constants';

export function hitTest(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

export function formatCredits(value: number): string {
  return `₡${value.toLocaleString()}`;
}

interface ButtonStyle {
  fill?: string;
  stroke?: string;
  text: string;
}

export function drawButton(
  display: typeof MakkoEngine.display,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  mx: number,
  my: number,
  isPressed: boolean,
  style: ButtonStyle,
): boolean {
  const isHovered = hitTest(mx, my, x, y, w, h);
  const bgColor = isPressed ? COLORS.grid : isHovered ? '#252b3d' : COLORS.background;

  display.drawRoundRect(x, y, w, h, 8, {
    fill: bgColor,
    stroke: style.stroke ?? COLORS.muted,
    lineWidth: 2,
  });

  const metrics = display.measureText(label, { font: '18px sans-serif' });
  display.drawText(label, x + (w - metrics.width) / 2, y + h / 2 + 6, {
    font: '18px sans-serif',
    fill: style.text,
  });

  return isHovered && isPressed;
}

export function wrapText(
  display: typeof MakkoEngine.display,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = display.measureText(testLine, { font });

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
