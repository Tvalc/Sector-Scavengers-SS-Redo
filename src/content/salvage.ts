// Salvage types collected during dives and stored in hub inventory.

export type SalvageTier = 'scrap' | 'components' | 'relic' | 'medtech';

export interface SalvageEntry {
  tier: SalvageTier;
  quantity: number;
  valueEach: number;
}

export const SALVAGE_DEFS: Record<SalvageTier, { label: string; baseValue: number; color: string }> = {
  scrap:      { label: 'Scrap',      baseValue: 15,  color: '#a0aec0' },
  components: { label: 'Components', baseValue: 40,  color: '#63b3ed' },
  relic:      { label: 'Relic',      baseValue: 120, color: '#f6e05e' },
  medtech:    { label: 'Medtech',    baseValue: 80,  color: '#68d391' },
};

/** Create a fresh SalvageEntry using the tier's base value. */
export function createSalvageEntry(tier: SalvageTier, quantity: number): SalvageEntry {
  return { tier, quantity, valueEach: SALVAGE_DEFS[tier].baseValue };
}

/**
 * Merge `entry` into `existing` by tier.
 * If a matching tier is already present, increments its quantity.
 * Otherwise appends a new entry. Pure — returns a new array.
 */
export function addSalvage(existing: SalvageEntry[], entry: SalvageEntry): SalvageEntry[] {
  const idx = existing.findIndex((e) => e.tier === entry.tier);
  if (idx === -1) {
    return [...existing, { ...entry }];
  }
  return existing.map((e, i) =>
    i === idx ? { ...e, quantity: e.quantity + entry.quantity } : e,
  );
}
