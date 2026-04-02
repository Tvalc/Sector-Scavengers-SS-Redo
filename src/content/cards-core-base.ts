import type { TacticCard } from './cards';

/**
 * Core Base Cards - Starting deck and basic variants.
 * These are the simple, foundational cards players begin with.
 * Upgraded versions are unlocked through research, doctrine, or discovery.
 */

export const CORE_BASE_CARDS: TacticCard[] = [
  // ── Starting Deck (3 cards only) ───────────────────────────────────────────
  {
    id: 'scavenge',
    name: 'Scavenge',
    description: '1-4 scrap. 15%: hull −5~12. 10%: bonus component.',
    introDescription: 'Random salvage. Small hull risk.',
    rarity: 'starter',
    lootNodeEligible: false,
    energyCost: 0,
    overchargeEffect: { multiplier: 1.5, description: '+50% scrap (1-6)' },
  },
  {
    id: 'repair',
    name: 'Repair',
    description: 'Hull +10~20. 15%: malfunction −5~10 hull.',
    introDescription: 'Fix ship. Risky.',
    rarity: 'starter',
    lootNodeEligible: false,
    energyCost: 0,
    overchargeEffect: { multiplier: 1.5, description: '+50% hull (+15~30)' },
  },
  {
    id: 'extract',
    name: 'Extract',
    description: 'End dive. 10%+3%/rnd: hull breach −10~25. Death if hull 0.',
    introDescription: 'Leave. Risky extraction.',
    rarity: 'starter',
    lootNodeEligible: false,
    energyCost: 0,
  },

  // ── Base Utility Cards (common unlocks) ────────────────────────────────────
  {
    id: 'diagnostic',
    name: 'Diagnostic',
    description: 'Reveal current hull bracket. 20%: systems stress −5 hull.',
    introDescription: 'Check hull status. Slight risk.',
    rarity: 'common',
    lootNodeEligible: true,
    energyCost: 0,
    overchargeEffect: { multiplier: 1, description: 'Also reveals exact hull value + next danger type and magnitude' },
  },
  {
    id: 'shield',
    name: 'Shield',
    description: '+1 shld. Negates next hit.',
    rarity: 'common',
    lootNodeEligible: true,
    energyCost: 1,
    overchargeEffect: { multiplier: 1.5, description: '+2 shld (negates next 2 hits for +1⚡)' },
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Next dng −50%. No ₡.',
    rarity: 'common',
    lootNodeEligible: true,
    energyCost: 1,
  },
  {
    id: 'upgrade',
    name: 'Upgrade',
    description: '+2 rnds. Hull −8.',
    rarity: 'common',
    lootNodeEligible: true,
    energyCost: 1,
  },

  // ── Base Risk Cards ────────────────────────────────────────────────────────
  {
    id: 'risky_scavenge',
    name: 'Risky Scavenge',
    description: '2-6 scrap. 0-2 comp. 35%: hull −15~30. 20%: relic.',
    introDescription: 'High risk salvage. Big rewards.',
    rarity: 'common',
    lootNodeEligible: true,
    energyCost: 1,
    overchargeEffect: { multiplier: 1.5, description: '+50% scrap (3-9) and +50% components (0-3)' },
  },
  {
    id: 'patch_and_hold',
    name: 'Patch & Hold',
    description: 'Hull +5~12. Shld +1. 10%: stress −3~8 hull.',
    rarity: 'common',
    lootNodeEligible: true,
    energyCost: 1,
    overchargeEffect: { multiplier: 1.5, description: '+50% hull (+8~18) and +50% shields (+2)' },
  },

  // ── Base Extraction Cards ──────────────────────────────────────────────────
  {
    id: 'quick_extract',
    name: 'Quick Extract',
    description: 'End dive. Breach chance −50%.',
    introDescription: 'Leave fast. Safer exit.',
    rarity: 'common',
    lootNodeEligible: true,
    energyCost: 0,
  },
  {
    id: 'secure_extract',
    name: 'Secure Extract',
    description: 'End dive. +10% extract bonus. Hull ≥50.',
    rarity: 'uncommon',
    lootNodeEligible: true,
    energyCost: 1,
  },
];
