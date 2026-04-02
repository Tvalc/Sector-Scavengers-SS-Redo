import type { ShipNodeType } from '../../types/state';

/**
 * Danger scaling configuration for different ship node types.
 */
export interface DangerScaling {
  /** Multiplier applied to base danger chance. */
  chanceMultiplier: number;
  /** If true, danger always fires (no roll needed). */
  guaranteed: boolean;
  /** Additional chance added for boss escalation (round × 0.1). */
  escalationPerRound?: number;
}

/**
 * Get danger scaling for a ship node type.
 * 
 * - standard: baseline (1.0× chance)
 * - elite: increased danger (1.25× chance), loot nodes offer 4 cards
 * - miniboss: guaranteed danger every round (20-35 hull damage)
 * - boss: escalating danger (starts 0.6, +0.05 per round, capped 0.95)
 * - shop: no danger
 */
export function getDangerScaling(nodeType: ShipNodeType): DangerScaling {
  switch (nodeType) {
    case 'standard':
      return { chanceMultiplier: 1.0, guaranteed: false };
    case 'elite':
      return { chanceMultiplier: 1.25, guaranteed: false };
    case 'miniboss':
      // Miniboss: guaranteed danger with heavy hull damage (20-35 per round)
      return { chanceMultiplier: 2.0, guaranteed: true };
    case 'boss':
      // Boss: starts at 0.6 base chance, escalates 0.05 per round, capped at 0.95
      return { chanceMultiplier: 3.0, guaranteed: false, escalationPerRound: 0.05 };
    case 'shop':
      return { chanceMultiplier: 0, guaranteed: false };
    default:
      return { chanceMultiplier: 1.0, guaranteed: false };
  }
}

/**
 * Get miniboss damage range for guaranteed danger.
 * Miniboss hazards deal 20-35 hull damage per round.
 */
export function getMinibossDamageRange(): { min: number; max: number } {
  return { min: 20, max: 35 };
}

/**
 * Shared types and card name lookup for the card-effects module.
 */

export interface PlayCardEvent {
  type: 'PLAY_CARD';
  cardId: string;
  scavengeBonus?: number;
  shieldGainBonus?: number;
  shieldToHullRegen?: number;
  botDamageReduction?: boolean;
  upgradeNoHullCost?: boolean;
  botCreditBonusPerBot?: number;
  /** Number of awake crew members (lead + companions), for crew-scaling cards. */
  crewCount?: number;
  /** Whether this card is being overcharged (+1⚡ for enhanced effect). */
  overcharge?: boolean;
}

/**
 * Energy calculation result for a card play.
 */
export interface EnergyResult {
  /** Base energy cost of the card. */
  cost: number;
  /** Energy refunded after playing (from card effects). */
  refund: number;
  /** Net energy change (cost - refund, negative means energy gained). */
  net: number;
}

