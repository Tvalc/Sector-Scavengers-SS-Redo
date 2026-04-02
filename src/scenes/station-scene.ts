/**
 * Station Scene
 *
 * Meta station hub — handles all StationScreen states between runs.
 * Manages hub navigation, station panels, tutorial overlay for station,
 * and scene transitions to/from the run scene.
 */

import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import { GameStore } from '../app/game-store';
import { GameState } from '../game/game-state';
import { TutorialController } from '../tutorial/tutorial-controller';
import type { StationScreen } from '../game/types';
import { clearBounds } from '../ui/tutorial-bounds';
import { feedbackLayer } from '../ui/feedback-layer';
import { asTutorialScreen } from '../game/tutorial';
import { updateStationTutorial } from '../game/station-tutorial';
import { renderMetaHub, MetaHubAction } from '../ui/meta-hub/index';
import { renderDivePrepExpanded, resetDivePrepExpandedPage } from '../ui/meta-hub/dive-prep';
import {
  handleSalvageMarket,
  handleHardwarePanel,
  handleCryoPanel,
  handleModulesPanel,
  handleResearchPanel,
  handleCrewPanel,
  handleShipsPanel,
  handleVoidShopPanel,
  handleVoidCommunion,
  handleShipSelectPanel,
  handleCrewSelectPanel,
  handleHardwareSelectPanel,
} from '../game/panel-handlers';
import { handleDebtCleared } from '../game/node-handlers';
import { renderCardCollectionPanel } from '../ui/card-collection';
import { renderLoreScreen, initLoreScreen } from '../ui/lore-screen';
import { DOCTRINE_ENDINGS } from '../content/doctrine';
import { resetModulesPage } from '../ui/modules-panel';
import { resetCrewPage } from '../ui/crew-panel';
import { resetShipsPage } from '../ui/ships-full-panel';
import { resetHardwarePage } from '../ui/hardware-panel';
import { resetCryoPage } from '../ui/cryo-panel';
import { resetSalvagePage } from '../ui/salvage-market-panel';
import { resetResearchPage } from '../ui/research-full-panel';
import { renderResetConfirmOverlay } from '../ui/reset-confirm-overlay';
import { renderToast, showToast } from '../game/toast';
import { serialize } from '../persist/save';
import { renderDebtContractPanel, updateDebtContractInput, resetDebtContractBackground } from '../scenes/intro-wake/debt-contract-panel';

// ── Layout Constants ──────────────────────────────────────────────────────────

// Mode badge removed - title shown only in meta-hub header to avoid duplication

// ── Station Scene ─────────────────────────────────────────────────────────────

export class StationScene extends BaseScene {
  readonly id = 'station_scene';

  private store: GameStore;
  private state: GameState;
  private tutorial: TutorialController;
  private activeBackground: 'nlc' | 'wlc' = 'nlc';

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
    this.tutorial = new TutorialController(this.store.getState().meta);

    const meta = this.store.getState().meta;

    // Check for pending lore fragments to show (debt cleared at station)
    if (this.store.pendingLoreFragments.length > 0 && this.store.debtClearedThisRun) {
      initLoreScreen(this.store.pendingLoreFragments, this.store.pendingLoreAttributionCrewId);
      this.store.pendingLoreFragments = [];
      this.store.pendingLoreAttributionCrewId = null;
      this.state.setScreen('lore');
      return;
    }

