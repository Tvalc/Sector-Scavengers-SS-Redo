import { MakkoEngine } from '@makko/engine';
import { RunState, MetaState } from '../types/state';
import { GameStore } from '../app/game-store';
import { serialize } from '../persist/save';
import { renderHub, HubAction, HubTab } from '../ui/hub-renderer';
import { renderDive } from '../ui/dive-renderer';
import { renderResult } from '../ui/result-renderer';
import { renderVoidCommunion, isBackButtonPressed } from '../ui/void-communion-panel';
import { TOAST_DURATION_MS } from '../config/constants';
import { TutorialController, TutorialScreen } from '../tutorial/tutorial-controller';
import { renderTutorialOverlay } from '../ui/tutorial-overlay';
import { renderSalvageMarket } from '../ui/salvage-market-panel';
import { renderHardwarePanel } from '../ui/hardware-panel';
import { renderCryoPanel } from '../ui/cryo-panel';
import { renderModulesPanel } from '../ui/modules-panel';
import { renderResetConfirmOverlay } from '../ui/reset-confirm-overlay';

// ── Types ────────────────────────────────────────────────────────────────────
type ScreenState = 'hub' | 'dive' | 'result' | 'void-communion' | 'salvage-market' | 'hardware' | 'cryo' | 'modules';

/* MANUAL TEST CHECKLIST — P25 integration checkpoint
 * Run at least 3 consecutive loops before shipping:
 *
 * [ ] 1. Fresh save: path-select screen shown, all 3 paths render with correct stats.
 * [ ] 2. Choose any path: hub shows correct energy/debt/credits for that path.
 * [ ] 3. Start Dive: energy decreases by 1, dive screen shows 3 draft cards.
 * [ ] 4. Play Scavenge: runCredits increases, round advances, new draft drawn.
 * [ ] 5. Play Extract: result screen shows EXTRACTED, correct credits banked (including extraction bonus).
 * [ ] 6. Continue: hub shows updated credits and debt.
 * [ ] 7. Billing: after N runs (billingCycleRuns), credits deducted or penalty added to debt.
 * [ ] 8. Danger triggers: play 5+ cards; at least one danger log line appears.
 * [ ] 9. Collapse: hull reaches 0 via dangers or no extract before maxRounds. Result shows COLLAPSED.
 * [ ] 10. VoidEcho: collapse gives correct echo (2 base, or round×multiplier with void_walker tiers).
 * [ ] 11. Void Communion: open panel, buy a tier, effect applies on next dive.
 * [ ] 12. Doctrine points: cards accumulate doctrine points; threshold unlocks doctrine card.
 * [ ] 13. Death lessons: after 4+ collapses, tier 1 effect shows in hub.
 * [ ] 14. Ship repair: set active repair, complete N runs, ship status changes to 'claimed'.
 * [ ] 15. Save/load: reload page, all progress retained (credits, unlocks, collapse count).
 * [ ] 16. Three consecutive full runs complete without JS errors or stuck screens.
 */

// ── Game class ───────────────────────────────────────────────────────────────
export class Game {
  private store: GameStore;
  private tutorial: TutorialController;

  /**
   * Set by update() when an in-game action needs a scene transition.
   * GameScene checks this after each update() and calls switchTo().
   * Always reset to null after reading.
   */
  pendingSceneSwitch: string | null = null;

  constructor(store: GameStore) {
    this.store = store;
    this.tutorial = new TutorialController(this.store.getState().meta);
  }

  private screenState: ScreenState = 'hub';
  private runLog: string[] = [];
  private lastRun: RunState | null = null;
  // lastRunCredits / lastRunEcho are read from GameStore fields set by endRun()
  // so they include extraction bonuses and walker-tier echo multipliers.
  private lastRunCredits = 0;
  private lastRunEcho = 0;

  // Hub tab state
  private hubTab: HubTab = 'overview';

  // Pre-run meta snapshot for result screen delta
  private preRunMeta: MetaState | null = null;

  // Toast
  private toastText = '';
  private toastExpiry = 0;

  // Reset confirm overlay
  private showResetConfirm = false;

