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
];

export function getVoidShopCardById(id: string): VoidShopCard | undefined {
  return VOID_SHOP_CARDS.find((c) => c.id === id);
}
