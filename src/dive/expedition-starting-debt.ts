// Expedition starting debt calculator — computes initial debt based on meta choices.

import type { MetaState } from '../types/state';
import type { ShipNodeType } from '../types/state';
import {
  EXPEDITION_DEBT_BASE,
  EXPEDITION_DEBT_PER_CREW,
  SHIP_DEBT_MULTIPLIER,
} from '../config/constants';
import type { ModuleId } from '../content/modules';
import type { AssignmentSlotId } from '../content/crew-assignments';
import type { CrewMemberId } from '../content/crew';
import { RESEARCH_DEBT_REDUCTION_BY_LEVEL } from '../progression/research-tracks';

/** Minimum possible expedition debt (500k). */
const MINIMUM_EXPEDITION_DEBT = 500_000;

/** Module flat debt reductions per level (cumulative). */
const MODULE_DEBT_REDUCTION: Partial<Record<ModuleId, number>> = {
  command_deck: 100_000, // -100k per level
  market_node: 50_000,   // -50k per level
};

/** Assignment debt reduction bonuses. */
const ASSIGNMENT_DEBT_REDUCTION: Partial<Record<AssignmentSlotId, number>> = {
  market_ops: 100_000, // Market Ops reduces debt by 100k
  research: 50_000,    // Research Lab reduces debt by 50k
};

/** Debt modifier breakdown for UI display. */
export interface DebtModifierBreakdown {
  base: number;
  crewCount: number;
  crewCost: number;
  shipMultiplier: number;
  subtotalBeforeMultipliers: number;
  subtotalAfterShipMultiplier: number;
  researchReductionPct: number;
  researchReductionAmount: number;
  moduleReductionAmount: number;
  assignmentReductionAmount: number;
  totalReductionAmount: number;
  calculatedDebt: number;
  finalDebt: number;
  minimumEnforced: boolean;
}

/**
 * Calculate the starting expedition debt based on meta state and ship type.
 *
 * Formula:
 * - Base: 2M
 * - +500k per awake crew
 * - × ship multiplier (STANDARD=1.0, ELITE=1.15, MINIBOSS=1.3, BOSS=1.5)
 * - - research debt reduction % (based on max research unlock level)
 * - - module flat reductions
 * - - assignment bonuses
 * - Minimum: 500k
 */
export function calculateStartingDebt(
  meta: MetaState,
  shipType: ShipNodeType,
): number {
  const breakdown = getDebtModifiers(meta, shipType);
  return breakdown.finalDebt;
}

/**
 * Get detailed debt modifier breakdown for UI display.
 */
export function getDebtModifiers(
  meta: MetaState,
  shipType: ShipNodeType,
): DebtModifierBreakdown {
  // Count awake crew (lead + companions)
  const awakeCrewIds: string[] = [];
  if (meta.leadId) awakeCrewIds.push(meta.leadId);
  if (meta.companionIds) {
    awakeCrewIds.push(...meta.companionIds);
  }
  const crewCount = awakeCrewIds.length;

  // Calculate crew cost
  const crewCost = crewCount * EXPEDITION_DEBT_PER_CREW;

  // Get ship multiplier
  const shipMultiplier = getShipMultiplier(shipType);

  // Calculate subtotals
  const subtotalBeforeMultipliers = EXPEDITION_DEBT_BASE + crewCost;
  const subtotalAfterShipMultiplier = Math.floor(
    subtotalBeforeMultipliers * shipMultiplier,
  );

  // Calculate research reduction (based on max unlock level across all tracks)
  const maxResearchLevel = getMaxResearchLevel(meta);
  const researchReductionPct = RESEARCH_DEBT_REDUCTION_BY_LEVEL[maxResearchLevel] ?? 0;
  const researchReductionAmount = Math.floor(
    subtotalAfterShipMultiplier * researchReductionPct,
  );

  // Calculate module reductions
  let moduleReductionAmount = 0;
  for (const [moduleId, reductionPerLevel] of Object.entries(MODULE_DEBT_REDUCTION)) {
    const level = meta.moduleLevels[moduleId as ModuleId] ?? 0;
    moduleReductionAmount += level * reductionPerLevel;
  }

  // Calculate assignment reductions
  let assignmentReductionAmount = 0;
  for (const crewId of awakeCrewIds) {
    const assignment = meta.crewAssignments[crewId as CrewMemberId];
    if (assignment && ASSIGNMENT_DEBT_REDUCTION[assignment]) {
      assignmentReductionAmount += ASSIGNMENT_DEBT_REDUCTION[assignment]!;
    }
  }

  // Total reductions
  const totalReductionAmount =
    researchReductionAmount + moduleReductionAmount + assignmentReductionAmount;

  // Calculate final debt
  let calculatedDebt = subtotalAfterShipMultiplier - totalReductionAmount;

  // Enforce minimum
  const minimumEnforced = calculatedDebt < MINIMUM_EXPEDITION_DEBT;
  const finalDebt = minimumEnforced ? MINIMUM_EXPEDITION_DEBT : calculatedDebt;

  return {
    base: EXPEDITION_DEBT_BASE,
    crewCount,
    crewCost,
    shipMultiplier,
    subtotalBeforeMultipliers,
    subtotalAfterShipMultiplier,
    researchReductionPct,
    researchReductionAmount,
    moduleReductionAmount,
    assignmentReductionAmount,
    totalReductionAmount,
    calculatedDebt,
    finalDebt,
    minimumEnforced,
  };
}

/**
 * Get the debt multiplier for a ship type.
 */
function getShipMultiplier(shipType: ShipNodeType): number {
  switch (shipType) {
    case 'standard':
      return SHIP_DEBT_MULTIPLIER.STANDARD;
    case 'elite':
      return SHIP_DEBT_MULTIPLIER.ELITE;
    case 'miniboss':
      return SHIP_DEBT_MULTIPLIER.MINIBOSS;
    case 'boss':
      return SHIP_DEBT_MULTIPLIER.BOSS;
    case 'shop':
      // Shop nodes use standard multiplier
      return SHIP_DEBT_MULTIPLIER.STANDARD;
    default:
      return SHIP_DEBT_MULTIPLIER.STANDARD;
  }
}

/**
 * Get the maximum research unlock level across all tracks (0-3).
 */
function getMaxResearchLevel(meta: MetaState): number {
  const levels = Object.values(meta.researchUnlockLevel);
  if (levels.length === 0) return 0;
  return Math.max(0, ...levels);
}

/**
 * Format debt amount for display (e.g., 2500000 → "₡2.5M").
 */
export function formatDebt(amount: number): string {
  if (amount >= 1_000_000) {
    return `₡${(amount / 1_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000) {
    return `₡${Math.floor(amount / 1_000)}k`;
  }
  return `₡${amount}`;
}

/**
 * Format debt with full precision for detailed display.
 */
export function formatDebtFull(amount: number): string {
  return `₡${amount.toLocaleString()}`;
}
