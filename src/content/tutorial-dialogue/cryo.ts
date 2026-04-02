import type { TutorialDialogueEntry } from './types';

// Hub Transition -> Cryo - Step 15 (2 entries)
export const CRYO_TRANSITION_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 15,
    speaker: 'VALU',
    text: 'Close panel. Switch to Crew tab.',
    highlight: 'tab-crew',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 15,
    speaker: 'VALU',
    text: 'Click Cryo. Frozen assets await.',
    highlight: 'cryo-nav',
    expectedInteraction: { type: 'open-panel', id: 'cryo' }
  }
];

// Cryo Tutorial - Step 9 (3 entries)
export const CRYO_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 9,
    speaker: 'VALU',
    text: 'Frozen crew cost nothing. Awake crew cost upkeep. Wake only what you afford.',
    highlight: 'cryo-pool',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 9,
    speaker: 'VALU',
    text: '[Wake] costs cells and adds debt. Two clicks required. Prevents regret.',
    highlight: 'cryo-wake-btn',
    expectedInteraction: { type: 'panel-action', id: 'wake' }
  },
  {
    step: 9,
    speaker: 'VALU',
    text: 'REPAIRS reduces damage. SCAV boosts income. MARKET improves prices. Idle: nothing.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];