export const CARD_NAME_MAP: Record<string, string> = {
  // Starter cards
  scavenge: 'Scavenge',
  repair: 'Repair',
  extract: 'Extract',
  shield: 'Shield',
  analyze: 'Analyze',
  upgrade: 'Upgrade',

  // Base utility cards
  diagnostic: 'Diagnostic',

  // Common cards
  patch_and_hold: 'Patch & Hold',
  risky_scavenge: 'Risky Scavenge',
  secure_extract: 'Secure Extract',
  quick_extract: 'Quick Extract',

  // Upgraded scavenge
  precision_scavenge: 'Precision Scavenge',
  salvage_beacon: 'Salvage Beacon',

  // Upgraded repair
  field_repair: 'Field Repair',
  emergency_overhaul: 'Emergency Overhaul',

  // Upgraded diagnostic
  deep_scan: 'Deep Scan',
  tactical_assessment: 'Tactical Assessment',

  // Upgraded shield
  reinforced_shield: 'Reinforced Shield',
  ablative_screen: 'Ablative Screen',

  // Upgraded extract
  priority_extract: 'Priority Extract',
  emergency_beacon: 'Emergency Beacon',

  // Mid-run salvage relay cards (replacing credit cards)
  basic_relay: 'Basic Relay',
  secure_channel: 'Secure Channel',
  smugglers_relay: "Smuggler's Relay",
  quantum_drop: 'Quantum Drop',

  // Doctrine signature cards
  corporate_mandate: 'Corporate Mandate',
  crew_effort: 'Crew Effort',
  black_market: 'Black Market',

  // Void/Death lesson cards
  void_siphon: 'Void Siphon',
  void_shield: 'Void Shield',
  echo_extract: 'Echo Extract',
  ancestor_memory: 'Ancestor Memory',
  death_defiance: 'Death Defiance',
  echo_drain: 'Echo Drain',
  void_touched: 'Void Touched',
  desperate_measures: 'Desperate Measures',
  debt_renegotiation: 'Debt Renegotiation',
  last_gasp: 'Last Gasp',
  scorched_extract: 'Scorched Extract',
  bitter_experience: 'Bitter Experience',
  defiant_last_stand: 'Defiant Last Stand',
  survivors_instinct: "Survivor's Instinct",

  // Build archetype cards
  repair_bot: 'Repair Bot',
  scavenge_bot: 'Scavenge Bot',
  overdrive_extract: 'Overdrive Extract',
  hull_surge: 'Hull Surge',
  last_stand: 'Last Stand',
  bulwark: 'Bulwark',

  // Corporate cards
  salvage_sweep: 'Salvage Sweep',
  credit_sweep: 'Salvage Sweep', // backward compatibility
  routine_extract: 'Routine Extract',
  protocol_scan: 'Protocol Scan',
  debt_audit: 'Debt Audit',
  risk_assessment: 'Risk Assessment',
  hull_investment_prep: 'Hull Investment Prep',
  efficiency_drive: 'Efficiency Drive',
  corporate_override: 'Corporate Override',
  credit_forecast: 'Credit Forecast',
  marathon: 'Marathon',
  audit_immunity: 'Audit Immunity',
  mandate_override: 'Mandate Override',
  debt_leveraging: 'Debt Leveraging',
  hostile_extraction: 'Hostile Extraction',
  debt_conversion: 'Debt Conversion',
  threat_analysis: 'Threat Analysis',
  sector_lockdown: 'Sector Lockdown',
  extended_contract: 'Extended Contract',
  efficiency_protocol: 'Efficiency Protocol',
  hull_investment: 'Hull Investment',
  corporate_lockdown: 'Corporate Lockdown',
  mass_extraction: 'Mass Extraction',
  debt_write_off: 'Debt Write-Off',
  executive_order: 'Executive Order',
  profit_margin: 'Profit Margin',
  sector_monopoly: 'Sector Monopoly',
  emergency_extraction: 'Emergency Extraction',
  hostile_takeover: 'Hostile Takeover',
  corporate_espionage: 'Corporate Espionage',
  full_audit: 'Full Audit',

  // Cooperative cards
  hull_patch: 'Hull Patch',
  group_effort: 'Group Effort',
  shared_repair: 'Shared Repair',
  solidarity: 'Solidarity',
  team_shield: 'Team Shield',
  collective_hull: 'Collective Hull',
  mutual_aid: 'Mutual Aid',
  shield_bash: 'Shield Bash',
  mass_shields: 'Mass Shields',
  fortress_protocol: 'Fortress Protocol',
  preemptive_shield: 'Preemptive Shield',
  triage: 'Triage',
  field_medicine: 'Field Medicine',
  emergency_repair: 'Emergency Repair',
  structural_reinforce: 'Structural Reinforce',
  adaptive_defense: 'Adaptive Defense',
  crew_solidarity: 'Crew Solidarity',
  shield_wall_prep: 'Shield Wall Prep',
  hull_buffer: 'Hull Buffer',
  shield_wall: 'Shield Wall',
  last_bastion: 'Last Bastion',
  collective_recovery: 'Collective Recovery',
  mass_healing: 'Mass Healing',
  perimeter: 'Perimeter',
  bulwark_surge: 'Bulwark Surge',
  fortress_lockdown: 'Fortress Lockdown',
  hull_fortress: 'Hull Fortress',
  crew_miracle: 'Crew Miracle',
  iron_covenant: 'Iron Covenant',

  // Smuggler cards
  quick_loot: 'Quick Loot',
  shadow_run: 'Shadow Run',
  off_books: 'Off Books',
  salvage_grab: 'Salvage Grab',
  risk_it: 'Risk It',
  opportunist: 'Opportunist',
  street_deal: 'Street Deal',
  bot_swarm: 'Bot Swarm',
  calculated_scrap: 'Calculated Scrap',
  calculated_risk: 'Calculated Risk',
  adrenaline_junkie: 'Adrenaline Junkie',
  deep_salvage: 'Deep Salvage',
  sector_sweep: 'Sector Sweep',
  ghost_claim: 'Ghost Claim',
  salvage_protocol: 'Salvage Protocol',
  overclock_bots: 'Overclock Bots',
  bot_army: 'Bot Army',
  reinforced_bots: 'Reinforced Bots',
  danger_rush: 'Danger Rush',
  danger_profit: 'Danger Profit',
  void_run: 'Void Run',
  high_stakes: 'High Stakes',
  black_ops: 'Black Ops',
  salvage_king: 'Salvage King',
  ghost_protocol: 'Ghost Protocol',
  maximum_risk: 'Maximum Risk',
  bot_empire: 'Bot Empire',
  underworld_contact: 'Underworld Contact',
  shadow_extraction: 'Shadow Extraction',
  void_smuggler: 'Void Smuggler',

  // Research/Signal cards
  salvage_override: 'Salvage Override',
  distress_response: 'Distress Response',
  audit_bribe: 'Audit Bribe',
  void_pulse: 'Void Pulse',
  entropy_gift: 'Entropy Gift',
  ancestral_extract: 'Ancestral Extract',
  premonition: 'Premonition',
  echo_amplifier_card: 'Echo Amplifier',
  void_communion_card: 'Void Communion',
  scrap_memory: 'Scrap Memory',
};
