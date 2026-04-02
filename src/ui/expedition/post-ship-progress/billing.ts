/**
 * Post-Ship Progress Billing Section
 *
 * Billing summary display within the center panel.
 */

import { MakkoEngine } from '@makko/engine';
import type { PostShipProgressState } from './types';
import { COLORS } from '../constants';
import { calculateShipBilling, formatStrikes } from '../../../dive/expedition-billing';
import { formatDebt } from '../../../dive/expedition-starting-debt';
import { renderStatRow } from './helpers';
import { CENTER_PANEL_X, CENTER_PANEL_W, CONTENT_PADDING, LINE_HEIGHT, SECTION_GAP } from './constants';

/** Render billing summary section. Returns updated Y position. */
export function renderBillingSection(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
  startY: number,
): number {
  const { runPath, billingResult } = state;
  let y = startY;

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
  display.drawText('BILLING SUMMARY', CENTER_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 12;

  if (billingResult) {
    y = renderProcessedBilling(display, y, billingResult);
  } else {
    y = renderBillingPreview(display, y, runPath);
  }

  return y;
}

function renderProcessedBilling(
  display: typeof MakkoEngine.display,
  y: number,
  billingResult: import('../../../dive/expedition-billing').ShipBillingResult,
): number {
  const statusColor = billingResult.paid ? COLORS.billingPaid : COLORS.danger;
  const statusText = billingResult.paid ? 'PAID' : 'MISSED';

  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Amount Charged', formatDebt(billingResult.billingAmount), COLORS.value);
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Status', statusText, statusColor);
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'New Debt', formatDebt(billingResult.debtAfter), billingResult.paid ? COLORS.creditPositive : COLORS.danger);

  if (billingResult.strikeAdded) {
    y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Strike Added', 'YES', COLORS.warning);
  }

  return y;
}

function renderBillingPreview(
  display: typeof MakkoEngine.display,
  y: number,
  runPath: import('../../../types/state').RunPath,
): number {
  const nextBilling = calculateShipBilling(runPath.expeditionDebt);
  const distanceToCeiling = runPath.expeditionDebtCeiling - runPath.expeditionDebt;

  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Next Billing', formatDebt(nextBilling), COLORS.value);
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Distance to Ceiling', formatDebt(distanceToCeiling), distanceToCeiling < 2000000 ? COLORS.warning : COLORS.value);
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Current Strikes', formatStrikes(runPath.expeditionMissedPayments), runPath.expeditionMissedPayments >= 2 ? COLORS.danger : COLORS.value);

  return y;
}
