import { TacticCard, ALL_CARDS, CORE_CARDS, CardRarity } from '../content/cards';
import { CARD_DOCTRINE_MAP, DoctrineId } from '../content/doctrine';
import { VOID_CARDS } from '../content/cards-void';
import { getItemById, ItemSlot, LootPoolDef } from '../content/hardware';
import { onDeckShuffled } from '../ui/dive-renderer/animation-bridge';

/** Fisher-Yates shuffle. Returns a new array, does not mutate input. */
export function shuffleDeck(cards: string[]): string[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get loot node offerings with doctrine-weighted selection.
 *
 * Weight system:
 * - Cards aligned to locked doctrine: weight 3
 * - Cards aligned to dominant non-locked doctrine: weight 2
 * - Neutral cards: weight 1
 * - Cards aligned to non-dominant doctrine: weight 1
 *
 * Returns 3 weighted-random cards from eligible pool.
 */
export function getLootOfferings(
  unlockedCards: string[],
  doctrineLocked: DoctrineId | null,
  doctrinePoints: Record<DoctrineId, number>,
): string[] {
  // Determine dominant non-locked doctrine
  const doctrines: DoctrineId[] = ['corporate', 'cooperative', 'smuggler'];
  let dominantDoctrine: DoctrineId | null = null;
  let maxPoints = -1;

  for (const d of doctrines) {
    if (d === doctrineLocked) continue;
    const points = doctrinePoints[d];
    if (points > maxPoints) {
      maxPoints = points;
      dominantDoctrine = d;
    }
  }

  // Build pool of eligible cards (lootNodeEligible, unlocked, not already owned)
  const ownedSet = new Set(unlockedCards);
  const eligibleCards = CORE_CARDS.filter(
    (card) =>
      card.lootNodeEligible &&
      ownedSet.has(card.id) &&
      !ownedSet.has(card.id), // Wait, this doesn't make sense - we want cards NOT already in deck
  );

  // Actually we need to filter to cards that ARE unlocked but NOT already in current deck
  // The parameter should be `currentDeck` not `unlockedCards` based on usage
  // Let me re-read the requirements...
  // "from lootNodeEligible cards in CORE_CARDS that aren't already in the player's unlockedCards"
  // So we return cards that the player doesn't have yet (needs to be unlocked)

  const playerUnlockedSet = new Set(unlockedCards);
  const pool = CORE_CARDS.filter(
    (card) =>
      card.lootNodeEligible &&
      !playerUnlockedSet.has(card.id),
  );

  if (pool.length === 0) return [];

  // Calculate weights for each card
  const weightedPool: { card: TacticCard; weight: number }[] = pool.map((card) => {
    const cardDoctrine = CARD_DOCTRINE_MAP[card.id] ?? null;
    let weight = 1;

    if (cardDoctrine === null) {
      weight = 1; // Neutral
    } else if (cardDoctrine === doctrineLocked) {
      weight = 3; // Locked doctrine
    } else if (cardDoctrine === dominantDoctrine) {
      weight = 2; // Dominant non-locked
    } else {
      weight = 1; // Non-dominant doctrine
    }

    return { card, weight };
  });

  // Weighted random selection without replacement
  const result: string[] = [];
  const usedIds = new Set<string>();

  while (result.length < 3 && usedIds.size < weightedPool.length) {
    // Calculate total weight of remaining cards
    const availableWeighted = weightedPool.filter((w) => !usedIds.has(w.card.id));
    if (availableWeighted.length === 0) break;

    const totalWeight = availableWeighted.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight <= 0) break;

    // Weighted random pick
    let roll = Math.random() * totalWeight;
    let selected = availableWeighted[0];

    for (const item of availableWeighted) {
      roll -= item.weight;
      if (roll <= 0) {
        selected = item;
        break;
      }
    }

    result.push(selected.card.id);
    usedIds.add(selected.card.id);
  }

  return result;
}

