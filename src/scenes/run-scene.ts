/**
 * Run Scene
 *
 * Active dive gameplay — handles all RunScreen states during a run.
 * Manages dive, result, loot/signal/audit/cache nodes, lore, and ending.
 * Transitions to station scene when the run concludes.
 */

import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import { GameStore } from '../app/game-store';
import { GameState } from '../game/game-state';
import { TutorialController } from '../tutorial/tutorial-controller';
import type { TutorialScreen } from '../tutorial/tutorial-controller';
import type { RunScreen } from '../game/types';
import { clearBounds } from '../ui/tutorial-bounds';
import { feedbackLayer } from '../ui/feedback-layer';
import { asTutorialScreen, getNextTutorialPhase } from '../game/tutorial';
import { renderAndHandleDive } from '../game/dive-handler';
import { renderRunPathMap } from '../ui/run-path-map';
import { renderIntershipLoot } from '../ui/intership-loot';
import { renderPostShipProgress, type PostShipProgressState } from '../ui/expedition/post-ship-progress/index';
import { renderShipShop } from '../ui/ship-shop';
import { buildLootOfferings } from '../dive/loot-pool';
import { HARDWARE_ITEMS } from '../content/hardware';
import { renderExtractManifest, resetExtractManifest } from '../ui/extract-manifest';
import { resolveAudit } from '../dive/audit';
import {
  handleLootNode,
  handleSignalNode,
  handleAuditNode,
  handleCacheNode,
  handleResult,
  handleBillingForecast,
} from '../game/node-handlers';
import { registerCardDrawAnimationHandler } from '../ui/dive-renderer/cards';
import { initDiveRenderer } from '../ui/dive-renderer/init';
import { renderLoreScreen } from '../ui/lore-screen';
import { DOCTRINE_ENDINGS } from '../content/doctrine';
import { renderToast, showToast } from '../game/toast';
import {
  renderTutorialOverlay,
  type TutorialHighlight,
} from '../ui/tutorial-overlay';
import {
  getTutorialDialogueForStep,
  getTutorialDialogueEntriesForStep,
} from '../content/tutorial-dialogue';
import { DialoguePlayer } from '../dialogue/dialogue-player';
import {
  updateTutorialContext,
  getNextTutorialPhaseFromStep,
  autoSwitchHubTabForTutorial,
  mapPanelActionToInteraction,
} from '../game/tutorial';

// ── Layout Constants ──────────────────────────────────────────────────────────

// Ship progress constants (shown in bottom right HUD)
const SHIP_PROGRESS_X = 1620;
const SHIP_PROGRESS_Y = 820;
const SHIP_PROGRESS_FONT = 'bold 16px monospace';
const SHIP_PROGRESS_COLOR = '#22d3ee';

// ── Run Scene ─────────────────────────────────────────────────────────────────

export class RunScene extends BaseScene {
  readonly id = 'run_scene';

  private store: GameStore;
  private state: GameState;
  private tutorial: TutorialController;

