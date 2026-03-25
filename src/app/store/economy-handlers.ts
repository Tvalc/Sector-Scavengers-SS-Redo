// Handlers for salvage sales, debt, energy recharge, and power cells.

import { GameState } from '../../types/state';
import { SalvageTier, addSalvage, createSalvageEntry } from '../../content/salvage';
import { CrewMemberId } from '../../content/crew';
import { computeModuleEffects } from '../module-effects';
import { computeCrewAssignmentEffects } from '../crew-assignment-effects';
import { MAX_ENERGY, RECHARGE_COST, EMERGENCY_RECHARGE_COST, SCRAP_JOB_CREDIT_REWARD, SCRAP_JOB_SCRAP_QUANTITY } from '../../config/constants';

function awakeIds(meta: GameState['meta']): CrewMemberId[] {
  return [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];
}

export function handleSellSalvage(state: GameState, tier: SalvageTier): GameState {
  const { meta } = state;
  const entryIdx = meta.hubInventory.findIndex((e) => e.tier === tier && e.quantity > 0);
  if (entryIdx === -1) return state;

  const entry = meta.hubInventory[entryIdx];
  const newQuantity = entry.quantity - 1;
  const newInventory = newQuantity === 0
    ? meta.hubInventory.filter((_, i) => i !== entryIdx)
    : meta.hubInventory.map((e, i) => i === entryIdx ? { ...e, quantity: newQuantity } : e);

  const modFx = computeModuleEffects(meta.moduleLevels);
  const assignFx = computeCrewAssignmentEffects(meta.crewAssignments, awakeIds(meta));
  const saleValue = Math.floor(
    entry.valueEach * (1 + (modFx.saleBonusPct + assignFx.saleBonusPct) / 100),
  );

  return {
    ...state,
    meta: { ...meta, credits: meta.credits + saleValue, hubInventory: newInventory },
  };
}

export function handleSellAllLowTier(state: GameState): GameState {
  const { meta } = state;
  const lowTiers: SalvageTier[] = ['scrap', 'components'];

  const modFx = computeModuleEffects(meta.moduleLevels);
  const assignFx = computeCrewAssignmentEffects(meta.crewAssignments, awakeIds(meta));
  const saleMultiplier = 1 + (modFx.saleBonusPct + assignFx.saleBonusPct) / 100;

  let totalValue = 0;
  const remaining = meta.hubInventory.filter((e) => {
    if (lowTiers.includes(e.tier)) {
      totalValue += Math.floor(e.quantity * e.valueEach * saleMultiplier);
      return false;
    }
    return true;
  });

  if (totalValue === 0) return state;

  return {
    ...state,
    meta: { ...meta, credits: meta.credits + totalValue, hubInventory: remaining },
  };
}

export function handlePayDebt(state: GameState, amount: number): GameState {
  const { meta } = state;
  if (meta.debt <= 0) return state;
  if (meta.credits < amount) return state;

  const payment = Math.min(amount, meta.debt);
  return {
    ...state,
    meta: { ...meta, credits: meta.credits - payment, debt: meta.debt - payment },
  };
}

export function handleRechargeEnergy(state: GameState): GameState {
  const { meta } = state;
  const modFx = computeModuleEffects(meta.moduleLevels);
  const effectiveCost = Math.floor(RECHARGE_COST * (1 - modFx.marketDiscountPct / 100));
  const effectiveCap = MAX_ENERGY + modFx.energyCapBonus;
  if (meta.credits < effectiveCost) return state;
  if (meta.energy >= effectiveCap) return state;

  return {
    ...state,
    meta: { ...meta, credits: meta.credits - effectiveCost, energy: meta.energy + 1 },
  };
}

export function handleRechargeEnergyEmergency(state: GameState): GameState {
  const { meta } = state;
  if (meta.energy !== 0) return state;
  if (meta.credits < EMERGENCY_RECHARGE_COST) return state;

  return {
    ...state,
    meta: {
      ...meta,
      credits: meta.credits - EMERGENCY_RECHARGE_COST,
      energy: meta.energy + 1,
    },
  };
}

export function handleScrapJob(state: GameState): GameState {
  const { meta } = state;
  if (!meta.scrapJobAvailable) return state;

  const updatedInventory = addSalvage(
    meta.hubInventory,
    createSalvageEntry('scrap', SCRAP_JOB_SCRAP_QUANTITY),
  );

  return {
    ...state,
    meta: {
      ...meta,
      credits: meta.credits + SCRAP_JOB_CREDIT_REWARD,
      hubInventory: updatedInventory,
      scrapJobAvailable: false,
    },
  };
}

export function handleGainPowerCells(state: GameState, amount: number): GameState {
  if (amount <= 0) return state;
  return {
    ...state,
    meta: { ...state.meta, powerCells: state.meta.powerCells + amount },
  };
}
