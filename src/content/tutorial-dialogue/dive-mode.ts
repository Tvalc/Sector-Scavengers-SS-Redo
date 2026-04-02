import type { TutorialDialogueEntry } from './types';

// Dive Mode Tutorial (Phases: dive-mode-welcome, dive-mode-hull, dive-mode-extract) - Step 23-24
export const DIVE_MODE_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 23,
    speaker: 'VALU',
    text: 'DIVE MODE active. This is temporary. Everything resets when you extract or collapse.',
    highlight: null,
    lockCards: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 23,
    speaker: 'VALU',
    text: 'Hull: 100. Credits: 0. Run-specific resources. Extract banks credits. Collapse loses all.',
    highlight: 'hull-display',
    lockCards: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 24,
    speaker: 'VALU',
    text: 'Scavenge for income. Repair when damaged. Extract when you have enough. Machine watches.',
    highlight: 'card-scavenge',
    lockCards: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 24,
    speaker: 'VALU',
    text: 'Extract ends the run. But first: the manifest. Declare what they own. Or decide what they do not need to know.',
    highlight: 'card-extract',
    lockCards: false,
    expectedInteraction: { type: 'dive-card', id: 'extract' }
  }
];
