/**
 * Post-Ship Progress Outcome Handling
 *
 * Expedition outcome determination and terminal state rendering.
 */

import { MakkoEngine } from '@makko/engine';
import type { RunPath } from '../../../types/state';
import { COLORS } from '../constants';
import { formatDebt } from '../../../dive/expedition-starting-debt';
import { formatStrikes } from '../../../dive/expedition-billing';
import { MAX_MISSED_PAYMENTS } from '../../../config/constants';
import { formatNum, getTotalSalvageCount } from './formatters';
import type { PostShipProgressState } from './types';
import type { ExpeditionOutcome } from './types';
import { SCREEN_WIDTH } from './constants';

/** Determine the current expedition outcome state. */
export function getExpeditionOutcome(runPath: RunPath): ExpeditionOutcome {
  if (runPath.expeditionVictory) return 'victory';
  if (runPath.expeditionFailed) {
    if (runPath.expeditionDebt >= runPath.expeditionDebtCeiling) {
      return 'ceiling_death';
    }
    if (runPath.expeditionMissedPayments >= MAX_MISSED_PAYMENTS) {
      return 'strike_out';
    }
    return 'ceiling_death';
  }
  return 'ongoing';
}

/** Render full-screen outcome panel for terminal states. */
export function renderOutcomePanel(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
  outcome: ExpeditionOutcome,
): void {
  const panelW = 1000;
  const panelH = 600;
  const panelX = (SCREEN_WIDTH - panelW) / 2;
  const panelY = 150;

  const bgColor = outcome === 'victory' ? '#0a2e1a' : '#2e0a0a';
  const borderColor = outcome === 'victory' ? COLORS.victory : COLORS.danger;

  display.drawRoundRect(panelX, panelY, panelW, panelH, 16, {
    fill: bgColor,
    stroke: borderColor,
    lineWidth: 3,
  });

  let y = panelY + 50;

  if (outcome === 'victory') {
    renderVictoryContent(display, state, y);
  } else if (outcome === 'ceiling_death') {
    renderCeilingDeathContent(display, state, y);
  } else if (outcome === 'strike_out') {
    renderStrikeOutContent(display, state, y);
  }
}

function renderVictoryContent(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
  startY: number,
): void {
  let y = startY;
  const { runPath } = state;

  display.drawText('★ DEBT CLEARED ★', SCREEN_WIDTH / 2, y, {
    font: 'bold 48px monospace',
    fill: COLORS.victory,
    align: 'center',
    baseline: 'top',
  });
  y += 80;

  display.drawText('You have successfully cleared all expedition debt!', SCREEN_WIDTH / 2, y, {
    font: '20px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });
  y += 60;

  display.drawText('REWARDS', SCREEN_WIDTH / 2, y, {
    font: 'bold 24px monospace',
    fill: COLORS.creditPositive,
    align: 'center',
    baseline: 'top',
  });
  y += 50;

  y = renderOutcomeStat(display, y, 'Credits Earned', formatDebt(runPath.pathCredits), COLORS.creditPositive);
  y = renderOutcomeStat(display, y, 'Salvage Recovered', `${getTotalSalvageCount(runPath.pathSalvage)} items`, COLORS.salvageHeader);
  y = renderOutcomeStat(display, y, 'Ships Completed', `${runPath.shipsCompleted} of 6`, COLORS.value);
}

function renderCeilingDeathContent(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
  startY: number,
): void {
  let y = startY;
  const { runPath } = state;

  display.drawText('⚠ DEBT CEILING BREACHED', SCREEN_WIDTH / 2, y, {
    font: 'bold 48px monospace',
    fill: '#ff0000',
    align: 'center',
    baseline: 'top',
  });
  y += 80;

  display.drawText('Your debt overwhelmed you.', SCREEN_WIDTH / 2, y, {
    font: '20px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });
  y += 40;

  display.drawText('The corporate collectors have seized your assets.', SCREEN_WIDTH / 2, y, {
    font: '16px monospace',
    fill: COLORS.subheader,
    align: 'center',
    baseline: 'top',
  });
  y += 60;

  y = renderOutcomeStat(display, y, 'Final Debt', formatDebt(runPath.expeditionDebt), COLORS.danger);
  y = renderOutcomeStat(display, y, 'Debt Ceiling', formatDebt(runPath.expeditionDebtCeiling), COLORS.value);
  y = renderOutcomeStat(display, y, 'Ships Completed', `${runPath.shipsCompleted} of 6`, COLORS.value);
}

function renderStrikeOutContent(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
  startY: number,
): void {
  let y = startY;
  const { runPath } = state;

  display.drawText('⚠ TOO MANY MISSED PAYMENTS', SCREEN_WIDTH / 2, y, {
    font: 'bold 48px monospace',
    fill: COLORS.danger,
    align: 'center',
    baseline: 'top',
  });
  y += 80;

  display.drawText('Corporate patience has run out.', SCREEN_WIDTH / 2, y, {
    font: '20px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });
  y += 40;

  display.drawText('Your expedition privileges have been revoked.', SCREEN_WIDTH / 2, y, {
    font: '16px monospace',
    fill: COLORS.subheader,
    align: 'center',
    baseline: 'top',
  });
  y += 60;

  y = renderOutcomeStat(display, y, 'Final Debt', formatDebt(runPath.expeditionDebt), COLORS.danger);
  y = renderOutcomeStat(display, y, 'Missed Payment Strikes', formatStrikes(runPath.expeditionMissedPayments), COLORS.danger);
  y = renderOutcomeStat(display, y, 'Ships Completed', `${runPath.shipsCompleted} of 6`, COLORS.value);
}

/** Render a single stat row in the outcome panel. */
export function renderOutcomeStat(
  display: typeof MakkoEngine.display,
  y: number,
  label: string,
  value: string,
  valueColor: string,
): number {
  display.drawText(label, SCREEN_WIDTH / 2 - 150, y, {
    font: '18px monospace',
    fill: COLORS.label,
    align: 'right',
    baseline: 'top',
  });

  display.drawText(value, SCREEN_WIDTH / 2 + 20, y, {
    font: 'bold 20px monospace',
    fill: valueColor,
    align: 'left',
    baseline: 'top',
  });

  return y + 50;
}

/** Render the continue button for terminal outcomes. */
export function renderOutcomeButton(
  display: typeof MakkoEngine.display,
  mx: number,
  my: number,
  outcome: ExpeditionOutcome,
): { hover: boolean } {
  const btnW = 400;
  const btnH = 60;
  const btnX = (SCREEN_WIDTH - btnW) / 2;
  const btnY = 850;

  const hover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;

  const btnColor = outcome === 'victory' ? '#0f3d2e' : '#3e0a0a';
  const btnHoverColor = outcome === 'victory' ? '#1e4a3a' : '#5a1a1a';
  const borderColor = outcome === 'victory' ? COLORS.victory : COLORS.danger;
  const text = outcome === 'victory' ? '[ CLAIM REWARDS ]' : '[ RETURN TO STATION ]';

  display.drawRoundRect(btnX, btnY, btnW, btnH, 8, {
    fill: hover ? btnHoverColor : btnColor,
    stroke: borderColor,
    lineWidth: 3,
  });

  display.drawText(text, SCREEN_WIDTH / 2, btnY + btnH / 2, {
    font: 'bold 20px monospace',
    fill: outcome === 'victory' ? COLORS.victory : COLORS.danger,
    align: 'center',
    baseline: 'middle',
  });

  return { hover };
}
