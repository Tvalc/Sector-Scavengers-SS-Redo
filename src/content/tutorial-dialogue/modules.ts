import type { TutorialDialogueEntry } from './types';

// Hub Transition -> Modules - Step 16 (2 entries)
export const MODULES_TRANSITION_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 16,
    speaker: 'VALU',
    text: 'Close panel. Still on Crew tab.',
    highlight: 'tab-crew',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 16,
    speaker: 'VALU',
    text: 'Click Modules. Permanent upgrades await.',
    highlight: 'modules-nav',
    expectedInteraction: { type: 'open-panel', id: 'modules' }
  }
];

// Modules Tutorial - Step 10 (3 entries)
export const MODULES_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 10,
    speaker: 'VALU',
    text: 'Modules: permanent upgrades. Cost credits and salvage. Compound across runs.',
    highlight: 'modules-grid',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 10,
    speaker: 'VALU',
    text: '[Upgrade] spends materials. Effects shown on card. Dimmed means you lack resources.',
    highlight: 'modules-upgrade-btn',
    expectedInteraction: { type: 'panel-action', id: 'upgrade' }
  },
  {
    step: 10,
    speaker: 'VALU',
    text: 'Modules persist. Never expire. Machine acknowledges infrastructure matters.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];
