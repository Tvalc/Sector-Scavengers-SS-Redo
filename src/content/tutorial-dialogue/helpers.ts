import type { DialogueEntry } from '../../dialogue/dialogue-player';
import type { TutorialDialogueEntry } from './types';
import { META_HUB_ENTRIES } from './meta-hub';
import { DIVE_MODE_ENTRIES } from './dive-mode';
import { HUB_WALKTHROUGH_ENTRIES } from './hub-walkthrough';
import { FIRST_DIVE_ENTRIES, TUTORIAL_ROUND2_REMINDER } from './first-dive';
import { RESULT_DEBRIEF_ENTRIES, RETURN_TO_HUB_ENTRIES, COLLAPSE_RESULT_ENTRIES } from './run-results';
import { SALVAGE_MARKET_ENTRIES, ENHANCED_SALVAGE_MARKET_ENTRIES } from './salvage-market';
import { VOID_COMMUNION_TRANSITION_ENTRIES, VOID_COMMUNION_ENTRIES } from './void-communion';
import { HARDWARE_TRANSITION_ENTRIES, HARDWARE_ENTRIES } from './hardware';
import { CRYO_TRANSITION_ENTRIES, CRYO_ENTRIES } from './cryo';
import { MODULES_TRANSITION_ENTRIES, MODULES_ENTRIES } from './modules';
import { SHIPS_TRANSITION_ENTRIES, SHIPS_ENTRIES } from './ships';
import { EXTRACTION_MANIFEST_ENTRIES } from './extraction-manifest';
import { TUTORIAL_COMPLETE_ENTRY } from './completion';
import {
  DEBT_CONTRACT_ENTRIES,
  BILLING_FORECAST_ENTRIES,
  POST_SHIP_PROGRESS_ENTRIES,
  MISSED_PAYMENT_WARNING_ENTRIES,
} from './expedition-debt';

// Aggregate all tutorial entries
export const ALL_TUTORIAL_ENTRIES: TutorialDialogueEntry[] = [
  ...META_HUB_ENTRIES,
  ...DIVE_MODE_ENTRIES,
  ...HUB_WALKTHROUGH_ENTRIES,
  ...FIRST_DIVE_ENTRIES,
  ...RESULT_DEBRIEF_ENTRIES,
  ...RETURN_TO_HUB_ENTRIES,
  ...COLLAPSE_RESULT_ENTRIES,
  ...SALVAGE_MARKET_ENTRIES,
  ...VOID_COMMUNION_TRANSITION_ENTRIES,
  ...VOID_COMMUNION_ENTRIES,
  ...HARDWARE_TRANSITION_ENTRIES,
  ...HARDWARE_ENTRIES,
  ...CRYO_TRANSITION_ENTRIES,
  ...CRYO_ENTRIES,
  ...MODULES_TRANSITION_ENTRIES,
  ...MODULES_ENTRIES,
  ...SHIPS_TRANSITION_ENTRIES,
  ...SHIPS_ENTRIES,
  ...EXTRACTION_MANIFEST_ENTRIES,
  ...DEBT_CONTRACT_ENTRIES,
  ...BILLING_FORECAST_ENTRIES,
  ...POST_SHIP_PROGRESS_ENTRIES,
  ...MISSED_PAYMENT_WARNING_ENTRIES,
  TUTORIAL_COMPLETE_ENTRY
];

export function getTutorialDialogueForStep(step: number): DialogueEntry[] {
  const entries = ALL_TUTORIAL_ENTRIES.filter(e => e.step === step);
  if (entries.length === 0) return [];
  return entries.map(e => ({ speaker: e.speaker, text: e.text }));
}

export function getTutorialDialogueEntriesForStep(step: number): TutorialDialogueEntry[] {
  return ALL_TUTORIAL_ENTRIES.filter(e => e.step === step);
}

export { TUTORIAL_ROUND2_REMINDER };
