// Cryo pool definitions — wake costs and path-based initial cryo assignments.

import { CrewMemberId } from './crew';
import { OpeningPathId } from './opening-paths';

/** Power cells consumed to wake one crew member from cryo. */
export const WAKE_COST_POWER_CELLS = 2;

/** Debt added to the ledger when waking a crew member from cryo (contract liability). */
export const WAKE_DEBT_COST = 300;

/** Passenger debt transfer amount when crew are rescued/awakened during intro (per crew member). */
export const PASSENGER_DEBT_TRANSFER = 84700;

/** All crew members in roster order. */
const ALL_CREW: CrewMemberId[] = ['max', 'imani', 'jax', 'sera', 'rook', 'del', 'vex', 'nyx'];

/**
 * Returns the crew members that start in cryo for a given opening path.
 * Active crew (lead + companions) for each path:
 *   cold_extract : none active        → all 8 in cryo (including new build crew)
 *   cut_and_run  : jax (lead), del    → remaining 6 in cryo (includes vex)
 *   duty_claim   : max (lead), sera, rook → remaining 5 in cryo (includes nyx)
 */
export function getCryoPoolForPath(path: OpeningPathId): CrewMemberId[] {
  const activeByPath: Record<OpeningPathId, CrewMemberId[]> = {
    cold_extract: [],
    cut_and_run:  ['jax', 'del'],
    duty_claim:   ['max', 'sera', 'rook'],
  };
  const active = new Set(activeByPath[path]);
  const pool = ALL_CREW.filter((id) => !active.has(id));
  // Add build-specific crew to appropriate pools
  if (path === 'cut_and_run') {
    return pool.includes('vex') ? pool : [...pool, 'vex'];
  }
  if (path === 'duty_claim') {
    return pool.includes('nyx') ? pool : [...pool, 'nyx'];
  }
  if (path === 'cold_extract') {
    // Solo path can discover both build crews
    let extended = pool;
    if (!extended.includes('vex')) extended = [...extended, 'vex'];
    if (!extended.includes('nyx')) extended = [...extended, 'nyx'];
    return extended;
  }
  return pool;
}
