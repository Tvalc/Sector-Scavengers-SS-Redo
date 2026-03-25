// Aggregates station module upgrade effects across all purchased levels.

import { ModuleId, MODULE_DEFS } from '../content/modules';

export interface AggregatedModuleEffects {
  /** Percentage bonus applied to salvage sale value (additive across levels). */
  saleBonusPct: number;
  /** Total power-cell reduction for waking crew (min effective cost: 1). */
  wakeDiscount: number;
  /** Extra repair progress steps per run (stacks with base +1). */
  repairSpeedBonus: number;
  /** Extra energy capacity above MAX_ENERGY. */
  energyCapBonus: number;
  /** Flat danger-chance reduction (0–1 range, stacks additively). */
  dangerChanceReduction: number;
  /** Percentage reduction of recharge cost (additive across levels). */
  marketDiscountPct: number;
}

const ZERO: AggregatedModuleEffects = {
  saleBonusPct:          0,
  wakeDiscount:          0,
  repairSpeedBonus:      0,
  energyCapBonus:        0,
  dangerChanceReduction: 0,
  marketDiscountPct:     0,
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
        case 'sale_bonus_pct':
          result.saleBonusPct += e.pct;
          break;
        case 'wake_discount':
          result.wakeDiscount += e.cells;
          break;
        case 'repair_speed':
          result.repairSpeedBonus += e.bonus;
          break;
        case 'energy_cap_bonus':
          result.energyCapBonus += e.amount;
          break;
        case 'danger_chance_reduction':
          result.dangerChanceReduction += e.amount;
          break;
        case 'market_discount':
          result.marketDiscountPct += e.pct;
          break;
      }
    }
  }

  return result;
}
