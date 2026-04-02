/**
 * Toast Notification System
 *
 * Handles display of temporary notification messages.
 */

import { MakkoEngine } from '@makko/engine';
import { GameState } from './game-state';
import { TOAST_DURATION_MS } from '../config/constants';
import { RunState } from '../types/state';
import { MetaState } from '../types/state';

export function showToast(state: GameState, text: string): void {
  state.setToast(text, TOAST_DURATION_MS);
}

const formatNum = (n: number) => n.toLocaleString('en-US');

export function showRunReturnToast(
  state: GameState,
  lastRun: RunState | null,
  credits: number,
  echo: number,
  meta: MetaState,
): void {
  if (lastRun === null) return;

  let text: string;
  if (lastRun.phase === 'extracted') {
    text = `Extracted! +₡${formatNum(credits)}  echo +${formatNum(echo)}`;
  } else {
    text = `Collapsed. echo +${formatNum(echo)}`;
  }

  const billing = meta.lastBillingResult;
  if (billing !== null) {
    if (billing.paid) {
      text += ` | Bill: PAID ₡${formatNum(billing.amount)}`;
    } else {
      text += ` | Bill missed +₡${formatNum(billing.penaltyAdded)} debt`;
    }
  }

  state.setToast(text, 3000);
}

export function renderToast(state: GameState): void {
  if (!state.toast.text || performance.now() > state.toast.expiry) return;

  MakkoEngine.display.drawText(state.toast.text, 1860, 40, {
    font: '24px monospace',
    fill: '#68d391',
    align: 'right',
    baseline: 'top',
  });
}
