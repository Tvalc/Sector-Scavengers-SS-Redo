// Card Collection Panel - Doctrine Summary Bars

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../types/state';
import { DOCTRINE_COLORS } from './constants';

interface DoctrineInfo {
  id: 'corporate' | 'cooperative' | 'smuggler';
  label: string;
}

const doctrines: DoctrineInfo[] = [
  { id: 'corporate', label: 'CORPORATE' },
  { id: 'cooperative', label: 'COOPERATIVE' },
  { id: 'smuggler', label: 'SMUGGLER' },
];

/** Render doctrine summary bars */
export function renderDoctrineSummary(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  x: number,
  y: number,
): void {
  let dx = x;

  for (const doctrine of doctrines) {
    const points = meta.doctrinePoints[doctrine.id];
    const isLocked = meta.doctrineLocked === doctrine.id;
    const colors = DOCTRINE_COLORS[doctrine.id];
    const barW = 260;
    const barH = 45;

    display.drawRoundRect(dx, y, barW, barH, 8, {
      fill: '#1a202c',
      stroke: isLocked ? colors.primary : '#4a5568',
      lineWidth: isLocked ? 3 : 2,
    });

    const progress = Math.min(1, points / 20);
    if (progress > 0) {
      display.drawRoundRect(dx + 3, y + 3, (barW - 6) * progress, barH - 6, 6, {
        fill: colors.primary,
        alpha: isLocked ? 0.6 : 0.4,
      });
    }

    display.drawText(`${doctrine.label}: ${points}`, dx + barW / 2, y + barH / 2, {
      font: isLocked ? 'bold 24px monospace' : '24px monospace',
      fill: isLocked ? colors.text : '#a0aec0',
      align: 'center',
      baseline: 'middle',
    });

    dx += barW + 30;
  }
}
