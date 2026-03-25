export interface TacticCard {
  id: string;
  name: string;
  description: string;
}

export const CORE_CARDS: TacticCard[] = [
  {
    id: 'scavenge',
    name: 'Scavenge',
    description: '+20 credits | 15% chance hull -10',
  },
  {
    id: 'repair',
    name: 'Repair',
    description: 'Hull +15 (max 100)',
  },
  {
    id: 'extract',
    name: 'Extract',
    description: 'End dive now. Bank all credits.',
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Gain 1 shield charge. Next hull damage is negated.',
  },
  {
    id: 'upgrade',
    name: 'Upgrade',
    description: 'Max rounds +2 | Hull -8 immediately',
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Next danger chance halved | No credits gained this round',
  },
  {
    id: 'risky_scavenge',
    name: 'Risky Scavenge',
    description: '+40 credits | 35% chance hull -20',
  },
  {
    id: 'secure_extract',
    name: 'Secure Extract',
    description: 'End dive, bank credits +10% bonus | Requires hull ≥ 50',
  },
  {
    id: 'quick_extract',
    name: 'Quick Extract',
    description: 'End dive now | Credits −15% penalty',
  },
  {
    id: 'patch_and_hold',
    name: 'Patch & Hold',
    description: 'Hull +8, shield +1 | Costs ₡20',
  },
  // ── Doctrine unlock cards ─────────────────────────────────────────────────
  {
    id: 'corporate_mandate',
    name: 'Corporate Mandate',
    description: 'End dive. Credits ×1.2. Debt +₡200.',
  },
  {
    id: 'crew_effort',
    name: 'Crew Effort',
    description: 'Hull +12. Gain 1 shield charge.',
  },
  {
    id: 'black_market',
    name: 'Black Market',
    description: '+60 credits | 50% chance hull -15.',
  },
  // ── Death lesson unlock ───────────────────────────────────────────────────
  {
    id: 'void_siphon',
    name: 'Void Siphon',
    description: '+30 credits. Gain 1 voidEcho immediately.',
  },
  // ── Void shop cards ───────────────────────────────────────────────────────
  {
    id: 'void_shield',
    name: 'Void Shield',
    description: '+2 shield charges.',
  },
  {
    id: 'echo_extract',
    name: 'Echo Extract',
    description: 'End dive. Bank credits. Gain 2 void echo.',
  },
  {
    id: 'ancestor_memory',
    name: 'Ancestor Memory',
    description: 'Scan incoming dangers. (Log preview of next round\u2019s danger.)',
  },
  {
    id: 'death_defiance',
    name: 'Death Defiance',
    description: 'If hull would hit 0, survive at hull 1 instead. One use per run.',
  },
];

export function getAvailableCards(unlockedIds: string[]): TacticCard[] {
  return CORE_CARDS.filter((card) => unlockedIds.includes(card.id));
}