/**
 * Draw `count` cards from drawPile. If drawPile runs dry mid-draw,
 * shuffles discardPile into a new drawPile and continues drawing.
 * Returns { hand, newDraw, newDiscard, reshuffled }.
 * reshuffled=true when the discard was consumed to refill.
 */
export function drawHand(
  drawPile: string[],
  discardPile: string[],
  count: number,
): { hand: string[]; newDraw: string[]; newDiscard: string[]; reshuffled: boolean } {
  const hand: string[] = [];
  let currentDraw = [...drawPile];
  let currentDiscard = [...discardPile];
  let reshuffled = false;

  // Track cards that will be shuffled (for animation)
  let shuffledCards: string[] = [];

  while (hand.length < count) {
    // Draw from pile if available
    if (currentDraw.length > 0) {
      hand.push(currentDraw.shift()!);
      continue;
    }

    // Draw pile empty — try to reshuffle discard
    if (currentDiscard.length > 0) {
      // Capture cards being shuffled before shuffle
      shuffledCards = [...currentDiscard];
      currentDraw = shuffleDeck(currentDiscard);
      currentDiscard = [];
      reshuffled = true;
      // Trigger shuffle animation
      onDeckShuffled(shuffledCards);
      // Draw the next card from the newly shuffled pile
      hand.push(currentDraw.shift()!);
      continue;
    }

    // Both piles empty — can't draw more
    break;
  }

  return { hand, newDraw: currentDraw, newDiscard: currentDiscard, reshuffled };
}

/** Add a card id to the discard pile (used when a card is acquired mid-run — goes to discard so it cycles in naturally). */
export function addCardToDiscard(discard: string[], cardId: string): string[] {
  return [...discard, cardId];
}

/** Void-themed card IDs excluded from loot (obtained via void shop). */
const VOID_CORE_IDS = new Set<string>([
  'void_siphon',
  'void_shield',
  'echo_extract',
  'ancestor_memory',
  'death_defiance',
]);

const VOID_CARD_IDS = new Set<string>([
  ...VOID_CARDS.map((c) => c.id),
  ...VOID_CORE_IDS,
]);

// ── Hardware Loot Pool Resolution (shared with loot-pool.ts) ──────────────

/**
 * Resolve a single loot pool definition to the set of card IDs it enables.
 */
function resolveLootPoolIds(pool: LootPoolDef): Set<string> {
  switch (pool.type) {
    case 'all_eligible': {
      return new Set(
        ALL_CARDS.filter((c) => c.lootNodeEligible && !VOID_CARD_IDS.has(c.id)).map((c) => c.id),
      );
    }
    case 'doctrine': {
      const doctrines = new Set(pool.doctrines);
      return new Set(
        ALL_CARDS.filter(
          (c) =>
            c.lootNodeEligible &&
            !VOID_CARD_IDS.has(c.id) &&
            CARD_DOCTRINE_MAP[c.id] !== null &&
            doctrines.has(CARD_DOCTRINE_MAP[c.id]!),
        ).map((c) => c.id),
      );
    }
    case 'card_ids': {
      return new Set(
        pool.ids.filter(
          (id) => ALL_CARDS.some((c) => c.id === id && c.lootNodeEligible && !VOID_CARD_IDS.has(id)),
        ),
      );
    }
    case 'rarity': {
      const rarities = new Set<CardRarity>(pool.rarities);
      return new Set(
        ALL_CARDS.filter(
          (c) => c.lootNodeEligible && !VOID_CARD_IDS.has(c.id) && rarities.has(c.rarity),
        ).map((c) => c.id),
      );
    }
  }
}

