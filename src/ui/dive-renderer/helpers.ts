import { DoctrineId } from '../../content/doctrine';
import { DOCTRINE_CARD_MAP } from './constants';

/** Check if a card interaction should be blocked by tutorial locking */
export function isCardLocked(cardId: string, lockedCardId?: string, isTutorialLocked?: boolean): boolean {
  if (!isTutorialLocked) return false;
  if (!lockedCardId) return false;
  return cardId !== lockedCardId;
}

/** Get the doctrine alignment for a specific card */
export function getDoctrineForCard(cardId: string): DoctrineId | null {
  return DOCTRINE_CARD_MAP[cardId] ?? null;
}

/** Wrap text into lines of maximum character length */
export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Determine the currently active doctrine based on points */
export function getActiveDoctrine(points: Record<DoctrineId, number>): DoctrineId | null {
  let maxPoints = -1;
  let active: DoctrineId | null = null;
  for (const d of ['corporate', 'cooperative', 'smuggler'] as DoctrineId[]) {
    if (points[d] > maxPoints) {
      maxPoints = points[d];
      active = d;
    }
  }
  return active;
}
