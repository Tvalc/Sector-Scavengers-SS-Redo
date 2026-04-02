import type { TutorialDialogueEntry } from './types';

// First Dive Briefing - Step 3 (5 entries)
export const FIRST_DIVE_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 3,
    speaker: 'VALU',
    text: 'Hull: 100. Dangers subtract. Zero means collapse. Everything collected: gone.',
    highlight: 'hull-display',
    lockCards: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 3,
    speaker: 'VALU',
    text: 'Rounds: 10. One card per round. Zero rounds without extract means collapse.',
    highlight: 'rounds-display',
    lockCards: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 3,
    speaker: 'VALU',
    text: 'Scavenge: credits and salvage. 15% hull risk. Income source. Debt demands it.',
    highlight: 'card-scavenge',
    lockCards: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 3,
    speaker: 'VALU',
    text: 'Repair: +15 hull. Use below 50. Machine permits healing. It notes when ignored.',
    highlight: 'card-repair',
    lockCards: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 3,
    speaker: 'VALU',
    text: 'Extract: the exit. Banks credits. But the manifest decides what "all" means. Machine tallies only what you show it.',
    highlight: 'card-extract',
    lockCards: false,
    expectedInteraction: { type: 'dive-card', id: 'extract' }
  }
];

// Round 2 reminder for first dive (shown when round === 2 and totalRuns === 0)
export const TUTORIAL_ROUND2_REMINDER: TutorialDialogueEntry = {
  step: 3,
  speaker: 'VALU',
  text: 'Round 2. Extract before hull zero. Bank credits to reduce debt. Collapse loses all.',
  highlight: null,
  expectedInteraction: { type: 'next-btn' }
};
