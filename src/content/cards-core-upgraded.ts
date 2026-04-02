import type { TacticCard } from './cards';

/**
 * Upgraded Core Cards - Enhanced versions of base cards.
 * These offer improved effects, reduced risks, or additional benefits.
 * Unlocked through research, doctrine progression, or rare discoveries.
 */

export const CORE_UPGRADED_CARDS: TacticCard[] = [
  // ── Upgraded Scavenge ──────────────────────────────────────────────────────
  {
    id: 'precision_scavenge',
    name: 'Precision Scavenge',
    description: '3-7 scrap. 1-3 comp. 10%: hull −5~10. 25%: relic.',
    introDescription: 'Better salvage. Lower hull risk.',
    rarity: 'uncommon',
    lootNodeEligible: true,
    energyCost: 1,
    energyRefund: { condition: 'Find relic', amount: 1 },
  },
  {
    id: 'salvage_beacon',
    name: 'Salvage Beacon',
    description: '4-9 scrap. 2-4 comp. Find +1 item. 15%: hull −8~15.',
    introDescription: 'Deploy drones. Better rewards.',
    rarity: 'rare',
    lootNodeEligible: true,
    energyCost: 2,
    overchargeEffect: { multiplier: 1.5, description: '+50% scrap (6-14) and +50% components (3-6)' },
  },

  // ── Upgraded Repair ────────────────────────────────────────────────────────
  {
    id: 'field_repair',
    name: 'Field Repair',
    description: 'Hull +15~25. 10%: malfunction −3~8 hull.',
    introDescription: 'More reliable repairs.',
    rarity: 'uncommon',
    lootNodeEligible: true,
    energyCost: 1,
    overchargeEffect: { multiplier: 1.5, description: '+50% hull (+23~38)' },
  },
  {
    id: 'emergency_overhaul',
    name: 'Emergency Overhaul',
    description: 'Hull +25~40. Shld +1. 15%: critical failure −10~20 hull.',
    introDescription: 'Major repairs. Higher stakes.',
    rarity: 'rare',
    lootNodeEligible: true,
    energyCost: 2,
    overchargeEffect: { multiplier: 1.5, description: '+50% hull (+38~60) and +50% shields (+2)' },
  },

  // ── Upgraded Diagnostic ────────────────────────────────────────────────────
  {
    id: 'deep_scan',
    name: 'Deep Scan',
    description: 'Reveal hull + next dng type. 15%: feedback −3 hull.',
    introDescription: 'More intel. Slight risk.',
    rarity: 'uncommon',
    lootNodeEligible: true,
    energyCost: 1,
  },
  {
    id: 'emergency_telemetry',
    name: 'Emergency Telemetry',
    description: 'Reveal hull bracket. If overcharged (+1⚡): reveal exact hull + danger in 2 rounds.',
    introDescription: 'Emergency data burst.',
    rarity: 'uncommon',
    lootNodeEligible: true,
    energyCost: 0,
    overchargeEffect: { multiplier: 1, description: 'Exact hull + 2-round danger forecast' },
  },
  {
    id: 'tactical_assessment',
    name: 'Tactical Assessment',
    description: 'Reveal hull + salvage value + dng type. No risk.',
    introDescription: 'Complete situation report.',
    rarity: 'rare',
    lootNodeEligible: true,
    energyCost: 2,
  },

  // ── Upgraded Shield ────────────────────────────────────────────────────────
  {
    id: 'reinforced_shield',
    name: 'Reinforced Shield',
    description: '+2 shld. Negates next 2 hits.',
    introDescription: 'Stronger protection.',
    rarity: 'uncommon',
    lootNodeEligible: true,
    energyCost: 1,
    overchargeEffect: { multiplier: 1.5, description: '+3 shld (negates next 3 hits for +1⚡)' },
  },
  {
    id: 'ablative_screen',
    name: 'Ablative Screen',
    description: '+1 shld. While active: −20% hull dmg from dangers.',
    introDescription: 'Damage reduction shield.',
    rarity: 'rare',
    lootNodeEligible: true,
    energyCost: 2,
    overchargeEffect: { multiplier: 1.5, description: '−30% hull dmg from dangers (+50% damage reduction for +1⚡)' },
  },

  // ── Upgraded Extract ───────────────────────────────────────────────────────
  {
    id: 'priority_extract',
    name: 'Priority Extract',
    description: 'End dive. Breach −75%. +5% salvage bonus.',
    introDescription: 'Safest extraction.',
    rarity: 'uncommon',
    lootNodeEligible: true,
    energyCost: 1,
  },
  {
    id: 'emergency_beacon',
    name: 'Emergency Beacon',
    description: 'End dive. No breach chance. −10% salvage value.',
    introDescription: 'Guaranteed escape. Costly.',
    rarity: 'rare',
    lootNodeEligible: true,
    energyCost: 2,
  },

  // ── Mid-Run Salvage Relay Cards (Smuggler Upgrades) ────────────────────────
  {
    id: 'basic_relay',
    name: 'Basic Relay',
    description: 'Send 1 scrap to base. 30%: hull −20.',
    introDescription: 'Early extraction. Risky.',
    rarity: 'common',
    lootNodeEligible: true,
    energyCost: 0,
  },
  {
    id: 'secure_channel',
    name: 'Secure Channel',
    description: 'Send 1-2 salvage to base safely. No hull risk.',
    introDescription: 'Safe mid-run extraction.',
    rarity: 'uncommon',
    lootNodeEligible: true,
    energyCost: 1,
  },
  {
    id: 'smugglers_relay',
    name: "Smuggler's Relay",
    description: 'Send 2-3 salvage + 1 comp to base. 50%: hull −30.',
    introDescription: 'High-value relay. Very risky.',
    rarity: 'rare',
    lootNodeEligible: true,
    energyCost: 2,
  },
  {
    id: 'quantum_drop',
    name: 'Quantum Drop',
    description: 'Send all scrap to base. 40%: hull −25. Skip next round.',
    introDescription: 'Emergency dump. Very dangerous.',
    rarity: 'rare',
    lootNodeEligible: true,
    energyCost: 2,
  },
];