  start(): void {
    // Reinitialise tutorial controller so it reflects the current (possibly
    // reset) meta state rather than the state at construction time.
    this.tutorial = new TutorialController(this.store.getState().meta);

    const meta = this.store.getState().meta;
    this.screenState = 'hub';

    if (this.store.loadResult.wasReset) {
      this.showToast('Save corrupted — starting fresh.');
    } else if (meta.totalRuns === 0 && !meta.openingPathChosen) {
      this.showToast('New game.');
    } else {
      this.showToast('Save loaded.');
    }

    MakkoEngine.input.capture(['KeyS', 'KeyR']);
  }

  private showToast(text: string): void {
    this.toastText = text;
    this.toastExpiry = performance.now() + TOAST_DURATION_MS;
  }

  private showRunReturnToast(): void {
    if (this.lastRun === null) return;
    let text: string;
    if (this.lastRun.phase === 'extracted') {
      text = `Extracted! +\u20a1${this.lastRunCredits}  echo +${this.lastRunEcho}`;
    } else {
      text = `Collapsed. echo +${this.lastRunEcho}`;
    }
    const billing = this.store.getState().meta.lastBillingResult;
    if (billing !== null) {
      if (billing.paid) {
        text += ` | Bill: PAID \u20a1${billing.amount}`;
      } else {
        text += ` | Bill missed +\u20a1${billing.penaltyAdded} debt`;
      }
    }
    this.showToast(text);
    this.toastExpiry = performance.now() + 3000;
  }

  // ── Input handling ─────────────────────────────────────────────────────────
  private handleHub(action: HubAction | null): void {
    const input = MakkoEngine.input;

    // Manual save via keyboard
    if (input.isKeyPressed('KeyS')) {
      serialize(this.store.getState());
      this.showToast('Saved.');
      return;
    }

    if (action === 'START_DIVE') {
      this.preRunMeta = { ...this.store.getState().meta };
      this.store.dispatch({ type: 'START_DIVE' });
      const snap = this.store.getState();
      if (snap.currentRun !== null) {
        this.runLog = [];
        this.screenState = 'dive';
      } else {
        // Dive didn't start (no energy) — discard snapshot
        this.preRunMeta = null;
      }
    } else if (action === 'RECHARGE_ENERGY') {
      this.store.dispatch({ type: 'RECHARGE_ENERGY' });
    } else if (action === 'RECHARGE_ENERGY_EMERGENCY') {
      this.store.dispatch({ type: 'RECHARGE_ENERGY_EMERGENCY' });
    } else if (action === 'SCRAP_JOB') {
      this.store.dispatch({ type: 'SCRAP_JOB' });
    } else if (action === 'OPEN_VOID_COMMUNION') {
      this.screenState = 'void-communion';
    } else if (action === 'OPEN_SALVAGE_MARKET') {
      this.screenState = 'salvage-market';
    } else if (action === 'OPEN_HARDWARE') {
      this.screenState = 'hardware';
    } else if (action === 'OPEN_CRYO') {
      this.screenState = 'cryo';
    } else if (action === 'OPEN_MODULES') {
      this.screenState = 'modules';
    } else if (action !== null && typeof action === 'object' && 'type' in action && action.type === 'SET_ACTIVE_REPAIR') {
      this.store.dispatch(action);
    }
  }

