// Extracted from game-store.ts — pure functions for merging run results into MetaState.

import { MetaState, RunState, ShipRecord, RunPath } from '../types/state';
import { ShipStatus, getShipById } from '../content/ships';
import { computeCrewEffects } from '../content/crew';
import { getPurchasedTiersForBranch } from '../content/void-communion';
import { addSalvage, SalvageEntry } from '../content/salvage';
import { resolveExtraction, calculateSalvageValue, applyExtractionBonuses } from '../dive/extraction';
import {
  DOCTRINE_UNLOCK_THRESHOLD,
  DOCTRINE_CARD_UNLOCKS,
  DOCTRINE_ORDER,
  DoctrineId,
} from '../content/doctrine';
import { applyCrewCardUnlocks } from '../progression/crew-card-unlocks';
import { applyResearchUnlocks } from '../progression/research-tracks';
import { processBilling } from './billing';
import { computeHardwareEffects } from './hardware-effects';
import { getDeclaredHaulValue } from '../dive/audit';
import { ECHO_PER_EXTRACT_BASE, ECHO_PER_5_ROUNDS } from '../config/constants';
import type { AuditResult, HaulDecision } from '../types/state';
import { computeModuleEffects } from './module-effects';
import { computeCrewAssignmentEffects } from './crew-assignment-effects';
import type { CrewMemberId, CrewPassiveEffect } from '../content/crew';
import type { AssignmentSlotId } from '../content/crew-assignments';
import { SHIP_DEFS } from '../content/ships';
import { CREW_LORE_FRAGMENTS } from '../content/crew-voice';
import { processShipBilling, checkExpeditionStatus } from '../dive/expedition-billing';

/**
 * Merge a completed RunState into MetaState. Handles both 'extracted' and
 * 'collapsed' outcomes, applies crew bonuses, echo multipliers, and billing.
 * Returns both the updated meta and pending lore fragments for display.
 *
 * @param run - The completed run state
 * @param meta - The current meta state
 * @param auditResult - Optional audit result from extract manifest (extract phase only)
 * @param haulDecisions - Optional haul decisions from extract manifest (extract phase only)
 */
export interface MergeRunResult {
  meta: MetaState;
  loreFragments: string[];
  loreAttributionCrewId: CrewMemberId | null;
  /** true = extracted with debt fully cleared, false = extracted but debt remains, null = collapsed */
  debtCleared: boolean | null;
  /** Expedition outcome for path-based runs: 'victory' | 'ceiling_death' | 'strike_out' | 'normal' | null */
  expeditionOutcome: 'victory' | 'ceiling_death' | 'strike_out' | 'normal' | null;
}

/**
 * Merge a completed RunState into MetaState. Handles both 'extracted' and
 * 'collapsed' outcomes, with special handling for path-based expeditions.
 *
 * When runPath is provided:
 * - On collapse: path credits/salvage/loot are lost; echo/doctrine/crew XP still apply
 * - On extract with debt cleared: all path credits/salvage/loot merged into meta
 * - On extract without debt clearance: handled in T6 (credits stay in path only)
 *
 * @param run - The completed run state
 * @param meta - The current meta state
 * @param auditResult - Optional audit result from extract manifest
 * @param haulDecisions - Optional haul decisions from extract manifest
 * @param runPath - Optional active run path for path-based expeditions
 */
