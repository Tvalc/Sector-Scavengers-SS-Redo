export interface VoidShopCard {
  id: string;
  name: string;
  description: string;
  cost: number;     // voidEcho cost
  cardId: string;   // tactic card id unlocked on purchase
}

export const VOID_SHOP_CARDS: VoidShopCard[] = [
  {
    id: 'vs_void_shield',
    name: 'Void Shield',
    description: 'Dive card: Gain 2 shield charges at once.',
    cost: 4,
    cardId: 'void_shield',
  },
  {
    id: 'vs_echo_extract',
    name: 'Echo Extract',
    description: 'Dive card: Extract + gain 2 voidEcho immediately.',
    cost: 5,
    cardId: 'echo_extract',
  },
  {
    id: 'vs_ancestor_memory',
    name: 'Ancestor Memory',
    description: 'Dive card: Preview next danger (cosmetic log entry).',
    cost: 3,
    cardId: 'ancestor_memory',
  },
  {
    id: 'vs_death_defiance',
    name: 'Death Defiance',
    description: 'Dive card: Survive one hull-to-zero collapse at 1 hull instead.',
    cost: 8,
    cardId: 'death_defiance',
  },
  // Phase 6 expansion: 6 new void shop cards
  {
    id: 'vs_echo_drain',
    name: 'Echo Drain',
    description: 'Dive card: Lose 10 hull. Gain voidEcho equal to round number.',
    cost: 6,
    cardId: 'echo_drain',
  },
  {
    id: 'vs_void_touched',
    name: 'Void Touched',
    description: 'Dive card: Gain 1 voidEcho on extract. +1 more if hull < 30 at extract.',
    cost: 8,
    cardId: 'void_touched',
  },
  {
    id: 'vs_desperate_measures',
    name: 'Desperate Measures',
    description: 'Dive card: Hull -20. Credits +10000. Shield +2.',
    cost: 5,
    cardId: 'desperate_measures',
  },
  {
    id: 'vs_debt_renegotiation',
    name: 'Debt Renegotiation',
    description: 'Dive card: Debt -20000. Credits -5000.',
    cost: 7,
    cardId: 'debt_renegotiation',
  },
  {
    id: 'vs_last_gasp',
    name: 'Last Gasp',
    description: 'Dive card: If hull ≤ 25: +8000 credits and +2 shields. Otherwise: +2000.',
    cost: 5,
    cardId: 'last_gasp',
  },
  {
    id: 'vs_scorched_extract',
    name: 'Scorched Extract',
    description: 'Dive card: End dive. Bank credits. Hull -30. Gain 3 voidEcho.',
    cost: 6,
    cardId: 'scorched_extract',
  },
];

export function getVoidShopCardById(id: string): VoidShopCard | undefined {
  return VOID_SHOP_CARDS.find((c) => c.id === id);
}
