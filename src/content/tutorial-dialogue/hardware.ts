import type { TutorialDialogueEntry } from './types';

// Hub Transition -> Hardware - Step 14 (2 entries)
export const HARDWARE_TRANSITION_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 14,
    speaker: 'VALU',
    text: 'Close panel. One more system here.',
    highlight: 'tab-secondary',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 14,
    speaker: 'VALU',
    text: 'Click Hardware. Equipment slots await.',
    highlight: 'hardware-nav',
    expectedInteraction: { type: 'open-panel', id: 'hardware' }
  }
];

// Hardware Tutorial - Step 8 (3 entries)
export const HARDWARE_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 8,
    speaker: 'VALU',
    text: 'Three slots: Hull, Scanner, Utility. One item each. Equipping replaces old.',
    highlight: 'hw-equipped',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 8,
    speaker: 'VALU',
    text: 'Inventory holds unequipped items. They do nothing here. Machine notes waste.',
    highlight: 'hw-inventory',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 8,
    speaker: 'VALU',
    text: '[Equip] assigns to slot. Old item displaced. Compare before committing.',
    highlight: 'hw-equip-btn',
    expectedInteraction: { type: 'panel-action', id: 'equip' }
  }
];
