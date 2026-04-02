import { MetaState } from '../types/state';
import { CrewMemberId, CREW_ORDER, isCrewUnlocked } from '../content/crew';

/**
 * Check which crew members are newly unlockable and return their IDs.
 * This is called after each run ends to detect mid-progression unlocks
 * (e.g., Imani after 3 extracts, Vex after doctrine lock, Nyx after 5 extracts).
 *
 * Crew already in cryoPool or already awake (leadId/companionIds) are excluded.
 */
export function checkCrewUnlocks(meta: MetaState): CrewMemberId[] {
  const newlyUnlocked: CrewMemberId[] = [];

  // Get all crew that are already available (awake or in cryo)
  const availableCrew = new Set<CrewMemberId>([
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
    ...meta.cryoPool,
  ]);

  for (const crewId of CREW_ORDER) {
    // Skip if already available
    if (availableCrew.has(crewId)) continue;

    // Check if now unlocked
    if (isCrewUnlocked(crewId, meta)) {
      newlyUnlocked.push(crewId);
    }
  }

  return newlyUnlocked;
}

/**
 * Add newly unlocked crew to the cryo pool.
 * Returns the updated MetaState with new crew added to cryoPool.
 */
export function addUnlockedCrewToCryo(meta: MetaState): MetaState {
  const newlyUnlocked = checkCrewUnlocks(meta);

  if (newlyUnlocked.length === 0) {
    return meta;
  }

  return {
    ...meta,
    cryoPool: [...meta.cryoPool, ...newlyUnlocked],
  };
}
