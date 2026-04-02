// Extract-moment audit resolution logic.
// Pure functions — no side effects, no game state imports.

import type { SalvageTier } from '../content/salvage';
import type { HaulDecision, AuditResult } from '../types/state';
import {
  AUDIT_DETECTION_SCRAP,
  AUDIT_DETECTION_COMPONENTS,
  AUDIT_DETECTION_MEDTECH,
  AUDIT_DETECTION_RELIC,
  AUDIT_PENALTY_MULTIPLIER,
  SMUGGLER_DOCTRINE_AUDIT_BONUS,
} from '../config/constants';

/**
 * Get the base detection rate for a salvage tier.
 * Returns probability 0–1.
 */
function getBaseDetectionRate(tier: SalvageTier): number {
  switch (tier) {
    case 'relic':
      return AUDIT_DETECTION_RELIC;
    case 'medtech':
      return AUDIT_DETECTION_MEDTECH;
    case 'components':
      return AUDIT_DETECTION_COMPONENTS;
    case 'scrap':
      return AUDIT_DETECTION_SCRAP;
    default:
      return 0;
  }
}

/**
 * Calculate final detection probability for an item.
 *
 * @param tier - Salvage tier of the item
 * @param auditReduction - Accumulated audit reduction from cards/crew (0-100)
 * @param smugglerBonus - Whether smuggler doctrine is locked (-20% flat)
 * @returns Final detection probability 0–1, clamped to [0, 0.95]
 */
export function getAuditDetectionRate(
  tier: SalvageTier,
  auditReduction: number,
  smugglerBonus: boolean,
): number {
  const baseRate = getBaseDetectionRate(tier);

  // Convert audit reduction from percentage points to decimal
  const reductionDecimal = auditReduction / 100;

  // Apply reduction
  let finalRate = baseRate - reductionDecimal;

  // Apply smuggler doctrine bonus if active
  if (smugglerBonus) {
    finalRate -= SMUGGLER_DOCTRINE_AUDIT_BONUS / 100;
  }

  // Clamp: never negative, never guaranteed (max 95%)
  return Math.max(0, Math.min(0.95, finalRate));
}

/**
 * Resolve the audit for a set of haul decisions.
 *
 * Only 'smuggle' decisions are subject to audit detection.
 * 'declare' decisions are always cleared (they go to Nexus Corp legally).
 *
 * @param decisions - Array of haul decisions from extract manifest
 * @param auditReduction - Accumulated audit reduction (0-100)
 * @param smugglerBonus - Whether smuggler doctrine bonus applies
 * @returns AuditResult with caught items, cleared items, and debt penalty
 */
/**
 * Convert a HaulDecision to a SalvageEntry format.
 */
function toSalvageEntry(decision: HaulDecision): import('../content/salvage').SalvageEntry {
  return {
    tier: decision.itemTier,
    quantity: decision.quantity,
    valueEach: decision.valueEach,
  };
}

export function resolveAudit(
  decisions: HaulDecision[],
  auditReduction: number,
  smugglerBonus: boolean,
): AuditResult {
  const caught: import('../content/salvage').SalvageEntry[] = [];
  const cleared: import('../content/salvage').SalvageEntry[] = [];
  let debtPenalty = 0;

  for (const decision of decisions) {
    if (decision.action === 'declare') {
      // Declared items are always cleared (legally handed over)
      cleared.push(toSalvageEntry(decision));
      continue;
    }

    // Smuggled items: roll for detection
    const detectionRate = getAuditDetectionRate(
      decision.itemTier,
      auditReduction,
      smugglerBonus,
    );

    const roll = Math.random();

    if (roll < detectionRate) {
      // Caught! Item is lost and adds debt penalty
      caught.push(toSalvageEntry(decision));
      const itemValue = decision.valueEach * decision.quantity;
      debtPenalty += Math.floor(itemValue * AUDIT_PENALTY_MULTIPLIER);
    } else {
      // Cleared! Item makes it to the station
      cleared.push(toSalvageEntry(decision));
    }
  }

  return {
    caught,
    cleared,
    debtPenalty,
  };
}

/**
 * Calculate total declared haul value from decisions.
 *
 * Sums valueEach × quantity for all 'declare' decisions.
 * This is the value that gets applied toward debt via billing.
 *
 * @param decisions - Array of haul decisions
 * @returns Total declared value in credits
 */
export function getDeclaredHaulValue(decisions: HaulDecision[]): number {
  return decisions
    .filter((d) => d.action === 'declare')
    .reduce((total, d) => total + d.valueEach * d.quantity, 0);
}
