import { MakkoEngine } from '@makko/engine';
import { RunState } from '../types/state';
import { GameStore } from '../app/game-store';
import { serialize } from '../persist/save';
import { OPENING_PATH_CONFIG, OPENING_PATH_ORDER, OpeningPathId } from '../content/opening-paths';
import { renderHub, HubAction } from '../ui/hub-renderer';
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

// ── Types ────────────────────────────────────────────────────────────────────
type ScreenState = 'path-select' | 'hub' | 'dive' | 'result' | 'void-communion' | 'salvage-market' | 'hardware' | 'cryo' | 'modules';

// ── Layout constants (path-select only — other screens handled by renderers) ─
const CARD_W = 440;
const CARD_H = 240;
const CARD_XS = [200, 720, 1240];
const PATH_Y = 380;

const CARD_FILL        = '#1e2433';
const CARD_BORDER_IDLE = '#4a5568';
const CARD_BORDER_HOVER = '#90cdf4';

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line !== '') { lines.push(line); line = word; }
    else { line = candidate; }
  }
  if (line) lines.push(line);
  return lines;
}

function pathHitTest(mx: number, my: number): number {
  for (let i = 0; i < CARD_XS.length; i++) {
    const cx = CARD_XS[i];
    if (mx >= cx && mx <= cx + CARD_W && my >= PATH_Y && my <= PATH_Y + CARD_H) return i;
  }
  return -1;
}

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
  private running = false;
  private store = new GameStore();
  private tutorial = new TutorialController(this.store.getState().meta);

  private screenState: ScreenState = 'hub';
  private runLog: string[] = [];
  private lastRun: RunState | null = null;
  // lastRunCredits / lastRunEcho are read from GameStore fields set by endRun()
  // so they include extraction bonuses and walker-tier echo multipliers.
  private lastRunCredits = 0;
  private lastRunEcho = 0;

  // Path-select press tracking
  private pressedPathIndex = -1;

  // Toast
  private toastText = '';
  private toastExpiry = 0;

  start(): void {
    this.running = true;

    const { loadResult } = this.store;
    const meta = this.store.getState().meta;
    this.screenState = meta.openingPathChosen === false ? 'path-select' : 'hub';

    if (loadResult.wasReset) {
      this.showToast('Save corrupted — starting fresh.');
    } else if (loadResult.state.meta.totalRuns === 0 && !loadResult.state.meta.openingPathChosen) {
      this.showToast('New game.');
    } else {
      this.showToast('Save loaded.');
    }

    MakkoEngine.input.capture(['KeyS', 'KeyR']);
    requestAnimationFrame((t) => this.gameLoop(t));
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
  private handlePathSelect(mx: number, my: number): void {
    const input = MakkoEngine.input;

    if (input.isMousePressed(0)) this.pressedPathIndex = pathHitTest(mx, my);

    if (input.isMouseReleased(0) && this.pressedPathIndex !== -1) {
      const released = pathHitTest(mx, my);
      if (released === this.pressedPathIndex && released < OPENING_PATH_ORDER.length) {
        const pathId = OPENING_PATH_ORDER[released] as OpeningPathId;
        this.store.dispatch({ type: 'CHOOSE_OPENING_PATH', path: pathId });
        this.screenState = 'hub';
      }
      this.pressedPathIndex = -1;
    }
  }

  private handleHub(action: HubAction | null): void {
    const input = MakkoEngine.input;

    // Manual save via keyboard
    if (input.isKeyPressed('KeyS')) {
      serialize(this.store.getState());
      this.showToast('Saved.');
      return;
    }

    if (action === 'START_DIVE') {
      this.store.dispatch({ type: 'START_DIVE' });
      const snap = this.store.getState();
      if (snap.currentRun !== null) {
        this.runLog = [];
        this.screenState = 'dive';
      }
    } else if (action === 'RECHARGE_ENERGY') {
      this.store.dispatch({ type: 'RECHARGE_ENERGY' });
    } else if (action === 'RECHARGE_ENERGY_EMERGENCY') {
      this.store.dispatch({ type: 'RECHARGE_ENERGY_EMERGENCY' });
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
    } else if (action !== null && typeof action === 'object' && action.type === 'SET_ACTIVE_REPAIR') {
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
  private renderPathSelectScreen(mx: number, my: number): void {
    const display = MakkoEngine.display;

    display.drawText('CHOOSE YOUR OPENING PATH', 960, 200, {
      font: 'bold 40px monospace', fill: '#e2e8f0', align: 'center', baseline: 'middle',
    });
    display.drawText('This choice shapes your starting conditions. It cannot be changed.', 960, 270, {
      font: '22px monospace', fill: '#718096', align: 'center', baseline: 'middle',
    });

    for (let i = 0; i < OPENING_PATH_ORDER.length; i++) {
      const cfg = OPENING_PATH_CONFIG[OPENING_PATH_ORDER[i]];
      const cx = CARD_XS[i];
      const hover = pathHitTest(mx, my) === i;

      display.drawRect(cx, PATH_Y, CARD_W, CARD_H, {
        fill: CARD_FILL,
        stroke: hover ? CARD_BORDER_HOVER : CARD_BORDER_IDLE,
        lineWidth: 2,
      });

      display.drawText(cfg.label, cx + CARD_W / 2, PATH_Y + 36, {
        font: 'bold 26px monospace', fill: '#ffffff', align: 'center', baseline: 'top',
      });

      const descLines = wrapText(cfg.description, 36);
      for (let l = 0; l < descLines.length; l++) {
        display.drawText(descLines[l], cx + CARD_W / 2, PATH_Y + 86 + l * 26, {
          font: '20px monospace', fill: '#a0aec0', align: 'center', baseline: 'top',
        });
      }

      const statLine = `Energy:${cfg.energy}  Debt:\u20a1${cfg.debt}  Void:+${cfg.voidEchoBonus}`;
      display.drawText(statLine, cx + CARD_W / 2, PATH_Y + CARD_H - 36, {
        font: '18px monospace', fill: '#68d391', align: 'center', baseline: 'top',
      });
    }
  }

  /** Maps ScreenState to TutorialScreen, or null for screens the tutorial ignores. */
  private asTutorialScreen(screen: ScreenState): TutorialScreen | null {
    if (
      screen === 'path-select' ||
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
  private gameLoop(currentTime: number): void {
    if (!this.running) return;

    const snap = this.store.getState();
    const { meta, currentRun, currentDraft } = snap;
    const input = MakkoEngine.input;
    const mx = input.mouseX;
    const my = input.mouseY;
    const display = MakkoEngine.display;

    display.beginFrame();
    display.clear('#101219');

    // ── Screen dispatch ────────────────────────────────────────────────────
    if (this.screenState === 'path-select') {
      this.handlePathSelect(mx, my);
      this.renderPathSelectScreen(mx, my);

    } else if (this.screenState === 'hub') {
      const hubAction = renderHub(meta, mx, my);
      this.handleHub(hubAction);

    } else if (this.screenState === 'dive' && currentRun !== null) {
      // Fix #4: currentDraft can only be [] here if endRun() ran this same
      // frame and set screenState to 'result', which is handled in handleDive.
      // The dive branch is already gated by currentRun !== null, so an empty
      // draft while currentRun is non-null is impossible in normal flow.
      const diveAction = renderDive(currentRun, currentDraft, this.runLog, mx, my);
      this.handleDive(diveAction ? diveAction.cardId : null);

    } else if (this.screenState === 'result' && this.lastRun !== null) {
      const resultAction = renderResult(
        this.lastRun,
        this.lastRunCredits,
        this.lastRunEcho,
        this.store.lastEndedRun?.salvage ?? [],
        this.store.lastEndedRun?.itemsFound ?? [],
        mx,
        my,
      );
      if (resultAction === 'CONTINUE') {
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

    // ── Tutorial overlay ──────────────────────────────────────────────────
    if (!meta.tutorialCompleted) {
      // Only show on screens the tutorial covers
      const tutorialScreen = this.asTutorialScreen(this.screenState);
      if (tutorialScreen !== null) {
        // Auto-advance step when the player has moved past the trigger
        const currentStep = meta.tutorialStep === 0 ? 1 : meta.tutorialStep;
        if (currentStep < 6 && this.tutorial.shouldAdvance(currentStep, tutorialScreen, meta)) {
          this.store.dispatch({ type: 'ADVANCE_TUTORIAL_STEP' });
        }

        // Determine what step to show (re-read after possible advance)
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

    // ── Toast overlay ──────────────────────────────────────────────────────
    this.renderToast();

    display.endFrame();
    MakkoEngine.input.endFrame();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}
