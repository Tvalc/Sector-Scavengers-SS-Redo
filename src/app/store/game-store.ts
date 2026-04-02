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
import { TacticCard, CORE_CARDS } from '../../content/cards';
import { addCardToDiscard } from '../../dive/deck-manager';
import { serialize, loadSave, clearSave, LoadResult } from '../../persist/save';
import { createEmptyGame } from '../../types/state';
import { checkAndUnlock } from '../../progression/unlocks';
import { addUnlockedCrewToCryo } from '../../progression/crew-unlocks';
import { getPurchasedTiersForBranch } from '../../content/void-communion';
import { computeCrewEffects } from '../../content/crew';
import { computeHardwareEffects } from '../hardware-effects';
import { mergeRunIntoMeta, applyRepairProgress, applyDoctrineUnlocks, applyDeathLessonUnlocks } from '../run-end-handler';
import { AppAction, StoreSnapshot } from './types';
import { handleStartDive, handleDiveEvent, handleSelectNextNode } from './dive-handlers';

import { handleChooseOpeningPath, handleBuyVoidTier, handleBuyVoidShopCard, handleApplyIntroOutcome } from './void-handlers';
import { handleBuyMarketItem, handlePayDebtEarly } from './economy-handlers';
import { handleEquipItem, handleUnequipItem, handleWakeCrew, handleSendToCryo, handleAssignCrew } from './crew-handlers';
import { handleCompleteTutorial, handleAdvanceTutorialPhase, handleSetActiveRepair, handleUpgradeModule, handleAssignCaptain, handleUnassignCaptain } from './meta-handlers';
import { TutorialPhase } from '../../types/state';
import { applyPlayCard } from './play-card';
import { CrewMemberId } from '../../content/crew';


export type { AppAction, StoreSnapshot };

export class GameStore {
  private state: GameState;
  private listeners: Array<() => void> = [];
  readonly loadResult: LoadResult;

  lastEndedRun: RunState | null = null;
  lastHaulValue = 0;
  lastEchoGained = 0;
  debtClearedThisRun = false;
  /** true = extracted with debt cleared, false = extracted with debt unpaid, null = collapsed */
  lastExtractDebtCleared: boolean | null = null;
  pendingLoreFragments: string[] = [];
  pendingLoreAttributionCrewId: CrewMemberId | null = null;

  constructor() {
    this.loadResult = loadSave();
    this.state = this.loadResult.state;
  }

  getState(): StoreSnapshot {
    return { ...this.state, meta: { ...this.state.meta }, currentDraft: this.makeDraft() };
  }

