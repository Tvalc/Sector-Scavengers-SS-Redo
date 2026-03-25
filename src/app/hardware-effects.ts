// Aggregates equipped hardware item effects into a single flat struct
// consumed by game-store.ts at START_DIVE and dispatchPlayCard time.

import { ItemSlot } from '../content/hardware';
import { getItemById } from '../content/hardware';

export interface HardwareEffects {
  /** Flat reduction applied to each danger's trigger chance (0–1 range). */
  breachChanceReduction: number;
  /** Flat credits added on a successful extract. */
  extractBonusFlat: number;
  /** Flat credits added to every scavenge-type card yield. */
  scavengeBonusFlat: number;
  /** Extra starting hull above the base 100. Capped at 150 total. */
  hullMaxBonus: number;
  /** Extra shield charges at the start of each dive. */
  shieldStartBonus: number;
  /** Extra energy added to the pool before spending 1 for the dive cost. */
  startingEnergyBonus: number;
}

const ZERO_EFFECTS: HardwareEffects = {
  breachChanceReduction: 0,
  extractBonusFlat:      0,
  scavengeBonusFlat:     0,
  hullMaxBonus:          0,
  shieldStartBonus:      0,
  startingEnergyBonus:   0,
};

/**
 * Compute the combined passive effects of all currently-equipped hardware.
 * Unequipped slots (null) are silently skipped.
 */
export function computeHardwareEffects(
  equippedItems: Record<ItemSlot, string | null>,
): HardwareEffects {
  const result: HardwareEffects = { ...ZERO_EFFECTS };

  const slots: ItemSlot[] = ['hull', 'scanner', 'utility'];
  for (const slot of slots) {
    const itemId = equippedItems[slot];
    if (itemId === null) continue;
    const item = getItemById(itemId);
    if (!item) continue;

    const e = item.effect;
    switch (e.type) {
      case 'breach_chance_down':
        result.breachChanceReduction += e.reduction;
        break;
      case 'extract_bonus_flat':
        result.extractBonusFlat += e.amount;
        break;
      case 'scavenge_bonus_flat':
        result.scavengeBonusFlat += e.amount;
        break;
      case 'hull_max_bonus':
        result.hullMaxBonus += e.amount;
        break;
      case 'shield_start_bonus':
        result.shieldStartBonus += e.amount;
        break;
      case 'starting_energy_bonus':
        result.startingEnergyBonus += e.amount;
        break;
    }
  }

  return result;
}