  constructor(store: GameStore) {
    super();
    this.store = store;
    this.state = new GameState();
    this.tutorial = new TutorialController(store.getState().meta);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  init(): void {
    // No systems needed — direct rendering
  }

  enter(previousScene?: string): void {
    // Initialize dive renderer callbacks (card draw, discard change)
    initDiveRenderer();
    // Register card draw animation handler for beam-in effects
    registerCardDrawAnimationHandler();

    this.tutorial = new TutorialController(this.store.getState().meta);

    if (previousScene === 'station_scene') {
      const snap = this.store.getState();
      if (snap.meta.activeRunPath !== null) {
        this.state.setScreen('path-map');
      } else {
        this.state.setScreen('dive');
      }
      this.state.runLog = [];
      this.state.resetTutorialState();
    }

    MakkoEngine.input.capture(['Space']);
  }

  exit(_nextScene?: string): void {
    MakkoEngine.input.releaseCapture(['Space']);
  }

  // ── Per-Frame ─────────────────────────────────────────────────────────────

  update(dt: number): void {
    const snap = this.store.getState();
    const { meta, currentRun } = snap;
    const input = MakkoEngine.input;
    const mx = input.mouseX;
    const my = input.mouseY;
    const display = MakkoEngine.display;
    const now = performance.now();

    // Check if run entered extracting phase
    if (this.state.screen === 'dive' && currentRun?.phase === 'extracting') {
      this.state.setScreen('extracting');
      return;
    }

    if (this.state.screen === 'dive' && currentRun === null && this.store.lastEndedRun) {
      this.state.updateLastRun(this.store.lastEndedRun, this.store.lastHaulValue, this.store.lastEchoGained);
      this.state.setScreen('result');
      return;
    }

    if (this.state.screen === 'extracting' && currentRun === null && this.store.lastEndedRun) {
      this.state.updateLastRun(this.store.lastEndedRun, this.store.lastHaulValue, this.store.lastEchoGained);
      this.state.setScreen('result');
      return;
    }

    if (this.state.screen === 'result' && this.store.lastEndedRun) {
      const path = meta.activeRunPath;
      const lastRun = this.store.lastEndedRun;
      if (path && lastRun.phase === 'extracted') {
        if (path.pendingLootPick) {
          this.state.setScreen('intership-loot');
          return;
        }
      }
    }

    if (this.state.screen === 'result' && this.state.lastRun.run === null) {
      this.state.setScreen('hub');
      return;
    }

    clearBounds();
    feedbackLayer.update(now);

    display.beginFrame();
    display.clear('#101219');

    const tutorialScreen = asTutorialScreen(this.state.screen);
    let tutorialActive = false;

    if (!meta.tutorialCompleted && tutorialScreen !== null) {
      const currentPhase = meta.tutorialPhase ?? 'not-started';
      const activeStep = this.tutorial.getActiveStep(tutorialScreen, currentRun, meta);
      tutorialActive = activeStep !== null;
    }

    switch (this.state.screen as RunScreen) {
      case 'dive':
        if (currentRun !== null) {
          renderAndHandleDive(this.state, this.store, mx, my, now, tutorialActive);
        }
        break;

      case 'extracting': {
        const freshRun = this.store.getState().currentRun;
        if (freshRun !== null) {
          const manifestAction = renderExtractManifest(freshRun, meta, mx, my, input.isMousePressed(0));
          if (manifestAction) {
            if (manifestAction.type === 'CONFIRM_EXTRACT') {
              const smugglerBonus = meta.doctrineLocked === 'smuggler';
              const smuggledDecisions = manifestAction.decisions.filter(d => d.action === 'smuggle');
              const auditResult = resolveAudit(smuggledDecisions, freshRun.auditReduction, smugglerBonus);
              freshRun.haulDecisions = manifestAction.decisions;
              freshRun.auditResult = auditResult;
              freshRun.phase = 'extracted';
              this.store.dispatch({
                type: 'RETURN_TO_HUB',
                haulDecisions: manifestAction.decisions,
                auditResult: auditResult,
              });
              resetExtractManifest();
              if (this.store.lastEndedRun) {
                this.state.updateLastRun(this.store.lastEndedRun, this.store.lastHaulValue, this.store.lastEchoGained);
                this.state.setScreen('result');
                return;
              }
            }
          }
        }
        break;
      }

      case 'billing-forecast': {
        // Trigger billing forecast tutorial on first view
        if (!meta.tutorialSeenBillingForecast && !meta.tutorialCompleted) {
          this.store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: 'billing-forecast-intro' });
          // Mark as seen will happen when tutorial completes
        }
        handleBillingForecast(this.state, this.store, mx, my);
        break;
      }

      case 'result':
        handleResult(this.state, this.store, mx, my, now);
        break;

      case 'path-map': {
        if (meta.activeRunPath) {
          const pathMapResult = renderRunPathMap(display, meta.activeRunPath, mx, my, now, meta);
          if (pathMapResult !== null) {
            this.store.dispatch({ type: 'SELECT_NEXT_NODE', nodeId: pathMapResult });
          }
          if (this.store.getState().currentRun !== null) {
            this.state.setScreen('dive');
          }
        } else {
          this.state.setScreen('hub');
        }
        break;
      }

      case 'post-ship-progress': {
        // Trigger post-ship progress tutorial on first view
        if (!meta.tutorialSeenPostShipProgress && !meta.tutorialCompleted) {
          this.store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: 'post-ship-progress-intro' });
        }

