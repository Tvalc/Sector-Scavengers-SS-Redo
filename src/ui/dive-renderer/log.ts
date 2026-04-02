import { MakkoEngine } from '@makko/engine';
import {
  LOG_BTN_X, LOG_BTN_Y, LOG_BTN_W, LOG_BTN_H,
  LOG_OVERLAY_X, LOG_OVERLAY_Y, LOG_OVERLAY_W, LOG_OVERLAY_H, LOG_MAX_DISPLAY,
} from './constants';
import { isLogOverlayVisible, toggleLogOverlay, closeLogOverlay } from './state';

export { toggleLogOverlay, closeLogOverlay, isLogOverlayVisible };

/** Render the log button at a given x/y position */
export function renderLogButtonAt(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  alpha: number,
  btnX: number = LOG_BTN_X,
  btnY: number = LOG_BTN_Y,
): boolean {
  const hover = mx >= btnX && mx <= btnX + LOG_BTN_W &&
                my >= btnY && my <= btnY + LOG_BTN_H;

  display.drawRect(btnX, btnY, LOG_BTN_W, LOG_BTN_H, {
    fill: isLogOverlayVisible() ? '#2d3748' : '#1a202c',
    stroke: hover ? '#90cdf4' : '#4a5568',
    lineWidth: hover ? 2 : 1,
    alpha,
  });

  display.drawText('LOG', btnX + LOG_BTN_W / 2, btnY + LOG_BTN_H / 2, {
    font: '14px monospace',
    fill: hover ? '#ffffff' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
    alpha,
  });

  return input.isMouseReleased(0) && hover;
}

/** Render the log overlay */
export function renderLogOverlay(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  log: string[],
): void {
  display.drawRect(0, 0, 1920, 1080, {
    fill: '#0d1117',
    alpha: 0.5,
  });

  display.drawRect(LOG_OVERLAY_X, LOG_OVERLAY_Y, LOG_OVERLAY_W, LOG_OVERLAY_H, {
    fill: '#0d1117',
    stroke: '#4a5568',
    lineWidth: 2,
    alpha: 0.9,
  });

  display.drawText('DIVE LOG', LOG_OVERLAY_X + LOG_OVERLAY_W / 2, LOG_OVERLAY_Y + 30, {
    font: 'bold 24px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'top',
  });

  const visibleLog = log.slice(-LOG_MAX_DISPLAY);
  const lineHeight = 32;
  const startY = LOG_OVERLAY_Y + 80;

  for (let i = 0; i < visibleLog.length; i++) {
    display.drawText(visibleLog[i], LOG_OVERLAY_X + 30, startY + i * lineHeight, {
      font: '18px monospace',
      fill: '#a0aec0',
      align: 'left',
      baseline: 'top',
    });
  }

  if (visibleLog.length === 0) {
    display.drawText('No log entries yet...', LOG_OVERLAY_X + LOG_OVERLAY_W / 2, LOG_OVERLAY_Y + LOG_OVERLAY_H / 2, {
      font: '18px monospace',
      fill: '#4a5568',
      align: 'center',
      baseline: 'middle',
    });
  }

  display.drawText('Click anywhere or press ESC to close', LOG_OVERLAY_X + LOG_OVERLAY_W / 2, LOG_OVERLAY_Y + LOG_OVERLAY_H - 20, {
    font: '14px monospace',
    fill: '#718096',
    align: 'center',
    baseline: 'bottom',
  });
}
