// Re-export all tutorial dialogue content from the organized module structure
// This file is maintained for backwards compatibility
// New code should import directly from 'tutorial-dialogue/' submodules

export type { HubHighlight, TutorialDialogueEntry } from './tutorial-dialogue/types';

// Re-export individual entry collections
export { META_HUB_ENTRIES } from './tutorial-dialogue/meta-hub';
export { DIVE_MODE_ENTRIES } from './tutorial-dialogue/dive-mode';
export { HUB_WALKTHROUGH_ENTRIES } from './tutorial-dialogue/hub-walkthrough';
export { FIRST_DIVE_ENTRIES } from './tutorial-dialogue/first-dive';
export { RESULT_DEBRIEF_ENTRIES, RETURN_TO_HUB_ENTRIES, COLLAPSE_RESULT_ENTRIES } from './tutorial-dialogue/run-results';
export { SALVAGE_MARKET_ENTRIES, ENHANCED_SALVAGE_MARKET_ENTRIES } from './tutorial-dialogue/salvage-market';
export { VOID_COMMUNION_TRANSITION_ENTRIES, VOID_COMMUNION_ENTRIES } from './tutorial-dialogue/void-communion';
export { HARDWARE_TRANSITION_ENTRIES, HARDWARE_ENTRIES } from './tutorial-dialogue/hardware';
export { CRYO_TRANSITION_ENTRIES, CRYO_ENTRIES } from './tutorial-dialogue/cryo';
export { MODULES_TRANSITION_ENTRIES, MODULES_ENTRIES } from './tutorial-dialogue/modules';
export { SHIPS_TRANSITION_ENTRIES, SHIPS_ENTRIES } from './tutorial-dialogue/ships';
export { EXTRACTION_MANIFEST_ENTRIES } from './tutorial-dialogue/extraction-manifest';
export { TUTORIAL_COMPLETE_ENTRY } from './tutorial-dialogue/completion';

// Re-export helpers with backwards-compatible aliases
export {
  ALL_TUTORIAL_ENTRIES as TUTORIAL_DIALOGUE_ENTRIES,
  TUTORIAL_ROUND2_REMINDER,
  getTutorialDialogueForStep,
  getTutorialDialogueEntriesForStep
} from './tutorial-dialogue/helpers';
