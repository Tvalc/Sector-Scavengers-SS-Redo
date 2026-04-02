import { ALL_CARDS, TacticCard, CardRarity } from '../content/cards';
import { CARD_DOCTRINE_MAP, DoctrineId } from '../content/doctrine';
import { VOID_CARDS } from '../content/cards-void';
import { getItemById, ItemSlot, LootPoolDef } from '../content/hardware';

/** Void card IDs — excluded from loot offerings (obtained via void shop instead). */
const VOID_CARD_IDS = new Set<string>(VOID_CARDS.map((c) => c.id));

/** Void-themed cards in CORE that should only come from the void shop. */
const VOID_CORE_IDS = new Set<string>([
  'void_siphon',
  'void_shield',
  'echo_extract',
  'ancestor_memory',
  'death_defiance',
]);

/** All card IDs that are excluded from loot offerings because they come from the void shop. */
const EXCLUDED_FROM_LOOT = new Set<string>([
  ...VOID_CARD_IDS,
  ...VOID_CORE_IDS,
]);

// ── Hardware Loot Pool Resolution ─────────────────────────────────────────

/**
 * Build the set of card IDs enabled by a single loot pool definition.
 */
function resolveLootPoolIds(pool: LootPoolDef): Set<string> {
  switch (pool.type) {
    case 'all_eligible': {
      return new Set(
        ALL_CARDS
          .filter((c) => c.lootNodeEligible && !EXCLUDED_FROM_LOOT.has(c.id))
          .map((c) => c.id),
      );
    }
    case 'doctrine': {
      const doctrines = new Set(pool.doctrines);
      return new Set(
        ALL_CARDS.filter(
          (c) =>
            c.lootNodeEligible &&
            !EXCLUDED_FROM_LOOT.has(c.id) &&
            CARD_DOCTRINE_MAP[c.id] !== null &&
            doctrines.has(CARD_DOCTRINE_MAP[c.id]!),
        ).map((c) => c.id),
      );
    }
    case 'card_ids': {
      return new Set(
        pool.ids.filter(
          (id) => ALL_CARDS.some((c) => c.id === id && c.lootNodeEligible && !EXCLUDED_FROM_LOOT.has(id)),
        ),
      );
    }
    case 'rarity': {
      const rarities = new Set<CardRarity>(pool.rarities);
      return new Set(
        ALL_CARDS.filter(
          (c) => c.lootNodeEligible && !EXCLUDED_FROM_LOOT.has(c.id) && rarities.has(c.rarity),
        ).map((c) => c.id),
      );
    }
  }
}

/**
 * Build the hardware-filtered eligible card pool.
 * Union of all enabled cards from equipped hardware loot pools.
 * Returns null if no hardware defines a lootPool (caller should use all eligible).
 */
