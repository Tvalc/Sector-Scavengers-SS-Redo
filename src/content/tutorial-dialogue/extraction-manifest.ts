import type { TutorialDialogueEntry } from './types';

// First Extraction Manifest Tutorial - Step 25 (5 entries)
export const EXTRACTION_MANIFEST_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 25,
    speaker: 'VALU',
    text: 'Extracting requires a manifest. You must declare what Nexus owns... or choose what they do not need to know.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 25,
    speaker: 'VALU',
    text: 'DECLARE: salvage becomes credits immediately. Debt reduces. Machine is satisfied.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 25,
    speaker: 'VALU',
    text: 'SMUGGLE: salvage goes to your hold. No credits. No debt reduction. But materials have value the machine does not control.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 25,
    speaker: 'VALU',
    text: 'Audit risk increases with secrets. Smuggler doctrine reduces detection. Corporate doctrine rewards compliance.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 25,
    speaker: 'VALU',
    text: 'Your crew observes. They judge. The manifest is not just paperwork—it is who you are becoming.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];
