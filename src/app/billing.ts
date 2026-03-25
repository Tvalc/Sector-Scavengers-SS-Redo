// Extracted from game-store.ts — handles end-of-run billing cycle logic.

import { MetaState, BillingResult } from '../types/state';
import { BILLING_MISSED_PENALTY_RATE } from '../config/constants';

/**
 * Advance the billing countdown by one run and, if the bill is due, attempt
 * to collect payment. Returns an updated MetaState with credits, debt, and
 * lastBillingResult reflecting the outcome.
 *
 * Upkeep pressure: the effective bill for this cycle adds
 * `(activeCrewCount - 1) * upkeepPerAwakeCrew` on top of the base
 * `billingAmount`. The base is NOT permanently changed — this is a
 * per-cycle surcharge that reflects crew life-support contracts.
 */
export function processBilling(meta: MetaState): MetaState {
  const newCountdown = meta.billingRunsUntilNext - 1;

  // Bill not yet due
  if (newCountdown > 0) {
    return { ...meta, billingRunsUntilNext: newCountdown };
  }

  // Bill is due — reset countdown
  const resetCountdown = meta.billingCycleRuns;

  // Compute crew upkeep surcharge
  const activeCrewCount = (meta.leadId !== null ? 1 : 0) + meta.companionIds.length;
  const upkeepSurcharge = Math.max(0, activeCrewCount - 1) * meta.upkeepPerAwakeCrew;
  const effectiveBillingAmount = meta.billingAmount + upkeepSurcharge;

  if (meta.credits >= effectiveBillingAmount) {
    // Paid successfully
    const result: BillingResult = {
      paid: true,
      amount: effectiveBillingAmount,
      penaltyAdded: 0,
    };
    return {
      ...meta,
      credits: meta.credits - effectiveBillingAmount,
      debt: Math.max(0, meta.debt - effectiveBillingAmount),
      billingRunsUntilNext: resetCountdown,
      lastBillingResult: result,
    };
  } else {
    // Missed — add penalty percentage of effective amount to debt
    const penalty = Math.ceil(effectiveBillingAmount * BILLING_MISSED_PENALTY_RATE);
    const result: BillingResult = {
      paid: false,
      amount: effectiveBillingAmount,
      penaltyAdded: penalty,
    };
    return {
      ...meta,
      debt: meta.debt + penalty,
      billingRunsUntilNext: resetCountdown,
      lastBillingResult: result,
    };
  }
}
