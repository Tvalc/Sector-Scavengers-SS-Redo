/**
 * Previously Panel - Stats display for returning players
 */

import { MakkoEngine } from '@makko/engine';
import { GameStore } from '../../app/game-store';
import { OPENING_PATH_CONFIG, OpeningPathId } from '../../content/opening-paths';

export function renderPreviouslyPanel(display: typeof MakkoEngine.display, store: GameStore): void {
  const meta = store.getState().meta;

  // Background
  display.drawRect(0, 0, display.width, display.height, { fill: '#0a0d14' });

  // Header
  display.drawText('[ PREVIOUSLY ]', display.width / 2, 180, {
    font: 'bold 32px monospace',
    fill: '#4ecdc4',
    align: 'center',
    baseline: 'middle',
  });

  // Divider
  display.drawLine(200, 220, display.width - 200, 220, {
    stroke: '#2d3a4a',
    lineWidth: 1,
  });

  renderStatsBlock(display, meta);
  renderOpeningPath(display, meta.openingPathChosen);

  // Footer
  display.drawText('[ CLICK OR PRESS SPACE TO CONTINUE ]', display.width / 2, 900, {
    font: '18px monospace',
    fill: '#4a5568',
    align: 'center',
    baseline: 'middle',
  });
}

function renderStatsBlock(display: typeof MakkoEngine.display, meta: any): void {
  const statsY = 280;
  const lineHeight = 44;
  const labelX = display.width / 2 - 200;
  const valueX = display.width / 2 + 50;

  const stats = [
    { label: 'Runs completed:', value: `${meta.totalRuns}` },
    { label: 'Extracts:', value: `${meta.totalExtracts}` },
    { label: 'Credits:', value: `₡${meta.credits}` },
    { label: 'Debt:', value: `₡${meta.debt}` },
    { label: 'Survivors:', value: getSurvivorsLabel(meta.survivorsSaved), color: getSurvivorsColor(meta.survivorsSaved) },
    { label: 'Crew awake:', value: meta.awakenedCrew.length === 0 ? 'None' : meta.awakenedCrew.map((c: string) => c.toUpperCase()).join(', ') },
  ];

  for (let i = 0; i < stats.length; i++) {
    const y = statsY + i * lineHeight;
    const stat = stats[i];

    display.drawText(stat.label, labelX, y, {
      font: '28px monospace',
      fill: '#718096',
      align: 'right',
      baseline: 'top',
    });

    display.drawText(stat.value, valueX, y, {
      font: '28px monospace',
      fill: stat.color ?? '#e2e8f0',
      align: 'left',
      baseline: 'top',
    });
  }
}

function renderOpeningPath(display: typeof MakkoEngine.display, pathId: OpeningPathId | false): void {
  if (pathId === false) return;

  const pathConfig = OPENING_PATH_CONFIG[pathId];
  if (!pathConfig) return;

  // Divider
  display.drawLine(200, 600, display.width - 200, 600, {
    stroke: '#2d3a4a',
    lineWidth: 1,
  });

  // "OPENING PATH" label
  display.drawText('OPENING PATH', display.width / 2, 640, {
    font: '18px monospace',
    fill: '#718096',
    align: 'center',
    baseline: 'middle',
  });

  // Path label
  display.drawText(pathConfig.label, display.width / 2, 680, {
    font: 'bold 28px monospace',
    fill: '#4ecdc4',
    align: 'center',
    baseline: 'middle',
  });

  // Path stats
  const extractionText = pathConfig.extractionBonus > 0 ? `+${pathConfig.extractionBonus} extract bonus` : '0 extract bonus';
  const pathStats = `${pathConfig.energy} energy • +${pathConfig.voidEchoBonus} void echo • ${extractionText}`;
  display.drawText(pathStats, display.width / 2, 720, {
    font: '20px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'middle',
  });
}

function getSurvivorsLabel(survivors: number | 'some' | 'many'): string {
  if (survivors === 0) return 'None';
  if (survivors === 'some') return 'Some';
  if (survivors === 'many') return 'Many';
  return 'None';
}

function getSurvivorsColor(survivors: number | 'some' | 'many'): string {
  if (survivors === 0) return '#e53e3e';
  if (survivors === 'some') return '#f6ad55';
  return '#68d391';
}