        if (meta.activeRunPath) {
          const currentNode = meta.activeRunPath.currentNodeId
            ? meta.activeRunPath.nodes.find(n => n.id === meta.activeRunPath!.currentNodeId)
            : null;

          const progressState: PostShipProgressState = {
            runPath: meta.activeRunPath,
            completedNode: currentNode!,
            lastRun: this.store.lastEndedRun,
            doctrinePointsGained: this.store.lastEndedRun?.doctrineRunPoints ?? {},
            meta: meta,
          };

          const progressResult = renderPostShipProgress(display, progressState, mx, my);

          if (progressResult) {
            if (progressResult.type === 'CONTINUE') {
              // Determine next screen based on pending loot
              const pendingLoot = meta.activeRunPath.pendingLootPick ?? false;
              if (pendingLoot) {
                this.state.setScreen('intership-loot');
              } else {
                this.state.setScreen('path-map');
              }
            } else if (progressResult.type === 'PAY_DEBT') {
              // Process early debt payment
              this.store.dispatch({ type: 'PAY_DEBT_EARLY', amount: progressResult.amount });
              // Show confirmation toast
              showToast(this.state, `Paid ${progressResult.amount.toLocaleString()} credits toward debt`);
            }
          }
        } else {
          this.state.setScreen('hub');
        }
        break;
      }

      case 'intership-loot': {
        if (meta.activeRunPath) {
          const cards = buildLootOfferings(
            meta.doctrinePoints,
            meta.doctrineLocked,
            5,
            meta.equippedItems,
          );
          const lootResult = renderIntershipLoot(display, cards, mx, my, now);
          if (lootResult !== null) {
            if (lootResult === 'SKIP') {
              this.store.dispatch({ type: 'PICK_INTERSHIP_LOOT', cardId: null });
            } else {
              this.store.dispatch({ type: 'PICK_INTERSHIP_LOOT', cardId: lootResult });
            }
            this.state.setScreen('path-map');
          }
        } else {
          this.state.setScreen('hub');
        }
        break;
      }

      case 'ship-shop': {
        if (meta.activeRunPath) {
          const shopCards = buildLootOfferings(
            meta.doctrinePoints,
            meta.doctrineLocked,
            6,
            meta.equippedItems,
          );
          const shopHardware = HARDWARE_ITEMS
            .filter(h => h.rarity === 'common' || h.rarity === 'uncommon')
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
          const shopResult = renderShipShop(
            display,
            meta.activeRunPath.pathCredits,
            { cards: shopCards, hardware: shopHardware },
            mx,
            my,
            now,
          );
          if (shopResult) {
            if (shopResult.type === 'BUY_CARD') {
              this.store.dispatch({ type: 'PICK_INTERSHIP_LOOT', cardId: shopResult.cardId });
            } else if (shopResult.type === 'BUY_HARDWARE') {
              // TODO: Dispatch BUY_PATH_HARDWARE action
            } else if (shopResult.type === 'LEAVE') {
              this.state.setScreen('path-map');
            }
          }
        } else {
          this.state.setScreen('hub');
        }
        break;
      }

      case 'loot-node':
        handleLootNode(this.state, this.store, mx, my, now);
        break;

      case 'signal-node':
        handleSignalNode(this.state, this.store, mx, my, now);
        break;

      case 'audit-node':
        handleAuditNode(this.state, this.store, mx, my, now);
        break;

      case 'cache-node':
        handleCacheNode(this.state, this.store, mx, my, now);
        break;

      case 'lore': {
        const loreResult = renderLoreScreen(display, mx, my, now);
        if (loreResult === 'CONTINUE') {
          if (this.store.debtClearedThisRun) {
            this.state.setScreen('ending');
          } else {
            this.state.setScreen('hub');
          }
        }
        if (input.isKeyPressed('Escape')) {
          if (this.store.debtClearedThisRun) {
            this.state.setScreen('ending');
          } else {
            this.state.setScreen('hub');
          }
        }
        break;
      }

      case 'ending': {
        const endingResult = renderEndingScreen(display, meta, mx, my, now);
        if (endingResult === 'CONTINUE') {
          this.store.debtClearedThisRun = false;
          this.state.setScreen('debt-cleared');
        }
        break;
      }
    }

    // DISABLED: tutorial overlay system deactivated
    // if (!meta.tutorialCompleted) {
    //   handleTutorialOverlay(this.state, this.store, this.tutorial, tutorialScreen, meta, currentRun, mx, my, now, false, dt);
    // }

    // Ship progress now rendered in bottom-right HUD via dive-renderer
    feedbackLayer.render(display, now);
    renderToast(this.state);

    if (this.state.screen === 'hub' || this.state.screen === 'debt-cleared') {
      this.switchTo('station_scene');
    }
  }

  render(): void {
    MakkoEngine.display.endFrame();
  }

  get gameState(): GameState {
    return this.state;
  }

  set gameState(state: GameState) {
    this.state = state;
  }
}

