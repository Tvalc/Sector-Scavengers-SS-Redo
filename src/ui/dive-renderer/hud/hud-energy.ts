import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../../types/state';

/** Render energy bar with pips in the top-right */
export function renderEnergyBar(
  display: typeof MakkoEngine.display,
  run: RunState,
  x: number,
  y: number,
  alpha: number,
): void {
  const pipSize = 16;
  const pipGap = 4;
  const maxPips = run.maxEnergy;

  // Label
  display.drawText('ENERGY', x, y, {
    font: '11px monospace',
    fill: '#94a3b8',
    align: 'left',
    baseline: 'top',
    alpha,
  });

  // Pips
  const labelY = y + 14;
  for (let i = 0; i < maxPips; i++) {
    const px = x + i * (pipSize + pipGap);
    const isFilled = i < run.energy;

    if (isFilled) {
      // Filled pip
      display.drawRoundRect(px, labelY, pipSize, pipSize, 4, {
        fill: '#22d3ee',
        alpha,
      });
    } else {
      // Empty pip
      display.drawRoundRect(px, labelY, pipSize, pipSize, 4, {
        fill: '#1e293b',
        stroke: '#334155',
        lineWidth: 1,
        alpha,
      });
    }
  }
}
