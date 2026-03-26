/**
 * Recap Panel - Mission debrief display
 */

import { MakkoEngine } from '@makko/engine';
import { IntroTerminalOutcome } from '../../content/intro-narrative';
import { getIntroChoiceStats } from '../../content/intro-choice-stats';

const PRESSURE_COLORS: Record<string, string> = {
  low: '#68d391',
  medium: '#f6ad55',
  high: '#e53e3e',
};

export function renderRecapPanel(display: typeof MakkoEngine.display, outcome: IntroTerminalOutcome): void {
  const stats = getIntroChoiceStats(outcome.nodeId);

  // Header
  display.drawText('[ MISSION DEBRIEF ]', display.width / 2, 160, {
    font: 'bold 36px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'middle',
  });

  if (stats) {
    renderStatsRows(display, stats);
  }

  // Divider
  display.drawLine(200, 620, display.width - 200, 620, {
    stroke: '#2d3a4a',
    lineWidth: 1,
  });

  // Opening profile badge
  const profileLabel = outcome.openingProfile.replace(/_/g, ' ').toUpperCase();
  display.drawText(profileLabel, display.width / 2, 660, {
    font: '22px monospace',
    fill: '#4ecdc4',
    align: 'center',
    baseline: 'middle',
  });

  // Footer
  display.drawText('[ PRESS SPACE OR CLICK TO BEGIN ]', display.width / 2, 900, {
    font: '20px monospace',
    fill: '#4a5568',
    align: 'center',
    baseline: 'middle',
  });
}

function renderStatsRows(display: typeof MakkoEngine.display, stats: ReturnType<typeof getIntroChoiceStats>): void {
  if (!stats) return;

  const labelX = 300;
  const valueX = 550;
  const startY = 280;
  const rowSpacing = 44;

  const rows: Array<{ label: string; value: string; color: string }> = [];

  // Starting Funds
  const creditsColor = stats.credits > 500 ? '#68d391' : '#e2e8f0';
  rows.push({ label: 'Starting Funds', value: `₡${stats.credits} credits`, color: creditsColor });

  // Void Echo
  rows.push({ label: 'Void Echo', value: `+${stats.voidEcho} Void Echo`, color: '#4ecdc4' });

  // Energy
  rows.push({ label: 'Energy', value: `${stats.energy} energy per run`, color: '#e2e8f0' });

  // Debt
  rows.push({ label: 'Debt', value: `₡${stats.debt} debt`, color: '#e2e8f0' });

  // Debt Pressure
  const pressureLabel = stats.debtPressure.toUpperCase();
  rows.push({
    label: 'Debt Pressure',
    value: pressureLabel,
    color: PRESSURE_COLORS[stats.debtPressure] ?? '#e2e8f0',
  });

  // Crew
  const crewText = stats.crew.length > 0 ? stats.crew.join(', ') : 'Solo';
  const crewColor = stats.crew.length > 0 ? '#f6ad55' : '#718096';
  rows.push({ label: 'Crew', value: crewText, color: crewColor });

  // Ship State (if not damaged)
  if (stats.shipState !== 'damaged') {
    const shipLabel = stats.shipState === 'partially_repaired' ? 'Partially Repaired' : 'Stabilized';
    rows.push({ label: 'Ship State', value: shipLabel, color: '#e2e8f0' });
  }

  // Render rows
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const y = startY + i * rowSpacing;

    display.drawText(row.label, labelX, y, {
      font: '24px monospace',
      fill: '#718096',
      align: 'left',
      baseline: 'top',
    });

    display.drawText(row.value, valueX, y, {
      font: '24px monospace',
      fill: row.color,
      align: 'left',
      baseline: 'top',
    });
  }
}
