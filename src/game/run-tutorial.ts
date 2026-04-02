/**
 * Run Tutorial Overlay
 *
 * Handles tutorial overlay for run screens (dive, result, loot nodes, signal nodes, cache nodes).
 */

import { MakkoEngine } from '@makko/engine';
import { GameStore } from '../app/game-store';
import { GameState } from './game-state';
import { TutorialController, TutorialScreen } from '../tutorial/tutorial-controller';
import type { RunScreen } from './types';
import { clearBounds } from '../ui/tutorial-bounds';
import { feedbackLayer } from '../ui/feedback-layer';
import { asTutorialScreen, getNextTutorialPhase, getNextTutorialPhaseFromStep, autoSwitchHubTabForTutorial, mapPanelActionToInteraction, updateTutorialContext } from './tutorial';
import { renderTutorialOverlay, type TutorialHighlight } from '../ui/tutorial-overlay';
import { getTutorialDialogueForStep, getTutorialDialogueEntriesForStep } from '../content/tutorial-dialogue';
import { DialoguePlayer } from '../dialogue/dialogue-player';
import type { MetaState, RunState } from '../types/state';
import type { TutorialInteraction } from '../tutorial/tutorial-context';

/**
 * Initialize a tutorial step with dialogue and context.
 */
function initializeTutorialStep(
  state: GameState,
  activeStep: number,
  meta: MetaState,
): void {
  autoSwitchHubTabForTutorial(state, activeStep, meta.tutorialPhase ?? 'not-started', state.screen);

  let entries = getTutorialDialogueForStep(activeStep);
  if (activeStep === 5 && meta.tutorialPhase === 'hub-return-pending') {
    const stepEntries = getTutorialDialogueEntriesForStep(activeStep);
    entries = entries.filter((_e, i) => i < stepEntries.length && stepEntries[i].highlight !== 'salvage-btn');
  }

  state.tutorialDialoguePlayer = new DialoguePlayer(entries);
  state.lastTutorialPhase = activeStep;
  updateTutorialContext(state, activeStep, 0);
  state.lastPanelAction = null;
}

/**
 * Update and render tutorial dialogue overlay.
 */
function updateAndRenderTutorialDialogue(
  state: GameState,
  store: GameStore,
  tutorial: TutorialController,
  activeStep: number,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  isPanelScreen: boolean,
  dt: number,
): void {
  if (!state.tutorialDialoguePlayer) return;

  state.tutorialDialoguePlayer.update(dt);

  updateTutorialContext(state, activeStep, state.tutorialDialoguePlayer.currentEntryIndex);

  const stepEntries = getTutorialDialogueEntriesForStep(activeStep);
  const entryIndex = state.tutorialDialoguePlayer.currentEntryIndex;
  const highlight: TutorialHighlight = entryIndex >= 0 && entryIndex < stepEntries.length
    ? stepEntries[entryIndex].highlight ?? null
    : null;

  const expectedInteraction = state.tutorialContext?.expectedInteraction;
  if (expectedInteraction?.type === 'panel-action' && state.lastPanelAction) {
    const panelInteraction = mapPanelActionToInteraction(state.lastPanelAction);
    if (panelInteraction && state.tutorialContext?.checkInteraction(panelInteraction)) {
      state.tutorialDialoguePlayer.advance();
      state.lastPanelAction = null;
    }
  }

  const isHub = state.screen === 'hub';
  const result = renderTutorialOverlay(
    state.tutorialDialoguePlayer,
    mx,
    my,
    activeStep,
    highlight,
    dt,
    isHub,
    meta,
    isPanelScreen,
  );

  if (result.interactionRequested && state.tutorialContext) {
    handleTutorialInteraction(state, store, tutorial, activeStep, meta, result.interactionRequested);
  }
}

/**
 * Handle tutorial interaction (next button click, etc).
 */
function handleTutorialInteraction(
  state: GameState,
  store: GameStore,
  _tutorial: TutorialController,
  activeStep: number,
  meta: MetaState,
  interaction: TutorialInteraction,
): void {
  if (!state.tutorialContext?.checkInteraction(interaction)) return;

  state.tutorialDialoguePlayer?.advance();

  if (state.tutorialDialoguePlayer?.isOnLastEntry && state.tutorialDialoguePlayer?.isComplete) {
    const nextPhase = getNextTutorialPhaseFromStep(activeStep, meta);
    if (nextPhase === 'completed') {
      completeTutorial(state, store);
    } else if (nextPhase) {
      store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: nextPhase });
      state.tutorialDialoguePlayer = null;
      state.tutorialContext = null;
    }
  }
}

/**
 * Complete the tutorial and clean up state.
 */
function completeTutorial(state: GameState, store: GameStore): void {
  store.dispatch({ type: 'COMPLETE_TUTORIAL' });
  state.tutorialDialoguePlayer = null;
  state.tutorialContext = null;
}

/**
 * Update run tutorial overlay.
 * Called once per frame from run-scene.ts.
 */
export function updateRunTutorial(
  state: GameState,
  store: GameStore,
  tutorial: TutorialController,
  dt: number,
): void {
  const input = MakkoEngine.input;
  const mx = input.mouseX;
  const my = input.mouseY;
  const now = performance.now();

  const { meta, currentRun } = store.getState();

  const tutorialScreen = asTutorialScreen(state.screen);
  if (tutorialScreen === null) return;

  const currentPhase = meta.tutorialPhase ?? 'not-started';
  const legacyStep = meta.tutorialStep ?? (currentPhase === 'not-started' ? 0 : currentPhase === 'completed' ? 6 : 1);

  if (legacyStep < 19 && tutorial.shouldAdvance(legacyStep, tutorialScreen, meta)) {
    const nextPhase = getNextTutorialPhase(
      currentPhase,
      tutorialScreen,
      currentRun,
      meta,
      state.lastRun.run,
    );
    if (nextPhase && nextPhase !== currentPhase) {
      store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: nextPhase });
    }
  }

  const freshMeta = store.getState().meta;
  const activeStep = tutorial.getActiveStep(tutorialScreen, currentRun, freshMeta);

  if (activeStep === null) return;

  if (activeStep !== state.lastTutorialPhase) {
    initializeTutorialStep(state, activeStep, freshMeta);
  }

  // Run screens are never panel screens
  const isPanelScreen = false;

  if (state.tutorialDialoguePlayer) {
    updateAndRenderTutorialDialogue(state, store, tutorial, activeStep, freshMeta, mx, my, now, isPanelScreen, dt);
  }
}
