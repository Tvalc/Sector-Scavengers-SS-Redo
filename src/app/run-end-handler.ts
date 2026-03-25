// Extracted from game-store.ts — pure functions for merging run results into MetaState.

import { MetaState, RunState, ShipRecord } from '../types/state';
import { ShipStatus, getShipById } from '../content/ships';
import { computeCrewEffects } from '../content/crew';
import { getPurchasedTiersForBranch } from '../content/void-communion';
import { addSalvage, SalvageEntry } from '../content/salvage';
import {
  DOCTRINE_UNLOCK_THRESHOLD,
  DOCTRINE_CARD_UNLOCKS,
  DOCTRINE_ORDER,
  DoctrineId,
} from '../content/doctrine';
import { processBilling } from './billing';
import { computeHardwareEffects } from './hardware-effects';
import { computeModuleEffects } from './module-effects';
import { computeCrewAssignmentEffects } from './crew-assignment-effects';
import type { CrewMemberId } from '../content/crew';
import type { AssignmentSlotId } from '../content/crew-assignments';

/**
 * Merge a completed RunState into MetaState. Handles both 'extracted' and
 * 'collapsed' outcomes, applies crew bonuses, echo multipliers, and billing.
 */
export function mergeRunIntoMeta(run: RunState, meta: MetaState): MetaState {
  let updated: MetaState;

  if (run.phase === 'extracted') {
    const extractCrewEffects = computeCrewEffects(meta.leadId, meta.companionIds);
    const crewExtractBonus = extractCrewEffects.reduce(
      (sum, e) => sum + (e.type === 'extract_bonus' ? e.amount : 0),
      0,
    );
    const hw = computeHardwareEffects(meta.equippedItems);
    // Merge run salvage into hub inventory (only on clean extract)
    const mergedInventory: SalvageEntry[] = run.salvage.reduce(
      (inv, entry) => addSalvage(inv, entry),
      meta.hubInventory,
    );
    updated = {
      ...meta,
      credits:
        meta.credits +
        run.runCredits +
        meta.extractionBonus +
        crewExtractBonus +
        hw.extractBonusFlat,
      voidEcho: meta.voidEcho + run.voidEchoGain,
      debt: meta.debt + run.debtIncrease,
      totalExtracts: meta.totalExtracts + 1,
      totalRuns: meta.totalRuns + 1,
      hubInventory: mergedInventory,
      // Hardware items found this run are added to hub storage on extract;
      // on collapse they are lost (not included in the collapsed branch).
      itemInventory: [...meta.itemInventory, ...run.itemsFound],
      // Power cells scavenged this run are added on extract only.
      powerCells: meta.powerCells + run.powerCellsGained,
    };
  } else {
    // collapsed — compute echo multiplier from void_walker tiers
    const walkerTiers = getPurchasedTiersForBranch(meta.purchasedVoidTiers, 'void_walker');
    const echoMultiplier = walkerTiers.reduce(
      (sum, t) => sum + (t.effect.type === 'echo_multiplier' ? t.effect.value : 0),
      0,
    );
    const echoGain = echoMultiplier > 0 ? run.round * echoMultiplier : 2;
    updated = {
      ...meta,
      voidEcho: meta.voidEcho + echoGain + run.voidEchoGain,
      debt: meta.debt + run.debtIncrease,
      totalCollapses: meta.totalCollapses + 1,
      totalRuns: meta.totalRuns + 1,
    };
  }

  return processBilling(updated);
}

/**
 * Advance repair progress on the actively-repairing ship by one step.
 * Returns meta unchanged if no active repair or ship is already claimed.
 */
export function applyRepairProgress(
  meta: MetaState,
  assignments: Partial<Record<CrewMemberId, AssignmentSlotId>> = {},
  awakeIds: CrewMemberId[] = [],
): MetaState {
  const { activeRepairShipId } = meta;
  if (activeRepairShipId === null) return meta;

  const def = getShipById(activeRepairShipId);
  if (!def) return meta;

  const shipIdx = meta.ships.findIndex((s) => s.id === activeRepairShipId);
  if (shipIdx === -1) return meta;

  const ship = meta.ships[shipIdx];
  if (ship.status === 'claimed') return meta;

  const modEffects = computeModuleEffects(meta.moduleLevels);
  const assignFx = computeCrewAssignmentEffects(assignments, awakeIds);
  const repairStep = 1 + modEffects.repairSpeedBonus + assignFx.repairBonus;
  const newProgress = ship.repairProgress + repairStep;
  const nowClaimed = newProgress >= def.repairCost;
  const newStatus: ShipStatus = nowClaimed ? 'claimed' : 'repairing';

  const updatedShips: ShipRecord[] = meta.ships.map((s, idx): ShipRecord =>
    idx === shipIdx
      ? { ...s, repairProgress: newProgress, status: newStatus }
      : s,
  );

  return { ...meta, ships: updatedShips };
}

/**
 * Check doctrine points and unlock signature cards + lock doctrine alignment
 * when a doctrine reaches the unlock threshold.
 */
export function applyDoctrineUnlocks(meta: MetaState): MetaState {
  let { unlockedCards, doctrineLocked, doctrinePoints } = meta;

  for (const doctrine of DOCTRINE_ORDER as DoctrineId[]) {
    if (doctrinePoints[doctrine] >= DOCTRINE_UNLOCK_THRESHOLD) {
      const cardId = DOCTRINE_CARD_UNLOCKS[doctrine];
      if (!unlockedCards.includes(cardId)) {
        unlockedCards = [...unlockedCards, cardId];
      }
      if (doctrineLocked === null) {
        doctrineLocked = doctrine;
      }
    }
  }

  if (unlockedCards === meta.unlockedCards && doctrineLocked === meta.doctrineLocked) {
    return meta;
  }
  return { ...meta, unlockedCards, doctrineLocked };
}

/**
 * Unlock the Tier-3 death-lesson card (void_siphon) once the player has
 * accumulated enough collapses.
 */
export function applyDeathLessonUnlocks(meta: MetaState): MetaState {
  if (meta.totalCollapses >= 12 && !meta.unlockedCards.includes('void_siphon')) {
    return { ...meta, unlockedCards: [...meta.unlockedCards, 'void_siphon'] };
  }
  return meta;
}
