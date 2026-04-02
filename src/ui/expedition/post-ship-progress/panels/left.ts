/**
 * Post-Ship Progress Left Panel
 *
 * Ship summary panel showing completed ship stats,
 * credits earned, salvage recovered, and discoveries.
 */

import { MakkoEngine } from '@makko/engine';
import type { PostShipProgressState } from '../types';
import { getNodeName } from '../../../../dive/run-path-generator';
import { getItemById } from '../../../../content/hardware';
import { COLORS } from '../../constants';
import { formatDebt } from '../../../../dive/expedition-starting-debt';
import { formatNum, getTotalSalvageCount, getSalvageValue } from '../formatters';
import { renderStatRow } from '../helpers';
import { LEFT_PANEL_X, LEFT_PANEL_W, PANEL_Y, CONTENT_PADDING, LINE_HEIGHT, SECTION_GAP } from '../constants';

/** Render left panel: completed ship summary. */
export function renderLeftPanel(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
): void {
  const { runPath, completedNode, lastRun } = state;

  // Panel background
  display.drawRoundRect(LEFT_PANEL_X, PANEL_Y, LEFT_PANEL_W, 780, 12, {
    fill: COLORS.panelBg,
    stroke: COLORS.panelBorder,
    lineWidth: 2,
  });

  // Header
  const shipName = getNodeName(completedNode, runPath.seed);
  let y = PANEL_Y + CONTENT_PADDING + 10;

  display.drawText('SHIP COMPLETED', LEFT_PANEL_X + LEFT_PANEL_W / 2, y, {
    font: 'bold 20px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 8;

  display.drawText(shipName.toUpperCase(), LEFT_PANEL_X + LEFT_PANEL_W / 2, y, {
    font: 'bold 24px monospace',
    fill: COLORS.creditPositive,
    align: 'center',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 16;

  // Divider
  display.drawLine(
    LEFT_PANEL_X + CONTENT_PADDING,
    y,
    LEFT_PANEL_X + LEFT_PANEL_W - CONTENT_PADDING,
    y,
    { stroke: COLORS.divider, lineWidth: 1 },
  );
  y += SECTION_GAP;

  // Credits earned this ship
  const creditsEarned = lastRun?.runCredits ?? 0;
  y = renderStatRow(display, LEFT_PANEL_X + CONTENT_PADDING, y, 'Credits Extracted', formatDebt(creditsEarned), COLORS.creditPositive);
  y += SECTION_GAP;

  // Salvage gained this ship
  const salvage = lastRun?.salvage ?? [];
  const salvageCount = getTotalSalvageCount(salvage);
  const salvageValue = getSalvageValue(salvage);

  display.drawText('SALVAGE RECOVERED', LEFT_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 4;

  y = renderStatRow(display, LEFT_PANEL_X + CONTENT_PADDING + 12, y, 'Items', `${formatNum(salvageCount)}`, COLORS.value);
  y = renderStatRow(display, LEFT_PANEL_X + CONTENT_PADDING + 12, y, 'Value', formatDebt(salvageValue), COLORS.salvageHeader);
  y += SECTION_GAP;

  // Items found this ship
  const itemsFound = lastRun?.itemsFound ?? [];
  if (itemsFound.length > 0) {
    y = renderHardwareDiscovered(display, y, itemsFound);
  }

  // Cards acquired this ship
  if (lastRun && lastRun.roundHistory.length > 0) {
    y = renderCardsPlayed(display, y, lastRun.roundHistory);
  }
}

function renderHardwareDiscovered(
  display: typeof MakkoEngine.display,
  y: number,
  itemsFound: string[],
): number {
  display.drawText('HARDWARE DISCOVERED', LEFT_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 4;

  for (const itemId of itemsFound) {
    const item = getItemById(itemId);
    const itemName = item ? item.name : itemId;
    display.drawText(`◆ ${itemName}`, LEFT_PANEL_X + CONTENT_PADDING + 12, y, {
      font: '14px monospace',
      fill: COLORS.value,
      align: 'left',
      baseline: 'top',
    });
    y += LINE_HEIGHT - 4;
  }

  return y + SECTION_GAP;
}

function renderCardsPlayed(
  display: typeof MakkoEngine.display,
  y: number,
  roundHistory: Array<{ cardName?: string; cardsPlayed?: Array<{ cardName: string }> }>,
): number {
  display.drawText('CARDS PLAYED', LEFT_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: COLORS.header,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 4;

  // Collect all card names from both old format (cardName) and new format (cardsPlayed)
  const allCardNames: string[] = [];
  for (const entry of roundHistory) {
    // Old format: single card per round
    if (entry.cardName) {
      allCardNames.push(entry.cardName);
    }
    // New format: multiple cards per round
    if (entry.cardsPlayed) {
      for (const card of entry.cardsPlayed) {
        allCardNames.push(card.cardName);
      }
    }
  }

  const uniqueCards = new Set(allCardNames);
  for (const cardName of uniqueCards) {
    display.drawText(`• ${cardName}`, LEFT_PANEL_X + CONTENT_PADDING + 12, y, {
      font: '14px monospace',
      fill: COLORS.value,
      align: 'left',
      baseline: 'top',
    });
    y += LINE_HEIGHT - 4;
  }

  return y;
}
