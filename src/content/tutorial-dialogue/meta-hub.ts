import type { TutorialDialogueEntry } from './types';

// Meta Hub Tutorial (Phases: meta-hub-welcome, meta-hub-cards, meta-hub-start-dive) - Step 20-22
export const META_HUB_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 20,
    speaker: 'VALU',
    text: 'Welcome to Command Deck. This is permanent. Everything here persists across dives.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 20,
    speaker: 'VALU',
    text: 'This is meta-progression. Cards stay unlocked. Research advances. Upgrades persist.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 20,
    speaker: 'VALU',
    text: 'No debt display here. No credits. No energy. Those are RUN-SPECIFIC only.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 20,
    speaker: 'VALU',
    text: 'Meta: permanent. Runs: temporary. Understand the difference. Machine does.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 21,
    speaker: 'VALU',
    text: 'Cards appear here. Doctrine unlocks them. Corporate. Cooperative. Smuggler.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 21,
    speaker: 'VALU',
    text: 'Research advances as you run. Engineering. Biology. Psionics. Tiers unlock rewards.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 21,
    speaker: 'VALU',
    text: 'Modules upgrade with salvage and credits. Salvage Bay. Cryo Ward. Workshop.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 21,
    speaker: 'VALU',
    text: 'Build infrastructure here. Then dive to earn what you need. Cycle repeats.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 22,
    speaker: 'VALU',
    text: 'Click START DIVE when ready. Enter a temporary run. Earn credits. Extract before collapse.',
    highlight: 'start-dive-btn',
    lockHub: false,
    expectedInteraction: { type: 'hub-btn', id: 'start-dive' }
  }
];
