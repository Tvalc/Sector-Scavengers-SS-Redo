export type VoidBranchId = 'survivor' | 'risk_taker' | 'void_walker';

export type VoidEffect =
  | { type: 'starting_shields'; value: number }
  | { type: 'scavenge_bonus'; value: number }
  | { type: 'echo_multiplier'; value: number };

export interface VoidTier {
  id: string;
  branch: VoidBranchId;
  tier: 1 | 2 | 3;
  cost: number;
  label: string;
  description: string;
  effect: VoidEffect;
}

export const VOID_TIERS: VoidTier[] = [
  // Survivor — starting shield charges
  {
    id: 'survivor_1',
    branch: 'survivor',
    tier: 1,
    cost: 3,
    label: 'Hardened Shell I',
    description: 'Begin each dive with 1 shield charge.',
    effect: { type: 'starting_shields', value: 1 },
  },
  {
    id: 'survivor_2',
    branch: 'survivor',
    tier: 2,
    cost: 6,
    label: 'Hardened Shell II',
    description: 'Begin each dive with an additional shield charge.',
    effect: { type: 'starting_shields', value: 1 },
  },
  {
    id: 'survivor_3',
    branch: 'survivor',
    tier: 3,
    cost: 10,
    label: 'Hardened Shell III',
    description: 'Begin each dive with yet another shield charge.',
    effect: { type: 'starting_shields', value: 1 },
  },

  // Risk Taker — scavenge credit bonus
  {
    id: 'risk_taker_1',
    branch: 'risk_taker',
    tier: 1,
    cost: 3,
    label: 'Greedy Hands I',
    description: 'Scavenge yields +10 extra credits.',
    effect: { type: 'scavenge_bonus', value: 10 },
  },
  {
    id: 'risk_taker_2',
    branch: 'risk_taker',
    tier: 2,
    cost: 6,
    label: 'Greedy Hands II',
    description: 'Scavenge yields +15 extra credits.',
    effect: { type: 'scavenge_bonus', value: 15 },
  },
  {
    id: 'risk_taker_3',
    branch: 'risk_taker',
    tier: 3,
    cost: 10,
    label: 'Greedy Hands III',
    description: 'Scavenge yields +20 extra credits.',
    effect: { type: 'scavenge_bonus', value: 20 },
  },

  // Void Walker — echo multiplier on collapse
  {
    id: 'void_walker_1',
    branch: 'void_walker',
    tier: 1,
    cost: 3,
    label: 'Echo Resonance I',
    description: 'On collapse, gain voidEcho equal to round × multiplier.',
    effect: { type: 'echo_multiplier', value: 1 },
  },
  {
    id: 'void_walker_2',
    branch: 'void_walker',
    tier: 2,
    cost: 6,
    label: 'Echo Resonance II',
    description: 'Collapse echo multiplier increases by 1.',
    effect: { type: 'echo_multiplier', value: 1 },
  },
  {
    id: 'void_walker_3',
    branch: 'void_walker',
    tier: 3,
    cost: 10,
    label: 'Echo Resonance III',
    description: 'Collapse echo multiplier increases by 1 again.',
    effect: { type: 'echo_multiplier', value: 1 },
  },
];

export function getTierById(id: string): VoidTier | undefined {
  return VOID_TIERS.find((t) => t.id === id);
}

export function getPurchasedTiersForBranch(
  purchasedIds: string[],
  branch: VoidBranchId,
): VoidTier[] {
  return VOID_TIERS.filter((t) => t.branch === branch && purchasedIds.includes(t.id));
}

export function getNextTierForBranch(
  purchasedIds: string[],
  branch: VoidBranchId,
): VoidTier | null {
  const branchTiers = VOID_TIERS.filter((t) => t.branch === branch).sort((a, b) => a.tier - b.tier);
  const purchased = branchTiers.filter((t) => purchasedIds.includes(t.id));
  if (purchased.length >= branchTiers.length) return null;
  return branchTiers[purchased.length] ?? null;
}
