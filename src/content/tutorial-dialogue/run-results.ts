import type { TutorialDialogueEntry } from './types';

// Result Debrief - Step 4 (4 entries)
export const RESULT_DEBRIEF_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 4,
    speaker: 'VALU',
    text: 'Run complete. More cards unlock through diving. Machine expands vocabulary.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 4,
    speaker: 'VALU',
    text: 'EXTRACTED: credits banked from declared salvage. Smuggled items reach the Hold. The manifest is your truth, chosen.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 4,
    speaker: 'VALU',
    text: 'Credits become balance. Balance attacks debt. Zero debt ends this arrangement.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 4,
    speaker: 'VALU',
    text: 'Void Echo from collapse. Void Communion accepts only this. Fail. Earn. Spend.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];

// Return to Hub Recap - Step 5 (2 entries)
export const RETURN_TO_HUB_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 5,
    speaker: 'VALU',
    text: 'Bill countdown ticks down. Zero triggers billing. Miss a bill: debt doubles.',
    highlight: 'bill-countdown',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 5,
    speaker: 'VALU',
    text: 'Sell salvage. More balance kills debt. Then dive. This is the loop.',
    highlight: 'salvage-btn',
    expectedInteraction: { type: 'hub-btn', id: 'salvage' }
  }
];

// Collapse Result Debrief - Step 11 (3 entries)
export const COLLAPSE_RESULT_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 11,
    speaker: 'VALU',
    text: 'COLLAPSED. Hull zero. Everything voided. Machine teaches what zero means.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 11,
    speaker: 'VALU',
    text: 'Void Echo posts. Wreck pays failure in its own currency. Spend in Communion.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 11,
    speaker: 'VALU',
    text: 'Hull resets. Return to hub. Debt remains. Loop demands continuation.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];
