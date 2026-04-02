import type { TutorialDialogueEntry } from './types';

// Hub Transition -> Void Communion - Step 13 (2 entries)
export const VOID_COMMUNION_TRANSITION_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 13,
    speaker: 'VALU',
    text: 'Close panel. Return to hub. Ships tab next.',
    highlight: 'tab-secondary',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 13,
    speaker: 'VALU',
    text: 'Click Void Communion. Machine teaches failure currency.',
    highlight: 'void-communion-nav',
    expectedInteraction: { type: 'open-panel', id: 'void-communion' }
  }
];

// Void Communion Tutorial - Step 7 (5 entries)
export const VOID_COMMUNION_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 7,
    speaker: 'VALU',
    text: 'Void Echo. Earned on collapse. Spend here only. Market rejects it.',
    highlight: 'void-echo-count',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 7,
    speaker: 'VALU',
    text: 'Three branches. Survivor: durability. Risk Taker: credits. Void Walker: more echo.',
    highlight: 'void-branches',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 7,
    speaker: 'VALU',
    text: 'Tiers unlock in sequence. No Tier II without Tier I. Machine respects order.',
    highlight: 'void-first-tier',
    expectedInteraction: { type: 'panel-action', id: 'buy-void' }
  },
  {
    step: 7,
    speaker: 'VALU',
    text: 'Effects apply immediately. Next dive starts modified. Machine has adjusted.',
    highlight: 'void-effect',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 7,
    speaker: 'VALU',
    text: 'Void Shop sells cards. New options for your hand. Learn existing ones first.',
    highlight: 'void-shop',
    expectedInteraction: { type: 'next-btn' }
  }
];
