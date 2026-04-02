import type { TutorialInteraction } from '../../tutorial/tutorial-context';

/** Check if a hub interaction is allowed given the current tutorial lock state */
export function isInteractionAllowed(element: TutorialInteraction, locked?: TutorialInteraction): boolean {
  if (!locked) return true;
  if (locked === null) return true;
  if (element === null) return false;
  if (locked.type !== element.type) return false;

  switch (locked.type) {
    case 'hub-btn':
      return locked.id === (element as { type: 'hub-btn'; id: string }).id;
    case 'hub-tab':
      return locked.id === (element as { type: 'hub-tab'; id: string }).id;
    case 'dive-card':
      return locked.id === (element as { type: 'dive-card'; id: string }).id;
    case 'next-btn':
      return true;
    default:
      return false;
  }
}
