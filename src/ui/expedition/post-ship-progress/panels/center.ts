/**
 * Post-Ship Progress Center Panel
 *
 * Expedition progress panel showing overall statistics,
 * progress bar, doctrine progress, and billing summary.
 */

import { MakkoEngine } from '@makko/engine';
import type { PostShipProgressState, PostShipProgressAction } from '../types';
import { COLORS } from '../../constants';
import { formatNum } from '../formatters';
import { renderStatRow } from '../helpers';
import { renderBillingSection } from '../billing';
import { renderDebtPaymentSection } from '../payment';
import { CENTER_PANEL_X, CENTER_PANEL_W, PANEL_Y, CONTENT_PADDING, LINE_HEIGHT, SECTION_GAP } from '../constants';

/** Render center panel: expedition progress. Returns action from payment section if triggered. */
export function renderCenterPanel(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
  mx: number,
  my: number,
): PostShipProgressAction | null {
  const { runPath, completedNode, doctrinePointsGained } = state;
  let action: PostShipProgressAction | null = null;

  // Panel background
  display.drawRoundRect(CENTER_PANEL_X, PANEL_Y, CENTER_PANEL_W, 780, 12, {
    fill: COLORS.panelBg,
    stroke: COLORS.panelBorder,
    lineWidth: 2,
  });

  let y = PANEL_Y + CONTENT_PADDING + 10;

  // Header
  display.drawText('EXPEDITION PROGRESS', CENTER_PANEL_X + CENTER_PANEL_W / 2, y, {
    font: 'bold 20px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 20;

  // Progress bar
  y = renderProgressBar(display, y, completedNode.layer + 1);
  y += SECTION_GAP + 12;

  // Divider
  y = renderDivider(display, y);

  // Expedition totals header
  display.drawText('EXPEDITION TOTALS', CENTER_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 12;

  // Path credits
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Credits Accumulated', formatCredits(runPath.pathCredits), COLORS.creditPositive);

  // Path salvage
  const pathSalvageCount = runPath.pathSalvage.reduce((sum, entry) => sum + entry.quantity, 0);
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Salvage Items', `${formatNum(pathSalvageCount)}`, COLORS.salvageHeader);

  // Hull status
  const hullColor = runPath.pathHull > 50 ? COLORS.billingPaid : runPath.pathHull > 25 ? COLORS.warning : COLORS.danger;
  y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Hull Status', `${formatNum(runPath.pathHull)}/100`, hullColor);

  // Shield charges
  if (runPath.pathShieldCharges > 0) {
    y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING, y, 'Shield Charges', `${formatNum(runPath.pathShieldCharges)}`, COLORS.echoColor);
  }
  y += SECTION_GAP;

  // Divider
  y = renderDivider(display, y);

  // Doctrine points
  y = renderDoctrineProgress(display, y, doctrinePointsGained);

  // Deck size
  y = renderDeckSize(display, y, runPath.pathDeck.length);

  // Billing section
  y = renderBillingSection(display, state, y);
  y += SECTION_GAP;

  // Debt payment section
  const paymentAction = renderDebtPaymentSection(display, state, mx, my, y);
  if (paymentAction) action = paymentAction;

  return action;
}

function renderProgressBar(
  display: typeof MakkoEngine.display,
  y: number,
  currentShip: number,
): number {
  const totalShips = 6;
  const barX = CENTER_PANEL_X + CONTENT_PADDING;
  const barW = CENTER_PANEL_W - CONTENT_PADDING * 2;
  const barH = 24;

  // Background
  display.drawRoundRect(barX, y, barW, barH, 6, {
    fill: COLORS.sectionBg,
    stroke: COLORS.divider,
    lineWidth: 1,
  });

  // Fill
  const fillW = (barW - 4) * (currentShip / totalShips);
  if (fillW > 0) {
    display.drawRoundRect(barX + 2, y + 2, fillW, barH - 4, 4, {
      fill: currentShip >= totalShips ? COLORS.victory : COLORS.billingPaid,
    });
  }

  // Text
  display.drawText(`SHIP ${formatNum(currentShip)} OF ${formatNum(totalShips)}`, CENTER_PANEL_X + CENTER_PANEL_W / 2, y + barH / 2, {
    font: 'bold 14px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'middle',
  });

  return y + barH;
}

function renderDivider(display: typeof MakkoEngine.display, y: number): number {
  display.drawLine(
    CENTER_PANEL_X + CONTENT_PADDING,
    y,
    CENTER_PANEL_X + CENTER_PANEL_W - CONTENT_PADDING,
    y,
    { stroke: COLORS.divider, lineWidth: 1 },
  );
  return y + SECTION_GAP;
}

function renderDoctrineProgress(
  display: typeof MakkoEngine.display,
  y: number,
  doctrinePointsGained: Record<string, number>,
): number {
  const totalDoctrinePoints = Object.values(doctrinePointsGained).reduce((a, b) => a + b, 0);
  if (totalDoctrinePoints === 0) return y;

  display.drawText('DOCTRINE PROGRESS', CENTER_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 8;

  for (const [doctrine, points] of Object.entries(doctrinePointsGained)) {
    if (points > 0) {
      const doctrineLabel = doctrine.charAt(0).toUpperCase() + doctrine.slice(1);
      y = renderStatRow(display, CENTER_PANEL_X + CONTENT_PADDING + 12, y, doctrineLabel, `+${formatNum(points)}`, COLORS.echoColor);
    }
  }

  return y + SECTION_GAP;
}

function renderDeckSize(
  display: typeof MakkoEngine.display,
  y: number,
  deckLength: number,
): number {
  display.drawText('CURRENT DECK', CENTER_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 4;

  display.drawText(`${formatNum(deckLength)} cards`, CENTER_PANEL_X + CONTENT_PADDING + 12, y, {
    font: '14px monospace',
    fill: COLORS.value,
    align: 'left',
    baseline: 'top',
  });

  return y + LINE_HEIGHT + SECTION_GAP;
}

/** @deprecated Helper for local formatting, use formatDebt from expedition-starting-debt. */
function formatCredits(n: number): string {
  return `₡${n.toLocaleString('en-US')}`;
}
