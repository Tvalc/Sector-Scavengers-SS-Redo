export type DeathLessonEffect =
  | { type: 'starting_shield'; amount: number }
  | { type: 'starting_credits'; amount: number }
  | { type: 'card_unlock'; cardId: string };

export interface DeathLessonTier {
  tier: 1 | 2 | 3;
  collapsesRequired: number;
  label: string;
  description: string;
  effect: DeathLessonEffect;
}

export const DEATH_LESSON_TIERS: DeathLessonTier[] = [
  {
    tier: 1,
    collapsesRequired: 3,
    label: "Initiate's Scar",
    description: 'Survived the void. +1 starting shield.',
    effect: { type: 'starting_shield', amount: 1 },
  },
  {
    tier: 2,
    collapsesRequired: 7,
    label: "Veteran's Mark",
    description: 'Debt you with the void. +\u20a1100 per dive start.',
    effect: { type: 'starting_credits', amount: 100 },
  },
  {
    tier: 3,
    collapsesRequired: 12,
    label: 'Echo-Touched',
    description: 'The void remembers. Unlock Void Siphon.',
    effect: { type: 'card_unlock', cardId: 'void_siphon' },
  },
];

/** Returns the highest tier whose collapsesRequired <= collapses, or null. */
export function getCurrentTier(collapses: number): DeathLessonTier | null {
  let current: DeathLessonTier | null = null;
  for (const tier of DEATH_LESSON_TIERS) {
    if (collapses >= tier.collapsesRequired) {
      current = tier;
    }
  }
  return current;
}

/** Returns the next tier not yet reached, or null if all tiers are unlocked. */
export function getNextTier(collapses: number): DeathLessonTier | null {
  for (const tier of DEATH_LESSON_TIERS) {
    if (collapses < tier.collapsesRequired) return tier;
  }
  return null;
}
