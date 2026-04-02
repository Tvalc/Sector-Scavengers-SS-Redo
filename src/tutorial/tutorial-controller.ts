// Tutorial flow controller for first-session guidance.
// Phases map to tutorial milestones defined in TutorialPhase type

import { MetaState, RunState, TutorialPhase } from '../types/state';

/** Subset of ScreenState values the tutorial cares about. */
export type TutorialScreen = 'hub' | 'dive' | 'result' | 'salvage-market' | 'void-communion' | 'void-shop' | 'hardware' | 'cryo' | 'modules' | 'ships';

export const TUTORIAL_DONE_PHASE = 18;

export class TutorialController {
  constructor(_meta: MetaState) {
    // meta snapshot at construction time; live meta is passed per-call
  }

  /**
   * Returns the active step number if the tutorial is in progress and the
   * current screen/state matches the step's trigger condition, else null.
   */
  getActiveStep(
    screen: TutorialScreen,
    _run: RunState | null,
    meta: MetaState,
  ): number | null {
    if (meta.tutorialCompleted) return null;

    const phase = meta.tutorialPhase ?? 'not-started';

    // If we have the deprecated tutorialStep field, still use it for backward compatibility
    if (phase === 'not-started' && typeof meta.tutorialStep === 'number' && meta.tutorialStep >= 1) {
      if (meta.tutorialStep === 1 || meta.tutorialStep === 2) {
        return screen === 'hub' ? meta.tutorialStep : null;
      }
      if (meta.tutorialStep === 3) {
        return screen === 'dive' ? 3 : null;
      }
      if (meta.tutorialStep === 4) {
        return screen === 'result' ? 4 : null;
      }
      if (meta.tutorialStep === 5) {
        return screen === 'hub' ? 5 : null;
      }
      return null;
    }

    // Map phases to step numbers based on current screen
    switch (phase) {
      // Dual-mode tutorial phases (new first-time flow)
      case 'meta-hub-welcome':
        return screen === 'hub' ? 20 : null;
      case 'meta-hub-cards':
        return screen === 'hub' ? 21 : null;
      case 'meta-hub-start-dive':
        return screen === 'hub' ? 22 : null;
      case 'dive-mode-welcome':
        return screen === 'dive' ? 23 : null;
      case 'dive-mode-hull':
        return screen === 'dive' ? 23 : null;
      case 'dive-mode-extract':
        return screen === 'dive' ? 24 : null;
      // Legacy phases
      case 'hub-welcome':
        return screen === 'hub' ? 2 : null;
      case 'dive-round1':
      case 'dive-round2':
      case 'dive-round3plus':
        if (screen === 'dive') return 3;
        if (screen === 'result') return 4;
        return null;
      case 'result-extracted':
        return screen === 'result' ? 4 : null;
      case 'result-collapsed':
        return screen === 'result' ? 11 : null;
      case 'hub-return-pending':
      case 'hub-return':
        return screen === 'hub' ? 5 : null;
      // Panel tutorial phases
      case 'salvage-tutorial-1':
      case 'salvage-tutorial-2':
      case 'salvage-tutorial-3':
      case 'salvage-tutorial-4':
      case 'salvage-tutorial-5':
        return screen === 'salvage-market' ? 6 : null;
      // Hub transition -> Void
      case 'hub-pre-void':
        return screen === 'hub' ? 13 : null;
      case 'void-tutorial-1':
      case 'void-tutorial-2':
      case 'void-tutorial-3':
      case 'void-tutorial-4':
      case 'void-tutorial-5':
        return screen === 'void-communion' ? 7 : null;
      // Hub transition -> Hardware
      case 'hub-pre-hardware':
        return screen === 'hub' ? 14 : null;
      case 'hw-tutorial-1':
      case 'hw-tutorial-2':
      case 'hw-tutorial-3':
        return screen === 'hardware' ? 8 : null;
      // Hub transition -> Cryo
      case 'hub-pre-cryo':
        return screen === 'hub' ? 15 : null;
      case 'cryo-tutorial-1':
      case 'cryo-tutorial-2':
      case 'cryo-tutorial-3':
        return screen === 'cryo' ? 9 : null;
      // Hub transition -> Modules
      case 'hub-pre-modules':
        return screen === 'hub' ? 16 : null;
      case 'modules-tutorial-1':
      case 'modules-tutorial-2':
      case 'modules-tutorial-3':
        return screen === 'modules' ? 10 : null;
      // Hub transition -> Ships
      case 'hub-pre-ships':
        return screen === 'hub' ? 17 : null;
      case 'ships-tutorial-1':
      case 'ships-tutorial-2':
      case 'ships-tutorial-3':
        return screen === 'hub' ? 12 : null;
      // Expedition debt education phases
      case 'debt-contract-intro':
        return screen === 'hub' ? 30 : null;
      case 'billing-forecast-intro':
        return screen === 'result' ? 31 : null;
      case 'post-ship-progress-intro':
        return screen === 'result' ? 32 : null;
      default:
        return null;
    }
  }

