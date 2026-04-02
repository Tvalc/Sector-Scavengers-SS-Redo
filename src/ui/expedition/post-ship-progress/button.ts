/**
 * Post-Ship Progress Continue Button
 *
 * Primary action button for continuing expedition.
 */

import { MakkoEngine } from '@makko/engine';
import { COLORS } from '../constants';
import { SCREEN_WIDTH } from './constants';

/** Render continue expedition button. Returns hover state. */
export function renderContinueButton(
  display: typeof MakkoEngine.display,
  mx: number,
  my: number,
): { hover: boolean } {
  const btnW = 320;
  const btnH = 56;
  const btnX = (SCREEN_WIDTH - btnW) / 2;
  const btnY = 920;

  const hover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;

  display.drawRoundRect(btnX, btnY, btnW, btnH, 8, {
    fill: hover ? COLORS.buttonHover : COLORS.button,
    stroke: COLORS.buttonBorder,
    lineWidth: 2,
  });

  display.drawText('[ CONTINUE EXPEDITION ]', SCREEN_WIDTH / 2, btnY + btnH / 2, {
    font: 'bold 18px monospace',
    fill: COLORS.buttonText,
    align: 'center',
    baseline: 'middle',
  });

  return { hover };
}