export function mergeRunIntoMeta(
  run: RunState,
  meta: MetaState,
  auditResult?: AuditResult,
  haulDecisions?: HaulDecision[],
  runPath?: RunPath | null,
): MergeRunResult {
  let updated: MetaState;
  let pendingLoreFragments: string[] = [];
  let pendingLoreAttribution: CrewMemberId | null = null;
  let expeditionOutcome: 'victory' | 'ceiling_death' | 'strike_out' | 'normal' | null = null;

  // PATH EXPEDITION: Process ship billing and check expedition outcome
  const isPathRun = runPath !== null && runPath !== undefined;
  if (isPathRun && run.phase === 'extracted') {
    // Process billing for this ship completion
    processShipBilling(runPath, runPath.pathCredits + run.runCredits);
    
    // Increment ships completed
    runPath.shipsCompleted++;
    
    // Check expedition status after billing
    const status = checkExpeditionStatus(runPath);
    
    if (status === 'victory') {
      expeditionOutcome = 'victory';
    } else if (status === 'failed') {
      // Determine if ceiling death or strike out
      if (runPath.expeditionDebt >= runPath.expeditionDebtCeiling) {
        expeditionOutcome = 'ceiling_death';
      } else if (runPath.expeditionMissedPayments >= 3) {
        expeditionOutcome = 'strike_out';
      } else {
        expeditionOutcome = 'ceiling_death'; // Default
      }
    } else if (runPath.shipsCompleted >= 6) {
      // Normal end - all 6 ships completed but no victory or failure
      expeditionOutcome = 'normal';
    }
    // If ongoing, expeditionOutcome stays null (continue expedition)
  }

  // Merge doctrine points from run into meta (applies to both outcomes)
  // For path runs, include path doctrine points if expedition is ending
  let mergedDoctrinePoints = {
    corporate: meta.doctrinePoints.corporate + (run.doctrineRunPoints?.corporate ?? 0),
    cooperative: meta.doctrinePoints.cooperative + (run.doctrineRunPoints?.cooperative ?? 0),
    smuggler: meta.doctrinePoints.smuggler + (run.doctrineRunPoints?.smuggler ?? 0),
  };
  
  // Add path doctrine points if expedition is ending (any outcome)
  if (isPathRun && expeditionOutcome !== null && runPath) {
    mergedDoctrinePoints = {
      corporate: mergedDoctrinePoints.corporate + runPath.pathDoctrineRunPoints.corporate,
      cooperative: mergedDoctrinePoints.cooperative + runPath.pathDoctrineRunPoints.cooperative,
      smuggler: mergedDoctrinePoints.smuggler + runPath.pathDoctrineRunPoints.smuggler,
    };
  }

  // Track crew runs participated and level ups
  const awakeCrewIds: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];

  // Compute research points from crew assignments (only on extract)
  const assignFx = computeCrewAssignmentEffects(meta.crewAssignments, awakeCrewIds);
  const baseResearchPoints = run.phase === 'extracted' ? 1 : 0;
  const researchBonusPoints = run.phase === 'extracted' ? assignFx.researchBonus : 0;
  const totalResearchPoints = baseResearchPoints + researchBonusPoints;

  // Update research points per track (distributed equally if crew assigned)
  const updatedResearchPoints = { ...meta.researchPoints };
  if (totalResearchPoints > 0 && assignFx.researchBonus > 0) {
    // Find which tracks have crew assigned (from crewAssignments)
    const tracksWithResearchers: Array<'engineering' | 'biology' | 'psionics'> = [];
    for (const [crewId, slotId] of Object.entries(meta.crewAssignments)) {
      if (slotId === 'research') {
        // Determine which track this crew contributes to (for now, rotate based on crew)
        // Simple distribution: cycle through tracks
        const crewIndex = awakeCrewIds.indexOf(crewId as CrewMemberId);
        const trackIndex = crewIndex % 3;
        const track = ['engineering', 'biology', 'psionics'][trackIndex] as 'engineering' | 'biology' | 'psionics';
        tracksWithResearchers.push(track);
      }
    }

    if (tracksWithResearchers.length > 0) {
      // Distribute points equally among tracks with researchers
      const pointsPerTrack = Math.floor(totalResearchPoints / tracksWithResearchers.length);
      const remainder = totalResearchPoints % tracksWithResearchers.length;

      for (let i = 0; i < tracksWithResearchers.length; i++) {
        const track = tracksWithResearchers[i];
        const bonus = i < remainder ? 1 : 0;
        updatedResearchPoints[track] += pointsPerTrack + bonus;
      }
    }
  }

  const updatedCrewRunsParticipated = { ...meta.crewRunsParticipated };
  const updatedCrewLevels = { ...meta.crewLevels };
  const leveledUpCrew: Array<{ id: CrewMemberId; newLevel: number }> = [];

  for (const crewId of awakeCrewIds) {
    // Increment runs participated
    const currentRuns = updatedCrewRunsParticipated[crewId] ?? 0;
    const newRuns = currentRuns + 1;
    updatedCrewRunsParticipated[crewId] = newRuns;

    // Check for level up: L2 at 3 runs, L3 at 8 runs
    const currentLevel = updatedCrewLevels[crewId] ?? 1;
    let newLevel = currentLevel;
    if (newRuns >= 8) {
      newLevel = 3;
    } else if (newRuns >= 3) {
      newLevel = 2;
    }
    if (newLevel > currentLevel) {
      updatedCrewLevels[crewId] = newLevel;
      leveledUpCrew.push({ id: crewId, newLevel });
      // Queue crew lore fragment on level up — ONLY when debt is cleared
      const debtWillBeCleared = meta.debt + run.debtIncrease <= 0;
      if (debtWillBeCleared) {
        const loreFragments = CREW_LORE_FRAGMENTS[crewId];
        const fragmentIndex = newLevel - 2; // L2 → fragment 0, L3 → fragment 1
        if (loreFragments && fragmentIndex >= 0 && fragmentIndex < loreFragments.length) {
          pendingLoreFragments.push(loreFragments[fragmentIndex]);
          pendingLoreAttribution = crewId;
        }
      }
    }
  }

  // Compute captain ship bonuses
  const captainBonuses: CrewPassiveEffect[] = [];
  for (const ship of meta.ships) {
    if (ship.status === 'claimed' && ship.captainedBy !== null) {
      const shipDef = SHIP_DEFS.find((s) => s.id === ship.id);
      if (shipDef) {
        captainBonuses.push(shipDef.captainBonus);
        if (shipDef.captainBonusSecondary) {
          captainBonuses.push(shipDef.captainBonusSecondary);
        }
      }
    }
  }
  const captainExtractBonus = captainBonuses.reduce(
    (sum, e) => sum + (e.type === 'extract_bonus' ? e.amount : 0),
    0,
  );
  const captainScavengeBonus = captainBonuses.reduce(
    (sum, e) => sum + (e.type === 'scavenge_bonus' ? e.amount : 0),
    0,
  );
  const captainShieldBonus = captainBonuses.reduce(
    (sum, e) => sum + (e.type === 'shield_start' ? e.amount : 0),
    0,
  );
  const captainVoidEchoOnCollapse = captainBonuses.reduce(
    (sum, e) => sum + (e.type === 'echo_on_collapse' ? e.amount : 0),
    0,
  );

  // Calculate base echo earned (applies to both extract and collapse)
  const echoFromRounds = Math.floor(run.round / 5) * ECHO_PER_5_ROUNDS;

  if (run.phase === 'extracted') {
    // Calculate echo earned on extract (applies to both path and single runs)
    const extractCrewEffects = computeCrewEffects(meta.leadId, meta.companionIds, meta.crewLevels);
    const hw = computeHardwareEffects(meta.equippedItems, run.foundHardware);
    const hwVoidEchoBonus = hw.voidEchoOnExtract;
    const totalEchoEarned = ECHO_PER_EXTRACT_BASE + echoFromRounds + run.voidEchoGain + hwVoidEchoBonus;

    // PATH EXPEDITION: Handle via helper function
    if (isPathRun && expeditionOutcome !== null && runPath) {
      updated = handlePathExpeditionEnd(
        meta,
        run,
        runPath,
        expeditionOutcome,
        totalEchoEarned,
        auditResult,
        mergedDoctrinePoints,
        updatedResearchPoints,
        updatedCrewRunsParticipated,
        updatedCrewLevels,
        captainExtractBonus,
        captainScavengeBonus,
        extractCrewEffects,
        hw,
        pendingLoreFragments,
      );
    } else {
      // SINGLE RUN extract (no path) - legacy handling
      const extractionResult = resolveExtraction(run);
      console.log('[Extraction]', extractionResult.logMessages.join(' | '));

      let shipHaulValue = extractionResult.creditsGained;
      const crewExtractBonus = extractCrewEffects.reduce(
        (sum, e) => sum + (e.type === 'extract_bonus' ? e.amount : 0),
        0,
      );
      const totalExtractBonus = (run.pendingExtractBonusPct ?? 0) + crewExtractBonus + captainExtractBonus + hw.extractBonusFlat;
      if (totalExtractBonus > 0) {
        shipHaulValue = applyExtractionBonuses(shipHaulValue, [totalExtractBonus]);
      }
      
      if (haulDecisions && haulDecisions.length > 0) {
        shipHaulValue += getDeclaredHaulValue(haulDecisions);
      }

      let finalDebt = meta.debt + run.debtIncrease;
      if (auditResult) {
        finalDebt += auditResult.debtPenalty;
      }

      const debtWillBeCleared = (meta.debt - shipHaulValue + run.debtIncrease) <= 0;

      let mergedInventory: SalvageEntry[];
      if (debtWillBeCleared && extractionResult.success) {
        mergedInventory = extractionResult.salvageConverted.reduce(
          (inv, entry) => addSalvage(inv, entry),
          meta.hubInventory,
        );
        if (auditResult) {
          for (const entry of auditResult.cleared) {
            mergedInventory = addSalvage(mergedInventory, entry);
          }
        }
      } else {
        mergedInventory = meta.hubInventory;
      }

      const mergedItemInventory = debtWillBeCleared
        ? [...meta.itemInventory, ...run.itemsFound, ...Object.values(run.foundHardware).filter(Boolean)]
        : meta.itemInventory;

      const mergedLoreFragments = debtWillBeCleared
        ? [...meta.seenLoreFragments, ...run.seenLoreFragments]
        : meta.seenLoreFragments;

      if (debtWillBeCleared && run.seenLoreFragments.length > 0) {
        pendingLoreFragments.push(...run.seenLoreFragments);
      }

      updated = {
        ...meta,
        credits: shipHaulValue,
        voidEcho: meta.voidEcho + totalEchoEarned,
        debt: finalDebt,
        totalExtracts: meta.totalExtracts + 1,
        totalRuns: meta.totalRuns + 1,
        hubInventory: mergedInventory,
        itemInventory: mergedItemInventory,
        seenLoreFragments: mergedLoreFragments,
        powerCells: meta.powerCells + run.powerCellsGained,
        doctrinePoints: mergedDoctrinePoints,
        researchPoints: updatedResearchPoints,
        crewRunsParticipated: updatedCrewRunsParticipated,
        crewLevels: updatedCrewLevels,
        activeRunPath: null,
      };
    }
  } else {
    // COLLAPSE: Handle path-aware collapse
    const isPathRun = runPath !== null && runPath !== undefined;

    // collapsed — compute echo multiplier from void_walker tiers
    const walkerTiers = getPurchasedTiersForBranch(meta.purchasedVoidTiers, 'void_walker');
    const echoMultiplier = walkerTiers.reduce(
      (sum, t) => sum + (t.effect.type === 'echo_multiplier' ? t.effect.value : 0),
      0,
    );
    const baseEchoGain = echoMultiplier > 0 ? run.round * echoMultiplier : 2;

    // Crew echo_on_collapse effects
    const collapseCrewEffects = computeCrewEffects(meta.leadId, meta.companionIds, meta.crewLevels);
    const crewEchoOnCollapse = collapseCrewEffects.reduce(
      (sum, e) => sum + (e.type === 'echo_on_collapse' ? e.amount : 0),
      0,
    );

    // Hardware echo_on_collapse effects
    const collapseHw = computeHardwareEffects(meta.equippedItems, run.foundHardware);
    const hwEchoOnCollapse = collapseHw.voidEchoOnCollapse;

    const totalEchoGain = baseEchoGain + run.voidEchoGain + crewEchoOnCollapse + hwEchoOnCollapse + captainVoidEchoOnCollapse;

    // Check for salvage retention effects on collapse
    // TODO: Add crew/hardware effects for salvage_retention when designed
    // For now, salvage is always lost on collapse (no retention)
    const retainedSalvage: SalvageEntry[] = [];

    // On path collapse: all path resources (credits, salvage, items) are lost
    // Only echo, doctrine points, and crew XP carry forward (death is educational)

    updated = {
      ...meta,
      voidEcho: meta.voidEcho + totalEchoGain,
      debt: meta.debt + run.debtIncrease,
      totalCollapses: meta.totalCollapses + 1,
      totalRuns: meta.totalRuns + 1,
      // Doctrine points accumulated this run are merged into meta
      doctrinePoints: mergedDoctrinePoints,
      // Research points only accumulate on extract
      researchPoints: updatedResearchPoints,
      // Crew advancement: runs participated and level ups (even on collapse, they tried)
      crewRunsParticipated: updatedCrewRunsParticipated,
      crewLevels: updatedCrewLevels,
      // Merge retained salvage into hub inventory (if any)
      hubInventory: retainedSalvage.length > 0
        ? retainedSalvage.reduce((inv, entry) => addSalvage(inv, entry), meta.hubInventory)
        : meta.hubInventory,
      // Clear active run path on collapse - the expedition is over
      activeRunPath: isPathRun ? null : meta.activeRunPath,
    };
  }

  // Apply crew card unlocks for any leveled-up crew members
  updated = applyCrewCardUnlocks(updated, leveledUpCrew);

  // Apply research track unlocks based on accumulated points
  updated = applyResearchUnlocks(updated);

  const processed = processBilling(updated);

  // After billing, zero out credits — they were haul value applied to debt, never the player's
  const finalMeta = { ...processed, credits: 0 };

  // Determine debt-cleared status for callers
  const debtClearedResult: boolean | null = run.phase === 'extracted'
    ? finalMeta.debt <= 0
    : null;

  return { 
    meta: finalMeta, 
    loreFragments: pendingLoreFragments, 
    loreAttributionCrewId: pendingLoreAttribution, 
    debtCleared: debtClearedResult,
    expeditionOutcome,
  };
}