  /**
   * Returns true if the current tutorial state warrants auto-advancing to the next phase.
   */
  shouldAdvance(legacyStep: number, screen: TutorialScreen, meta: MetaState): boolean {
    if (meta.tutorialCompleted) return false;
    if (legacyStep >= TUTORIAL_DONE_PHASE) return false;
    if (meta.tutorialPhase === 'completed') return false;

    const phase = meta.tutorialPhase ?? 'not-started';

    // Dual-mode tutorial flow (new first-time players)
    if (phase === 'not-started' && screen === 'hub') {
      // First-time flow: after intro scene -> meta-hub-welcome
      const m = meta as MetaState;
      if (m.totalRuns === 0 && m.openingPathChosen) {
        return true; // Will advance to meta-hub-welcome
      }
      return true;
    }
    if (phase === 'meta-hub-welcome' && screen === 'hub') {
      return true; // Advance to meta-hub-cards after hub dialogue
    }
    if (phase === 'meta-hub-cards' && screen === 'hub') {
      return true; // Advance to meta-hub-start-dive
    }
    if (phase === 'meta-hub-start-dive' && screen === 'dive') {
      return true; // Player clicked start dive -> dive-mode-welcome
    }
    if ((phase === 'dive-mode-welcome' || phase === 'dive-mode-hull') && screen === 'dive') {
      return true; // Continue dive tutorials
    }
    if (phase === 'dive-mode-extract' && screen === 'result') {
      return true; // After extracting -> result
    }

    // Legacy flow (for players with old saves)
    if (phase === 'hub-welcome' && screen === 'dive') {
      return true;
    }
    if ((phase === 'dive-round1' || phase === 'dive-round2' || phase === 'dive-round3plus') && screen === 'result') {
      return true;
    }
    if ((phase === 'result-extracted' || phase === 'result-collapsed') && screen === 'hub') {
      return true;
    }
    if (phase === 'hub-return-pending' && screen === 'result') {
      return true;
    }
    if (phase === 'hub-return' && screen === 'salvage-market') {
      return true;
    }
    // Hub transition phases advance when user opens the target panel
    if (phase === 'hub-pre-void' && screen === 'void-communion') {
      return true;
    }
    if (phase === 'hub-pre-hardware' && screen === 'hardware') {
      return true;
    }
    if (phase === 'hub-pre-cryo' && screen === 'cryo') {
      return true;
    }
    if (phase === 'hub-pre-modules' && screen === 'modules') {
      return true;
    }
    if (phase === 'hub-pre-ships' && screen === 'hub') {
      return true;
    }
    // Legacy panel-to-panel transitions (for backward compat)
    if (phase === 'salvage-tutorial-5' && screen === 'void-communion') {
      return true;
    }
    if (phase === 'void-tutorial-5' && screen === 'hardware') {
      return true;
    }
    if (phase === 'hw-tutorial-3' && screen === 'cryo') {
      return true;
    }
    if (phase === 'cryo-tutorial-3' && screen === 'modules') {
      return true;
    }
    if (phase === 'modules-tutorial-3' && screen === 'hub') {
      return true;
    }

    // Debt education phases advance when shown
    if (phase === 'debt-contract-intro' && screen === 'hub') {
      return true;
    }
    if (phase === 'billing-forecast-intro' && screen === 'result') {
      return true;
    }
    if (phase === 'post-ship-progress-intro' && screen === 'result') {
      return true;
    }

    return false;
  }

  /**
   * Returns the first tutorial phase for a given panel when entering it
   * during the correct tutorial window.
   */
  getNextPhaseForPanel(currentPhase: TutorialPhase, screen: TutorialScreen): TutorialPhase | null {
    if (currentPhase === 'hub-return-pending') {
      return null;
    }
    if (currentPhase === 'hub-return' && screen === 'salvage-market') {
      return 'salvage-tutorial-1';
    }
    // Hub transition phases -> panel tutorial
    if (currentPhase === 'hub-pre-void' && screen === 'void-communion') {
      return 'void-tutorial-1';
    }
    if (currentPhase === 'hub-pre-hardware' && screen === 'hardware') {
      return 'hw-tutorial-1';
    }
    if (currentPhase === 'hub-pre-cryo' && screen === 'cryo') {
      return 'cryo-tutorial-1';
    }
    if (currentPhase === 'hub-pre-modules' && screen === 'modules') {
      return 'modules-tutorial-1';
    }
    // Legacy direct panel-to-panel (for saves stuck on last panel phase)
    if (currentPhase === 'salvage-tutorial-5' && screen === 'void-communion') {
      return 'void-tutorial-1';
    }
    if (currentPhase === 'void-tutorial-5' && screen === 'hardware') {
      return 'hw-tutorial-1';
    }
    if (currentPhase === 'hw-tutorial-3' && screen === 'cryo') {
      return 'cryo-tutorial-1';
    }
    if (currentPhase === 'cryo-tutorial-3' && screen === 'modules') {
      return 'modules-tutorial-1';
    }
    if (currentPhase === 'modules-tutorial-3' && screen === 'hub') {
      return 'ships-tutorial-1';
    }
    return null;
  }
}
