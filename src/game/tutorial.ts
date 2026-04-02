/**
 * Tutorial Integration
 *
 * Handles tutorial phase progression, dialogue management, and
 * interaction tracking.
 */

import { TutorialController, TutorialScreen } from '../tutorial/tutorial-controller';
import { TutorialContext, TutorialInteraction } from '../tutorial/tutorial-context';
import { getTutorialDialogueForStep, getTutorialDialogueEntriesForStep } from '../content/tutorial-dialogue';
import { DialoguePlayer } from '../dialogue/dialogue-player';
import { TutorialPhase, RunState, MetaState } from '../types/state';
import { GameStore } from '../app/game-store';
import { GameState } from './game-state';
import { ScreenState } from './types';
import { HubTab } from '../ui/hub/index';

export function mapPanelActionToInteraction(actionType: string): TutorialInteraction | null {
  switch (actionType) {
    case 'SELL_SALVAGE':
    case 'SELL_ALL_LOW_TIER':
      return { type: 'panel-action', id: 'sell' };
    case 'PAY_DEBT':
      return { type: 'panel-action', id: 'pay-debt' };
    case 'BUY_VOID_TIER':
    case 'BUY_VOID_SHOP_CARD':
      return { type: 'panel-action', id: 'buy-void' };
    case 'EQUIP_ITEM':
      return { type: 'panel-action', id: 'equip' };
    case 'WAKE_CREW':
      return { type: 'panel-action', id: 'wake' };
    case 'UPGRADE_MODULE':
      return { type: 'panel-action', id: 'upgrade' };
    case 'SET_ACTIVE_REPAIR':
      return { type: 'panel-action', id: 'focus-ship' };
    default:
      return null;
  }
}

export function asTutorialScreen(screen: ScreenState): TutorialScreen | null {
  return screen as TutorialScreen;
}

export function getNextTutorialPhase(
  currentPhase: TutorialPhase,
  screen: TutorialScreen,
  run: RunState | null,
  meta: MetaState,
  lastRun: RunState | null,
): TutorialPhase | null {
  switch (currentPhase) {
    // Dual-mode tutorial flow (new first-time players)
    case 'not-started':
      // If this is a fresh game (totalRuns === 0 and openingPathChosen), use dual-mode flow
      if (meta.totalRuns === 0 && meta.openingPathChosen) {
        return screen === 'hub' ? 'meta-hub-welcome' : null;
      }
      return screen === 'hub' ? 'hub-welcome' : null;
    case 'meta-hub-welcome':
      return 'meta-hub-cards';
    case 'meta-hub-cards':
      return 'meta-hub-start-dive';
    case 'meta-hub-start-dive':
      return screen === 'dive' && run !== null ? 'dive-mode-welcome' : null;
    case 'dive-mode-welcome':
      return 'dive-mode-hull';
    case 'dive-mode-hull':
      return 'dive-mode-extract';
    case 'dive-mode-extract':
      if (screen === 'result' && lastRun !== null) {
        return lastRun.phase === 'extracted' ? 'result-extracted' : 'result-collapsed';
      }
      return null;

    // Legacy flow (for old saves)
    case 'hub-welcome':
      return screen === 'dive' && run !== null && run.round === 1 ? 'dive-round1' : null;
    case 'dive-round1':
      return screen === 'dive' && run !== null && run.round >= 2 ? 'dive-round2' : null;
    case 'dive-round2':
      return screen === 'dive' && run !== null && run.round >= 3 ? 'dive-round3plus' : null;
    case 'dive-round3plus':
      if (screen === 'result' && lastRun !== null) {
        return lastRun.phase === 'extracted' ? 'result-extracted' : 'result-collapsed';
      }
      return null;
    case 'result-extracted':
      if (!meta.tutorialSeenCollapse) return screen === 'hub' ? 'hub-return-pending' : null;
      return screen === 'hub' ? 'hub-return' : null;
    case 'result-collapsed':
      if (!meta.tutorialSeenExtraction) return screen === 'hub' ? 'hub-return-pending' : null;
      return screen === 'hub' ? 'hub-return' : null;
    case 'hub-return-pending':
      if (screen === 'result' && lastRun !== null) {
        return lastRun.phase === 'extracted' ? 'result-extracted' : 'result-collapsed';
      }
      return null;
    case 'hub-return':
      return null;
    case 'salvage-tutorial-5':
      return screen === 'hub' ? 'hub-pre-void' : null;
    case 'void-tutorial-5':
      return screen === 'hub' ? 'hub-pre-hardware' : null;
    case 'hw-tutorial-3':
      return screen === 'hub' ? 'hub-pre-cryo' : null;
    case 'cryo-tutorial-3':
      return screen === 'hub' ? 'hub-pre-modules' : null;
    case 'modules-tutorial-3':
      return screen === 'hub' ? 'hub-pre-ships' : null;
    case 'completed':
      return null;
    default:
      return null;
  }
}

