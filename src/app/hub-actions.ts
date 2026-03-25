// Hub action availability helper — returns enabled/disabled state with reason strings.

import type { MetaState } from '../types/state';
import { computeModuleEffects } from './module-effects';
import { MAX_ENERGY, RECHARGE_COST, EMERGENCY_RECHARGE_COST } from '../config/constants';

export interface HubActionStatus {
  canDive: boolean;
  diveReason: string;
  canRecharge: boolean;
  rechargeReason: string;
  canEmergency: boolean;
  emergencyReason: string;
  canSellSalvage: boolean;
  sellReason: string;
  canScrapJob: boolean;
  scrapJobReason: string;
  nextBestHint: string;
  nextBestColor: '#68d391' | '#f6e05e' | '#f6ad55' | '#fc8181';
}

export function getHubAvailableActions(meta: MetaState): HubActionStatus {
  const modFx = computeModuleEffects(meta.moduleLevels);
  const effectiveCap = MAX_ENERGY + modFx.energyCapBonus;
  const effectiveRechargeCost = Math.floor(RECHARGE_COST * (1 - modFx.marketDiscountPct / 100));

  // Dive
  const canDive = meta.energy >= 1;
  const diveReason = canDive ? '' : 'No energy — recharge first';

  // Standard recharge
  const canRecharge = meta.credits >= effectiveRechargeCost && meta.energy < effectiveCap;
  let rechargeReason = '';
  if (!canRecharge) {
    if (meta.energy >= effectiveCap) {
      rechargeReason = 'Energy full';
    } else {
      rechargeReason = `Need ₡${effectiveRechargeCost}`;
    }
  }

  // Emergency recharge (energy=0 only)
  const canEmergency = meta.energy === 0 && meta.credits >= EMERGENCY_RECHARGE_COST;
  const emergencyReason = canEmergency ? '' : `Need ₡${EMERGENCY_RECHARGE_COST}`;

  // Sell salvage
  const canSellSalvage =
    meta.hubInventory.length > 0 && meta.hubInventory.some((e) => e.quantity > 0);
  const sellReason = canSellSalvage ? '' : 'No salvage to sell';

  // Scrap job
  const canScrapJob = meta.scrapJobAvailable;
  const scrapJobReason = canScrapJob ? '' : 'On cooldown (1 run)';

  // Next best hint
  let nextBestHint: string;
  let nextBestColor: HubActionStatus['nextBestColor'];

  if (canDive) {
    nextBestHint = '▶ START YOUR DIVE';
    nextBestColor = '#68d391';
  } else if (canRecharge) {
    nextBestHint = `▶ RECHARGE ENERGY  (₡${effectiveRechargeCost})`;
    nextBestColor = '#f6e05e';
  } else if (canEmergency) {
    nextBestHint = `▶ EMERGENCY RECHARGE  (₡${EMERGENCY_RECHARGE_COST})`;
    nextBestColor = '#f6ad55';
  } else if (canSellSalvage) {
    nextBestHint = '▶ SELL SALVAGE';
    nextBestColor = '#f6e05e';
  } else if (canScrapJob) {
    nextBestHint = '▶ SCRAP JOB  (free, 1-run cooldown)';
    nextBestColor = '#f6ad55';
  } else {
    nextBestHint = '⚠ LOADING BAILOUT...';
    nextBestColor = '#fc8181';
  }

  return {
    canDive,
    diveReason,
    canRecharge,
    rechargeReason,
    canEmergency,
    emergencyReason,
    canSellSalvage,
    sellReason,
    canScrapJob,
    scrapJobReason,
    nextBestHint,
    nextBestColor,
  };
}
