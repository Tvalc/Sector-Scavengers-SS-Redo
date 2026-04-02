import { CORE_BASE_CARDS } from './cards-core-base.ts';
import { CORE_UPGRADED_CARDS } from './cards-core-upgraded.ts';
import { CORPORATE_CARDS } from './cards-corporate.ts';
import { COOPERATIVE_CARDS } from './cards-cooperative.ts';
import { SMUGGLER_CARDS } from './cards-smuggler.ts';
import { VOID_CARDS } from './cards-void.ts';

export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare';

export interface TacticCard {
  id: string;
  name: string;
  description: string;
  /** Simplified description for intro/tutorial context (optional). */
  introDescription?: string;
  rarity: CardRarity;
  lootNodeEligible: boolean;
  /** Energy cost to play this card (default 0 for backward compatibility). */
  energyCost?: number;
  /** Overcharge effect - spend extra energy for enhanced effect. */
  overchargeEffect?: { multiplier: number; description: string };
  /** Energy refund condition - get energy back when condition is met. */
  energyRefund?: { condition: string; amount: number };
  /** Surge card - gives energy instead of costing (isSurge implies negative cost behavior). */
  isSurge?: boolean;
}

// Core cards now split between base (starter/foundational) and upgraded variants
export const CORE_CARDS: TacticCard[] = [
  ...CORE_BASE_CARDS,
  ...CORE_UPGRADED_CARDS,
];

// Combined card registry with new relay cards replacing credit-based systems
export const ALL_CARDS: TacticCard[] = [
  ...CORE_CARDS,
  ...CORPORATE_CARDS,
  ...COOPERATIVE_CARDS,
  ...SMUGGLER_CARDS,
  ...VOID_CARDS,
];

export function getAvailableCards(unlockedIds: string[]): TacticCard[] {
  return ALL_CARDS.filter((card) => unlockedIds.includes(card.id));
}
