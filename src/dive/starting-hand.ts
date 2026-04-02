import type { CrewMemberId } from '../content/crew';
import { getCrewDoctrineAffinity } from '../content/crew';
import { getDoctrine, type DoctrineId } from '../content/doctrine';
import type { TacticCard } from '../content/cards';
import { ALL_CARDS } from '../content/cards';

export interface DealConfig {
  unlockedCardIds: string[];
  crewId: CrewMemberId | null;
  seed: number;
  forceCards?: string[];
}

// Crew doctrine affinity is now defined in content/crew.ts via getCrewDoctrineAffinity()

// Starter cards that always have high weight
const STARTER_CARD_IDS = new Set([
  'scavenge',
  'repair',
  'extract',
  'shield',
  'analyze',
  'upgrade',
]);

/**
 * Mulberry32 seeded random number generator.
 * Fast, compact, and provides reproducible results with the same seed.
 */
function mulberry32(seed: number): () => number {
  return function (): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a new random seed for hand rerolling.
 */
export function generateNewSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Calculate weight for a card based on crew affinity and locked doctrine.
 * - Cards matching crew's doctrine: weight 3
 * - Cards matching locked doctrine: weight 2
 * - Neutral cards: weight 1
 * - Starter cards: weight 5 (always preferred)
 */
function calculateCardWeight(
  card: TacticCard,
  crewId: CrewMemberId | null,
  lockedDoctrine: DoctrineId | null
): number {
  // Starter cards always have highest weight
  if (STARTER_CARD_IDS.has(card.id)) {
    return 5;
  }

  const cardDoctrine = getDoctrine(card.id);

  // If card matches crew's preferred doctrine
  const crewAffinity = crewId ? getCrewDoctrineAffinity(crewId) : null;
  if (crewAffinity && cardDoctrine === crewAffinity) {
    return 3;
  }

  // If card matches locked doctrine
  if (lockedDoctrine && cardDoctrine === lockedDoctrine) {
    return 2;
  }

  // Neutral cards (no doctrine or mismatch)
  return 1;
}

/**
 * Weighted Fisher-Yates shuffle using seeded RNG.
 * Items are drawn based on their weights, then shuffled.
 */
function weightedShuffle<T>(items: T[], weights: number[], rng: () => number): T[] {
  if (items.length !== weights.length) {
    throw new Error('Items and weights must have the same length');
  }

  // Create a copy of items with their weights
  const pool: Array<{ item: T; weight: number; index: number }> = items.map((item, i) => ({
    item,
    weight: weights[i],
    index: i,
  }));

  const result: T[] = [];

  while (pool.length > 0) {
    // Calculate total weight
    const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);

    // Select based on weighted random
    let random = rng() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < pool.length; i++) {
      random -= pool[i].weight;
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    // Add selected item to result and remove from pool
    result.push(pool[selectedIndex].item);
    pool.splice(selectedIndex, 1);
  }

  return result;
}

/**
 * Deal a starting hand of 3 cards based on unlocked cards, crew affinity, and RNG seed.
 * Force cards (if provided) are placed first, then the rest are drawn from the pool.
 */
export function dealStartingHand(
  config: DealConfig,
  lockedDoctrine: DoctrineId | null = null
): string[] {
  const { unlockedCardIds, crewId, seed, forceCards = [] } = config;

  // Initialize RNG with seed
  const rng = mulberry32(seed);

  // Get available cards from the unlocked pool
  const availableCards = ALL_CARDS.filter((card) => unlockedCardIds.includes(card.id));

  if (availableCards.length === 0) {
    // Fallback: return basic starter cards if nothing is unlocked
    return ['scavenge', 'repair', 'extract'];
  }

  // Calculate weights for each card
  const weights = availableCards.map((card) =>
    calculateCardWeight(card, crewId, lockedDoctrine)
  );

  // Perform weighted shuffle
  const shuffled = weightedShuffle(availableCards, weights, rng);

  // Build the hand
  const hand: string[] = [];

  // Add forced cards first (up to 3)
  for (const cardId of forceCards.slice(0, 3)) {
    if (unlockedCardIds.includes(cardId)) {
      hand.push(cardId);
    }
  }

  // Fill remaining slots from shuffled pool, avoiding duplicates
  for (const card of shuffled) {
    if (hand.length >= 3) break;
    if (!hand.includes(card.id)) {
      hand.push(card.id);
    }
  }

  // If we still don't have 3 cards, fill with random from available
  while (hand.length < 3 && hand.length < availableCards.length) {
    const remaining = shuffled.filter((c) => !hand.includes(c.id));
    if (remaining.length === 0) break;
    const randomIndex = Math.floor(rng() * remaining.length);
    hand.push(remaining[randomIndex].id);
  }

  return hand.slice(0, 3);
}
