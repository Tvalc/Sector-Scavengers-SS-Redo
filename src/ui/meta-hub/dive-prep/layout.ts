// Section Background Rendering

import { MakkoEngine } from '@makko/engine';
import { SECTION_W, SECTION_H } from './constants';
import { ACCENT, BG_PANEL, BORDER_DEFAULT } from '../../panel-layout';

export function renderSectionBackground(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  title: string,
): void {
  display.drawRoundRect(x, y, SECTION_W, SECTION_H, 12, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  display.drawLine(x, y, x + 30, y, { stroke: ACCENT, lineWidth: 3 });
  display.drawLine(x, y, x, y + 30, { stroke: ACCENT, lineWidth: 3 });

  display.drawText(title, x + 25, y + 28, {
    font: 'bold 22px monospace',
    fill: ACCENT,
    align: 'left',
    baseline: 'top',
  });
}
