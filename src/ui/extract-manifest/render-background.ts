// Extract Manifest — Background and Header Rendering

import { MakkoEngine } from '@makko/engine';
import { COLORS, FONTS } from './constants';
import { HeaderContent } from './types';

export function renderBackground(display: typeof MakkoEngine.display): void {
  display.clear(COLORS.background);

  for (let x = 0; x < display.width; x += 80) {
    display.drawLine(x, 0, x, display.height, { stroke: COLORS.grid, lineWidth: 1 });
  }
  for (let y = 0; y < display.height; y += 80) {
    display.drawLine(0, y, display.width, y, { stroke: COLORS.grid, lineWidth: 1 });
  }
}

export function renderHeader(
  display: typeof MakkoEngine.display,
  header: HeaderContent,
  subtext: { text: string; color: string },
): void {
  display.drawText(header.title, display.width / 2, 50, {
    font: FONTS.headerTitle,
    fill: header.accentColor,
    align: 'center',
  });

  display.drawText(header.subtitle, display.width / 2, 95, {
    font: FONTS.headerSubtitle,
    fill: COLORS.muted,
    align: 'center',
  });

  display.drawText(subtext.text, display.width / 2, 135, {
    font: FONTS.headerSubtext,
    fill: subtext.color,
    align: 'center',
  });
}
