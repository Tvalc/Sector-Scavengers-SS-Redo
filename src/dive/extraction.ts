import type { RunState } from '../types/state';
import type { SalvageEntry, SalvageTier } from '../content/salvage';
import { SALVAGE_DEFS } from '../content/salvage';
import { applyHullDamage } from './card-effects/hull';

/**
 * Calculate base value of salvage at Company rates.
 * Sums (quantity × valueEach) for all salvage entries.
 */
export function calculateSalvageValue(salvage: SalvageEntry[]): number {
  return salvage.reduce((total, entry) => {
    return total + (entry.quantity * entry.valueEach);
  }, 0);
}

/**
 * Apply extraction bonuses as percentage multipliers.
 * Bonuses are additive (e.g., [0.10, 0.15] = +25% total).
 * Returns final value after bonuses.
 */
export function applyExtractionBonuses(baseValue: number, bonuses: number[]): number {
  const totalBonus = bonuses.reduce((sum, bonus) => sum + bonus, 0);
  const multiplier = 1 + totalBonus;
  return Math.floor(baseValue * multiplier);
}

/**
 * Roll for hull breach during extraction.
 * Base 10% + 3% per round spent in the ship.
 * @returns Object with breachOccurred and damageAmount
 */
export function rollExtractionBreach(round: number): { breachOccurred: boolean; damageAmount: number } {
  const baseBreachChance = 0.10;
  const breachChancePerRound = 0.03;
  const breachChance = baseBreachChance + (round * breachChancePerRound);

  const breachOccurred = Math.random() < breachChance;

  // Damage range: 10-25 hull
  const damageAmount = breachOccurred ? Math.floor(Math.random() * 16) + 10 : 0;

  return { breachOccurred, damageAmount };
}

/**
 * Result of extraction resolution.
 */
export interface ExtractionResult {
  /** Whether extraction succeeded (false if hull reached 0) */
  success: boolean;
  /** Total credits gained from salvage conversion */
  creditsGained: number;
  /** Base value before bonuses */
  baseValue: number;
  /** Bonus percentage applied */
  bonusPercent: number;
  /** Salvage that was successfully extracted and converted */
  salvageConverted: SalvageEntry[];
  /** Salvage lost due to collapse (empty if success) */
  salvageLost: SalvageEntry[];
  /** Whether a hull breach occurred during extraction */
  breachOccurred: boolean;
  /** Hull damage taken from breach (0 if no breach) */
  breachDamage: number;
  /** Final hull after extraction */
  finalHull: number;
  /** Log messages for the extraction event */
  logMessages: string[];
}

/**
 * Resolve the extraction phase for a run.
 * Handles breach chance, damage, collapse check, and salvage conversion.
 * @param run - Current run state
 * @returns ExtractionResult with all details
 */
export function resolveExtraction(run: RunState): ExtractionResult {
  const logMessages: string[] = [];

  // Roll for breach
  const { breachOccurred, damageAmount } = rollExtractionBreach(run.round);
  let finalHull = run.hull;
  let success = true;

  if (breachOccurred) {
    logMessages.push(`Hull breach during extraction! −${damageAmount} hull`);
    finalHull = Math.max(0, run.hull - damageAmount);

    // Check for collapse
    if (finalHull <= 0) {
      success = false;
      logMessages.push('Extraction failed! Run collapsed!');
    }
  }

  // Calculate salvage value
  const baseValue = calculateSalvageValue(run.salvage);

  // Get extraction bonuses from run state
  const bonuses: number[] = [];
  if (run.pendingExtractBonusPct > 0) {
    bonuses.push(run.pendingExtractBonusPct);
  }

  // Apply bonuses if extraction succeeded
  let creditsGained = 0;
  if (success) {
    creditsGained = applyExtractionBonuses(baseValue, bonuses);
    logMessages.push(`Extracted ${run.salvage.length} salvage types`);
    logMessages.push(`Base value: ${baseValue.toLocaleString()}₡`);
    if (bonuses.length > 0) {
      const bonusPercent = Math.round(bonuses.reduce((a, b) => a + b, 0) * 100);
      logMessages.push(`Extraction bonus: +${bonusPercent}%`);
    }
    logMessages.push(`Total credits: ${creditsGained.toLocaleString()}₡`);
  }

  return {
    success,
    creditsGained,
    baseValue,
    bonusPercent: bonuses.reduce((a, b) => a + b, 0),
    salvageConverted: success ? [...run.salvage] : [],
    salvageLost: success ? [] : [...run.salvage],
    breachOccurred,
    breachDamage: damageAmount,
    finalHull,
    logMessages,
  };
}

/**
 * Quick extraction check - just determines if extraction succeeds without full resolution.
 * Used for UI previews and quick checks.
 */
export function canExtractSafely(run: RunState): {
  canExtract: boolean;
  breachChance: number;
  estimatedValue: number;
  estimatedBonus: number;
} {
  const baseBreachChance = 0.10;
  const breachChancePerRound = 0.03;
  const breachChance = baseBreachChance + (run.round * breachChancePerRound);

  // Check if hull is high enough to survive max breach damage
  const maxBreachDamage = 25;
  const canExtract = run.hull > maxBreachDamage * 0.5; // Conservative estimate

  const baseValue = calculateSalvageValue(run.salvage);
  const estimatedBonus = run.pendingExtractBonusPct;
  const estimatedValue = applyExtractionBonuses(baseValue, [estimatedBonus]);

  return {
    canExtract,
    breachChance,
    estimatedValue,
    estimatedBonus,
  };
}

/**
 * Format salvage for display in extraction UI.
 */
export function formatSalvageForDisplay(salvage: SalvageEntry[]): string {
  if (salvage.length === 0) return 'No salvage';

  return salvage
    .map((entry) => {
      const def = SALVAGE_DEFS[entry.tier];
      const value = entry.quantity * entry.valueEach;
      return `${entry.quantity} ${def.label} (${value.toLocaleString()}₡)`;
    })
    .join(', ');
}

/**
 * Calculate extraction risk level for UI display.
 */
export function getExtractionRiskLevel(round: number, currentHull: number): 'low' | 'medium' | 'high' | 'critical' {
  const baseBreachChance = 0.10;
  const breachChancePerRound = 0.03;
  const breachChance = baseBreachChance + (round * breachChancePerRound);

  if (breachChance >= 0.40 || currentHull < 20) return 'critical';
  if (breachChance >= 0.25 || currentHull < 35) return 'high';
  if (breachChance >= 0.15 || currentHull < 50) return 'medium';
  return 'low';
}
