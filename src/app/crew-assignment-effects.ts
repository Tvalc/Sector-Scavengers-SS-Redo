import type { CrewMemberId } from '../content/crew';
import type { AssignmentSlotId } from '../content/crew-assignments';

export interface CrewAssignmentEffects {
  /** Extra hull repair progress steps added per run. */
  repairBonus: number;
  /** Extra credits added to scavenge / risky-scavenge outcomes per dive. */
  scavengeBonusFlat: number;
  /** Extra starting hull added at dive start (capped by caller). */
  hullStartBonus: number;
  /** Extra percentage points added to salvage sale value multiplier. */
  saleBonusPct: number;
  /** Research points bonus per dive. */
  researchBonus: number;
}

const ZERO_EFFECTS: CrewAssignmentEffects = {
  repairBonus: 0,
  scavengeBonusFlat: 0,
  hullStartBonus: 0,
  saleBonusPct: 0,
  researchBonus: 0,
};

export function computeCrewAssignmentEffects(
  assignments: Partial<Record<CrewMemberId, AssignmentSlotId>>,
  awakeIds: CrewMemberId[],
): CrewAssignmentEffects {
  if (awakeIds.length === 0) return { ...ZERO_EFFECTS };

  const effects: CrewAssignmentEffects = { ...ZERO_EFFECTS };

  for (const crewId of awakeIds) {
    const slot = assignments[crewId];
    if (!slot || slot === 'idle') continue;

    switch (slot) {
      case 'repairs':
        effects.repairBonus += 1;
        break;
      case 'scav_prep':
        effects.scavengeBonusFlat += 500;
        break;
      case 'medbay':
        effects.hullStartBonus += 8;
        break;
      case 'market_ops':
        effects.saleBonusPct += 5;
        break;
      case 'research':
        effects.researchBonus += 1;
        break;
    }
  }

  return effects;
}
