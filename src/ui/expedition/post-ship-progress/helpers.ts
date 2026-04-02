/**
 * Post-Ship Progress Helper Functions
 *
 * Shared rendering utilities and formatting helpers.
 */

import { MakkoEngine } from '@makko/engine';
import { COLORS } from '../constants';

/** Render a labeled stat row with aligned value. */
export function renderStatRow(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  label: string,
  value: string,
  valueColor: string,
): number {
  display.drawText(label, x, y, {
    font: '14px monospace',
    fill: COLORS.label,
    align: 'left',
    baseline: 'top',
  });

  display.drawText(value, x + 260, y, {
    font: 'bold 14px monospace',
    fill: valueColor,
    align: 'right',
    baseline: 'top',
  });

  return y + 28; // LINE_HEIGHT
}

/** Get color for ship type badge. */
export function getShipTypeColor(shipType: string): string {
  const colors: Record<string, string> = {
    standard: '#475569',
    elite: '#f59e0b',
    miniboss: '#f97316',
    boss: '#ef4444',
    shop: '#14b8a6',
  };
  return colors[shipType] ?? '#475569';
}

/** Get difficulty description from danger rating. */
export function getDifficultyText(danger: number): string {
  if (danger <= 1) return 'Low Risk';
  if (danger <= 2) return 'Moderate';
  if (danger <= 3) return 'High Risk';
  return 'Extreme Danger';
}