function buildHardwareFilteredPool(
  equippedItems: Record<ItemSlot, string | null>,
): Set<string> | null {
  const slots: ItemSlot[] = ['hull', 'scanner', 'utility'];
  const poolDefs: LootPoolDef[] = [];

  for (const slot of slots) {
    const itemId = equippedItems[slot];
    if (!itemId) continue;
    const item = getItemById(itemId);
    if (item?.lootPool) {
      poolDefs.push(item.lootPool);
    }
  }

  // No hardware defines a loot pool — return null to signal "use all eligible"
  if (poolDefs.length === 0) return null;
  // Union all resolved pools
  const merged = new Set<string>();
  for (const def of poolDefs) {
    const ids = resolveLootPoolIds(def);
    for (const id of ids) {
      merged.add(id);
    }
  }
  return merged;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Build doctrine-weighted loot offerings for a loot node.
 *
 * Returns exactly 3 cards (or fewer if not enough eligible cards exist).
 * Cards are filtered by:
 * - Must have `lootNodeEligible: true`
 * - Not a void card (void cards come from the void shop)
 * - Must be in the hardware-defined loot pool (if any hardware defines one)
 * - Duplicates ARE allowed in offerings and in the player's deck
 *
 * Weighting logic:
 * - If doctrine is locked: 60% chance per pick to draw from locked doctrine pool first
 * - If doctrine not locked: picks weighted toward the doctrine with most doctrinePoints
 * - Round-based rarity weighting controls which rarity pools are used
 *
 * @param doctrinePoints - Points accumulated per doctrine
 * @param doctrineLocked - Currently locked doctrine (or null)
 * @param round - Current round number (affects rarity distribution)
 * @param equippedItems - Currently equipped hardware items (determines loot pool)
 * @returns Array of up to 3 TacticCards
 */
export function buildLootOfferings(
  doctrinePoints: Record<DoctrineId, number>,
  doctrineLocked: DoctrineId | null,
  round: number,
  equippedItems: Record<ItemSlot, string | null>,
): TacticCard[] {
  // Step 1: Collect hardware-filtered pool
  const hardwarePool = buildHardwareFilteredPool(equippedItems);

  // Step 2: Build eligible cards — filtered by hardware pool or all eligible
  let eligibleCards: TacticCard[];
  if (hardwarePool !== null) {
    // Hardware defines loot pools — filter to only hardware-enabled cards
    eligibleCards = ALL_CARDS.filter(
      (card) => card.lootNodeEligible && !EXCLUDED_FROM_LOOT.has(card.id) && hardwarePool.has(card.id),
    );
  } else {
    // No hardware loot pools defined — use all eligible (default behavior)
    eligibleCards = ALL_CARDS.filter(
      (card) => card.lootNodeEligible && !EXCLUDED_FROM_LOOT.has(card.id),
    );
  }

  if (eligibleCards.length === 0) return [];
  if (eligibleCards.length <= 3) return [...eligibleCards];

  // Step 3: Apply rarity distribution based on round
  const rarityWeights = getRarityWeightsForRound(round);

  // Group cards by rarity
  const byRarity = {
    common: eligibleCards.filter((c) => c.rarity === 'common'),
    uncommon: eligibleCards.filter((c) => c.rarity === 'uncommon'),
    rare: eligibleCards.filter((c) => c.rarity === 'rare'),
  };

  // Step 4: Determine doctrine weights
  const doctrineWeights = doctrineLocked
    ? null
    : calculateDoctrineWeights(doctrinePoints);

  const result: TacticCard[] = [];
  const usedIds = new Set<string>();

  // Step 5: Pick 3 cards with doctrine weighting
  while (result.length < 3) {
    const targetRarity = pickRarityByWeight(rarityWeights, byRarity, usedIds);
    if (!targetRarity) break;

    let availablePool = byRarity[targetRarity].filter((c) => !usedIds.has(c.id));

    // Fall back to lower rarities if target pool is empty
    if (availablePool.length === 0 && targetRarity === 'rare') {
      availablePool = byRarity.uncommon.filter((c) => !usedIds.has(c.id));
      if (availablePool.length === 0) {
        availablePool = byRarity.common.filter((c) => !usedIds.has(c.id));
      }
    } else if (availablePool.length === 0 && targetRarity === 'uncommon') {
      availablePool = byRarity.common.filter((c) => !usedIds.has(c.id));
    }

    if (availablePool.length === 0) break;

    // Apply doctrine weighting
    const selectedCard = doctrineLocked
      ? pickWithLockedDoctrine(availablePool, doctrineLocked)
      : pickWithUnlockedDoctrine(availablePool, doctrineWeights!);

    if (!selectedCard) break;

    result.push(selectedCard);
    usedIds.add(selectedCard.id);
  }

  return result;
}

// ── Internal helpers ───────────────────────────────────────────────────────

/**
 * Get rarity weight distribution based on round number.
 */
function getRarityWeightsForRound(round: number): Record<string, number> {
  if (round <= 3) return { common: 1.0, uncommon: 0, rare: 0 };
  if (round <= 6) return { common: 0.6, uncommon: 0.4, rare: 0 };
  if (round <= 9) return { common: 0.4, uncommon: 0.4, rare: 0.2 };
  return { common: 0.2, uncommon: 0.4, rare: 0.4 };
}

/**
 * Pick a rarity based on weighted probabilities.
 * Falls back through rarities if the selected one has no available cards.
 */
function pickRarityByWeight(
  weights: Record<string, number>,
  byRarity: { common: TacticCard[]; uncommon: TacticCard[]; rare: TacticCard[] },
  usedIds: Set<string>,
): 'common' | 'uncommon' | 'rare' | null {
  const hasCommon = byRarity.common.some((c) => !usedIds.has(c.id));
  const hasUncommon = byRarity.uncommon.some((c) => !usedIds.has(c.id));
  const hasRare = byRarity.rare.some((c) => !usedIds.has(c.id));

  const availableWeights: Record<string, number> = {};
  if (hasCommon) availableWeights.common = weights.common;
  if (hasUncommon) availableWeights.uncommon = weights.uncommon;
  if (hasRare) availableWeights.rare = weights.rare;

  const totalWeight = Object.values(availableWeights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return null;

  const normalized = Object.fromEntries(
    Object.entries(availableWeights).map(([k, v]) => [k, v / totalWeight]),
  );

  const roll = Math.random();
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(normalized)) {
    cumulative += weight;
    if (roll < cumulative) {
      return rarity as 'common' | 'uncommon' | 'rare';
    }
  }
  return (Object.keys(normalized)[0] as 'common' | 'uncommon' | 'rare') || null;
}

/**
 * Calculate doctrine weights when no doctrine is locked.
 * Proportional to doctrine points, minimum 20% per doctrine.
 */
function calculateDoctrineWeights(
  doctrinePoints: Record<DoctrineId, number>,
): Record<DoctrineId | 'neutral', number> {
  const points = {
    corporate: doctrinePoints.corporate || 0,
    cooperative: doctrinePoints.cooperative || 0,
    smuggler: doctrinePoints.smuggler || 0,
  };
  const total = points.corporate + points.cooperative + points.smuggler;
  if (total === 0) {
    return { corporate: 0.27, cooperative: 0.27, smuggler: 0.26, neutral: 0.2 };
  }
  const minWeight = 0.2;
  const remainingWeight = 1 - minWeight * 3;
  return {
    corporate: minWeight + (points.corporate / total) * remainingWeight,
    cooperative: minWeight + (points.cooperative / total) * remainingWeight,
    smuggler: minWeight + (points.smuggler / total) * remainingWeight,
    neutral: 0,
  };
}

/**
 * Pick a card when a doctrine is locked.
 * 60% chance to pick from locked doctrine pool first.
 */
function pickWithLockedDoctrine(
  availablePool: TacticCard[],
  doctrineLocked: DoctrineId,
): TacticCard | null {
  const roll = Math.random();
  if (roll < 0.6) {
    const lockedPool = availablePool.filter(
      (c) => CARD_DOCTRINE_MAP[c.id] === doctrineLocked,
    );
    if (lockedPool.length > 0) {
      return lockedPool[Math.floor(Math.random() * lockedPool.length)];
    }
  }
  if (availablePool.length > 0) {
    return availablePool[Math.floor(Math.random() * availablePool.length)];
  }
  return null;
}
/**
 * Pick a card when no doctrine is locked.
 * Uses proportional weights based on doctrine points.
 */
function pickWithUnlockedDoctrine(
  availablePool: TacticCard[],
  weights: Record<DoctrineId | 'neutral', number>,
): TacticCard | null {
  const byDoctrine = {
    corporate: availablePool.filter((c) => CARD_DOCTRINE_MAP[c.id] === 'corporate'),
    cooperative: availablePool.filter((c) => CARD_DOCTRINE_MAP[c.id] === 'cooperative'),
    smuggler: availablePool.filter((c) => CARD_DOCTRINE_MAP[c.id] === 'smuggler'),
    neutral: availablePool.filter((c) => !CARD_DOCTRINE_MAP[c.id]),
  };
  let totalWeight = 0;
  const availableWeights: Record<string, number> = {};
  for (const [doctrine, pool] of Object.entries(byDoctrine)) {
    if (pool.length > 0) {
      const weight = weights[doctrine as keyof typeof weights] || 0.2;
      availableWeights[doctrine] = weight;
      totalWeight += weight;
    }
  }
  if (totalWeight === 0) return null;
  const roll = Math.random() * totalWeight;
  let cumulative = 0;
  let selectedDoctrine: string | null = null;
  for (const [doctrine, weight] of Object.entries(availableWeights)) {
    cumulative += weight;
    if (roll < cumulative) {
      selectedDoctrine = doctrine;
      break;
    }
  }
  if (!selectedDoctrine) {
    selectedDoctrine = Object.keys(availableWeights)[0];
  }
  const pool = byDoctrine[selectedDoctrine as keyof typeof byDoctrine];
  if (pool && pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}
