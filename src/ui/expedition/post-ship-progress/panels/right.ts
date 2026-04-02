/**
 * Post-Ship Progress Right Panel
 *
 * Next ship preview panel showing target information,
 * danger rating, and ships remaining.
 */

import { MakkoEngine } from '@makko/engine';
import type { PostShipProgressState } from '../types';
import { getNodeName, DANGER_RATING } from '../../../../dive/run-path-generator';
import { COLORS } from '../../constants';
import { formatNum } from '../formatters';
import { getShipTypeColor, getDifficultyText } from '../helpers';
import { RIGHT_PANEL_X, RIGHT_PANEL_W, PANEL_Y, CONTENT_PADDING, LINE_HEIGHT, SECTION_GAP } from '../constants';

/** Render right panel: next ship preview. */
export function renderRightPanel(
  display: typeof MakkoEngine.display,
  state: PostShipProgressState,
): void {
  const { runPath, completedNode } = state;

  // Panel background
  display.drawRoundRect(RIGHT_PANEL_X, PANEL_Y, RIGHT_PANEL_W, 780, 12, {
    fill: COLORS.panelBg,
    stroke: COLORS.panelBorder,
    lineWidth: 2,
  });

  let y = PANEL_Y + CONTENT_PADDING + 10;

  // Header
  display.drawText('NEXT TARGET', RIGHT_PANEL_X + RIGHT_PANEL_W / 2, y, {
    font: 'bold 20px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 20;

  // Get next ship options
  const nextNodes = completedNode.childIds
    .map(id => runPath.nodes.find(n => n.id === id))
    .filter((n): n is import('../../../../types/state').PathTreeNode => n !== undefined && !n.visited);

  if (nextNodes.length === 0) {
    renderFinalShipComplete(display, y);
    return;
  }

  renderNextShipPreview(display, y, nextNodes[0], runPath.seed, completedNode.layer);
}

function renderFinalShipComplete(
  display: typeof MakkoEngine.display,
  y: number,
): void {
  display.drawText('FINAL SHIP COMPLETE', RIGHT_PANEL_X + RIGHT_PANEL_W / 2, y, {
    font: 'bold 18px monospace',
    fill: COLORS.victory,
    align: 'center',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 8;

  display.drawText('Proceed to expedition conclusion', RIGHT_PANEL_X + RIGHT_PANEL_W / 2, y, {
    font: '14px monospace',
    fill: COLORS.subheader,
    align: 'center',
    baseline: 'top',
  });
}

function renderNextShipPreview(
  display: typeof MakkoEngine.display,
  y: number,
  nextNode: import('../../../../types/state').PathTreeNode,
  seed: number,
  completedLayer: number,
): void {
  const nextShipName = getNodeName(nextNode, seed);
  const danger = DANGER_RATING[nextNode.shipType];

  // Ship type badge
  const typeColor = getShipTypeColor(nextNode.shipType);
  display.drawRoundRect(RIGHT_PANEL_X + CONTENT_PADDING, y, RIGHT_PANEL_W - CONTENT_PADDING * 2, 40, 6, {
    fill: typeColor,
    alpha: 0.2,
    stroke: typeColor,
    lineWidth: 2,
  });

  display.drawText(nextNode.shipType.toUpperCase(), RIGHT_PANEL_X + RIGHT_PANEL_W / 2, y + 20, {
    font: 'bold 16px monospace',
    fill: typeColor,
    align: 'center',
    baseline: 'middle',
  });
  y += 50;

  // Ship name
  display.drawText(nextShipName, RIGHT_PANEL_X + RIGHT_PANEL_W / 2, y, {
    font: 'bold 22px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 20;

  // Danger rating
  y = renderDangerRating(display, y, danger);

  // Ships remaining
  const shipsRemaining = 6 - (completedLayer + 1);
  display.drawText(`${formatNum(shipsRemaining)} ship${shipsRemaining > 1 ? 's' : ''} remaining`, RIGHT_PANEL_X + RIGHT_PANEL_W / 2, y, {
    font: '14px monospace',
    fill: COLORS.subheader,
    align: 'center',
    baseline: 'top',
  });
}

function renderDangerRating(
  display: typeof MakkoEngine.display,
  y: number,
  danger: number,
): number {
  display.drawText('DANGER RATING', RIGHT_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 14px monospace',
    fill: COLORS.subheader,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 4;

  const dots = '★'.repeat(danger) + '☆'.repeat(5 - danger);
  const dangerColor = danger >= 4 ? COLORS.danger : danger >= 3 ? COLORS.warning : COLORS.subheader;
  display.drawText(dots, RIGHT_PANEL_X + CONTENT_PADDING, y, {
    font: '16px sans-serif',
    fill: dangerColor,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT + 8;

  const difficultyText = getDifficultyText(danger);
  display.drawText('Estimated Difficulty', RIGHT_PANEL_X + CONTENT_PADDING, y, {
    font: '14px monospace',
    fill: COLORS.subheader,
    align: 'left',
    baseline: 'top',
  });
  y += LINE_HEIGHT;

  display.drawText(difficultyText, RIGHT_PANEL_X + CONTENT_PADDING, y, {
    font: 'bold 16px monospace',
    fill: dangerColor,
    align: 'left',
    baseline: 'top',
  });

  return y + SECTION_GAP + 16;
}
