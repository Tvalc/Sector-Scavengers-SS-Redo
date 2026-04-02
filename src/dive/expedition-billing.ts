// Per-ship billing logic with debt ceiling checks.

import type { RunPath, BillingHistoryEntry } from '../types/state';
import {
  EXPEDITION_SHIP_BILLING_PERCENT,
  BILLING_MISSED_PENALTY_RATE,
  EXPEDITION_DEBT_CEILING,
  MAX_MISSED_PAYMENTS,
} from '../config/constants';

/** Minimum billing amount floor. */
const MIN_BILLING_FLOOR = 1000;

/** Result of processing a ship billing. */
export interface ShipBillingResult {
  paid: boolean;
  billingAmount: number;
  creditsBefore: number;
  creditsAfter: number;
  debtBefore: number;
  debtAfter: number;
  penaltyAdded: number;
  strikeAdded: boolean;
  strikeCount: number;
  ceilingHit: boolean;
  victoryAchieved: boolean;
  failed: boolean;
  shipNumber: number;
}

/** Check expedition status after billing. */
export type ExpeditionStatus = 'ongoing' | 'victory' | 'failed';

/**
 * Calculate the billing amount for a ship (30% of current debt, with 1000 floor).
 */
export function calculateShipBilling(debt: number): number {
  const billing = Math.floor(debt * EXPEDITION_SHIP_BILLING_PERCENT);
  return Math.max(billing, MIN_BILLING_FLOOR);
}

/**
 * Process billing for a completed ship.
 *
 * Rules:
 * - Calculate billing as 30% of current debt (min 1000)
 * - If player can pay: subtract from credits, reduce debt, reset strikes
 * - If player can't pay: debt doubles (penalty rate), increment strike
 * - If debt > ceiling after miss: expedition fails (ceiling death)
 * - If strikes >= 3: expedition fails (strike out)
 * - If debt <= 0: expedition victory
 */
export function processShipBilling(
  path: RunPath,
  credits: number,
): ShipBillingResult {
  const debtBefore = path.expeditionDebt;
  const billingAmount = calculateShipBilling(debtBefore);
  const creditsBefore = credits;
  const shipNumber = path.shipsCompleted + 1;

  let paid = false;
  let creditsAfter = creditsBefore;
  let debtAfter = debtBefore;
  let penaltyAdded = 0;
  let strikeAdded = false;
  let strikeCount = path.expeditionMissedPayments;
  let ceilingHit = false;
  let victoryAchieved = path.expeditionVictory;
  let failed = path.expeditionFailed;

  // Check if already failed or victorious
  if (failed || victoryAchieved) {
    return {
      paid: false,
      billingAmount,
      creditsBefore,
      creditsAfter,
      debtBefore,
      debtAfter: path.expeditionDebt,
      penaltyAdded: 0,
      strikeAdded: false,
      strikeCount: path.expeditionMissedPayments,
      ceilingHit: false,
      victoryAchieved,
      failed,
      shipNumber,
    };
  }

  // Determine if player can pay
  if (creditsBefore >= billingAmount) {
    // Paid successfully
    paid = true;
    creditsAfter = creditsBefore - billingAmount;
    debtAfter = debtBefore - billingAmount;
    strikeCount = 0; // Reset strikes on successful payment
    penaltyAdded = 0;
    strikeAdded = false;

    // Check for victory (debt cleared)
    if (debtAfter <= 0) {
      debtAfter = 0;
      victoryAchieved = true;
    }
  } else {
    // Missed payment
    paid = false;
    penaltyAdded = Math.floor(debtBefore * BILLING_MISSED_PENALTY_RATE);
    debtAfter = debtBefore + penaltyAdded;
    strikeCount = path.expeditionMissedPayments + 1;
    strikeAdded = true;

    // Check for ceiling hit (debt death)
    if (debtAfter >= EXPEDITION_DEBT_CEILING) {
      debtAfter = EXPEDITION_DEBT_CEILING;
      ceilingHit = true;
      failed = true;
    }

    // Check for strike out (3 strikes)
    if (strikeCount >= MAX_MISSED_PAYMENTS && !failed) {
      failed = true;
    }
  }

  // Create billing history entry
  const historyEntry: BillingHistoryEntry = {
    shipNumber,
    amount: billingAmount,
    paid,
  };

  // Update the path
  path.expeditionDebt = debtAfter;
  path.expeditionMissedPayments = strikeCount;
  path.expeditionBillingHistory.push(historyEntry);
  path.pathCredits = creditsAfter;

  if (victoryAchieved) {
    path.expeditionVictory = true;
  }
  if (failed) {
    path.expeditionFailed = true;
  }

  return {
    paid,
    billingAmount,
    creditsBefore,
    creditsAfter,
    debtBefore,
    debtAfter,
    penaltyAdded,
    strikeAdded,
    strikeCount,
    ceilingHit,
    victoryAchieved: path.expeditionVictory,
    failed: path.expeditionFailed,
    shipNumber,
  };
}

/**
 * Check the current expedition status.
 */
export function checkExpeditionStatus(path: RunPath): ExpeditionStatus {
  if (path.expeditionVictory) {
    return 'victory';
  }
  if (path.expeditionFailed) {
    return 'failed';
  }
  return 'ongoing';
}

/**
 * Preview what debt would be after a missed payment (capped at ceiling).
 * Used for UI to show "If you miss, debt will be X".
 */
export function getDebtAfterMiss(debt: number): number {
  const penalty = Math.floor(debt * BILLING_MISSED_PENALTY_RATE);
  const newDebt = debt + penalty;
  return Math.min(newDebt, EXPEDITION_DEBT_CEILING);
}

/**
 * Preview what debt would be after a successful payment.
 * Used for UI to show "If you pay, debt will be X".
 */
export function getDebtAfterPayment(debt: number): number {
  const billing = calculateShipBilling(debt);
  const newDebt = debt - billing;
  return Math.max(0, newDebt);
}

/**
 * Get formatted strike count display (e.g., "0/3", "2/3 ⚠️").
 */
export function formatStrikes(strikes: number): string {
  const warning = strikes >= 2 ? ' ⚠️' : '';
  return `${strikes}/${MAX_MISSED_PAYMENTS}${warning}`;
}

/**
 * Check if the expedition is at risk of failing on next miss.
 */
export function isAtRisk(path: RunPath): boolean {
  // At risk if 2 strikes (one more = 3 = fail)
  const strikeRisk = path.expeditionMissedPayments >= MAX_MISSED_PAYMENTS - 1;

  // At risk if missing would hit ceiling
  const projectedDebt = getDebtAfterMiss(path.expeditionDebt);
  const ceilingRisk = projectedDebt >= EXPEDITION_DEBT_CEILING;

  return strikeRisk || ceilingRisk;
}
