// Re-export from organized dive-renderer module for backwards compatibility
// This file is maintained for existing imports - new code should import from './dive-renderer/'

export type { DiveAction, TutorialCardInteraction } from './dive-renderer/types';

export {
  isCardLocked,
  wrapText,
  getActiveDoctrine,
  getDoctrineForCard,
} from './dive-renderer/helpers';

export {
  toggleLogOverlay,
  closeLogOverlay,
  isLogOverlayVisible,
} from './dive-renderer/log';

export { renderDive } from './dive-renderer/index';