  dispatch(action: AppAction): void {
    switch (action.type) {
      case 'START_DIVE': {
        const next = handleStartDive(this.state, action.divePrep);
        if (next === null) break;
        this.state = next;
        break;
      }
      case 'DIVE_EVENT': {
        const { state: next, shouldEnd } = handleDiveEvent(this.state, action.event);
        if (shouldEnd && next.currentRun) {
          this.endRun(next.currentRun);
        } else {
          this.state = next;
        }
        break;
      }
      case 'RETURN_TO_HUB': {
        if (this.state.currentRun === null) break;
        if (this.state.currentRun.phase === 'active') break;

        const run = this.state.currentRun;
        const path = this.state.meta.activeRunPath;

        // COLLAPSE PATH: Clear the entire run and return to hub
        if (run.phase === 'collapsed') {
          // Clear the active path — the expedition is over
          this.state = {
            ...this.state,
            meta: {
              ...this.state.meta,
              activeRunPath: null,
            },
          };
          this.endRun(run);

          // Clear dive prep
          const clearedDivePrep = {
            ...this.state.meta.divePrep,
            selectedCrewId: null,
            selectedShipId: null,
            equippedForDive: { hull: null, scanner: null, utility: null },
            selectedCards: ['scavenge', 'repair', 'extract'],
          };
          this.state = {
            ...this.state,
            meta: {
              ...this.state.meta,
              divePrep: clearedDivePrep,
            },
          };
          serialize(this.state);
          break;
        }

        // EXTRACT PATH: Check if we should continue expedition or end
        if (run.phase === 'extracted') {
          // No path — treat as single run end
          if (!path) {
            this.endRun(run);
            const clearedDivePrep = {
              ...this.state.meta.divePrep,
              selectedCrewId: null,
              selectedShipId: null,
              equippedForDive: { hull: null, scanner: null, utility: null },
              selectedCards: ['scavenge', 'repair', 'extract'],
            };
            this.state = {
              ...this.state,
              meta: {
                ...this.state.meta,
                activeRunPath: null,
                divePrep: clearedDivePrep,
              },
            };
            serialize(this.state);
            break;
          }

          // Build node lookup
          const nodeMap = new Map(path.nodes.map(n => [n.id, n]));
          const currentNode = path.currentNodeId ? nodeMap.get(path.currentNodeId) : null;

          // Mark current node visited
          const visitedNodeIds = new Set<string>();
          if (currentNode) visitedNodeIds.add(currentNode.id);

          const updatedNodes = path.nodes.map(node =>
            visitedNodeIds.has(node.id) ? { ...node, visited: true } : node
          );

          // Rebuild layers from updated nodes
          const updatedLayers = path.layers.map(layer =>
            layer.map(node => updatedNodes.find(n => n.id === node.id)!)
          );

          // Check if this node triggers a reward (intership loot pick)
          const isRewardNode = currentNode?.isReward === true;

          // Check if expedition is done (boss node or no children)
          const isBossNode = currentNode?.shipType === 'boss';
          const hasNoChildren = currentNode ? currentNode.childIds.length === 0 : true;
          const isExpeditionDone = isBossNode || hasNoChildren;

          // Calculate projected debt after this run
          const projectedCredits = run.runCredits + path.pathCredits;
          const projectedDebt = this.state.meta.debt - projectedCredits;

          // Check victory condition (debt cleared) — end expedition immediately
          if (projectedDebt <= 0) {
            if (action.haulDecisions || action.auditResult) {
              const mergeResult = mergeRunIntoMeta(run, this.state.meta, action.auditResult, action.haulDecisions);
              const merged = mergeResult.meta;

              const repairAwakeIds: CrewMemberId[] = [
                ...(merged.leadId !== null ? [merged.leadId] : []),
                ...merged.companionIds,
              ];
              const afterRepair = applyRepairProgress(merged, merged.crewAssignments, repairAwakeIds);
              const afterDoc = applyDoctrineUnlocks(afterRepair);
              const afterDeath = applyDeathLessonUnlocks(afterDoc);
              const afterUnlocks = checkAndUnlock(afterDeath);
              const afterCrewUnlocks = addUnlockedCrewToCryo(afterUnlocks);

              let finalMeta = afterCrewUnlocks;
              if (finalMeta.debt <= 0) {
                finalMeta = {
                  ...finalMeta,
                  debtClearedCount: finalMeta.debtClearedCount + 1,
                  debt: 0,
                };
                if (finalMeta.debtClearedCount === 1) {
                  finalMeta.handicapEnabled = true;
                }
                this.debtClearedThisRun = true;
              }

              this.lastExtractDebtCleared = mergeResult.debtCleared;
              this.pendingLoreFragments = mergeResult.loreFragments;
              this.pendingLoreAttributionCrewId = mergeResult.loreAttributionCrewId;
              this.lastEndedRun = run;
              this.lastHaulValue = action.haulDecisions
                ? run.runCredits + this.state.meta.extractionBonus
                : run.runCredits;
              this.lastEchoGained = finalMeta.voidEcho - this.state.meta.voidEcho;

              this.state = { ...this.state, meta: finalMeta, currentRun: null };
            } else {
              this.endRun(run);
            }

            const clearedDivePrep = {
              ...this.state.meta.divePrep,
              selectedCrewId: null,
              selectedShipId: null,
              equippedForDive: { hull: null, scanner: null, utility: null },
              selectedCards: ['scavenge', 'repair', 'extract'],
            };
            this.state = {
              ...this.state,
              meta: {
                ...this.state.meta,
                activeRunPath: null,
                divePrep: clearedDivePrep,
              },
            };
            serialize(this.state);
            break;
          }

          // Check if expedition is done (boss or no children)
          if (isExpeditionDone) {
            if (action.haulDecisions || action.auditResult) {
              const mergeResult = mergeRunIntoMeta(run, this.state.meta, action.auditResult, action.haulDecisions);
              const merged = mergeResult.meta;

              const repairAwakeIds: CrewMemberId[] = [
                ...(merged.leadId !== null ? [merged.leadId] : []),
                ...merged.companionIds,
              ];
              const afterRepair = applyRepairProgress(merged, merged.crewAssignments, repairAwakeIds);
              const afterDoc = applyDoctrineUnlocks(afterRepair);
              const afterDeath = applyDeathLessonUnlocks(afterDoc);
              const afterUnlocks = checkAndUnlock(afterDeath);
              const afterCrewUnlocks = addUnlockedCrewToCryo(afterUnlocks);

              let finalMeta = afterCrewUnlocks;
              this.lastExtractDebtCleared = mergeResult.debtCleared;
              this.pendingLoreFragments = mergeResult.loreFragments;
              this.pendingLoreAttributionCrewId = mergeResult.loreAttributionCrewId;
              this.lastEndedRun = run;
              this.lastHaulValue = action.haulDecisions
                ? run.runCredits + this.state.meta.extractionBonus
                : run.runCredits;
              this.lastEchoGained = finalMeta.voidEcho - this.state.meta.voidEcho;

              this.state = { ...this.state, meta: finalMeta, currentRun: null };
            } else {
              this.endRun(run);
            }

            const clearedDivePrep = {
              ...this.state.meta.divePrep,
              selectedCrewId: null,
              selectedShipId: null,
              equippedForDive: { hull: null, scanner: null, utility: null },
              selectedCards: ['scavenge', 'repair', 'extract'],
            };
            this.state = {
              ...this.state,
              meta: {
                ...this.state.meta,
                activeRunPath: null,
                divePrep: clearedDivePrep,
              },
            };
            serialize(this.state);
            break;
          }

          // Continue expedition — accumulate resources and return to path map
          const updatedPath = {
            ...path,
            nodes: updatedNodes,
            layers: updatedLayers,
            pathCredits: path.pathCredits + run.runCredits,
            pathSalvage: [...path.pathSalvage, ...run.salvage],
            pathItemsFound: [...path.pathItemsFound, ...run.itemsFound],
            pathHull: run.hull,
            pathShieldCharges: run.shieldCharges,
            pathDeck: [...run.deck, ...run.discardPile, ...run.hand],
            pathDoctrineRunPoints: {
              corporate: path.pathDoctrineRunPoints.corporate + run.doctrineRunPoints.corporate,
              cooperative: path.pathDoctrineRunPoints.cooperative + run.doctrineRunPoints.cooperative,
              smuggler: path.pathDoctrineRunPoints.smuggler + run.doctrineRunPoints.smuggler,
            },
            pathBotsDeployed: path.pathBotsDeployed + run.botsDeployed,
            pendingLootPick: isRewardNode, // Trigger inter-ship loot pick on reward nodes
          };

          // Populate lastEndedRun fields so run-scene can show mid-expedition result
          this.lastEndedRun = run;
          const extractEffects = computeCrewEffects(this.state.meta.leadId, this.state.meta.companionIds, this.state.meta.crewLevels);
          const crewBonus = extractEffects.reduce(
            (sum, e) => sum + (e.type === 'extract_bonus' ? e.amount : 0), 0,
          );
          const hw = computeHardwareEffects(this.state.meta.equippedItems, run.foundHardware);
          this.lastHaulValue = run.runCredits + this.state.meta.extractionBonus + crewBonus + hw.extractBonusFlat;
          this.lastEchoGained = run.voidEchoGain;
          this.lastExtractDebtCleared = null; // Not final — debt check happens at expedition end

          this.state = {
            ...this.state,
            meta: {
              ...this.state.meta,
              activeRunPath: updatedPath,
            },
            currentRun: null, // Clear current run, player picks next target on path map
          };
          serialize(this.state);
        }
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
      case 'ADVANCE_TUTORIAL_PHASE': {
        this.state = handleAdvanceTutorialPhase(this.state, action.phase);
        break; // ephemeral — not saved
      }
      case 'UPGRADE_MODULE': {
        const next = handleUpgradeModule(this.state, action.moduleId);
        if (next === null) break; // insufficient salvage — notify only
        this.state = next;
        serialize(this.state);
        break;
      }
      case 'ASSIGN_CAPTAIN': {
        const next = handleAssignCaptain(this.state, action.shipId, action.crewId);
        if (next === null) break;
        this.state = next;
        serialize(this.state);
        break;
      }
      case 'UNASSIGN_CAPTAIN': {
        const next = handleUnassignCaptain(this.state, action.shipId);
        if (next === null) break;
        this.state = next;
        serialize(this.state);
        break;
      }
      case 'APPLY_INTRO_OUTCOME': {
        this.state = handleApplyIntroOutcome(this.state, action.outcome);
        serialize(this.state);
        break;
      }
      case 'BUY_MARKET_ITEM': {
        this.state = handleBuyMarketItem(this.state, action.hardwareId);
        serialize(this.state);
        break;
      }
      case 'SET_DIVE_PREP_CREW': {
        this.state = {
          ...this.state,
          meta: {
            ...this.state.meta,
            divePrep: {
              ...this.state.meta.divePrep,
              selectedCrewId: action.crewId,
            },
          },
        };
        serialize(this.state);
        break;
      }
      case 'SET_DIVE_PREP_SHIP': {
        this.state = {
          ...this.state,
          meta: {
            ...this.state.meta,
            divePrep: {
              ...this.state.meta.divePrep,
              selectedShipId: action.shipId,
            },
          },
        };
        serialize(this.state);
        break;
      }
      case 'SET_DIVE_PREP_HARDWARE': {
        this.state = {
          ...this.state,
          meta: {
            ...this.state.meta,
            divePrep: {
              ...this.state.meta.divePrep,
              equippedForDive: {
                ...this.state.meta.divePrep.equippedForDive,
                [action.slot]: action.itemId,
              },
            },
          },
        };
        serialize(this.state);
        break;
      }
      // Dive-prep selection panel actions (distinct from SET_DIVE_PREP_*)
      case 'DIVE_PREP_SELECT_SHIP': {
        this.state = {
          ...this.state,
          meta: {
            ...this.state.meta,
            divePrep: {
              ...this.state.meta.divePrep,
              selectedShipId: action.shipId,
            },
          },
        };
        serialize(this.state);
        break;
      }
      case 'DIVE_PREP_SELECT_CREW': {
        this.state = {
          ...this.state,
          meta: {
            ...this.state.meta,
            divePrep: {
              ...this.state.meta.divePrep,
              selectedCrewId: action.crewId,
            },
          },
        };
        serialize(this.state);
        break;
      }
      case 'DIVE_PREP_EQUIP_HARDWARE': {
        this.state = {
          ...this.state,
          meta: {
            ...this.state.meta,
            divePrep: {
              ...this.state.meta.divePrep,
              equippedForDive: {
                ...this.state.meta.divePrep.equippedForDive,
                [action.slot]: action.itemId,
              },
            },
          },
        };
        serialize(this.state);
        break;
      }
      case 'REROLL_DIVE_PREP_HAND': {
        // Deprecated — deck is now player-constructed, not seed-based.
        // Kept as no-op for backward compatibility with lingering dispatches.
        break;
      }
      case 'SELECT_NEXT_NODE': {
        const next = handleSelectNextNode(this.state, action.nodeId);
        if (next === null) break;
        this.state = next;
        serialize(this.state);
        break;
      }
      case 'PICK_INTERSHIP_LOOT': {
        if (!this.state.meta.activeRunPath || !this.state.meta.activeRunPath.pendingLootPick) break;

        const path = this.state.meta.activeRunPath;

        // Add card to path deck if not skipped
        const updatedDeck = action.cardId === null
          ? path.pathDeck
          : [...path.pathDeck, action.cardId];

        this.state = {
          ...this.state,
          meta: {
            ...this.state.meta,
            activeRunPath: {
              ...path,
              pathDeck: updatedDeck,
              pendingLootPick: false,
            },
          },
        };
        serialize(this.state);
        break;
      }
      case 'PAY_DEBT_EARLY': {
        const next = handlePayDebtEarly(this.state, action.amount);
        this.state = next;
        serialize(this.state);
        break;
      }
    }
    this.notify();
  }

  dispatchPlayCard(cardId: string, overcharge: boolean = false): string[] {
    if (this.state.currentRun === null) return [];

    const { state, dangerMessages, runEnded } = applyPlayCard(this.state, cardId, overcharge);
    this.state = state;

    if (runEnded && this.state.currentRun) {
      this.endRun(this.state.currentRun);
      this.notify();
      return dangerMessages;
    }

    this.notify();
    return dangerMessages;
  }

  /**
   * Handle loot node choice — add selected card to discard pile or skip.
   */
  dispatchLootChoice(cardId: string | null): void {
    if (this.state.currentRun === null) return;

    const run = this.state.currentRun;

    if (cardId === null) {
      // Player skipped — just clear the loot node pending state
      this.state = {
        ...this.state,
        currentRun: { ...run, lootNodePending: false },
      };
    } else {
      // Add selected card to discard pile
      const updatedDiscard = addCardToDiscard(run.discardPile, cardId);
      this.state = {
        ...this.state,
        currentRun: { ...run, discardPile: updatedDiscard, lootNodePending: false },
      };
    }

    serialize(this.state);
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }



  private endRun(run: RunState): void {
    this.lastEndedRun = run;

    if (run.phase === 'extracted') {
      const extractEffects = computeCrewEffects(this.state.meta.leadId, this.state.meta.companionIds, this.state.meta.crewLevels);
      const crewBonus = extractEffects.reduce(
        (sum, e) => sum + (e.type === 'extract_bonus' ? e.amount : 0),
        0,
      );
      const hw = computeHardwareEffects(this.state.meta.equippedItems, run.foundHardware);
      this.lastHaulValue = run.runCredits + this.state.meta.extractionBonus + crewBonus + hw.extractBonusFlat;
      this.lastEchoGained = run.voidEchoGain;
    } else {
      this.lastHaulValue = 0;
      const walkerTiers = getPurchasedTiersForBranch(this.state.meta.purchasedVoidTiers, 'void_walker');
      const echoMultiplier = walkerTiers.reduce(
        (sum, t) => sum + (t.effect.type === 'echo_multiplier' ? t.effect.value : 0),
        0,
      );
      // Base echo on collapse: 2 + (1 per 5 rounds completed)
      const baseEcho = 2 + Math.floor(run.round / 5);
      this.lastEchoGained = (echoMultiplier > 0 ? Math.floor(baseEcho * echoMultiplier) : baseEcho) + run.voidEchoGain;
    }

    const mergeResult = mergeRunIntoMeta(run, this.state.meta);
    const merged = mergeResult.meta;

    // Track whether extract was debt-cleared or debt-unpaid for result screen
    this.lastExtractDebtCleared = mergeResult.debtCleared;

    // Queue lore fragments for display
    this.pendingLoreFragments = mergeResult.loreFragments;
    this.pendingLoreAttributionCrewId = mergeResult.loreAttributionCrewId;

    const repairAwakeIds: CrewMemberId[] = [
      ...(merged.leadId !== null ? [merged.leadId] : []),
      ...merged.companionIds,
    ];
    const afterRepair  = applyRepairProgress(merged, merged.crewAssignments, repairAwakeIds);
    const afterDoc     = applyDoctrineUnlocks(afterRepair);
    const afterDeath   = applyDeathLessonUnlocks(afterDoc);
    const afterUnlocks = checkAndUnlock(afterDeath);
    const afterCrewUnlocks = addUnlockedCrewToCryo(afterUnlocks);
    
    // Check for debt clearance win condition
    let finalMeta = afterCrewUnlocks;
    if (finalMeta.debt <= 0) {
      finalMeta = {
        ...finalMeta,
        debtClearedCount: finalMeta.debtClearedCount + 1,
        debt: 0, // Clamp to 0
      };
      if (finalMeta.debtClearedCount === 1) {
        finalMeta.handicapEnabled = true;
      }
      this.debtClearedThisRun = true;
    }
    
    this.state = { ...this.state, meta: finalMeta, currentRun: null };
    serialize(this.state);
  }

  /**
   * Build the current draft from the run's hand.
   * Returns empty array if no active run.
   */
  private makeDraft(): TacticCard[] {
    if (this.state.currentRun === null) return [];

    return this.state.currentRun.hand
      .map((id) => CORE_CARDS.find((c) => c.id === id))
      .filter((c): c is TacticCard => c !== undefined);
  }

  /**
   * Wipe localStorage and reset all in-memory state to a fresh game.
   * Use instead of window.location.reload() so the preview environment
   * is not disrupted.
   */
  resetToFreshGame(): void {
    clearSave();
    this.state = createEmptyGame();
    this.lastEndedRun = null;
    this.lastHaulValue = 0;
    this.lastEchoGained = 0;
    this.lastExtractDebtCleared = null;
    this.debtClearedThisRun = false;
    this.pendingLoreFragments = [];
    this.pendingLoreAttributionCrewId = null;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