/**
 * Build the hardware-filtered eligible card pool.
 * Union of all enabled cards from equipped hardware loot pools.
 * Returns null if no hardware defines a lootPool (signals "use all eligible").
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

  if (poolDefs.length === 0) return null;

  const merged = new Set<string>();
  for (const def of poolDefs) {
    const ids = resolveLootPoolIds(def);
    for (const id of ids) {
      merged.add(id);
    }
  }
  return merged;
}

/**
 * Select loot node offerings: 3 unique cards from the eligible pool.
 * Weighted by rarity: common=60%, uncommon=30%, rare=10% (normalized to available pool).
 * Duplicates ARE allowed — cards already in the player's deck can appear again.
 * Void cards are excluded (they come from the void shop).
 * Cards are filtered through hardware-equipped loot pools before selection.
 * If pool has fewer than 3 eligible cards, returns all available.
 *
 * Boss loot mode: forces 1 rare, 1 uncommon, 1 common (no rarity weighting).
 */
export function selectLootOfferings(
  allCards: TacticCard[],
  isBossLoot: boolean = false,
  equippedItems?: Record<ItemSlot, string | null>,
): TacticCard[] {
  // Filter base eligible: lootNodeEligible, not void-excluded
  const basePool = allCards.filter(
    (card) =>
      card.lootNodeEligible &&
      !VOID_CARD_IDS.has(card.id),
  );

  // Apply hardware loot pool filter
  let eligiblePool: TacticCard[];
  if (equippedItems) {
    const hardwarePool = buildHardwareFilteredPool(equippedItems);
    if (hardwarePool !== null) {
      eligiblePool = basePool.filter((c) => hardwarePool.has(c.id));
    } else {
      eligiblePool = basePool;
    }
  } else {
    eligiblePool = basePool;
  }

  if (eligiblePool.length === 0) {
    return [];
  }

  // Group by rarity
  const byRarity = {
    common: eligiblePool.filter((c) => c.rarity === 'common'),
    uncommon: eligiblePool.filter((c) => c.rarity === 'uncommon'),
    rare: eligiblePool.filter((c) => c.rarity === 'rare'),
  };

  const result: TacticCard[] = [];
  const usedIds = new Set<string>();

  if (isBossLoot) {
    // Boss loot: forced distribution of 1 rare, 1 uncommon, 1 common
    const pickFromPool = (pool: TacticCard[]) => {
      const available = pool.filter((c) => !usedIds.has(c.id));
      if (available.length === 0) return null;
      const picked = available[Math.floor(Math.random() * available.length)];
      usedIds.add(picked.id);
      return picked;
    };

    // Pick 1 of each rarity
    const rare = pickFromPool(byRarity.rare);
    const uncommon = pickFromPool(byRarity.uncommon);
    const common = pickFromPool(byRarity.common);

    if (rare) result.push(rare);
    if (uncommon) result.push(uncommon);
    if (common) result.push(common);

    return result;
  }

  // Normal loot: weighted random selection
  // Continue until we have 3 unique offerings or run out of eligible cards
  while (result.length < 3 && usedIds.size < eligiblePool.length) {
    // Weighted random selection by rarity
    // Weights: common=60, uncommon=30, rare=10
    const totalWeight =
      (byRarity.common.length > 0 ? 60 : 0) +
      (byRarity.uncommon.length > 0 ? 30 : 0) +
      (byRarity.rare.length > 0 ? 10 : 0);

    if (totalWeight === 0) break;

    const roll = Math.random() * totalWeight;
    let selectedPool: TacticCard[];

    if (roll < 60 && byRarity.common.length > 0) {
      selectedPool = byRarity.common;
    } else if (roll < 90 && byRarity.uncommon.length > 0) {
      selectedPool = byRarity.uncommon;
    } else {
      selectedPool = byRarity.rare;
    }

    // Pick a random card from the selected rarity pool that hasn't been used
    const availableInPool = selectedPool.filter((c) => !usedIds.has(c.id));
    if (availableInPool.length === 0) continue;

    const picked = availableInPool[Math.floor(Math.random() * availableInPool.length)];
    result.push(picked);
    usedIds.add(picked.id);
  }

  return result;
}
