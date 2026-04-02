// Salvage types collected during dives and stored in hub inventory.

export type SalvageTier = 'scrap' | 'components' | 'relic' | 'medtech';

export interface SalvageEntry {
  tier: SalvageTier;
  quantity: number;
  valueEach: number;
}

/** Input for rolling salvage with quantity range */
export interface SalvageRollInput {
  tier: SalvageTier;
  min: number;
  max: number;
}

export const SALVAGE_DEFS: Record<SalvageTier, { label: string; baseValue: number; color: string }> = {
  scrap:      { label: 'Scrap',      baseValue: 1500,  color: '#a0aec0' },
  components: { label: 'Components', baseValue: 4000,  color: '#63b3ed' },
  relic:      { label: 'Relic',      baseValue: 12000, color: '#f6e05e' },
  medtech:    { label: 'Medtech',    baseValue: 8000,  color: '#68d391' },
};

/** Helper: Random integer between min and max (inclusive) */
function rollRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create a SalvageEntry with either a specific quantity or randomized range.
 * If minQuantity and maxQuantity are provided, rolls a random value between them.
 * Otherwise uses the fixed quantity.
 */
export function createSalvageEntry(
  tier: SalvageTier,
  quantity: number,
  minQuantity?: number,
  maxQuantity?: number,
): SalvageEntry {
  const finalQuantity = minQuantity !== undefined && maxQuantity !== undefined
    ? rollRange(minQuantity, maxQuantity)
    : quantity;
  return { tier, quantity: finalQuantity, valueEach: SALVAGE_DEFS[tier].baseValue };
}

/**
 * Roll a single salvage yield with randomized quantity.
 * @returns A SalvageEntry with quantity rolled between min and max
 */
export function rollSalvageYield(tier: SalvageTier, min: number, max: number): SalvageEntry {
  const quantity = rollRange(min, max);
  return { tier, quantity, valueEach: SALVAGE_DEFS[tier].baseValue };
}

/**
 * Roll multiple salvage yields at once.
 * Useful for cards that award multiple types of salvage.
 * @returns Array of SalvageEntry with rolled quantities
 */
export function rollMultipleSalvage(yields: SalvageRollInput[]): SalvageEntry[] {
  return yields.map(({ tier, min, max }) => rollSalvageYield(tier, min, max));
}

/**
 * Format a salvage quantity range for card descriptions.
 * Example: formatSalvageRange(1, 4, 'scrap') => "1-4 scrap"
 */
export function formatSalvageRange(min: number, max: number, tier: SalvageTier): string {
  const def = SALVAGE_DEFS[tier];
  if (min === max) {
    return `${min} ${def.label.toLowerCase()}`;
  }
  return `${min}-${max} ${def.label.toLowerCase()}`;
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

/**
 * Remove a quantity of salvage from existing entries by tier.
 * If quantity exceeds available, removes the entire entry.
 * Returns new array with reduced or removed entry. Pure function.
 */
export function removeSalvage(existing: SalvageEntry[], tier: SalvageTier, quantity: number): SalvageEntry[] {
  const idx = existing.findIndex((e) => e.tier === tier);
  if (idx === -1) return existing;

  const entry = existing[idx];
  const newQuantity = entry.quantity - quantity;

  if (newQuantity <= 0) {
    // Remove the entry entirely
    return existing.filter((_, i) => i !== idx);
  }

  // Reduce quantity
  return existing.map((e, i) =>
    i === idx ? { ...e, quantity: newQuantity } : e,
  );
}
