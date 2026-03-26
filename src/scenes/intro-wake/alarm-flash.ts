/**
 * Alarm Flash Effect
 */

import { AlarmFlashState } from './types';

const FLASH_INTERVAL_MS = 100;
const MAX_FLASHES = 3;

export function createAlarmFlash(): AlarmFlashState {
  return {
    active: true,
    flashCount: 0,
    elapsedMs: 0,
  };
}

export function updateAlarmFlash(state: AlarmFlashState, dt: number): void {
  state.elapsedMs += dt;
  const flashIndex = Math.floor(state.elapsedMs / FLASH_INTERVAL_MS);

  if (flashIndex >= MAX_FLASHES * 2) {
    state.active = false;
  }
}

export function renderAlarmFlash(state: AlarmFlashState): void {
  const display = MakkoEngine.display;
  const flashIndex = Math.floor(state.elapsedMs / FLASH_INTERVAL_MS);
  const isOn = flashIndex % 2 === 0 && flashIndex < MAX_FLASHES * 2;

  if (isOn) {
    display.drawRect(0, 0, display.width, display.height, {
      fill: '#ffffff',
      alpha: 0.15,
    });
  }
}

// Import for display access
import { MakkoEngine } from '@makko/engine';
