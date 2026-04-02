// Hardware item definitions — equippable gear that applies deterministic run effects.

import type { DoctrineId } from './doctrine.ts';
import type { CardRarity } from './cards.ts';
import { EXTENDED_HARDWARE } from './hardware-extended.ts';

export type ItemSlot = 'hull' | 'scanner' | 'utility';
export type ItemRarity = 'common' | 'uncommon' | 'rare';

export type LootPoolDef =
  | { type: 'doctrine'; doctrines: DoctrineId[] }
  | { type: 'card_ids'; ids: string[] }
  | { type: 'rarity'; rarities: CardRarity[] }
  | { type: 'all_eligible' };

export type ItemEffect =
  | { type: 'breach_chance_down';    reduction: number }
  | { type: 'extract_bonus_flat';    amount: number }
  | { type: 'starting_energy_bonus'; amount: number }
  | { type: 'scavenge_bonus_flat';   amount: number }
  | { type: 'hull_max_bonus';        amount: number }
  | { type: 'shield_start_bonus';    amount: number }
  | { type: 'bot_damage_reduction' }
  | { type: 'hull_high_danger_reduction'; threshold: number; reduction: number }
  | { type: 'shield_gain_bonus'; amount: number }
  | { type: 'upgrade_no_hull_cost' }
  | { type: 'bot_credit_bonus_per_bot'; amount: number }
  | { type: 'hull_on_shield_block'; amount: number }
  | { type: 'shield_gain_and_danger_reduction'; shieldBonus: number; dangerReductionAtThreshold: number; threshold: number }
  | { type: 'void_echo_on_extract'; amount: number }
  | { type: 'void_echo_on_collapse'; amount: number }
  | { type: 'void_echo_start'; amount: number }
  | { type: 'hull_regen_per_round'; amount: number }
  | { type: 'danger_reduction_at_hull'; threshold: number; reduction: number }
  | { type: 'scavenge_danger_reduction'; amount: number }
  | { type: 'relic_bonus_chance'; chance: number };

export interface HardwareItem {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  effect: ItemEffect;
  description: string;
  /** Which cards this hardware enables as findable loot during dives. */
  lootPool?: LootPoolDef;
}

