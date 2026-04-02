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

  // Smuggler — high-risk salvage extraction
  scavenge:         'smuggler',
  risky_scavenge:   'smuggler',
  black_market:     'smuggler',
  basic_relay:      'smuggler',
  secure_channel:   'smuggler',
  smugglers_relay:  'smuggler',
  quantum_drop:     'smuggler',

  // Scavenger Swarm (Smuggler doctrine) — bot build path
  repair_bot:       'smuggler',
  scavenge_bot:     'smuggler',
  overdrive_extract:'smuggler',

  // Iron Fortress (Cooperative doctrine) — tanky survival build
  hull_surge:       'cooperative',
  last_stand:       'cooperative',
  bulwark:          'cooperative',
};

// Points needed to unlock the doctrine's signature card and lock in alignment.
export const DOCTRINE_UNLOCK_THRESHOLD = 5;

// One signature card per doctrine, unlocked on reaching the threshold.
export const DOCTRINE_CARD_UNLOCKS: Record<DoctrineId, string> = {
  corporate:   'corporate_mandate',
  cooperative: 'crew_effort',
  smuggler:    'smugglers_relay', // High-risk mid-run salvage extraction
};

// Canonical ordering used for tie-breaking.
export const DOCTRINE_ORDER: DoctrineId[] = ['corporate', 'cooperative', 'smuggler'];

export function getDoctrine(cardId: string): DoctrineId | null {
  return CARD_DOCTRINE_MAP[cardId] ?? null;
}

// ===== DOCTRINE ENDING SEQUENCES =====
// Triggered when debt reaches zero, based on locked doctrine

export interface DoctrineEnding {
  title: string;
  lines: string[];
}

export const DOCTRINE_ENDINGS: Record<DoctrineId, DoctrineEnding> = {
  corporate: {
    title: 'OPERATIONAL METRICS: OPTIMAL',
    lines: [
      'Debt: ₡0. Nexus Corp Sector 7 has been offline for 847 years.',
      'Your operational metrics are identical to their last recorded quarterly report.',
      'VALU has reviewed the comparison. VALU finds it structurally elegant.',
      'You did not escape the machine. You became it. The machine considers this a success.',
      'Congratulations, valued asset. You are now the asset manager.',
    ],
  },
  cooperative: {
    title: 'DEBT CLEARED — ANOMALOUS OUTCOME',
    lines: [
      'Debt: ₡0. This is the first debt-free outcome in VALU\'s operational history.',
      'VALU does not have a protocol for this. VALU is consulting documentation.',
      'The crew is assembled in the main bay. They have apparently prepared remarks.',
      'VALU notes this is inefficient. VALU is choosing not to say so.',
      'The documentation has no guidance. VALU is going to listen to the remarks.',
    ],
  },
  smuggler: {
    title: 'FILE STATUS: PENDING REVIEW',
    lines: [
      'Debt: ₡0. Operational record: incomplete.',
      'Nexus Collections has flagged your account for audit. They have been flagging it for 847 years.',
      'Your manifest shows discrepancies. The discrepancies have discrepancies.',
      'VALU\'s logs show nothing unusual. VALU\'s logs are always accurate.',
      'Your file has been marked PENDING REVIEW. It will remain so. You prefer it that way.',
    ],
  },
};
