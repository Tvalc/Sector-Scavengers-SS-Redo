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
  /** When true, scavenge-type hull damage chance is halved when botsDeployed > 0. */
  botDamageReduction: boolean;
  /** Flat reduction to danger chances when hull > hullHighDangerThreshold. Summed from all items. */
  hullHighDangerReduction: number;
  /** Hull threshold above which hullHighDangerReduction applies. Lowest (most permissive) value from all items. Infinity if none. */
  hullHighDangerThreshold: number;
  /** Bonus shield charges added to all shield-granting cards. */
  shieldGainBonus: number;
  // Phase 6 new hardware effects
  /** When true, upgrade card deals no hull damage. */
  upgradeNoHullCost: boolean;
  /** Extra credits per bot deployed on extract. */
  botCreditBonusPerBot: number;
  /** Hull restored when a shield blocks damage. */
  hullOnShieldBlock: number;
  /** Extra danger reduction when shields >= threshold. */
  shieldDangerReduction: number;
  /** Shield threshold for shieldDangerReduction to apply. */
  shieldDangerThreshold: number;
  /** VoidEcho gained on each successful extract. */
  voidEchoOnExtract: number;
  /** VoidEcho gained on collapse. */
  voidEchoOnCollapse: number;
  /** VoidEcho at start of each dive. */
  voidEchoStart: number;
}

const ZERO_EFFECTS: HardwareEffects = {
  breachChanceReduction: 0,
  extractBonusFlat:      0,
  scavengeBonusFlat:     0,
  hullMaxBonus:          0,
  shieldStartBonus:      0,
  startingEnergyBonus:   0,
  botDamageReduction:    false,
  hullHighDangerReduction: 0,
  hullHighDangerThreshold: Infinity,
  shieldGainBonus:       0,
  upgradeNoHullCost:    false,
  botCreditBonusPerBot:   0,
  hullOnShieldBlock:      0,
  shieldDangerReduction:  0,
  shieldDangerThreshold:  0,
  voidEchoOnExtract:      0,
  voidEchoOnCollapse:     0,
  voidEchoStart:          0,
};

/**
 * Compute the combined passive effects of all currently-equipped hardware.
 * Unequipped slots (null) are silently skipped.
 *
 * If foundHardware is provided, those items are merged with equipped items.
 * For each slot: if foundHardware has an item AND equippedItems[slot] is null,
 * the found item is used. If both exist, effects stack additively.
 */
export function computeHardwareEffects(
  equippedItems: Record<ItemSlot, string | null>,
  foundHardware?: Partial<Record<ItemSlot, string>>,
): HardwareEffects {
  const result: HardwareEffects = { ...ZERO_EFFECTS };

  const slots: ItemSlot[] = ['hull', 'scanner', 'utility'];
  for (const slot of slots) {
    // Get equipped item (if any)
    const equippedId = equippedItems[slot];
    if (equippedId !== null) {
      const item = getItemById(equippedId);
      if (item) {
        applyEffect(result, item.effect);
      }
    }

    // Get found item (if any) - stacks with equipped
    if (foundHardware && foundHardware[slot]) {
      const foundId = foundHardware[slot];
      const item = foundId ? getItemById(foundId) : undefined;
      if (item) {
        applyEffect(result, item.effect);
      }
    }
  }

  return result;
}

function applyEffect(result: HardwareEffects, e: import('../content/hardware').ItemEffect): void {
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
    case 'bot_damage_reduction':
      result.botDamageReduction = true;
      break;
    case 'hull_high_danger_reduction':
      result.hullHighDangerReduction += e.reduction;
      // Use the lowest threshold (most permissive) across all items
      result.hullHighDangerThreshold = Math.min(result.hullHighDangerThreshold, e.threshold);
      break;
    case 'shield_gain_bonus':
      result.shieldGainBonus += e.amount;
      break;
    // Phase 6 new hardware effects
    case 'upgrade_no_hull_cost':
      result.upgradeNoHullCost = true;
      break;
    case 'bot_credit_bonus_per_bot':
      result.botCreditBonusPerBot += e.amount;
      break;
    case 'hull_on_shield_block':
      result.hullOnShieldBlock += e.amount;
      break;
    case 'shield_gain_and_danger_reduction':
      result.shieldGainBonus += e.shieldBonus;
      result.shieldDangerReduction += e.dangerReductionAtThreshold;
      result.shieldDangerThreshold = e.threshold;
      break;
    case 'void_echo_on_extract':
      result.voidEchoOnExtract += e.amount;
      break;
    case 'void_echo_on_collapse':
      result.voidEchoOnCollapse += e.amount;
      break;
    case 'void_echo_start':
      result.voidEchoStart += e.amount;
      break;
  }
}
