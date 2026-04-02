import type { TutorialDialogueEntry } from './types';

// Tutorial Complete - Step 18 (1 entry)
export const TUTORIAL_COMPLETE_ENTRY: TutorialDialogueEntry = {
  step: 18,
  speaker: 'VALU',
  text: 'All systems reviewed. Machine has no patience for tours. Dive.',
  highlight: 'start-dive-btn',
  expectedInteraction: { type: 'hub-btn', id: 'start-dive' }
};
