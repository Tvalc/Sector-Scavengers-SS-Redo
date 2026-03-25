// Hardware item definitions — equippable gear that applies deterministic run effects.

export type ItemSlot = 'hull' | 'scanner' | 'utility';
export type ItemRarity = 'common' | 'uncommon' | 'rare';

export type ItemEffect =
  | { type: 'breach_chance_down';    reduction: number }
  | { type: 'extract_bonus_flat';    amount: number }
  | { type: 'starting_energy_bonus'; amount: number }
  | { type: 'scavenge_bonus_flat';   amount: number }
  | { type: 'hull_max_bonus';        amount: number }
  | { type: 'shield_start_bonus';    amount: number };

export interface HardwareItem {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  effect: ItemEffect;
  description: string;
}

export const HARDWARE_ITEMS: HardwareItem[] = [
  // ── Hull slot ──────────────────────────────────────────────────────────────
  {
    id: 'hull_plating',
    name: 'Hull Plating',
    slot: 'hull',
    rarity: 'common',
    effect: { type: 'breach_chance_down', reduction: 0.05 },
    description: 'Reinforced plating. Danger chances −5%.',
  },
  {
    id: 'ablative_armor',
    name: 'Ablative Armor',
    slot: 'hull',
    rarity: 'uncommon',
    effect: { type: 'breach_chance_down', reduction: 0.10 },
    description: 'Ablative layers. Danger chances −10%.',
  },
  {
    id: 'reactive_shell',
    name: 'Reactive Shell',
    slot: 'hull',
    rarity: 'rare',
    effect: { type: 'hull_max_bonus', amount: 20 },
    description: 'Hull capacity +20.',
  },

  // ── Scanner slot ───────────────────────────────────────────────────────────
  {
    id: 'basic_scanner',
    name: 'Basic Scanner',
    slot: 'scanner',
    rarity: 'common',
    effect: { type: 'scavenge_bonus_flat', amount: 10 },
    description: 'Basic scanner. Scavenge +\u20a110.',
  },
  {
    id: 'deep_scanner',
    name: 'Deep Scanner',
    slot: 'scanner',
    rarity: 'uncommon',
    effect: { type: 'scavenge_bonus_flat', amount: 25 },
    description: 'Deep scanner. Scavenge +\u20a125.',
  },
  {
    id: 'void_sensor',
    name: 'Void Sensor',
    slot: 'scanner',
    rarity: 'rare',
    effect: { type: 'breach_chance_down', reduction: 0.08 },
    description: 'Void sensor. Danger chances −8%.',
  },

  // ── Utility slot ───────────────────────────────────────────────────────────
  {
    id: 'power_cell',
    name: 'Power Cell',
    slot: 'utility',
    rarity: 'common',
    effect: { type: 'starting_energy_bonus', amount: 0 },
    description: 'Spare power cell. No passive yet.',
  },
  {
    id: 'extraction_rig',
    name: 'Extraction Rig',
    slot: 'utility',
    rarity: 'uncommon',
    effect: { type: 'extract_bonus_flat', amount: 80 },
    description: 'Extraction rig. Extract +\u20a180.',
  },
  {
    id: 'shield_emitter',
    name: 'Shield Emitter',
    slot: 'utility',
    rarity: 'rare',
    effect: { type: 'shield_start_bonus', amount: 2 },
    description: 'Shield emitter. Start each dive with +2 shields.',
  },
];

export function getItemById(id: string): HardwareItem | undefined {
  return HARDWARE_ITEMS.find((item) => item.id === id);
}

export const ITEM_RARITY_COLORS: Record<ItemRarity, string> = {
  common:   '#a0aec0',
  uncommon: '#63b3ed',
  rare:     '#f6e05e',
};
