import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../../types/state';
import { DoctrineId } from '../../../content/doctrine';
import { ROOM_X, ROOM_W, DOCTRINE_COLORS } from '../constants';
import { lastSignatureUnlockTime, lastSignatureDoctrine, setSignatureUnlock } from '../state';

/** Render the doctrine lean indicator showing player's current alignment */
export function renderDoctrineLean(
  display: typeof MakkoEngine.display,
  run: RunState,
  now: number,
  y: number,
): void {
  const points = run.doctrineRunPoints;
  const hasPoints = points.corporate > 0 || points.cooperative > 0 || points.smuggler > 0;

  if (!hasPoints) return;

  const order: DoctrineId[] = ['corporate', 'cooperative', 'smuggler'];

  // Check for signature unlock (5 points) - flash message
  for (const d of order) {
    if (points[d] >= 5 && run.doctrineCardAddedThisRun) {
      if (lastSignatureDoctrine !== d || now - lastSignatureUnlockTime > 3000) {
        setSignatureUnlock(d, now);
      }
    }
  }

  // Build lean text
  const parts: string[] = [];
  for (const d of order) {
    if (points[d] > 0) {
      const star = points[d] >= 5 && run.doctrineCardAddedThisRun ? '★ ' : '';
      const label = d.charAt(0).toUpperCase() + d.slice(1);
      parts.push(`${star}${label} ${points[d]}`);
    }
  }

  const leanText = `Lean: ${parts.join(' | ')}`;

  display.drawText(leanText, ROOM_X + ROOM_W / 2, y, {
    font: '13px monospace',
    fill: '#718096',
    align: 'center',
    baseline: 'top',
  });

  // Render "Signature card added!" flash if within 2 seconds
  if (lastSignatureUnlockTime > 0 && now - lastSignatureUnlockTime < 2000 && lastSignatureDoctrine) {
    const flashColor = DOCTRINE_COLORS[lastSignatureDoctrine];
    display.drawText('★ Signature card added!', ROOM_X + ROOM_W / 2, y + 18, {
      font: 'bold 12px monospace',
      fill: flashColor,
      align: 'center',
      baseline: 'top',
    });
  }
}
