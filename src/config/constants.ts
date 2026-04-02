// Centralized game constants — single source of truth for all magic numbers.
// Import from here instead of hard-coding values in feature files.

// ── Expedition Debt System ───────────────────────────────────────────────

/** Percentage of expedition debt billed per ship completion (0.30 = 30%). */
export const EXPEDITION_SHIP_BILLING_PERCENT = 0.30;

/** Base starting debt for a new expedition (1 million credits). */
export const EXPEDITION_DEBT_BASE = 1_000_000;

/** Additional debt per awakened crew member at expedition start (+50k per crew). */
export const EXPEDITION_DEBT_PER_CREW = 50_000;

/** Ship type multipliers for expedition debt calculation. */
export const SHIP_DEBT_MULTIPLIER = {
  STANDARD: 1.0,
  ELITE: 1.15,
  MINIBOSS: 1.3,
  BOSS: 1.5,
} as const;

/** Maximum expedition debt before automatic failure (10 million credits = death). */
export const EXPEDITION_DEBT_CEILING = 10_000_000;

/** How long (ms) a toast notification stays on screen. */
export const TOAST_DURATION_MS = 1500;

/** Maximum number of log lines shown in the dive event log. */
export const LOG_MAX_LINES = 6;

/** Fraction of billing amount added to debt when a bill is missed. 
 *  At 1.0, missed payment causes debt to double (penalty = full amount).
 */
export const BILLING_MISSED_PENALTY_RATE = 1.0;

/** Maximum hull integrity for a ship during a dive. */
export const MAX_HULL = 100;

/** Starting debt for new players (1 million credits). */
export const STARTING_DEBT = 1000000;

/** Base billing amount per cycle (250K credits).
 * Billing now fires once per expedition completion (win or collapse), not per ship.
 */
export const BASE_BILLING_AMOUNT = 250000;

/** Upkeep cost per awake crew member per billing cycle (50K credits). */
export const UPKEEP_PER_CREW = 50000;

/** Maximum debt before automatic game over (10 million credits). */
export const MAX_DEBT_BEFORE_GAME_OVER = 10000000;

/** Number of consecutive missed payments before game over. */
export const MAX_MISSED_PAYMENTS = 3;

/** Billing cycle runs — now 1 (triggers once per expedition, not per ship). */
export const BILLING_CYCLE_RUNS = 1;

// ── Echo Economy ─────────────────────────────────────────────────────────

/** Void echo cost to wake one crew member from cryo. */
export const WAKE_ECHO_COST = 2;

/** Base void echo earned on extract. */
export const ECHO_PER_EXTRACT_BASE = 2;

/** Additional void echo earned per 5 rounds completed on extract. */
export const ECHO_PER_5_ROUNDS = 1;

// ── In-Run Energy System ──────────────────────────────────────────────────

/** Energy at the start of each ship battle. */
export const ENERGY_PER_SHIP_START = 3;

/** Maximum in-run energy cap. */
export const ENERGY_MAX = 5;

/** Energy regenerated at the start of each round. */
export const ENERGY_REGEN_PER_ROUND = 1;

/** Energy cost to draw one extra card beyond the base hand. */
export const ENERGY_DRAW_COST = 1;

/** Rounds hardware remains on cooldown after use. */
export const HARDWARE_COOLDOWN_ROUNDS = 2;

/** Multiplier for overcharged card effects (1.5 = +50%). */
export const ENERGY_OVERCHARGE_MULTIPLIER = 1.5;

/** Energy spent threshold for Corporate doctrine bonus. */
export const CORPORATE_ENERGY_BONUS_THRESHOLD = 3;

/** Credits gained when Corporate energy bonus threshold is met. */
export const CORPORATE_ENERGY_BONUS_CREDITS = 1000;

// ── Information-Energy Economy Balance ─────────────────────────────────

/**
 * Tiered Information Costs - "Scout vs Act" Decision Framework
 * 
 * At 3⚡ starting energy, players face meaningful tradeoffs:
 * - 3× Tier 1 info cards (0⚡ each): Full recon round, no actions
 * - 1× Tier 2 + 1× Tier 1: Balanced scout-act combo
 * - 1× Action (1-2⚡) + 2× Tier 1: Action-heavy with minimal intel
 * 
 * Reserve Burn (at max energy) reduces effective info cost by 1⚡,
 * encouraging info-gathering when energy is full.
 */

/** Tier 1 Info: Hull bracket/status only (0⚡). */
export const INFO_REVEAL_HULL_TIER_1_COST = 0;

/** Tier 2 Info: Exact hull OR next node/danger (1⚡). */
export const INFO_REVEAL_HULL_TIER_2_COST = 1;

/** Tier 3 Info: Full situational awareness - hull + 2-round forecast (2⚡). */
export const INFO_REVEAL_FORECAST_TIER_3_COST = 2;

/** Danger magnitude damage ranges for forecast display. */
export const DANGER_MAGNITUDE_RANGES = {
  low: { min: 5, max: 15, description: 'Minor hazard' },
  medium: { min: 15, max: 25, description: 'Significant threat' },
  high: { min: 25, max: 40, description: 'Severe danger' },
} as const;

// ── Extract Manifest Audit ─────────────────────────────────────────────────

/** Base detection rate for relic tier salvage (0.55 = 55%). */
export const AUDIT_DETECTION_RELIC = 0.55;

/** Base detection rate for medtech tier salvage (0.40 = 40%). */
export const AUDIT_DETECTION_MEDTECH = 0.40;

/** Base detection rate for components tier salvage (0.25 = 25%). */
export const AUDIT_DETECTION_COMPONENTS = 0.25;

/** Base detection rate for scrap tier salvage (0.10 = 10%). */
export const AUDIT_DETECTION_SCRAP = 0.10;

/** Debt penalty multiplier for caught smuggled items (1.5 = 1.5x item value). */
export const AUDIT_PENALTY_MULTIPLIER = 1.5;

/** Flat audit reduction (percentage points) when smuggler doctrine is locked. */
export const SMUGGLER_DOCTRINE_AUDIT_BONUS = 20;
