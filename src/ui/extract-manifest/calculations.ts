// Extract Manifest — Value Calculations

import { RunState, HaulDecision } from '../../types/state';
import { getDecision, getSmuggledCount, getSmuggledIndices } from './state';
import { SalvageEntry } from '../../content/salvage';

export function getDeclaredValue(salvage: SalvageEntry[]): number {
  let total = 0;
  for (let i = 0; i < salvage.length; i++) {
    if (getDecision(i) === 'declare') {
      const entry = salvage[i];
      total += entry.valueEach * entry.quantity;
    }
  }
  return total;
}

export function getExtractionBonusPercent(run: RunState): number {
  return Math.round((run.pendingExtractBonusPct ?? 0) * 100);
}

export function getFinalHaulValue(run: RunState): number {
  const baseValue = getDeclaredValue(run.salvage);
  const bonusMultiplier = 1 + (run.pendingExtractBonusPct ?? 0);
  return Math.floor(baseValue * bonusMultiplier);
}

export function getKeptSalvage(salvage: SalvageEntry[]): SalvageEntry[] {
  const kept: SalvageEntry[] = [];
  const smuggledIndices = getSmuggledIndices(salvage);
  for (const idx of smuggledIndices) {
    kept.push(salvage[idx]);
  }
  return kept;
}

export function buildDecisions(salvage: SalvageEntry[]): HaulDecision[] {
  const decisions: HaulDecision[] = [];
  for (let i = 0; i < salvage.length; i++) {
    const entry = salvage[i];
    const action = getDecision(i);
    decisions.push({
      itemTier: entry.tier,
      quantity: entry.quantity,
      valueEach: entry.valueEach,
      action,
    });
  }
  return decisions;
}

export function calculateSuspicionLevel(salvage: SalvageEntry[]): number {
  const totalValue = salvage.reduce((sum, e) => sum + e.valueEach * e.quantity, 0);
  if (totalValue === 0) return 0;
  const smuggledValue = getKeptSalvage(salvage).reduce((sum, e) => sum + e.valueEach * e.quantity, 0);
  return smuggledValue / totalValue;
}
