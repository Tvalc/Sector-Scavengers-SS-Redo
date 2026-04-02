import type { TutorialDialogueEntry } from './types';

// Salvage Market Tutorial - Step 6 (5 entries)
export const SALVAGE_MARKET_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 6,
    speaker: 'VALU',
    text: 'Your hold. The machine calls this "salvage." You might call it leverage.',
    highlight: 'salvage-inventory',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 6,
    speaker: 'VALU',
    text: 'Scrap for repairs. Components for hardware. Relics for those who trade outside the Company.',
    highlight: 'salvage-inventory',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 6,
    speaker: 'VALU',
    text: 'The Hold does not file manifests. What you bring stays unlogged. Unless you choose otherwise.',
    highlight: 'salvage-sell-btn',
    expectedInteraction: { type: 'panel-action', id: 'sell' }
  },
  {
    step: 6,
    speaker: 'VALU',
    text: '[Pay Debt] is the only button the machine truly sees. Everything else happens in the spaces between.',
    highlight: 'salvage-pay-debt',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 6,
    speaker: 'VALU',
    text: 'Total obligation displayed. But look at your materials. Freedom looks different than debt clearance.',
    highlight: 'salvage-debt-display',
    expectedInteraction: { type: 'next-btn' }
  }
];

// Enhanced Salvage Market Tutorial - Step 26 (5 entries)
export const ENHANCED_SALVAGE_MARKET_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 26,
    speaker: 'VALU',
    text: 'The Hold. Unregistered exchange. No manifests filed here.',
    highlight: 'salvage-btn',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 26,
    speaker: 'VALU',
    text: 'Nexus "chooses not to know" about this level. Their gift to you. Use it.',
    highlight: 'salvage-inventory',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 26,
    speaker: 'VALU',
    text: 'Salvage has material value. Credits only pay debt. Materials build freedom.',
    highlight: 'salvage-inventory',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 26,
    speaker: 'VALU',
    text: 'Hardware requires components. Repairs require scrap. The market serves those who plan beyond the next billing cycle.',
    highlight: 'salvage-sell-btn',
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 26,
    speaker: 'VALU',
    text: 'Every smuggled crate is a vote against the system. Every declared item pays for your cage. Choose deliberately.',
    highlight: 'salvage-debt-display',
    expectedInteraction: { type: 'next-btn' }
  }
];
