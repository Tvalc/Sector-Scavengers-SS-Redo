/**
 * Text rendering and wrapping utilities
 */

import { MakkoEngine } from '@makko/engine';

/**
 * Wrap text to fit within maxWidth pixels using the given font.
 */
export function wrapText(text: string, maxWidth: number, font: string): string[] {
  const display = MakkoEngine.display;
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (display.measureText(candidate, { font }).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

/**
 * Render wrapped text to display
 */
export function renderWrappedText(
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  color: string,
  font: string = '24px monospace'
): void {
  const lines = wrapText(text, maxWidth, font);

  for (let i = 0; i < lines.length; i++) {
    MakkoEngine.display.drawText(lines[i], x, y + i * lineHeight, {
      font,
      fill: color,
      align: 'left',
      baseline: 'top',
    });
  }
}