export function getNextTutorialPhaseFromStep(step: number, meta: MetaState): TutorialPhase | null {
  switch (step) {
    // Dual-mode tutorial steps
    case 20:
      return 'meta-hub-cards';
    case 21:
      return 'meta-hub-start-dive';
    case 22:
      // Wait for player to click start dive, handled by shouldAdvance
      return null;
    case 23:
      return 'dive-mode-hull';
    case 24:
      return 'result-extracted';

    // Legacy steps
    case 1:
      return 'hub-welcome';
    case 2:
      return 'dive-round1';
    case 3:
      return 'result-extracted';
    case 4:
      return 'hub-return';
    case 5:
      return 'completed';
    case 6:
      return 'hub-pre-void';
    case 7:
      return 'hub-pre-hardware';
    case 8:
      return 'hub-pre-cryo';
    case 9:
      return 'hub-pre-modules';
    case 10:
      return 'hub-pre-ships';
    case 11:
      return meta.tutorialSeenExtraction ? 'hub-return' : 'hub-return-pending';
    case 12:
      return 'completed';
    case 13:
      return 'void-tutorial-1';
    case 14:
      return 'hw-tutorial-1';
    case 15:
      return 'cryo-tutorial-1';
    case 16:
      return 'modules-tutorial-1';
    case 17:
      return 'ships-tutorial-1';
    case 18:
      return 'completed';
    default:
      return null;
  }
}

export function updateTutorialContext(
  state: GameState,
  step: number,
  entryIndex: number,
): void {
  if (!state.tutorialContext) {
    state.tutorialContext = new TutorialContext(step, entryIndex);
  }

  const stepEntries = getTutorialDialogueEntriesForStep(step);
  if (entryIndex >= 0 && entryIndex < stepEntries.length) {
    const entry = stepEntries[entryIndex];
    state.tutorialContext.setExpectedInteraction(
      entry.expectedInteraction ?? null,
      entry.lockHub || entry.lockCards || false,
    );
  }
}

export function autoSwitchHubTabForTutorial(
  state: GameState,
  activeStep: number,
  phase: TutorialPhase,
  screen: ScreenState,
): void {
  if (screen !== 'hub') return;

  // Auto-switch hub tab for tutorial transition steps
  if (activeStep === 12 && (phase === 'ships-tutorial-1' || phase === 'ships-tutorial-2' || phase === 'ships-tutorial-3')) {
    state.hubTab = 'secondary';
  }
  if (activeStep === 13) state.hubTab = 'secondary';
  if (activeStep === 14) state.hubTab = 'secondary';
  if (activeStep === 15) state.hubTab = 'crew-modules';
  if (activeStep === 16) state.hubTab = 'crew-modules';
  if (activeStep === 17) state.hubTab = 'secondary';
}

export function shouldFilterSalvageEntry(step: number, phase: TutorialPhase): boolean {
  return step === 5 && phase === 'hub-return-pending';
}

export function createDialoguePlayer(state: GameState, activeStep: number): void {
  let entries = getTutorialDialogueForStep(activeStep);
  const meta = state.lastRun?.run ? undefined : undefined; // Will be resolved by caller

  if (shouldFilterSalvageEntry(activeStep, (meta as unknown as MetaState)?.tutorialPhase ?? 'not-started')) {
    const stepEntries = getTutorialDialogueEntriesForStep(activeStep);
    entries = entries.filter((_e, i) => i < stepEntries.length && stepEntries[i].highlight !== 'salvage-btn');
  }

  state.tutorialDialoguePlayer = new DialoguePlayer(entries);
  state.lastTutorialPhase = activeStep;
}
