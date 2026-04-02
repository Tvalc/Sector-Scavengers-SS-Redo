import type { TutorialDialogueEntry } from './types';

// Hub Transition -> Ships - Step 17 (2 entries)
export const SHIPS_TRANSITION_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 17,
    speaker: 'VALU',
    text: 'Close panel. Switch to Ships tab.',
    highlight: 'tab-secondary',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 17,
    speaker: 'VALU',
    text: 'Ships: long-term repair projects. Machine finds this poetic.',
    highlight: 'ship-grid',
    expectedInteraction: { type: 'next-btn' }
  }
];

// Ships Tutorial - Step 12 (3 entries)
export const SHIPS_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 12,
    speaker: 'VALU',
    text: 'Derelict hulls. Each has repair cost. Progress per run on focused ship only.',
    highlight: 'ship-grid',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 12,
    speaker: 'VALU',
    text: 'Progress fills per run. Meet repair cost: hull claimed. Claimed ships grant bonuses.',
    highlight: 'ship-progress',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 12,
    speaker: 'VALU',
    text: '[Focus] selects a ship. One at a time. Choose wisely.',
    highlight: 'ship-focus-btn',
    expectedInteraction: { type: 'panel-action', id: 'focus-ship' }
  }
];