    // If returning from a run scene, reset to hub.
    // The run scene's GameState is separate — our local screen may still be 'dive'
    // from when we last started a dive.
    if (previousScene === 'run_scene') {
      this.state.setScreen('hub');
      this.state.resetTutorialState();
    } else if (previousScene === 'intro_wake_scene') {
      // Coming from intro - first time player sees meta hub
      this.state.setScreen('hub');
      this.state.resetTutorialState();
      
      // Trigger debt contract tutorial for first-time players
      if (!meta.tutorialSeenDebtContract && !meta.tutorialCompleted) {
        this.store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: 'debt-contract-intro' });
      }
      
      // First-time player: start dual-mode tutorial
      // DISABLED: tutorial overlay system deactivated
      // if (!meta.tutorialCompleted && meta.tutorialPhase === 'not-started') {
      //   this.store.dispatch({ type: 'ADVANCE_TUTORIAL_PHASE', phase: 'meta-hub-welcome' });
      // }
    } else {
      this.state.setScreen('hub');
      this.state.resetTutorialState();

      if (this.store.loadResult.wasReset) {
        showToast(this.state, 'Save corrupted — starting fresh.');
      } else if (meta.totalRuns === 0 && !meta.openingPathChosen) {
        showToast(this.state, 'New game.');
      } else {
        showToast(this.state, 'Save loaded.');
      }
    }

    MakkoEngine.input.capture(['KeyS']);
  }

  exit(_nextScene?: string): void {
    MakkoEngine.input.releaseCapture(['KeyS']);
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

    // Clear tutorial bounds before rendering
    clearBounds();

    // Update feedback layer
    feedbackLayer.update(now);

    display.beginFrame();
    display.clear('#101219');

    // Station background
    renderStationBackground(display, this.activeBackground);

    // Manual save
    if (input.isKeyPressed('KeyS')) {
      serialize(this.store.getState());
      showToast(this.state, 'Saved.');
    }

    // Determine tutorial state
    const tutorialScreen = asTutorialScreen(this.state.screen);
    let tutorialActive = false;

    if (!meta.tutorialCompleted && !this.state.showResetConfirm && tutorialScreen !== null) {
      const currentPhase = meta.tutorialPhase ?? 'not-started';
      const activeStep = this.tutorial.getActiveStep(tutorialScreen, currentRun, meta);
      tutorialActive = activeStep !== null;
    }

    // Screen dispatch — StationScreen values only
    switch (this.state.screen as StationScreen) {
      case 'hub': {
        const metaResult = renderMetaHub(meta, mx, my, now, this.activeBackground);
        // Handle meta hub actions
        if (metaResult.action && typeof metaResult.action === 'object' && 'type' in metaResult.action) {
          // Object-type action (START_DIVE with dive prep data)
          if (metaResult.action.type === 'START_DIVE') {
            this.store.dispatch(metaResult.action);
            // Show debt contract before dive, then path map
            const afterState = this.store.getState();
            if (afterState.meta.activeRunPath !== null) {
              resetDebtContractBackground();
              this.state.setScreen('debt-contract');
            }
          }
        } else if (metaResult.action === 'OPEN_CARD_COLLECTION') {
          this.state.setScreen('card-collection');
        } else if (metaResult.action === 'OPEN_RESEARCH') {
          resetResearchPage();
          this.state.setScreen('research');
        } else if (metaResult.action === 'OPEN_MODULES') {
          resetModulesPage();
          this.state.setScreen('modules');
        } else if (metaResult.action === 'OPEN_CREW') {
          resetCrewPage();
          this.state.setScreen('crew');
        } else if (metaResult.action === 'OPEN_SHIPS') {
          resetShipsPage();
          this.state.setScreen('ships');
        } else if (metaResult.action === 'OPEN_HARDWARE') {
          resetHardwarePage();
          this.state.setScreen('hardware');
        } else if (metaResult.action === 'OPEN_DIVE_PREP_EXPANDED') {
          resetDivePrepExpandedPage();
          this.state.setScreen('dive-prep-expanded');
        } else if (metaResult.action === 'OPEN_VOID_SHOP') {
          this.state.lastPanelAction = null;
          this.state.setScreen('void-shop');
        } else if (metaResult.action === 'OPEN_VOID_COMMUNION') {
          this.state.lastPanelAction = null;
          this.state.setScreen('void-communion');
        } else if (metaResult.action === 'DIVE_PREP_SELECT_SHIP') {
          this.state.lastPanelAction = null;
          this.state.setScreen('dive-prep-select-ship');
        } else if (metaResult.action === 'DIVE_PREP_SELECT_CREW') {
          this.state.lastPanelAction = null;
          this.state.setScreen('dive-prep-select-crew');
        } else if (metaResult.action === 'DIVE_PREP_EQUIP_HARDWARE') {
          this.state.lastPanelAction = null;
          this.state.setScreen('dive-prep-select-hardware');
        } else if (metaResult.action === 'TOGGLE_COMMAND_DECK_BACKGROUND') {
          this.activeBackground = this.activeBackground === 'nlc' ? 'wlc' : 'nlc';
        }
        break;
      }

      case 'salvage-market':
        handleSalvageMarket(this.state, this.store, meta, mx, my, now, 'meta');
        break;

      case 'hardware':
        handleHardwarePanel(this.state, this.store, meta, mx, my, now, 'meta');
        break;

      case 'cryo':
        handleCryoPanel(this.state, this.store, meta, mx, my, now, 'meta');
        break;

      case 'modules':
        handleModulesPanel(this.state, this.store, meta, mx, my, now, 'meta');
        break;

      case 'research':
        handleResearchPanel(this.state, this.store, meta, mx, my, now, 'meta');
        break;

      case 'card-collection': {
        const collectionResult = renderCardCollectionPanel(meta, mx, my, 'meta');
        if (collectionResult === 'CLOSED') {
          this.state.setScreen('hub');
        }
        break;
      }

      case 'debt-cleared':
        handleDebtCleared(this.state, this.store, mx, my, now);
        break;

      case 'lore': {
        const loreResult = renderLoreScreen(display, mx, my, now);
        if (loreResult === 'CONTINUE') {
          // After lore, go to ending if debt cleared, otherwise hub
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

      case 'crew':
        handleCrewPanel(this.state, this.store, meta, mx, my, dt, 'meta');
        break;

      case 'ships':
        handleShipsPanel(this.state, this.store, meta, mx, my, dt, 'meta');
        break;

      case 'void-shop':
        handleVoidShopPanel(this.state, this.store, meta, mx, my, now, 'meta');
        break;

      case 'void-communion':
        handleVoidCommunion(this.state, this.store, meta, mx, my, now, 'meta');
        break;

      case 'dive-prep-select-ship':
        handleShipSelectPanel(this.state, this.store, meta, mx, my, dt);
        break;

      case 'dive-prep-select-crew':
        handleCrewSelectPanel(this.state, this.store, meta, mx, my, dt);
        break;

      case 'dive-prep-select-hardware':
        handleHardwareSelectPanel(this.state, this.store, meta, mx, my, dt);
        break;

      case 'debt-contract': {
        // Render the debt contract panel (full screen) with current debt info
        renderDebtContractPanel(display, meta);
        // Input handling for debt contract
        if (updateDebtContractInput()) {
          this.state.setScreen('path-map');
        }
        break;
      }

      case 'dive-prep-expanded': {
        const snap = this.store.getState();
        const { action, close } = renderDivePrepExpanded(
          display,
          snap.meta,
          {
            selectedCrewId: snap.meta.divePrep?.selectedCrewId ?? snap.meta.leadId,
            selectedShipId: snap.meta.divePrep?.selectedShipId ?? null,
            equippedForDive: snap.meta.divePrep?.equippedForDive ?? snap.meta.equippedItems,
            selectedCards: snap.meta.divePrep?.selectedCards ?? ['scavenge', 'repair', 'extract'],
          },
          mx,
          my,
          now
        );
        
        if (action) {
          // Handle dive prep actions by updating local dive prep state
          switch (action.type) {
            case 'SELECT_CREW':
              this.store.dispatch({ type: 'SET_DIVE_PREP_CREW', crewId: action.crewId });
              break;
            case 'SELECT_SHIP':
              this.store.dispatch({ type: 'SET_DIVE_PREP_SHIP', shipId: action.shipId });
              break;
            case 'EQUIP_HARDWARE':
              this.store.dispatch({ type: 'SET_DIVE_PREP_HARDWARE', slot: action.slot, itemId: action.itemId });
              break;
            case 'REROLL_HAND':
              // Deprecated — deck is player-constructed now
              break;
          }
        }
        
        if (close) {
          this.state.setScreen('hub');
        }
        break;
      }
    }

    // Tutorial overlay (delegated to station-tutorial.ts)
    // DISABLED: tutorial overlay system deactivated
    // if (!meta.tutorialCompleted && !this.state.showResetConfirm) {
    //   updateStationTutorial(this.state, this.store, this.tutorial, dt);
    // }

    // Reset confirm overlay
    if (this.state.showResetConfirm) {
      const resetAction = renderResetConfirmOverlay(mx, my);
      if (resetAction === 'CANCEL') {
        this.state.showResetConfirm = false;
      } else if (resetAction === 'CONFIRM') {
        this.store.resetToFreshGame();
        this.switchTo('title_scene');
      }
    }

    // Render feedback and toast
    feedbackLayer.render(display, now);
    renderToast(this.state);

    // Scene transition: dive started → hand off to run scene
    // path-map is set after expedition creation; run scene handles it
    if (this.state.screen === 'dive' || this.state.screen === 'path-map') {
      this.switchTo('run_scene');
    }
  }

  render(): void {
    MakkoEngine.display.endFrame();
  }

  // ── Expose state for run scene handoff ────────────────────────────────────

  /** The GameState is shared so the run scene can pick up where we left off. */
  get gameState(): GameState {
    return this.state;
  }
}

// ── Station Background ─────────────────────────────────────────────────────────

function renderStationBackground(
  display: typeof MakkoEngine.display,
  activeBackground: 'nlc' | 'wlc'
): void {
  // Try to load and draw the static asset background
  const bgAssetName = activeBackground === 'nlc'
    ? 'ss-command-deck-nlcf'
    : 'ss-background-command-deck-lcp';
  const bgAsset = MakkoEngine.staticAsset(bgAssetName);

  if (bgAsset?.image) {
    // Draw the background image centered and scaled to fill the canvas
    const scaleX = display.width / bgAsset.width;
    const scaleY = display.height / bgAsset.height;
    const scale = Math.max(scaleX, scaleY);

    const drawWidth = bgAsset.width * scale;
    const drawHeight = bgAsset.height * scale;
    const drawX = (display.width - drawWidth) / 2;
    const drawY = (display.height - drawHeight) / 2;

    display.drawImage(bgAsset.image, drawX, drawY, drawWidth, drawHeight);
    return;
  }

  // Fallback: Clean station schematic background - pure schematic grid
  // Background already cleared to #0a0e14 in renderMetaHub, just add subtle grid
  for (let x = 0; x < display.width; x += 160) {
    display.drawLine(x, 0, x, display.height, {
      stroke: '#1a2d4a',
      lineWidth: 1,
      alpha: 0.3,
    });
  }
  for (let y = 0; y < display.height; y += 160) {
    display.drawLine(0, y, display.width, y, {
      stroke: '#1a2d4a',
      lineWidth: 1,
      alpha: 0.3,
    });
  }

  // Accent corner markers
  const cornerSize = 40;
  const margin = 20;
  // Top left
  display.drawLine(margin, margin, margin + cornerSize, margin, { stroke: '#22d3ee', lineWidth: 2, alpha: 0.5 });
  display.drawLine(margin, margin, margin, margin + cornerSize, { stroke: '#22d3ee', lineWidth: 2, alpha: 0.5 });
  // Top right
  display.drawLine(display.width - margin, margin, display.width - margin - cornerSize, margin, { stroke: '#22d3ee', lineWidth: 2, alpha: 0.5 });
  display.drawLine(display.width - margin, margin, display.width - margin, margin + cornerSize, { stroke: '#22d3ee', lineWidth: 2, alpha: 0.5 });
}

// ── Mode Badge ─────────────────────────────────────────────────────────────────

// Mode badge removed - title shown only in meta-hub header

// ── Ending Screen (copied from run-scene.ts) ──────────────────────────────────

function renderEndingScreen(
  display: typeof MakkoEngine.display,
  meta: import('../types/state').MetaState,
  mx: number,
  my: number,
  now: number,
): 'CONTINUE' | null {
  const doctrine = meta.doctrineLocked ?? 'smuggler';
  const ending = DOCTRINE_ENDINGS[doctrine];

  // Dark background
  display.drawRect(0, 0, display.width, display.height, {
    fill: '#0a0d14',
  });

  // Title
  display.drawText(ending.title, display.width / 2, 120, {
    font: 'bold 28px monospace',
    fill: '#22d3ee',
    align: 'center',
    baseline: 'middle',
  });

  // Lines
  const startY = 200;
  const lineHeight = 40;

  for (let i = 0; i < ending.lines.length; i++) {
    const line = ending.lines[i];
    display.drawText(line, display.width / 2, startY + i * lineHeight, {
      font: '18px monospace',
      fill: '#e2e8f0',
      align: 'center',
      baseline: 'middle',
    });
  }

  // Continue prompt
  const pulse = Math.sin((now % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
  const alpha = 0.5 + pulse * 0.5;
  display.drawText('[ PRESS SPACE OR CLICK TO CONTINUE ]', display.width / 2, display.height - 100, {
    font: '16px monospace',
    fill: '#ffffff',
    align: 'center',
    baseline: 'middle',
    alpha,
  });

  // Handle input
  const input = MakkoEngine.input;
  if (input.isKeyPressed('Space') || input.isMouseReleased(0)) {
    return 'CONTINUE';
  }

  return null;
}
