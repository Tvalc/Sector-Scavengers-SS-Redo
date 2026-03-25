export type DoctrineId = 'corporate' | 'cooperative' | 'smuggler';

// Maps each card id to the doctrine it contributes to, or null if neutral.
export const CARD_DOCTRINE_MAP: Record<string, DoctrineId | null> = {
  // Corporate — extraction efficiency and upgrades
  extract:          'corporate',
  secure_extract:   'corporate',
  quick_extract:    'corporate',
  upgrade:          'corporate',
  analyze:          'corporate',
  corporate_mandate:'corporate',

  // Cooperative — hull preservation and crew support
  repair:           'cooperative',
  patch_and_hold:   'cooperative',
  shield:           'cooperative',
  crew_effort:      'cooperative',

  // Smuggler — high-risk credit grabs
  scavenge:         'smuggler',
  risky_scavenge:   'smuggler',
  black_market:     'smuggler',
};

// Points needed to unlock the doctrine's signature card and lock in alignment.
export const DOCTRINE_UNLOCK_THRESHOLD = 5;

// One signature card per doctrine, unlocked on reaching the threshold.
export const DOCTRINE_CARD_UNLOCKS: Record<DoctrineId, string> = {
  corporate:   'corporate_mandate',
  cooperative: 'crew_effort',
  smuggler:    'black_market',
};

// Canonical ordering used for tie-breaking.
export const DOCTRINE_ORDER: DoctrineId[] = ['corporate', 'cooperative', 'smuggler'];

export function getDoctrine(cardId: string): DoctrineId | null {
  return CARD_DOCTRINE_MAP[cardId] ?? null;
}
