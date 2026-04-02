// Extracted from game-store.ts — handles end-of-run billing cycle logic.

import { MetaState, BillingResult, RunPath } from '../types/state';
import { 
  BILLING_MISSED_PENALTY_RATE, 
  MAX_DEBT_BEFORE_GAME_OVER, 
  MAX_MISSED_PAYMENTS,
  BASE_BILLING_AMOUNT,
  BILLING_CYCLE_RUNS
} from '../config/constants';

/**
 * Check if the game is over due to debt or missed payments.
 */
export function checkGameOver(meta: MetaState): { gameOver: boolean; reason: string | null } {
  if (meta.debt >= MAX_DEBT_BEFORE_GAME_OVER) {
    return { gameOver: true, reason: 'Debt exceeded 10 million credits.' };
  }
  if (meta.consecutiveMissedPayments >= MAX_MISSED_PAYMENTS) {
    return { gameOver: true, reason: '3 consecutive missed payments.' };
  }
  return { gameOver: false, reason: null };
}

/**
 * Process billing at the end of an expedition (win or collapse).
 * Billing now fires once per expedition completion, not per individual ship.
 *
 * Upkeep pressure: the effective bill adds
 * `activeCrewCount * upkeepPerAwakeCrew` on top of the base `billingAmount`.
 * 
 * LOSE CONDITIONS:
 * - Debt exceeds 10 million credits
 * - 3 consecutive missed payments
 * 
 * Missed payment penalty: debt doubles (100% penalty added).
 */
export function processBilling(meta: MetaState, path?: RunPath | null): MetaState {
  // Billing now happens once per expedition end
  // We don't use countdown anymore - billing triggers on expedition completion

  // Compute crew upkeep surcharge (50K per awake crew member)
  const activeCrewCount = (meta.leadId !== null ? 1 : 0) + meta.companionIds.length;
  const upkeepSurcharge = activeCrewCount * meta.upkeepPerAwakeCrew;
  
  // If we have path data, use accumulated path credits for payment
  const availableCredits = path ? path.pathCredits : meta.credits;
  const effectiveBillingAmount = meta.billingAmount + upkeepSurcharge;

  if (availableCredits >= effectiveBillingAmount) {
    // Paid successfully — reset missed payment counter
    const result: BillingResult = {
      paid: true,
      amount: effectiveBillingAmount,
      penaltyAdded: 0,
    };
    return {
      ...meta,
      // Path credits are consumed to pay debt; any remainder is lost (not kept)
      debt: Math.max(0, meta.debt - effectiveBillingAmount),
      billingRunsUntilNext: BILLING_CYCLE_RUNS,
      lastBillingResult: result,
      consecutiveMissedPayments: 0, // Reset on successful payment
    };
  } else {
    // Missed — debt increases by billing amount plus penalty
    const penalty = Math.ceil(effectiveBillingAmount * BILLING_MISSED_PENALTY_RATE);
    const result: BillingResult = {
      paid: false,
      amount: effectiveBillingAmount,
      penaltyAdded: penalty,
    };
    const newConsecutiveMissed = meta.consecutiveMissedPayments + 1;
    return {
      ...meta,
      debt: meta.debt + penalty,
      billingRunsUntilNext: BILLING_CYCLE_RUNS,
      lastBillingResult: result,
      consecutiveMissedPayments: newConsecutiveMissed,
    };
  }
}
