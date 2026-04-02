// Aggregates station module upgrade effects across all purchased levels.

import { ModuleId, MODULE_DEFS } from '../content/modules';

export interface AggregatedModuleEffects {
  /** Audit detection reduction percentage points (e.g., 15 = 15% reduction). */
  auditDetectionReduction: number;
  /** Total power-cell reduction for waking crew (min effective cost: 1). */
  wakeDiscount: number;
  /** Extra repair progress steps per run (stacks with base +1). */
  repairSpeedBonus: number;
  /** Flat danger-chance reduction (0–1 range, stacks additively). */
  dangerChanceReduction: number;
  /** Current level of salvage bay (0 if not built). Used for audit detection reduction. */
  salvageBayLevel: number;
}

const ZERO: AggregatedModuleEffects = {
  auditDetectionReduction: 0,
  wakeDiscount:          0,
  repairSpeedBonus:      0,
  dangerChanceReduction: 0,
  salvageBayLevel:       0,
};

/**
 * Compute cumulative effects from all station module levels.
 * Each module's upgrades are applied from level 1 up to the purchased level.
 */
export function computeModuleEffects(
  moduleLevels: Record<ModuleId, number>,
): AggregatedModuleEffects {
  const result: AggregatedModuleEffects = { ...ZERO };

  for (const def of MODULE_DEFS) {
    const purchasedLevel = moduleLevels[def.id] ?? 0;
    if (purchasedLevel === 0) continue;

    // Sum effects for all levels up to and including purchasedLevel
    for (const upgrade of def.upgrades) {
      if (upgrade.level > purchasedLevel) break;

      const e = upgrade.effect;
      switch (e.type) {
        case 'wake_discount':
          result.wakeDiscount += e.cells;
          break;
        case 'repair_speed':
          result.repairSpeedBonus += e.bonus;
          break;
        case 'danger_chance_reduction':
          result.dangerChanceReduction += e.amount;
          break;
        case 'audit_detection_reduction':
          result.auditDetectionReduction += e.pct;
          break;
      }
    }

    // Track salvage bay level separately
    if (def.id === 'salvage_bay') {
      result.salvageBayLevel = purchasedLevel;
    }
  }

  return result;
}
