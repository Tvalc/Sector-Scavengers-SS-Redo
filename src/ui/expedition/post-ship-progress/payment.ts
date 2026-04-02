/**
 * Post-Ship Progress Debt Payment Section
 *
 * Early debt payment input and confirmation UI.
 */

import { MakkoEngine } from '@makko/engine';
import type { PostShipProgressState, PostShipProgressAction } from './types';
import { COLORS } from '../constants';
import { formatDebt } from '../../../dive/expedition-starting-debt';
import { renderStatRow } from './helpers';
import { CENTER_PANEL_X, CENTER_PANEL_W, CONTENT_PADDING, LINE_HEIGHT, SECTION_GAP, MIN_PAYMENT_AMOUNT } from './constants';

/** Module-level payment state (persists between frames). */
let paymentInputValue = '';
let paymentError = '';
let lastPaymentAmount = 0;

/** Reset payment state (call when leaving screen). */
export function resetPaymentState(): void {
  paymentInputValue = '';
  paymentError = '';
  lastPaymentAmount = 0;
}

/** Get last payment amount for confirmation messaging. */
export function getLastPaymentAmount(): number {
  return lastPaymentAmount;
}

/** Render debt payment section. Returns action if payment confirmed. */
export function renderDebtPaymentSection(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
  mx: number,
  my: number,
  startY: number,
): PostShipProgressAction | null {
  const input = MakkoEngine.input;
  const { runPath } = state;

  // Only show if there's debt and available credits
  if (runPath.expeditionDebt <= 0 || runPath.pathCredits <= 0) return null;

  let y = startY;
  let action: PostShipProgressAction | null = null;

  // Divider
  display.drawLine(
    CENTER_PANEL_X + CONTENT_PADDING,
    y,
    CENTER_PANEL_X + CENTER_PANEL_W - CONTENT_PADDING,
    y,
    { stroke: COLORS.divider, lineWidth: 1 },
  );
  y += SECTION_GAP;

  // Header
  display.drawText('EARLY DEBT PAYMENT', CENTER_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: COLORS.creditPositive,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 8;

  // Current debt and available credits
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Current Debt', formatDebt(runPath.expeditionDebt), COLORS.creditNegative);
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Available Credits', formatDebt(runPath.pathCredits), COLORS.creditPositive);
  y += 8;

  // Payment input field
  const inputX = CENTER_PANEL_X + CONTENT_PADDING;
  const inputW = CENTER_PANEL_W - CONTENT_PADDING * 2;
  const inputH = 36;

  display.drawRoundRect(inputX, y, inputW, inputH, 6, {
    fill: COLORS.sectionBg,
    stroke: COLORS.divider,
    lineWidth: 1,
  });

  const hasInput = paymentInputValue.length > 0;
  display.drawText(hasInput ? `₡${paymentInputValue}` : 'Enter amount...', inputX + 12, y + inputH / 2, {
    font: '14px monospace',
    fill: hasInput ? COLORS.value : COLORS.subheader,
    align: 'left',
    baseline: 'middle',
  });

  const inputHover = mx >= inputX && mx <= inputX + inputW && my >= y && my <= y + inputH;
  if (inputHover) {
    handleNumberInput(input);
  }

  y += inputH + 8;

  // Calculate and render preview
  const paymentAmount = parseInt(paymentInputValue, 10) || 0;
  const maxPayment = Math.min(runPath.pathCredits, runPath.expeditionDebt);
  const validPayment = paymentAmount >= MIN_PAYMENT_AMOUNT && paymentAmount <= maxPayment;

  if (paymentAmount > 0) {
    y = renderPaymentPreview(display, y, runPath, paymentAmount);
  }

  // Error message
  if (paymentError) {
    display.drawText(paymentError.replace(/\d+/, (match) => parseInt(match).toLocaleString('en-US')), CENTER_PANEL_X + CONTENT_PADDING, y, {
      font: '12px monospace',
      fill: COLORS.danger,
      align: 'left',
      baseline: 'top',
    });
    y += LINE_HEIGHT;
  }

  // Confirm button
  const btnResult = renderConfirmButton(display, input, mx, my, y, validPayment, paymentAmount, runPath);
  if (btnResult.action) action = btnResult.action;

  return action;
}

function handleNumberInput(input: import('@makko/engine').InputHandler): void {
  for (let i = 0; i <= 9; i++) {
    const key = `Digit${i}`;
    if (input.isKeyPressed(key)) {
      paymentInputValue += i.toString();
      paymentError = '';
    }
  }
  if (input.isKeyPressed('Backspace') && paymentInputValue.length > 0) {
    paymentInputValue = paymentInputValue.slice(0, -1);
    paymentError = '';
  }
}

function renderPaymentPreview(
  display: typeof MakkoEngine.display,
  y: number,
  runPath: import('../../../types/state').RunPath,
  paymentAmount: number,
): number {
  const remainingCredits = runPath.pathCredits - paymentAmount;
  const remainingDebt = Math.max(0, runPath.expeditionDebt - paymentAmount);

  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING + 12, y, 'Credits After', formatDebt(Math.max(0, remainingCredits)), COLORS.label);
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING + 12, y, 'Debt After', formatDebt(remainingDebt), remainingDebt === 0 ? COLORS.victory : COLORS.creditNegative);

  return y + 4;
}

function renderConfirmButton(
  display: typeof MakkoEngine.display,
  input: import('@makko/engine').InputHandler,
  mx: number,
  my: number,
  y: number,
  validPayment: boolean,
  paymentAmount: number,
  runPath: import('../../../types/state').RunPath,
): { action: PostShipProgressAction | null } {
  const btnW = 180;
  const btnH = 40;
  const btnX = CENTER_PANEL_X + (CENTER_PANEL_W - btnW) / 2;
  const btnY = y;

  const btnHover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;

  display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
    fill: validPayment ? (btnHover ? '#1e4a3a' : '#0f3d2e') : '#1a202c',
    stroke: validPayment ? (btnHover ? COLORS.creditPositive : '#2f855a') : '#4a5568',
    lineWidth: 2,
  });

  display.drawText('[ PAY DEBT ]', btnX + btnW / 2, btnY + btnH / 2, {
    font: 'bold 14px monospace',
    fill: validPayment ? COLORS.creditPositive : COLORS.subheader,
    align: 'center',
    baseline: 'middle',
  });

  // Handle confirmation
  if (validPayment && btnHover && input.isMouseReleased(0)) {
    lastPaymentAmount = paymentAmount;
    paymentInputValue = '';
    paymentError = '';
    return { action: { type: 'PAY_DEBT', amount: paymentAmount } };
  }

  // Handle invalid click (show error)
  if (!validPayment && btnHover && input.isMouseReleased(0)) {
    if (paymentAmount < MIN_PAYMENT_AMOUNT) {
      paymentError = `Minimum payment is ₡${MIN_PAYMENT_AMOUNT.toLocaleString('en-US')}`;
    } else if (paymentAmount > runPath.pathCredits) {
      paymentError = 'Cannot pay more than available credits';
    } else if (paymentAmount > runPath.expeditionDebt) {
      paymentError = 'Cannot pay more than total debt';
    }
  }

  return { action: null };
}
