// Tutorial flow controller for first-session guidance.
// Steps 1–5 map to the five tutorial milestones; step 6+ = completed.

import { MetaState, RunState } from '../types/state';

/** Subset of ScreenState values the tutorial cares about. */
export type TutorialScreen = 'path-select' | 'hub' | 'dive' | 'result';

/** Human-readable guidance text for each step. */
export const TUTORIAL_MESSAGES: Record<number, string> = {
  1: 'Choose your opening path to begin.',
  2: "You're at the Hub. Press Start Dive to deploy.",
  3: 'Select a tactic card to take action this round.',
  4: 'Run complete. Extract banks credits. Collapse loses them.',
  5: 'Your first run is done. Keep diving to pay off your debt.',
};

export const TUTORIAL_DONE_STEP = 6;

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
    run: RunState | null,
    meta: MetaState,
  ): number | null {
    if (meta.tutorialCompleted) return null;

    const step = meta.tutorialStep === 0 ? 1 : meta.tutorialStep;
    if (step >= TUTORIAL_DONE_STEP) return null;

    switch (step) {
      case 1:
        return screen === 'path-select' ? 1 : null;

      case 2:
        return screen === 'hub' && meta.totalRuns === 0 ? 2 : null;

      case 3:
        // Dive is active, round 1 — player hasn't played a card yet this run
        return screen === 'dive' && run !== null && run.round === 1 ? 3 : null;

      case 4:
        return screen === 'result' ? 4 : null;

      case 5:
        return screen === 'hub' && meta.totalRuns > 0 ? 5 : null;

      default:
        return null;
    }
  }

  /**
   * Returns true when the player has progressed past a step's trigger,
   * signalling the step should advance automatically next frame.
   */
  shouldAdvance(
    step: number,
    screen: TutorialScreen,
    meta: MetaState,
  ): boolean {
    switch (step) {
      case 1:
        // Path has been chosen — move from path-select to hub
        return meta.openingPathChosen !== false;

      case 2:
        // A dive has started — screen will be 'dive' now
        return screen === 'dive';

      case 3:
        // Round advanced past 1, or run ended — card was played
        return screen === 'result' || (screen === 'dive' && meta.totalRuns === 0);

      case 4:
        // Player clicked Continue and returned to hub
        return screen === 'hub' && meta.totalRuns > 0;

      case 5:
        // Step 5 is the last step; it stays visible until dismissed
        return false;

      default:
        return false;
    }
  }

  /**
   * Returns a partial MetaState delta that marks the tutorial complete.
   * Callers should merge this into meta via a store dispatch.
   */
  dismiss(): Pick<MetaState, 'tutorialCompleted' | 'tutorialStep'> {
    return { tutorialCompleted: true, tutorialStep: TUTORIAL_DONE_STEP };
  }
}
