/**
 * GameStore — thin orchestrator that routes AppActions to handler modules
 * and manages subscription/notification lifecycle.
 *
 * P23 refactor changelog (original):
 *  - processBilling()          → src/app/billing.ts
 *  - mergeRunIntoMeta() et al. → src/app/run-end-handler.ts
 *  - MAX_ENERGY, RECHARGE_COST → src/config/constants.ts
 *
 * P24 refactor: dispatch handlers split into src/app/store/
 */

import { GameState, RunState } from '../../types/state';
import { TacticCard, getAvailableCards } from '../../content/cards';
import { drawThree } from '../../dive/draft';
import { serialize, loadSave, LoadResult } from '../../persist/save';
import { checkAndUnlock } from '../../progression/unlocks';
import { getPurchasedTiersForBranch } from '../../content/void-communion';
import { computeCrewEffects } from '../../content/crew';
import { computeHardwareEffects } from '../hardware-effects';
import { mergeRunIntoMeta, applyRepairProgress, applyDoctrineUnlocks, applyDeathLessonUnlocks } from '../run-end-handler';
import { AppAction, StoreSnapshot } from './types';
import { handleStartDive, handleDiveEvent } from './dive-handlers';
import { handleChooseOpeningPath, handleBuyVoidTier, handleBuyVoidShopCard } from './void-handlers';
import { handleSellSalvage, handleSellAllLowTier, handlePayDebt, handleRechargeEnergy, handleRechargeEnergyEmergency, handleGainPowerCells } from './economy-handlers';
import { handleEquipItem, handleUnequipItem, handleWakeCrew, handleSendToCryo, handleAssignCrew } from './crew-handlers';
import { handleCompleteTutorial, handleAdvanceTutorialStep, handleSetActiveRepair, handleUpgradeModule } from './meta-handlers';
import { applyPlayCard } from './play-card';
import { CrewMemberId } from '../../content/crew';

export type { AppAction, StoreSnapshot };

export class GameStore {
  private state: GameState;
  private currentDraft: TacticCard[] = [];
  private listeners: Array<() => void> = [];
  readonly loadResult: LoadResult;

  lastEndedRun: RunState | null = null;
  lastBankedCredits = 0;
  lastEchoGained = 0;

  constructor() {
    this.loadResult = loadSave();
    this.state = this.loadResult.state;
  }

  getState(): StoreSnapshot {
    return { ...this.state, meta: { ...this.state.meta }, currentDraft: [...this.currentDraft] };
  }

