/**
 * Hub Screen Handler
 *
 * Handles all hub screen interactions including starting dives and opening panels.
 */

import { MakkoEngine } from '@makko/engine';
import { GameStore } from '../app/game-store';
import { GameState } from './game-state';
import { MetaState, TutorialPhase } from '../types/state';
import { TutorialController } from '../tutorial/tutorial-controller';
import { HubAction, HubTab, renderHub } from '../ui/hub/index';
import { TutorialInteraction } from '../tutorial/tutorial-context';
import { serialize } from '../persist/save';
import { showToast } from './toast';

export function mapHubActionToInteraction(action: HubAction): TutorialInteraction | null {
  switch (action) {
    case 'START_DIVE':
      return { type: 'hub-btn', id: 'start-dive' };
    case 'OPEN_SALVAGE_MARKET':
      return { type: 'hub-btn', id: 'salvage' };
    case 'OPEN_VOID_COMMUNION':
      return { type: 'open-panel', id: 'void-communion' };
    case 'OPEN_HARDWARE':
      return { type: 'open-panel', id: 'hardware' };
    case 'OPEN_CRYO':
      return { type: 'open-panel', id: 'cryo' };
    case 'OPEN_MODULES':
      return { type: 'open-panel', id: 'modules' };
    case 'OPEN_CARD_COLLECTION':
      return null; // No tutorial for this yet
    default:
      return null;
  }
}

export function getNextPhaseForPanel(
  controller: TutorialController,
  currentPhase: TutorialPhase,
  panelId: 'void-communion' | 'hardware' | 'cryo' | 'modules',
): TutorialPhase | null {
  return controller.getNextPhaseForPanel(currentPhase, panelId as import('../tutorial/tutorial-controller').TutorialScreen);
}

export function handleHub(
  state: GameState,
  store: GameStore,
  controller: TutorialController,
  action: HubAction | null,
): void {
  const input = MakkoEngine.input;
  const meta = store.getState().meta;

  // Manual save via keyboard
  if (input.isKeyPressed('KeyS')) {
    serialize(store.getState());
    showToast(state, 'Saved.');
    return;
  }

  if (action === null) return;

  switch (action) {
    case 'START_DIVE': {
      state.preRunMeta = { ...store.getState().meta };
      store.dispatch({ type: 'START_DIVE' });
      const snap = store.getState();
      if (snap.currentRun !== null) {
        state.runLog = [];
        state.setScreen('dive');
      } else {
        state.preRunMeta = null;
      }
      break;
    }

    case 'OPEN_SALVAGE_MARKET': {
      state.setScreen('salvage-market');
      if (!meta.tutorialCompleted && meta.tutorialPhase === 'hub-return') {
        store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: 'salvage-tutorial-1' });
      }
      state.salvageAnimator.open();
      break;
    }

    case 'OPEN_HARDWARE': {
      state.setScreen('hardware');
      if (!meta.tutorialCompleted) {
        const nextPhase = getNextPhaseForPanel(controller, meta.tutorialPhase, 'hardware' as 'hardware');
        if (nextPhase) {
          store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: nextPhase });
        }
      }
      state.hwAnimator.open();
      break;
    }

    case 'OPEN_CRYO': {
      state.setScreen('cryo');
      if (!meta.tutorialCompleted) {
        const nextPhase = getNextPhaseForPanel(controller, meta.tutorialPhase, 'cryo' as 'cryo');
        if (nextPhase) {
          store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: nextPhase });
        }
      }
      state.cryoAnimator.open();
      break;
    }

    case 'OPEN_MODULES': {
      state.setScreen('modules');
      if (!meta.tutorialCompleted) {
        const nextPhase = getNextPhaseForPanel(controller, meta.tutorialPhase, 'modules' as 'modules');
        if (nextPhase) {
          store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: nextPhase });
        }
      }
      state.modulesAnimator.open();
      break;
    }

    case 'OPEN_CARD_COLLECTION':
      state.setScreen('card-collection');
      break;
    default: {
      // Handle SET_ACTIVE_REPAIR action object
      if (typeof action === 'object' && 'type' in action && action.type === 'SET_ACTIVE_REPAIR') {
        store.dispatch(action);
        state.lastPanelAction = 'SET_ACTIVE_REPAIR';
      }
    }
  }
}

export function renderAndHandleHub(
  state: GameState,
  store: GameStore,
  controller: TutorialController,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  tutorialActive: boolean,
): void {
  const lockedInteraction = state.tutorialContext?.isLocked
    ? state.tutorialContext.expectedInteraction
    : undefined;

  const { action: hubAction, tabClicked } = renderHub(
    meta,
    state.hubTab,
    mx,
    my,
    false,
    lockedInteraction,
    now,
    tutorialActive,
  );

  const hubInteraction = hubAction ? mapHubActionToInteraction(hubAction) : null;

  if (hubInteraction && state.tutorialContext?.checkInteraction(hubInteraction)) {
    state.tutorialDialoguePlayer?.advance();
  }

  if (tabClicked !== null) {
    const tabInteraction: TutorialInteraction = {
      type: 'hub-tab',
      id: tabClicked === 'crew-modules' ? 'crew' : tabClicked,
    };

    if (!state.tutorialContext || state.tutorialContext.checkInteraction(tabInteraction)) {
      state.hubTab = tabClicked;
      if (state.tutorialContext?.checkInteraction(tabInteraction)) {
        state.tutorialDialoguePlayer?.advance();
      }
    }
  }

  handleHub(state, store, controller, hubAction);
}