/**
 * Handle path expedition end with different outcomes:
 * - Victory: Merge all path resources, apply bonuses, clear runPath
 * - Ceiling Death/Strike Out: Lose all path resources, keep doctrine points only, clear runPath
 * - Normal End: Keep % of resources based on ships completed, clear runPath
 * - Never modifies meta.debt (expedition-scoped only)
 */
function handlePathExpeditionEnd(
  meta: MetaState,
  run: RunState,
  runPath: RunPath,
  outcome: 'victory' | 'ceiling_death' | 'strike_out' | 'normal' | null,
  totalEchoEarned: number,
  auditResult: AuditResult | undefined,
  mergedDoctrinePoints: Record<DoctrineId, number>,
  updatedResearchPoints: Record<'engineering' | 'biology' | 'psionics', number>,
  updatedCrewRunsParticipated: Partial<Record<CrewMemberId, number>>,
  updatedCrewLevels: Partial<Record<CrewMemberId, number>>,
  captainExtractBonus: number,
  captainScavengeBonus: number,
  extractCrewEffects: CrewPassiveEffect[],
  hw: { voidEchoOnExtract: number; extractBonusFlat: number; voidEchoOnCollapse: number },
  pendingLoreFragments: string[],
): MetaState {
  // RESOLVE EXTRACTION for this ship
  const extractionResult = resolveExtraction(run);
  
  let shipHaulValue = extractionResult.creditsGained;
  const crewExtractBonus = extractCrewEffects.reduce(
    (sum, e) => sum + (e.type === 'extract_bonus' ? e.amount : 0),
    0,
  );
  const totalExtractBonus = crewExtractBonus + captainExtractBonus + hw.extractBonusFlat;
  if (totalExtractBonus > 0) {
    shipHaulValue = applyExtractionBonuses(shipHaulValue, [totalExtractBonus]);
  }

  // Add haul decisions from manifest
  if (run.haulDecisions && run.haulDecisions.length > 0) {
    shipHaulValue += getDeclaredHaulValue(run.haulDecisions);
  }

  switch (outcome) {
    case 'victory': {
      // FULL VICTORY: Merge everything including path accumulated resources
      // This ship's salvage
      let mergedInventory = extractionResult.salvageConverted.reduce(
        (inv, entry) => addSalvage(inv, entry),
        meta.hubInventory,
      );
      // Add path salvage
      mergedInventory = runPath.pathSalvage.reduce(
        (inv, entry) => addSalvage(inv, entry),
        mergedInventory,
      );
      if (auditResult) {
        for (const entry of auditResult.cleared) {
          mergedInventory = addSalvage(mergedInventory, entry);
        }
      }

      // Merge hardware
      const shipHardware = [...run.itemsFound, ...Object.values(run.foundHardware).filter(Boolean) as string[]];
      const mergedItemInventory = [...meta.itemInventory, ...runPath.pathItemsFound, ...shipHardware];

      // Merge lore fragments
      const mergedLoreFragments = [...meta.seenLoreFragments, ...run.seenLoreFragments];
      if (run.seenLoreFragments.length > 0) {
        pendingLoreFragments.push(...run.seenLoreFragments);
      }

      // Total credits: path credits + ship haul
      const totalCredits = runPath.pathCredits + shipHaulValue;

      return {
        ...meta,
        credits: totalCredits,
        voidEcho: meta.voidEcho + totalEchoEarned,
        totalExtracts: meta.totalExtracts + 1,
        totalRuns: meta.totalRuns + 1,
        hubInventory: mergedInventory,
        itemInventory: mergedItemInventory,
        seenLoreFragments: mergedLoreFragments,
        powerCells: meta.powerCells + run.powerCellsGained,
        doctrinePoints: mergedDoctrinePoints,
        researchPoints: updatedResearchPoints,
        crewRunsParticipated: updatedCrewRunsParticipated,
        crewLevels: updatedCrewLevels,
        // Expedition debt cleared - victory!
        debtClearedCount: meta.debtClearedCount + 1,
        handicapEnabled: meta.debtClearedCount >= 1 || meta.handicapEnabled,
        activeRunPath: null, // Clear runPath
      };
    }

    case 'ceiling_death':
    case 'strike_out': {
      // EXPEDITION FAILED: Lose all path resources
      // Only echo, doctrine points, and crew XP carry forward (death is educational)
      // Credits, salvage, items from path are lost
      // This ship's haul is also lost (you died before returning)

      return {
        ...meta,
        voidEcho: meta.voidEcho + totalEchoEarned,
        totalCollapses: meta.totalCollapses + 1,
        totalRuns: meta.totalRuns + 1,
        // Doctrine points already merged above
        doctrinePoints: mergedDoctrinePoints,
        researchPoints: updatedResearchPoints,
        crewRunsParticipated: updatedCrewRunsParticipated,
        crewLevels: updatedCrewLevels,
        // Hub inventory unchanged (path resources lost)
        hubInventory: meta.hubInventory,
        itemInventory: meta.itemInventory,
        activeRunPath: null, // Clear runPath
      };
    }

    case 'normal': {
      // NORMAL END: All 6 ships completed but no victory or failure
      // Keep percentage of resources based on ships completed / debt paid
      const shipsCompleted = runPath.shipsCompleted;
      const completionPercent = shipsCompleted / 6;

      // Keep % of path credits
      const keptCredits = Math.floor(runPath.pathCredits * completionPercent);

      // Keep % of path salvage
      const keptSalvage: SalvageEntry[] = runPath.pathSalvage.map(entry => ({
        ...entry,
        quantity: Math.floor(entry.quantity * completionPercent),
      })).filter(e => e.quantity > 0);

      let mergedInventory = meta.hubInventory;
      if (keptSalvage.length > 0) {
        mergedInventory = keptSalvage.reduce(
          (inv, entry) => addSalvage(inv, entry),
          mergedInventory,
        );
      }

      // Keep % of hardware items
      const keptHardwareCount = Math.floor(runPath.pathItemsFound.length * completionPercent);
      const keptHardware = runPath.pathItemsFound.slice(0, keptHardwareCount);
      const mergedItemInventory = [...meta.itemInventory, ...keptHardware];

      // This ship's salvage is still converted (you extracted from it)
      mergedInventory = extractionResult.salvageConverted.reduce(
        (inv, entry) => addSalvage(inv, entry),
        mergedInventory,
      );

      return {
        ...meta,
        credits: keptCredits + shipHaulValue,
        voidEcho: meta.voidEcho + totalEchoEarned,
        totalExtracts: meta.totalExtracts + 1,
        totalRuns: meta.totalRuns + 1,
        hubInventory: mergedInventory,
        itemInventory: mergedItemInventory,
        seenLoreFragments: [...meta.seenLoreFragments, ...run.seenLoreFragments],
        powerCells: meta.powerCells + run.powerCellsGained,
        doctrinePoints: mergedDoctrinePoints,
        researchPoints: updatedResearchPoints,
        crewRunsParticipated: updatedCrewRunsParticipated,
        crewLevels: updatedCrewLevels,
        activeRunPath: null, // Clear runPath
      };
    }

    default:
      // ONGOING - should not reach here via this function
      // But as fallback, return meta unchanged
      return meta;
  }
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
 * Unlock death-lesson cards at collapse milestones.
 * These are underdog cards that are stronger when you're behind.
 */
export function applyDeathLessonUnlocks(meta: MetaState): MetaState {
  let updated = meta;
  const collapses = meta.totalCollapses;
  const hasCard = (id: string) => updated.unlockedCards.includes(id);
  const addCard = (id: string) => {
    if (!hasCard(id)) {
      updated = { ...updated, unlockedCards: [...updated.unlockedCards, id] };
    }
  };

  // Milestone 1: 3 collapses → void_siphon
  if (collapses >= 3) addCard('void_siphon');

  // Milestone 2: 7 collapses → bitter_experience
  if (collapses >= 7) addCard('bitter_experience');

  // Milestone 3: 12 collapses → scrap_memory
  if (collapses >= 12) addCard('scrap_memory');

  // Milestone 4: 20 collapses → defiant_last_stand
  if (collapses >= 20) addCard('defiant_last_stand');

  // Milestone 5: 30 collapses → survivors_instinct
  if (collapses >= 30) addCard('survivors_instinct');

  return updated;
}
