/**
 * Billing Forecast Modal — Pre-Billing Warning & Prediction
 *
 * Displays before billing is processed at expedition end.
 * Shows predicted payment outcome and consequences.
 */

import { MakkoEngine } from '@makko/engine';
import type { MetaState, RunPath, BillingResult } from '../../types/state';
import {
  MAX_MISSED_PAYMENTS,
} from '../../config/constants';
import { calculateShipBilling, getDebtAfterMiss, formatStrikes } from '../../dive/expedition-billing';
import { formatDebt } from '../../dive/expedition-starting-debt';
import { COLORS } from './constants';

// ===== Layout Constants =====

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;
const MODAL_X = 560;
const MODAL_Y = 180;
const MODAL_W = 800;
const MODAL_H = 720;
const PADDING = 40;
const LINE_HEIGHT = 32;
const SECTION_GAP = 28;

// ===== Types =====

export interface BillingForecastState {
  meta: MetaState;
  runPath: RunPath | null;
}

export interface BillingForecastResult {
  /** Whether the bill can be paid with available credits */
  canPay: boolean;
  /** Amount of credits available for payment */
  availableCredits: number;
  /** Billing amount (30% of expedition debt) */
  billingAmount: number;
  /** Current expedition debt before billing */
  currentDebt: number;
  /** Debt ceiling (10M) */
  debtCeiling: number;
  /** Distance to ceiling */
  distanceToCeiling: number;
  /** Debt after billing if paid */
  debtIfPaid: number;
  /** Debt after billing if missed (doubles) */
  debtIfMissed: number;
  /** Whether miss would hit/exceed ceiling */
  ceilingBreachOnMiss: boolean;
  /** Predicted payment result */
  predictedResult: BillingResult;
  /** Warning level for UI coloring */
  warningLevel: 'safe' | 'warning' | 'danger';
  /** Shortfall amount if can't pay */
  shortfall: number;
  /** Current consecutive missed payments */
  currentMissedCount: number;
  /** Consecutive missed payments after this if missed */
  projectedMissedCount: number;
  /** Ships completed so far */
  shipsCompleted: number;
  /** Ships remaining in expedition */
  shipsRemaining: number;
}

let pressedContinue = false;

// ===== Forecast Calculation =====

export function calculateBillingForecast(state: BillingForecastState): BillingForecastResult {
  const { meta, runPath } = state;

  if (!runPath) {
    throw new Error('Billing forecast requires an active expedition');
  }

  // Expedition debt system
  const currentDebt = runPath.expeditionDebt;
  const debtCeiling = runPath.expeditionDebtCeiling;
  const currentMissedCount = runPath.expeditionMissedPayments;
  const shipsCompleted = runPath.shipsCompleted;

  // Calculate 30% billing amount
  const billingAmount = calculateShipBilling(currentDebt);

  // Available credits from expedition
  const availableCredits = runPath.pathCredits;

  // Determine if can pay
  const canPay = availableCredits >= billingAmount;
  const shortfall = canPay ? 0 : billingAmount - availableCredits;

  // Debt projections
  const debtIfPaid = Math.max(0, currentDebt - billingAmount);
  const debtIfMissed = getDebtAfterMiss(currentDebt);
  const ceilingBreachOnMiss = debtIfMissed >= debtCeiling;

  // Distance to ceiling
  const distanceToCeiling = debtCeiling - currentDebt;

  // Warning level
  let warningLevel: 'safe' | 'warning' | 'danger';
  if (canPay) {
    warningLevel = 'safe';
  } else if (ceilingBreachOnMiss) {
    warningLevel = 'danger'; // Death imminent
  } else if (currentMissedCount >= MAX_MISSED_PAYMENTS - 1) {
    warningLevel = 'danger'; // One strike away from fail
  } else if (availableCredits >= billingAmount * 0.5) {
    warningLevel = 'warning';
  } else {
    warningLevel = 'danger';
  }

  // Predicted result
  let predictedResult: BillingResult;
  if (canPay) {
    predictedResult = {
      paid: true,
      amount: billingAmount,
      penaltyAdded: 0,
    };
  } else {
    const penalty = debtIfMissed - currentDebt;
    predictedResult = {
      paid: false,
      amount: billingAmount,
      penaltyAdded: penalty,
    };
  }

  // Projected missed count
  const projectedMissedCount = canPay ? 0 : currentMissedCount + 1;

  // Ships remaining (6 total in expedition)
  const shipsRemaining = 6 - shipsCompleted;

  return {
    canPay,
    availableCredits,
    billingAmount,
    currentDebt,
    debtCeiling,
    distanceToCeiling,
    debtIfPaid,
    debtIfMissed,
    ceilingBreachOnMiss,
    predictedResult,
    warningLevel,
    shortfall,
    currentMissedCount,
    projectedMissedCount,
    shipsCompleted,
    shipsRemaining,
  };
}