  dispatch(action: AppAction): void {
    switch (action.type) {
      case 'START_DIVE': {
        const next = handleStartDive(this.state);
        if (next === null) break;
        this.state = next;
        this.currentDraft = this.makeDraft();
        break;
      }
      case 'DIVE_EVENT': {
        const { state: next, shouldEnd } = handleDiveEvent(this.state, action.event);
        if (shouldEnd && next.currentRun) {
          this.endRun(next.currentRun);
        } else {
          this.state = next;
          if (action.event.type === 'NEXT_ROUND') this.currentDraft = this.makeDraft();
        }
        break;
      }
      case 'RETURN_TO_HUB': {
        if (this.state.currentRun === null) break;
        if (this.state.currentRun.phase === 'active') break;
        this.state = { ...this.state, currentRun: null };
        break;
      }
      case 'CHOOSE_OPENING_PATH': {
        this.state = handleChooseOpeningPath(this.state, action.path);
        serialize(this.state);
        break;
      }
      case 'BUY_VOID_TIER': {
        this.state = handleBuyVoidTier(this.state, action.tierId);
        serialize(this.state);
        break;
      }
      case 'BUY_VOID_SHOP_CARD': {
        this.state = handleBuyVoidShopCard(this.state, action.shopCardId);
        serialize(this.state);
        break;
      }
      case 'RECHARGE_ENERGY': {
        this.state = handleRechargeEnergy(this.state);
        serialize(this.state);
        break;
      }
      case 'RECHARGE_ENERGY_EMERGENCY': {
        this.state = handleRechargeEnergyEmergency(this.state);
        serialize(this.state);
        break;
      }
      case 'SELL_SALVAGE': {
        this.state = handleSellSalvage(this.state, action.tier);
        serialize(this.state);
        break;
      }
      case 'SELL_ALL_LOW_TIER': {
        this.state = handleSellAllLowTier(this.state);
        serialize(this.state);
        break;
      }
      case 'PAY_DEBT': {
        this.state = handlePayDebt(this.state, action.amount);
        serialize(this.state);
        break;
      }
      case 'GAIN_POWER_CELLS': {
        this.state = handleGainPowerCells(this.state, action.amount);
        serialize(this.state);
        break;
      }
      case 'EQUIP_ITEM': {
        this.state = handleEquipItem(this.state, action.slot, action.itemId);
        serialize(this.state);
        break;
      }
      case 'UNEQUIP_ITEM': {
        this.state = handleUnequipItem(this.state, action.slot);
        serialize(this.state);
        break;
      }
      case 'WAKE_CREW': {
        this.state = handleWakeCrew(this.state, action.crewId);
        serialize(this.state);
        break;
      }
      case 'SEND_TO_CRYO': {
        this.state = handleSendToCryo(this.state, action.crewId);
        serialize(this.state);
        break;
      }
      case 'ASSIGN_CREW': {
        this.state = handleAssignCrew(this.state, action.crewId, action.slot);
        serialize(this.state);
        break;
      }
      case 'SET_ACTIVE_REPAIR': {
        this.state = handleSetActiveRepair(this.state, action.shipId);
        serialize(this.state);
        break;
      }
      case 'COMPLETE_TUTORIAL': {
        this.state = handleCompleteTutorial(this.state);
        serialize(this.state);
        break;
      }
      case 'ADVANCE_TUTORIAL_STEP': {
        this.state = handleAdvanceTutorialStep(this.state);
        break; // ephemeral — not saved
      }
      case 'UPGRADE_MODULE': {
        const next = handleUpgradeModule(this.state, action.moduleId);
        if (next === null) break; // insufficient salvage — notify only
        this.state = next;
        serialize(this.state);
        break;
      }
    }
    this.notify();
  }

  dispatchPlayCard(cardId: string): string[] {
    if (this.state.currentRun === null) return [];

    const { state, dangerMessages, runEnded } = applyPlayCard(this.state, cardId);
    this.state = state;

    if (runEnded && this.state.currentRun) {
      this.endRun(this.state.currentRun);
      this.notify();
      return dangerMessages;
    }

    if (this.state.currentRun && this.state.currentRun.phase !== 'collapsed') {
      this.currentDraft = this.makeDraft();
    }

    this.notify();
    return dangerMessages;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private endRun(run: RunState): void {
    this.lastEndedRun = run;

    if (run.phase === 'extracted') {
      const extractEffects = computeCrewEffects(this.state.meta.leadId, this.state.meta.companionIds);
      const crewBonus = extractEffects.reduce(
        (sum, e) => sum + (e.type === 'extract_bonus' ? e.amount : 0),
        0,
      );
      const hw = computeHardwareEffects(this.state.meta.equippedItems);
      this.lastBankedCredits = run.runCredits + this.state.meta.extractionBonus + crewBonus + hw.extractBonusFlat;
      this.lastEchoGained = run.voidEchoGain;
    } else {
      this.lastBankedCredits = 0;
      const walkerTiers = getPurchasedTiersForBranch(this.state.meta.purchasedVoidTiers, 'void_walker');
      const echoMultiplier = walkerTiers.reduce(
        (sum, t) => sum + (t.effect.type === 'echo_multiplier' ? t.effect.value : 0),
        0,
      );
      this.lastEchoGained = (echoMultiplier > 0 ? run.round * echoMultiplier : 2) + run.voidEchoGain;
    }

    const merged = mergeRunIntoMeta(run, this.state.meta);
    const repairAwakeIds: CrewMemberId[] = [
      ...(merged.leadId !== null ? [merged.leadId] : []),
      ...merged.companionIds,
    ];
    const afterRepair  = applyRepairProgress(merged, merged.crewAssignments, repairAwakeIds);
    const afterDoc     = applyDoctrineUnlocks(afterRepair);
    const afterDeath   = applyDeathLessonUnlocks(afterDoc);
    const afterUnlocks = checkAndUnlock(afterDeath);
    this.state = { ...this.state, meta: afterUnlocks, currentRun: null };
    this.currentDraft = [];
    serialize(this.state);
  }

  private makeDraft(): TacticCard[] {
    return drawThree(getAvailableCards(this.state.meta.unlockedCards));
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