export const HARDWARE_ITEMS: HardwareItem[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // BASE HARDWARE (12 items)
  // ═══════════════════════════════════════════════════════════════════════════
  // ── Hull slot ──────────────────────────────────────────────────────────────
  {
    id: 'hull_plating',
    name: 'Hull Plating',
    slot: 'hull',
    rarity: 'common',
    effect: { type: 'breach_chance_down', reduction: 0.05 },
    description: 'Reinforced plating. Danger chances −5%.',
    lootPool: { type: 'doctrine', doctrines: ['cooperative'] },
  },
  {
    id: 'ablative_armor',
    name: 'Ablative Armor',
    slot: 'hull',
    rarity: 'uncommon',
    effect: { type: 'breach_chance_down', reduction: 0.10 },
    description: 'Ablative layers. Danger chances −10%.',
    lootPool: { type: 'doctrine', doctrines: ['cooperative', 'corporate'] },
  },
  {
    id: 'reactive_shell',
    name: 'Reactive Shell',
    slot: 'hull',
    rarity: 'rare',
    effect: { type: 'hull_max_bonus', amount: 20 },
    description: 'Hull capacity +20.',
    lootPool: { type: 'all_eligible' },
  },

  // ── Scanner slot ───────────────────────────────────────────────────────────
  {
    id: 'basic_scanner',
    name: 'Basic Scanner',
    slot: 'scanner',
    rarity: 'common',
    effect: { type: 'scavenge_bonus_flat', amount: 500 },
    description: 'Basic scanner. Scavenge +\u20a1500.',
    lootPool: { type: 'doctrine', doctrines: ['smuggler'] },
  },
  {
    id: 'deep_scanner',
    name: 'Deep Scanner',
    slot: 'scanner',
    rarity: 'uncommon',
    effect: { type: 'scavenge_bonus_flat', amount: 1500 },
    description: 'Deep scanner. Scavenge +\u20a11500.',
    lootPool: { type: 'doctrine', doctrines: ['smuggler', 'corporate'] },
  },
  {
    id: 'void_sensor',
    name: 'Void Sensor',
    slot: 'scanner',
    rarity: 'rare',
    effect: { type: 'breach_chance_down', reduction: 0.08 },
    description: 'Void sensor. Danger chances −8%.',
    lootPool: { type: 'all_eligible' },
  },

  // ── Utility slot ───────────────────────────────────────────────────────────
  {
    id: 'power_cell',
    name: 'Power Cell',
    slot: 'utility',
    rarity: 'common',
    effect: { type: 'starting_energy_bonus', amount: 0 },
    description: 'Spare power cell. No passive yet.',
    lootPool: { type: 'card_ids', ids: ['risky_scavenge', 'quick_extract', 'secure_extract'] },
  },
  {
    id: 'shield_recycler',
    name: 'Shield Recycler',
    slot: 'utility',
    rarity: 'uncommon',
    effect: { type: 'shield_gain_bonus', amount: 1 },
    description: 'Recycled shield cells. All shield gains +1 charge.',
    lootPool: { type: 'card_ids', ids: ['shield', 'team_shield', 'mass_shields', 'bulwark', 'shield_wall_prep'] },
  },
  {
    id: 'extraction_rig',
    name: 'Extraction Rig',
    slot: 'utility',
    rarity: 'uncommon',
    effect: { type: 'extract_bonus_flat', amount: 80 },
    description: 'Extraction rig. Extract +\u20a180.',
    lootPool: { type: 'doctrine', doctrines: ['corporate'] },
  },
  {
    id: 'bot_chassis',
    name: 'Bot Chassis',
    slot: 'utility',
    rarity: 'rare',
    effect: { type: 'bot_damage_reduction' },
    description: 'Integrated bot frame. Scavenge hull risk halved when bots are deployed.',
    lootPool: { type: 'card_ids', ids: ['repair_bot', 'scavenge_bot', 'bot_swarm', 'bot_army', 'overclock_bots', 'reinforced_bots', 'bot_empire', 'calculated_scrap', 'overdrive_extract'] },
  },
  {
    id: 'shield_emitter',
    name: 'Shield Emitter',
    slot: 'utility',
    rarity: 'rare',
    effect: { type: 'shield_start_bonus', amount: 2 },
    description: 'Shield emitter. Start each dive with +2 shields.',
    lootPool: { type: 'card_ids', ids: ['shield', 'team_shield', 'mass_shields', 'bulwark', 'shield_wall_prep', 'shield_bash', 'perimeter', 'bulwark_surge', 'fortress_lockdown', 'iron_covenant', 'void_shield'] },
  },

  // ── Hull slot (additional items) ──────────────────────────────────────────
  {
    id: 'bulkhead_plating',
    name: 'Bulkhead Plating',
    slot: 'hull',
    rarity: 'rare',
    effect: { type: 'hull_high_danger_reduction', threshold: 75, reduction: 0.12 },
    description: 'Reinforced bulkheads. Danger chances −12% when hull > 75.',
    lootPool: { type: 'doctrine', doctrines: ['cooperative', 'corporate', 'smuggler'] },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTENDED HARDWARE (38 items — imported from hardware-extended.ts)
  // ═══════════════════════════════════════════════════════════════════════════
  ...EXTENDED_HARDWARE,
];

export function getItemById(id: string): HardwareItem | undefined {
  return HARDWARE_ITEMS.find((item) => item.id === id);
}

export const ITEM_RARITY_COLORS: Record<ItemRarity, string> = {
  common:   '#a0aec0',
  uncommon: '#63b3ed',
  rare:     '#f6e05e',
};