  private handleDive(cardId: string | null): void {
    if (cardId === null) return;

    const before = this.store.getState().currentRun;

    // dispatchPlayCard handles card + dangers + NEXT_ROUND atomically
    const dangerMessages = this.store.dispatchPlayCard(cardId);

    const snap = this.store.getState();
    const afterSnap = snap.currentRun;

    // Card result log entry (use ended run if run finished, else current)
    if (before) {
      const ref = afterSnap ?? this.store.lastEndedRun ?? before;
      const creditsDelta = ref.runCredits - before.runCredits;
      const hullDelta = ref.hull - before.hull;
      let entry = `Round ${before.round}: ${cardId}`;
      if (creditsDelta !== 0) entry += `  \u20a1${creditsDelta > 0 ? '+' : ''}${creditsDelta}`;
      if (hullDelta !== 0) entry += `  hull ${hullDelta > 0 ? '+' : ''}${hullDelta}`;
      this.runLog.push(entry);
    }

    // Append danger messages
    for (const msg of dangerMessages) {
      this.runLog.push(msg);
    }

    // Check for run end — also handle case where run ended mid-dive from dangers
    if (snap.currentRun === null || snap.currentRun.phase !== 'active') {
      if (snap.currentRun === null) {
        const ended = this.store.lastEndedRun;
        if (ended) {
          this.lastRun = ended;
          // Use the store's pre-computed values — they include extraction bonus
          // and crew extract bonus (Fix #1) and correct echo gain (Fix #2).
          this.lastRunCredits = this.store.lastBankedCredits;
          this.lastRunEcho    = this.store.lastEchoGained;
        }
        // Fix #3: RETURN_TO_HUB is NOT needed here. endRun() already sets
        // currentRun: null before we transition to 'result'. The action
        // remains in the store as a guard for external callers but is never
        // dispatched from the result screen in normal flow.
        this.screenState = 'result';
      }
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  /** Maps ScreenState to TutorialScreen, or null for screens the tutorial ignores. */
  private asTutorialScreen(screen: ScreenState): TutorialScreen | null {
    if (
      screen === 'hub' ||
      screen === 'dive' ||
      screen === 'result'
    ) {
      return screen as TutorialScreen;
    }
    return null;
  }

  private renderToast(): void {
    if (!this.toastText || performance.now() > this.toastExpiry) return;
    MakkoEngine.display.drawText(this.toastText, 1860, 40, {
      font: '24px monospace', fill: '#68d391', align: 'right', baseline: 'top',
    });
  }

  // ── Game loop ──────────────────────────────────────────────────────────────

  /** Handle all input, state mutation, and drawing for this frame. Called by SceneManager loop.
   *  Drawing happens here because the renderer functions both draw AND return actions in one call.
   *  render() calls endFrame() to flush — always call update() before render() each frame.
   */
  update(_dt: number): void {
    const snap = this.store.getState();
    const { meta, currentRun, currentDraft } = snap;
    const input = MakkoEngine.input;
    const mx = input.mouseX;
    const my = input.mouseY;
    const display = MakkoEngine.display;

    display.beginFrame();
    display.clear('#101219');

    // ── Screen dispatch ────────────────────────────────────────────────────
    if (this.screenState === 'hub') {
      const { action: hubAction, tabClicked } = renderHub(meta, this.hubTab, mx, my);
      if (tabClicked !== null) this.hubTab = tabClicked;
      this.handleHub(hubAction);

    } else if (this.screenState === 'dive' && currentRun !== null) {
      // Fix #4: currentDraft can only be [] here if endRun() ran this same
      // frame and set screenState to 'result', which is handled in handleDive.
      // The dive branch is already gated by currentRun !== null, so an empty
      // draft while currentRun is non-null is impossible in normal flow.
      const diveAction = renderDive(currentRun, currentDraft, this.runLog, mx, my);
      this.handleDive(diveAction ? diveAction.cardId : null);

    } else if (this.screenState === 'result' && this.lastRun !== null) {
      const delta = this.preRunMeta !== null ? {
        creditsBefore: this.preRunMeta.credits,
        debtBefore:    this.preRunMeta.debt,
        voidBefore:    this.preRunMeta.voidEcho,
        inventoryCountBefore: this.preRunMeta.hubInventory.reduce((s, e) => s + e.quantity, 0),
      } : null;
      const resultAction = renderResult(
        this.lastRun,
        this.lastRunCredits,
        this.lastRunEcho,
        this.store.lastEndedRun?.salvage ?? [],
        this.store.lastEndedRun?.itemsFound ?? [],
        mx,
        my,
        delta,
      );
      if (resultAction === 'CONTINUE') {
        this.preRunMeta = null;
        this.screenState = 'hub';
        this.showRunReturnToast();
      }

    } else if (this.screenState === 'salvage-market') {
      const marketAction = renderSalvageMarket(meta, mx, my);
      if (marketAction !== null) {
        if (marketAction.type === 'CLOSE_MARKET') {
          this.screenState = 'hub';
        } else if (marketAction.type === 'SELL_SALVAGE') {
          this.store.dispatch({ type: 'SELL_SALVAGE', tier: marketAction.tier });
        } else if (marketAction.type === 'SELL_ALL_LOW_TIER') {
          this.store.dispatch({ type: 'SELL_ALL_LOW_TIER' });
        } else if (marketAction.type === 'PAY_DEBT') {
          this.store.dispatch({ type: 'PAY_DEBT', amount: marketAction.amount });
        }
      }

    } else if (this.screenState === 'hardware') {
      const hwAction = renderHardwarePanel(meta, mx, my);
      if (hwAction !== null) {
        if (hwAction.type === 'CLOSE_HARDWARE') {
          this.screenState = 'hub';
        } else if (hwAction.type === 'EQUIP_ITEM') {
          this.store.dispatch({ type: 'EQUIP_ITEM', slot: hwAction.slot, itemId: hwAction.itemId });
        } else if (hwAction.type === 'UNEQUIP_ITEM') {
          this.store.dispatch({ type: 'UNEQUIP_ITEM', slot: hwAction.slot });
        }
      }

    } else if (this.screenState === 'cryo') {
      const cryoAction = renderCryoPanel(meta, mx, my);
      if (cryoAction !== null) {
        if (cryoAction.type === 'CLOSE_CRYO') {
          this.screenState = 'hub';
        } else if (cryoAction.type === 'WAKE_CREW') {
          this.store.dispatch({ type: 'WAKE_CREW', crewId: cryoAction.crewId });
        } else if (cryoAction.type === 'SEND_TO_CRYO') {
          this.store.dispatch({ type: 'SEND_TO_CRYO', crewId: cryoAction.crewId });
        } else if (cryoAction.type === 'ASSIGN_CREW') {
          this.store.dispatch({ type: 'ASSIGN_CREW', crewId: cryoAction.crewId, slot: cryoAction.slot });
        }
      }

    } else if (this.screenState === 'modules') {
      const modAction = renderModulesPanel(meta, mx, my);
      if (modAction !== null) {
        if (modAction.type === 'CLOSE_MODULES') {
          this.screenState = 'hub';
        } else if (modAction.type === 'UPGRADE_MODULE') {
          this.store.dispatch({ type: 'UPGRADE_MODULE', moduleId: modAction.moduleId });
        }
      }

    } else if (this.screenState === 'void-communion') {
      const vcAction = renderVoidCommunion(snap.meta, mx, my);
      if (vcAction !== null) {
        if (vcAction.type === 'BUY_VOID_TIER') {
          this.store.dispatch({ type: 'BUY_VOID_TIER', tierId: vcAction.tierId });
        } else if (vcAction.type === 'BUY_VOID_SHOP_CARD') {
          this.store.dispatch({ type: 'BUY_VOID_SHOP_CARD', shopCardId: vcAction.shopCardId });
        }
      }
      if (isBackButtonPressed(mx, my)) {
        this.screenState = 'hub';
      }
    }

    // ── Tutorial overlay (input portion) ──────────────────────────────────
    if (!meta.tutorialCompleted && !this.showResetConfirm) {
      const tutorialScreen = this.asTutorialScreen(this.screenState);
      if (tutorialScreen !== null) {
        const currentStep = meta.tutorialStep === 0 ? 1 : meta.tutorialStep;
        if (currentStep < 6 && this.tutorial.shouldAdvance(currentStep, tutorialScreen, meta)) {
          this.store.dispatch({ type: 'ADVANCE_TUTORIAL_STEP' });
        }

        const freshMeta = this.store.getState().meta;
        const activeStep = this.tutorial.getActiveStep(tutorialScreen, currentRun, freshMeta);
        if (activeStep !== null) {
          const dismissed = renderTutorialOverlay(activeStep, mx, my);
          if (dismissed) {
            this.store.dispatch({ type: 'COMPLETE_TUTORIAL' });
          }
        }
      }
    }

    // ── Reset confirm overlay ─────────────────────────────────────────────
    if (this.showResetConfirm) {
      const resetAction = renderResetConfirmOverlay(mx, my);
      if (resetAction === 'CANCEL') {
        this.showResetConfirm = false;
      } else if (resetAction === 'CONFIRM') {
        this.store.resetToFreshGame();
        this.pendingSceneSwitch = 'title_scene';
      }
    }

    // ── Toast overlay ────────────────────────────────────────────────────
    this.renderToast();
  }

  /** Flush the drawn frame. Always call after update() — never call alone.
   *  All drawing happens in update() since renderer functions draw + return actions.
   *  This method only calls endFrame() to flush the WebGL batch.
   */
  render(): void {
    MakkoEngine.display.endFrame();
  }
}