// ===== Main Renderer =====

/**
 * Render billing forecast modal.
 * @returns 'CONTINUE' when player clicks to proceed, null otherwise.
 */
export function renderBillingForecastModal(
  display: typeof MakkoEngine.display,
  forecast: BillingForecastResult,
  mx: number,
  my: number,
): 'CONTINUE' | null {
  const input = MakkoEngine.input;

  // Dark backdrop
  display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, {
    fill: '#000000',
    alpha: 0.75,
  });

  // Modal panel with warning-colored border
  const borderColor = getWarningBorderColor(forecast.warningLevel);
  display.drawRoundRect(MODAL_X, MODAL_Y, MODAL_W, MODAL_H, 12, {
    fill: COLORS.panelBg,
    stroke: borderColor,
    lineWidth: 3,
  });

  let y = MODAL_Y + PADDING;

  // Title with warning indicator
  const titleText = forecast.canPay ? 'BILLING FORECAST' : '⚠ BILLING WARNING';
  const titleColor = forecast.canPay ? COLORS.billingPaid : COLORS.danger;
  display.drawText(titleText, SCREEN_WIDTH / 2, y, {
    font: 'bold 28px monospace',
    fill: titleColor,
    align: 'center',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 16;

  // Subtitle
  display.drawText('Corporate debt obligation settlement cycle', SCREEN_WIDTH / 2, y, {
    font: '16px monospace',
    fill: COLORS.subheader,
    align: 'center',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 24;

  // Divider
  display.drawLine(MODAL_X + PADDING, y, MODAL_X + MODAL_W - PADDING, y, {
    stroke: COLORS.divider,
    lineWidth: 1,
  });
  y += SECTION_GAP;

  // Billing Breakdown Section
  y = renderBillingBreakdown(display, y, forecast);
  y += SECTION_GAP;

  // Divider
  display.drawLine(MODAL_X + PADDING, y, MODAL_X + MODAL_W - PADDING, y, {
    stroke: COLORS.divider,
    lineWidth: 1,
  });
  y += SECTION_GAP;

  // Payment Prediction Section
  y = renderPaymentPrediction(display, y, forecast);
  y += SECTION_GAP;

  // Consequence Preview
  if (!forecast.canPay || forecast.projectedMissedCount > 0) {
    y = renderConsequencePreview(display, y, forecast);
    y += SECTION_GAP;
  }

  // Missed Payments Counter
  y = renderMissedPaymentsCounter(display, y, forecast);

  // Continue button
  const result = renderContinueButton(display, mx, my, forecast.canPay);

  // Input handling
  if (input.isKeyPressed('Space') || input.isKeyPressed('Enter')) {
    pressedContinue = true;
  }

  if (input.isMousePressed(0) && result.hover) {
    pressedContinue = true;
  }

  if (input.isMouseReleased(0) || input.isKeyReleased('Space') || input.isKeyReleased('Enter')) {
    if (result.hover && pressedContinue) {
      pressedContinue = false;
      return 'CONTINUE';
    }
    pressedContinue = false;
  }

  return null;
}

// ===== Section Renderers =====

function renderBillingBreakdown(
  display: typeof MakkoEngine.display,
  y: number,
  forecast: BillingForecastResult,
): number {
  // Header
  display.drawText('EXPEDITION DEBT STATUS', MODAL_X + PADDING, y, {
    font: 'bold 18px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 12;

  // Current debt
  y = renderForecastRow(display, y, 'Current expedition debt', formatDebt(forecast.currentDebt), COLORS.value);

  // Debt ceiling
  y = renderForecastRow(display, y, 'Debt ceiling', formatDebt(forecast.debtCeiling), COLORS.value);

  // Distance to ceiling (with warning if close)
  const distancePercent = forecast.distanceToCeiling / forecast.debtCeiling;
  const distanceColor = distancePercent < 0.2 ? COLORS.danger : distancePercent < 0.5 ? COLORS.warning : COLORS.value;
  y = renderForecastRow(display, y, 'Distance to ceiling', formatDebt(forecast.distanceToCeiling), distanceColor);

  // Next billing (30%)
  y += 8;
  display.drawRoundRect(MODAL_X + PADDING, y - 4, MODAL_W - PADDING * 2, LINE_HEIGHT + 8, 4, {
    fill: COLORS.sectionBg,
    stroke: getWarningBorderColor(forecast.warningLevel),
    lineWidth: 1,
  });

  display.drawText('NEXT BILLING (30% OF DEBT)', MODAL_X + PADDING + 12, y, {
    font: 'bold 16px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });

  display.drawText(formatDebt(forecast.billingAmount), MODAL_X + MODAL_W - PADDING - 12, y, {
    font: 'bold 18px monospace',
    fill: getWarningValueColor(forecast.warningLevel),
    align: 'right',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 16;

  return y;
}

function renderPaymentPrediction(
  display: typeof MakkoEngine.display,
  y: number,
  forecast: BillingForecastResult,
): number {
  // Header
  display.drawText('PAYMENT PREDICTION', MODAL_X + PADDING, y, {
    font: 'bold 18px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 12;

  // Ships status
  y = renderForecastRow(display, y, 'Ships completed', `${forecast.shipsCompleted} of 6`, COLORS.value);
  y = renderForecastRow(display, y, 'Ships remaining', `${forecast.shipsRemaining}`, COLORS.value);

  // Available credits
  const availableColor = forecast.canPay ? COLORS.creditPositive : COLORS.warning;
  y = renderForecastRow(display, y, 'Credits available', formatDebt(forecast.availableCredits), availableColor);

  // Bill amount
  y = renderForecastRow(display, y, 'Billing due', `−${formatDebt(forecast.billingAmount)}`, COLORS.creditNegative);

  // Shortfall or surplus
  if (forecast.canPay) {
    const surplus = forecast.availableCredits - forecast.billingAmount;
    y = renderForecastRow(display, y, 'Surplus after payment', formatDebt(surplus), COLORS.creditPositive);
  } else {
    y = renderForecastRow(display, y, 'SHORTFALL', formatDebt(forecast.shortfall), COLORS.danger);
  }

  // Prediction result badge
  y += 16;
  const badgeColor = forecast.canPay ? COLORS.billingPaid : COLORS.danger;
  const badgeText = forecast.canPay ? '✓ BILL WILL BE PAID' : '✗ BILL WILL BE MISSED';

  display.drawRoundRect(MODAL_X + PADDING + 200, y, MODAL_W - PADDING * 2 - 400, 40, 6, {
    fill: forecast.canPay ? '#0a2e1a' : '#2e0a0a',
    stroke: badgeColor,
    lineWidth: 2,
  });

  display.drawText(badgeText, SCREEN_WIDTH / 2, y + 20, {
    font: 'bold 18px monospace',
    fill: badgeColor,
    align: 'center',
    baseline: 'middle',
  });
  y += 56;

  return y;
}

function renderConsequencePreview(
  display: typeof MakkoEngine.display,
  y: number,
  forecast: BillingForecastResult,
): number {
  // Header
  display.drawText('CONSEQUENCE PREVIEW', MODAL_X + PADDING, y, {
    font: 'bold 18px monospace',
    fill: forecast.canPay ? COLORS.header : COLORS.danger,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 12;

  // Determine box height based on content (with 20px internal padding)
  let boxH = 80;
  if (!forecast.canPay) {
    if (forecast.ceilingBreachOnMiss) {
      boxH = 160; // Taller for ceiling breach warning
    } else if (forecast.projectedMissedCount >= MAX_MISSED_PAYMENTS) {
      boxH = 140;
    } else {
      boxH = 100;
    }
  }

  const boxColor = forecast.canPay ? COLORS.sectionBg : '#2e0a0a';
  const borderColor = forecast.canPay ? COLORS.divider : COLORS.danger;

  display.drawRoundRect(MODAL_X + PADDING, y, MODAL_W - PADDING * 2, boxH, 8, {
    fill: boxColor,
    stroke: borderColor,
    lineWidth: 2,
  });

  // 20px internal padding for all content
  const contentX = MODAL_X + PADDING + 20;
  let textY = y + 20;

  if (forecast.canPay) {
    // Show debt reduction
    const debtReduction = Math.min(forecast.billingAmount, forecast.currentDebt);
    display.drawText(`✓ Debt will decrease by ${formatDebt(debtReduction)}`, contentX, textY, {
      font: '16px monospace',
      fill: COLORS.billingPaid,
      align: 'left',
      baseline: 'top',
    });
    textY += 32;

    if (forecast.debtIfPaid === 0 && forecast.currentDebt > 0) {
      display.drawText('★ EXPEDITION VICTORY: DEBT CLEARED ★', contentX, textY, {
        font: 'bold 16px monospace',
        fill: COLORS.victory,
        align: 'left',
        baseline: 'top',
      });
    } else if (forecast.debtIfPaid > 0) {
      display.drawText(`Remaining debt after payment: ${formatDebt(forecast.debtIfPaid)}`, contentX, textY, {
        font: '16px monospace',
        fill: COLORS.value,
        align: 'left',
        baseline: 'top',
      });
    }
  } else {
    // Show penalties
    display.drawText(`✗ Debt will DOUBLE to: ${formatDebt(forecast.debtIfMissed)}`, contentX, textY, {
      font: 'bold 16px monospace',
      fill: COLORS.danger,
      align: 'left',
      baseline: 'top',
    });
    textY += 32;

    // CEILING BREACH WARNING (highest priority)
    if (forecast.ceilingBreachOnMiss) {
      display.drawText('⚠ WARNING: CEILING BREACH — DEATH', contentX, textY, {
        font: 'bold 18px monospace',
        fill: '#ff0000',
        align: 'left',
        baseline: 'top',
      });
      textY += 36;

      display.drawText('Expedition will fail immediately!', contentX, textY, {
        font: '16px monospace',
        fill: COLORS.danger,
        align: 'left',
        baseline: 'top',
      });
    }
    // STRIKE OUT WARNING
    else if (forecast.projectedMissedCount >= MAX_MISSED_PAYMENTS) {
      display.drawText('⚠ STRIKE OUT: 3rd missed payment!', contentX, textY, {
        font: 'bold 16px monospace',
        fill: COLORS.danger,
        align: 'left',
        baseline: 'top',
      });
      textY += 32;

      display.drawText('Expedition will fail!', contentX, textY, {
        font: '16px monospace',
        fill: COLORS.danger,
        align: 'left',
        baseline: 'top',
      });
    }
    // General miss warning
    else {
      display.drawText(`Strike ${forecast.projectedMissedCount}/${MAX_MISSED_PAYMENTS}`, contentX, textY, {
        font: '16px monospace',
        fill: COLORS.warning,
        align: 'left',
        baseline: 'top',
      });
    }
  }

  y += boxH + SECTION_GAP;
  return y;
}

function renderMissedPaymentsCounter(
  display: typeof MakkoEngine.display,
  y: number,
  forecast: BillingForecastResult,
): number {
  // Background bar
  const barX = MODAL_X + PADDING;
  const barW = MODAL_W - PADDING * 2;
  const barH = 48;

  display.drawRoundRect(barX, y, barW, barH, 6, {
    fill: COLORS.sectionBg,
    stroke: COLORS.divider,
    lineWidth: 1,
  });

  // Counter text - show current strikes
  const currentCount = forecast.currentMissedCount;
  const maxCount = MAX_MISSED_PAYMENTS;
  const counterColor = currentCount === 0 ? COLORS.billingPaid : currentCount === 1 ? COLORS.warning : COLORS.danger;

  display.drawText('Missed payment strikes:', barX + 16, y + 14, {
    font: 'bold 16px monospace',
    fill: COLORS.label,
    align: 'left',
    baseline: 'top',
  });

  // Counter indicator - filled dots for current strikes
  const counterX = barX + barW - 140;
  for (let i = 0; i < maxCount; i++) {
    const dotX = counterX + i * 28;
    const filled = i < currentCount;
    const dotColor = filled ? counterColor : COLORS.divider;
    display.drawCircle(dotX, y + 24, 8, {
      fill: dotColor,
      stroke: dotColor,
      lineWidth: 1,
    });
  }

  // Counter text with formatting
  const strikesText = formatStrikes(currentCount);
  display.drawText(strikesText, counterX + maxCount * 28 + 10, y + 14, {
    font: 'bold 16px monospace',
    fill: counterColor,
    align: 'left',
    baseline: 'top',
  });

  y += barH + SECTION_GAP;
  return y;
}

// ===== Continue Button =====

function renderContinueButton(
  display: typeof MakkoEngine.display,
  mx: number,
  my: number,
  canPay: boolean,
): { hover: boolean } {
  const btnW = 280;
  const btnH = 56;
  const btnX = (SCREEN_WIDTH - btnW) / 2;
  const btnY = MODAL_Y + MODAL_H - 80;

  const hover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;

  const btnColor = canPay ? COLORS.button : '#2e0a0a';
  const btnHoverColor = canPay ? COLORS.buttonHover : '#4a1a1a';
  const borderColor = canPay ? COLORS.buttonBorder : COLORS.danger;

  display.drawRoundRect(btnX, btnY, btnW, btnH, 8, {
    fill: hover ? btnHoverColor : btnColor,
    stroke: borderColor,
    lineWidth: 2,
  });

  display.drawText('[ PROCEED TO BILLING ]', SCREEN_WIDTH / 2, btnY + btnH / 2, {
    font: 'bold 18px monospace',
    fill: canPay ? COLORS.buttonText : COLORS.danger,
    align: 'center',
    baseline: 'middle',
  });

  return { hover };
}

// ===== Helpers =====

function renderForecastRow(
  display: typeof MakkoEngine.display,
  y: number,
  label: string,
  value: string,
  valueColor: string,
): number {
  display.drawText(label, MODAL_X + PADDING, y, {
    font: '16px monospace',
    fill: COLORS.label,
    align: 'left',
    baseline: 'top',
  });

  display.drawText(value, MODAL_X + MODAL_W - PADDING, y, {
    font: 'bold 16px monospace',
    fill: valueColor,
    align: 'right',
    baseline: 'top',
  });

  return y + LINE_HEIGHT;
}

/** @deprecated Use formatDebt from expedition-starting-debt instead */
function formatCredits(n: number): string {
  return formatDebt(n);
}

function getWarningBorderColor(level: 'safe' | 'warning' | 'danger'): string {
  switch (level) {
    case 'safe': return COLORS.billingPaid;
    case 'warning': return COLORS.warning;
    case 'danger': return COLORS.danger;
    default: return COLORS.panelBorder;
  }
}

function getWarningValueColor(level: 'safe' | 'warning' | 'danger'): string {
  switch (level) {
    case 'safe': return COLORS.creditPositive;
    case 'warning': return COLORS.warning;
    case 'danger': return COLORS.danger;
    default: return COLORS.value;
  }
}
