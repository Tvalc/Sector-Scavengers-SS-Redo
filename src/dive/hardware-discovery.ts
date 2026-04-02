import { ItemSlot, HardwareItem, HARDWARE_ITEMS } from '../content/hardware';
import type { DoctrineId } from '../content/doctrine';

/**
 * Hardware doctrine affinity map.
 * Each hardware item is aligned with a doctrine for weighted drops.
 */
const HARDWARE_DOCTRINE_AFFINITY: Record<string, DoctrineId> = {
  hull_plating: 'cooperative',
  ablative_armor: 'cooperative',
  bulkhead_plating: 'cooperative',
  basic_scanner: 'corporate',
  deep_scanner: 'corporate',
  extraction_rig: 'corporate',
  reactive_shell: 'smuggler',
  void_sensor: 'smuggler',
  shield_emitter: 'cooperative',
  bot_chassis: 'smuggler',
  power_cell: 'smuggler',
};

/**
 * Pick a random hardware item weighted by rarity and doctrine affinity, respecting slot vacancies.
 * Slots already occupied in foundHardware are excluded.
 * Returns null if all slots occupied.
 *
 * @param foundHardware - Already found hardware (occupied slots)
 * @param seededRng - Optional seeded RNG function
 * @param doctrineLocked - Optional locked doctrine for weighted selection (matching doctrine gets 3x weight)
 */
export function pickRandomHardware(
  foundHardware: Partial<Record<ItemSlot, string>>,
  seededRng?: () => number,
  doctrineLocked?: DoctrineId | null,
): HardwareItem | null {
  // Check which slots are vacant
  const occupiedSlots = new Set(Object.keys(foundHardware) as ItemSlot[]);
  const allSlots: ItemSlot[] = ['hull', 'scanner', 'utility'];
  const vacantSlots = allSlots.filter(slot => !occupiedSlots.has(slot));

  if (vacantSlots.length === 0) {
    return null;
  }

  // Filter hardware to only items that fit vacant slots
  const availableItems = HARDWARE_ITEMS.filter(item => vacantSlots.includes(item.slot));

  if (availableItems.length === 0) {
    return null;
  }

  // Group by rarity
  const byRarity = {
    common: availableItems.filter(item => item.rarity === 'common'),
    uncommon: availableItems.filter(item => item.rarity === 'uncommon'),
    rare: availableItems.filter(item => item.rarity === 'rare'),
  };

  // Apply doctrine weighting if doctrineLocked is specified
  const applyDoctrineWeights = (items: HardwareItem[]): { item: HardwareItem; weight: number }[] => {
    return items.map(item => {
      const itemDoctrine = HARDWARE_DOCTRINE_AFFINITY[item.id];
      const weight = (doctrineLocked && itemDoctrine === doctrineLocked) ? 3 : 1;
      return { item, weight };
    });
  };

  // Rarity weights: common=60, uncommon=30, rare=10
  const rand = seededRng ?? Math.random;
  const roll = rand();

  let selectedPool: { item: HardwareItem; weight: number }[];

  // Calculate normalized weights based on available pools
  const commonWeight = byRarity.common.length > 0 ? 60 : 0;
  const uncommonWeight = byRarity.uncommon.length > 0 ? 30 : 0;
  const rareWeight = byRarity.rare.length > 0 ? 10 : 0;
  const totalWeight = commonWeight + uncommonWeight + rareWeight;

  if (totalWeight === 0) {
    return null;
  }

  const commonThreshold = commonWeight / totalWeight;
  const uncommonThreshold = commonThreshold + uncommonWeight / totalWeight;

  if (roll < commonThreshold && byRarity.common.length > 0) {
    selectedPool = applyDoctrineWeights(byRarity.common);
  } else if (roll < uncommonThreshold && byRarity.uncommon.length > 0) {
    selectedPool = applyDoctrineWeights(byRarity.uncommon);
  } else if (byRarity.rare.length > 0) {
    selectedPool = applyDoctrineWeights(byRarity.rare);
  } else if (byRarity.uncommon.length > 0) {
    selectedPool = applyDoctrineWeights(byRarity.uncommon);
  } else {
    selectedPool = applyDoctrineWeights(byRarity.common);
  }

  // Weighted random selection from pool
  const totalPoolWeight = selectedPool.reduce((sum, w) => sum + w.weight, 0);
  let itemRoll = rand() * totalPoolWeight;

  for (const weightedItem of selectedPool) {
    itemRoll -= weightedItem.weight;
    if (itemRoll <= 0) {
      return weightedItem.item;
    }
  }

  // Fallback (shouldn't reach here)
  return selectedPool[selectedPool.length - 1]?.item ?? null;
}

/**
 * Apply a found hardware item to the run's foundHardware tray.
 * If the slot is already occupied, returns foundHardware unchanged (no overwrite).
 */
export function addFoundHardware(
  foundHardware: Partial<Record<ItemSlot, string>>,
  item: HardwareItem,
): Partial<Record<ItemSlot, string>> {
  if (foundHardware[item.slot] !== undefined) {
    return foundHardware;
  }

  return {
    ...foundHardware,
    [item.slot]: item.id,
  };
}

/**
 * Get all found hardware items (resolved from ids) for a run.
 */
export function resolveFoundHardware(
  foundHardware: Partial<Record<ItemSlot, string>>,
): Partial<Record<ItemSlot, HardwareItem>> {
  const result: Partial<Record<ItemSlot, HardwareItem>> = {};
  const allSlots: ItemSlot[] = ['hull', 'scanner', 'utility'];

  for (const slot of allSlots) {
    const itemId = foundHardware[slot];
    if (itemId) {
      const item = HARDWARE_ITEMS.find(i => i.id === itemId);
      if (item) {
        result[slot] = item;
      }
    }
  }

  return result;
}
