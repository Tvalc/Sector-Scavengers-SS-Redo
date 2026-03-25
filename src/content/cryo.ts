// Cryo pool definitions — wake costs and path-based initial cryo assignments.

import { CrewMemberId } from './crew';
import { OpeningPathId } from './opening-paths';

/** Power cells consumed to wake one crew member from cryo. */
export const WAKE_COST_POWER_CELLS = 2;

/** Debt added to the ledger when waking a crew member (contract liability). */
export const WAKE_DEBT_COST = 300;

/** All crew members in roster order. */
const ALL_CREW: CrewMemberId[] = ['max', 'imani', 'jax', 'sera', 'rook', 'del'];

/**
 * Returns the crew members that start in cryo for a given opening path.
 * Active crew (lead + companions) for each path:
 *   cold_extract : none active        → all 6 in cryo
 *   cut_and_run  : jax (lead), del    → remaining 4 in cryo
 *   duty_claim   : max (lead), sera, rook → remaining 3 in cryo
 */
export function getCryoPoolForPath(path: OpeningPathId): CrewMemberId[] {
  const activeByPath: Record<OpeningPathId, CrewMemberId[]> = {
    cold_extract: [],
    cut_and_run:  ['jax', 'del'],
    duty_claim:   ['max', 'sera', 'rook'],
  };
  const active = new Set(activeByPath[path]);
  return ALL_CREW.filter((id) => !active.has(id));
}
