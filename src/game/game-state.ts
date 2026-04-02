/**
 * Game State Fields
 *
 * Encapsulates all mutable state fields from the Game class
 * for better separation of concerns.
 */

import { ScreenState, LastRunInfo, ToastState, HubActionMap } from './types';
import { HubTab } from '../ui/hub/index';
import { RunState, MetaState, RunPath } from '../types/state';
import { Signal } from '../content/signals';
import { TacticCard } from '../content/cards';
import { CrewMemberId } from '../content/crew';
import { PanelAnimator } from '../ui/panel-overlay';
import { DialoguePlayer } from '../dialogue/dialogue-player';
import { TutorialContext } from '../tutorial/tutorial-context';
import type { BillingForecastResult } from '../ui/expedition/billing-forecast-modal';
import type { ShipBillingResult } from '../dive/expedition-billing';

export class GameState {
  screen: ScreenState = 'hub';
  hubTab: HubTab = 'overview';

  // Run tracking
  runLog: string[] = [];
  lastRun: LastRunInfo = { run: null, haulValue: 0, echo: 0 };
  preRunMeta: MetaState | null = null;

  // Node state
  lootOfferings: TacticCard[] = [];
  currentSignal: Signal | null = null;

  // Toast
  toast: ToastState = { text: '', expiry: 0 };

  // Reset confirmation
  showResetConfirm = false;

  // Panel animators
  salvageAnimator = new PanelAnimator(200);
  voidAnimator = new PanelAnimator(200);
  hwAnimator = new PanelAnimator(200);
  cryoAnimator = new PanelAnimator(200);
  modulesAnimator = new PanelAnimator(200);

  // Tutorial state
  tutorialDialoguePlayer: DialoguePlayer | null = null;
  lastTutorialPhase: number | null = null;
  tutorialContext: TutorialContext | null = null;

  // Track last panel action for tutorial advancement
  lastPanelAction: string | null = null;

  // Scene transition signal
  pendingSceneSwitch: string | null = null;

  // Pending lore fragments to display after result screen
  pendingLoreFragments: string[] = [];
  pendingLoreFragmentCrewId: CrewMemberId | null = null; // for attribution

  // Billing forecast state for end-of-expedition warning
  billingForecast: BillingForecastResult | null = null;
  billingForecastPath: RunPath | null = null;
  billingProcessed: boolean = false;
  lastBillingResult: ShipBillingResult | null = null;
  expeditionOutcome: 'victory' | 'ceiling_death' | 'strike_out' | 'normal' | null = null;

  setScreen(screen: ScreenState): void {
    this.screen = screen;
  }

  updateLastRun(run: RunState, haulValue: number, echo: number): void {
    this.lastRun = { run, haulValue, echo };
  }

  setToast(text: string, durationMs: number): void {
    this.toast = { text, expiry: performance.now() + durationMs };
  }

  clearToast(): void {
    this.toast = { text: '', expiry: 0 };
  }

  isToastActive(): boolean {
    return this.toast.text !== '' && performance.now() < this.toast.expiry;
  }

  getRemainingToastTime(): number {
    return Math.max(0, this.toast.expiry - performance.now());
  }

  resetTutorialState(): void {
    this.tutorialDialoguePlayer = null;
    this.lastTutorialPhase = null;
    this.tutorialContext = null;
    this.lastPanelAction = null;
  }

  setLootOfferings(offerings: TacticCard[]): void {
    this.lootOfferings = offerings;
  }

  clearLootOfferings(): void {
    this.lootOfferings = [];
  }

  setCurrentSignal(signal: Signal | null): void {
    this.currentSignal = signal;
  }
}
