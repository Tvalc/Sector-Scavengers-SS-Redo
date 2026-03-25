// Centralized game constants — single source of truth for all magic numbers.
// Import from here instead of hard-coding values in feature files.

/** Maximum player energy charges. */
export const MAX_ENERGY = 5;

/** Credit cost to recharge one energy. */
export const RECHARGE_COST = 200;

/** Credit cost for emergency recharge (usable only when energy === 0). */
export const EMERGENCY_RECHARGE_COST = 100;

/** How long (ms) a toast notification stays on screen. */
export const TOAST_DURATION_MS = 1500;

/** Maximum number of log lines shown in the dive event log. */
export const LOG_MAX_LINES = 6;

/** Fraction of billing amount added to debt when a bill is missed. */
export const BILLING_MISSED_PENALTY_RATE = 0.1;

/** Maximum hull integrity for a ship during a dive. */
export const MAX_HULL = 100;
