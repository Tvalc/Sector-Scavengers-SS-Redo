/**
 * Post-Ship Progress Formatters
 *
 * Value formatting and salvage calculations.
 */

import type { SalvageEntry } from '../../../content/salvage';
import { formatDebt } from '../../../dive/expedition-starting-debt';

/** Format number with thousand separators. */
export const formatNum = (n: number): string => n.toLocaleString('en-US');

/** @deprecated Use formatDebt from expedition-starting-debt instead */
export function formatCredits(n: number): string {
  return formatDebt(n);
}

/** Count total salvage items across all entries. */
export function getTotalSalvageCount(salvage: SalvageEntry[]): number {
  return salvage.reduce((sum, entry) => sum + entry.quantity, 0);
}

/** Calculate total market value of all salvage. */
export function getSalvageValue(salvage: SalvageEntry[]): number {
  return salvage.reduce((sum, entry) => sum + entry.valueEach * entry.quantity, 0);
}
