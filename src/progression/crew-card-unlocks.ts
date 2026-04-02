import type { MetaState } from '../types/state';
import type { CrewMemberId } from '../content/crew';

/**
 * Crew card unlock table — each crew member unlocks specific cards at L2 and L3.
 * These cards are permanently added to the player's unlockedCards pool when the
 * crew member reaches the respective level.
 *
 * Unlock schedule:
 * - Level 2: 3 runs participated
 * - Level 3: 8 runs participated
 */
export const CREW_CARD_UNLOCKS: Record<
  CrewMemberId,
  { level2: string; level3: string }
> = {
  max: {
    level2: 'emergency_repair',
    level3: 'structural_reinforce',
  },
  imani: {
    level2: 'threat_assessment',
    level3: 'danger_profit',
  },
  jax: {
    level2: 'calculated_risk',
    level3: 'deep_salvage',
  },
  sera: {
    level2: 'triage',
    level3: 'field_medicine',
  },
  rook: {
    level2: 'preemptive_shield',
    level3: 'shield_wall',
  },
  del: {
    level2: 'debt_leveraging',
    level3: 'hostile_extraction',
  },
  vex: {
    level2: 'bot_swarm',
    level3: 'overclock_bots',
  },
  nyx: {
    level2: 'shield_bash',
    level3: 'last_bastion',
  },
};

/**
 * Apply crew card unlocks for crew members who have leveled up.
 * Adds the unlocked card IDs to the meta's unlockedCards pool permanently.
 *
 * @param meta - Current meta state
 * @param leveledUpCrew - Array of crew IDs and their new levels
 * @returns Updated meta state with new cards added to unlockedCards
 */
export function applyCrewCardUnlocks(
  meta: MetaState,
  leveledUpCrew: Array<{ id: CrewMemberId; newLevel: number }>,
): MetaState {
  const newCardIds: string[] = [];

  for (const { id, newLevel } of leveledUpCrew) {
    const unlocks = CREW_CARD_UNLOCKS[id];
    if (!unlocks) continue;

    // L2 unlock at level 2 or higher
    if (newLevel >= 2 && !meta.unlockedCards.includes(unlocks.level2)) {
      newCardIds.push(unlocks.level2);
    }

    // L3 unlock at level 3
    if (newLevel >= 3 && !meta.unlockedCards.includes(unlocks.level3)) {
      newCardIds.push(unlocks.level3);
    }
  }

  // If no new cards to add, return unchanged
  if (newCardIds.length === 0) {
    return meta;
  }

  // Add all new cards to unlockedCards (avoiding duplicates with Set)
  const updatedUnlockedCards = [
    ...meta.unlockedCards,
    ...newCardIds.filter((id) => !meta.unlockedCards.includes(id)),
  ];

  return {
    ...meta,
    unlockedCards: updatedUnlockedCards,
  };
}