// ── Ending Screen ─────────────────────────────────────────────────────────────

function renderEndingScreen(
  display: typeof MakkoEngine.display,
  meta: import('../types/state').MetaState,
  mx: number,
  my: number,
  now: number,
): 'CONTINUE' | null {
  const doctrine = meta.doctrineLocked ?? 'smuggler';
  const ending = DOCTRINE_ENDINGS[doctrine];

  display.drawRect(0, 0, display.width, display.height, { fill: '#0a0d14' });

  display.drawText(ending.title, display.width / 2, 120, {
    font: 'bold 28px monospace',
    fill: '#22d3ee',
    align: 'center',
    baseline: 'middle',
  });

  const startY = 200;
  const lineHeight = 40;
  for (let i = 0; i < ending.lines.length; i++) {
    display.drawText(ending.lines[i], display.width / 2, startY + i * lineHeight, {
      font: '18px monospace',
      fill: '#e2e8f0',
      align: 'center',
      baseline: 'middle',
    });
  }

  const pulse = Math.sin((now % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
  const alpha = 0.5 + pulse * 0.5;
  display.drawText('[ PRESS SPACE OR CLICK TO CONTINUE ]', display.width / 2, display.height - 100, {
    font: '16px monospace',
    fill: '#ffffff',
    align: 'center',
    baseline: 'middle',
    alpha,
  });

  const input = MakkoEngine.input;
  if (input.isKeyPressed('Space') || input.isMouseReleased(0)) {
    return 'CONTINUE';
  }

  return null;
}

// ── Mode Badge (now renders ship progress in bottom right) ─────────────────────

function renderModeBadge(display: typeof MakkoEngine.display): void {
  // Ship progress indicator is now rendered in the bottom-right HUD area
  // via renderShipProgress() in dive-renderer/hud.ts
}

// ── Tutorial Overlay (Run-local) ──────────────────────────────────────────────

function handleTutorialOverlay(
  state: GameState,
  store: GameStore,
  tutorial: TutorialController,
  tutorialScreen: TutorialScreen | null,
  meta: import('../types/state').MetaState,
  currentRun: import('../types/state').RunState | null,
  mx: number,
  my: number,
  now: number,
  isPanelScreen: boolean,
  dt: number,
): void {
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

  if (state.tutorialDialoguePlayer) {
    updateAndRenderTutorialDialogue(state, store, tutorial, activeStep, freshMeta, mx, my, now, isPanelScreen, dt);
  }
}

function initializeTutorialStep(
  state: GameState,
  activeStep: number,
  meta: import('../types/state').MetaState,
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

function updateAndRenderTutorialDialogue(
  state: GameState,
  store: GameStore,
  tutorial: TutorialController,
  activeStep: number,
  meta: import('../types/state').MetaState,
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

function handleTutorialInteraction(
  state: GameState,
  store: GameStore,
  tutorial: TutorialController,
  activeStep: number,
  meta: import('../types/state').MetaState,
  interaction: import('../tutorial/tutorial-context').TutorialInteraction,
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

function completeTutorial(state: GameState, store: GameStore): void {
  store.dispatch({ type: 'COMPLETE_TUTORIAL' });
  state.tutorialDialoguePlayer = null;
  state.tutorialContext = null;
}
