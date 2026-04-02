import { RunState, RoundHistoryEntry } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { PlayCardEvent } from './types';
import { applyOverchargeMultiplier } from './energy-utils';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

/** Effective max hull including bonus from cards like structural_reinforce. */
function effectiveMaxHull(run: RunState): number {
  return MAX_HULL + run.maxHullBonus;
}

export function applyShieldCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId, shieldGainBonus = 0, crewCount = 1 } = event;

  switch (cardId) {
    // ── Build archetype cards ──

    case 'hull_surge': {
      if (run.shieldCharges < 2) return run;
      const hadThreeOrMore = run.shieldCharges >= 3;
      return {
        ...run,
        shieldCharges: run.shieldCharges - 2,
        hull: Math.min(effectiveMaxHull(run), run.hull + (hadThreeOrMore ? 40 : 25)),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'last_stand': {
      if (run.lastStandUsed || run.hull > 35 || run.round < 5) return run;
      return {
        ...run,
        lastStandUsed: true,
        shieldCharges: run.shieldCharges + 2 + shieldGainBonus,
        dangerImmune: true,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'bulwark': {
      const newBulwarkPlays = run.bulwarkPlays + 1;
      return {
        ...run,
        bulwarkPlays: newBulwarkPlays,
        hull: Math.min(effectiveMaxHull(run), run.hull + 6),
        shieldCharges: run.shieldCharges + 1 + shieldGainBonus,
        bulwarkDangerReduction: newBulwarkPlays >= 3 ? true : run.bulwarkDangerReduction,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'shield_wall': {
      if (run.shieldCharges < 3) return run;
      return {
        ...run,
        shieldCharges: run.shieldCharges - 3,
        dangerImmune: true,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'fortress_protocol': {
      const hasShields = run.shieldCharges >= 5;
      return {
        ...run,
        runCredits: run.runCredits + (hasShields ? 2000 : 0),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'shield_bash': {
      if (run.shieldCharges < 1) return run;
      const hasManyShields = run.shieldCharges >= 5;
      return {
        ...run,
        shieldCharges: run.shieldCharges - 1,
        hull: Math.min(effectiveMaxHull(run), run.hull + 15),
        runCredits: run.runCredits + (hasManyShields ? 3000 : 0),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'mass_shields': {
      const missingHull = effectiveMaxHull(run) - run.hull;
      const shieldsToGain = Math.ceil(missingHull / 20);
      return {
        ...run,
        shieldCharges: run.shieldCharges + shieldsToGain + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'preemptive_shield': {
      const isEarly = run.round <= 3;
      return {
        ...run,
        shieldCharges: run.shieldCharges + (isEarly ? 2 : 1) + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    // ── Cooperative Common (7 cards) ──

    case 'hull_patch': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 12),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'group_effort': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 8),
        shieldCharges: run.shieldCharges + 1 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'shared_repair': {
      const heal = run.hull < 50 ? 15 : 8;
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + heal),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'solidarity': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 6),
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.05,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'team_shield': {
      // Base shield gain is 2, overcharge gives +50% = 3 shields
      let shieldGain = 2 + shieldGainBonus;
      if (event.overcharge) {
        shieldGain = applyOverchargeMultiplier(shieldGain);
      }
      return {
        ...run,
        shieldCharges: run.shieldCharges + shieldGain,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'collective_hull': {
      const bonus = crewCount >= 4 ? 1 + shieldGainBonus : 0;
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 10),
        shieldCharges: run.shieldCharges + bonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'mutual_aid': {
      const newDebuffs = run.debuffs.length > 0
        ? run.debuffs.slice(0, -1)
        : run.debuffs;
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 8),
        debuffs: newDebuffs,
        roundHistory: makeHistory(run, cardId),
      };
    }

    // ── Cooperative Uncommon (8 new + 4 already wired above) ──

    case 'triage': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 20),
        runCredits: Math.max(0, run.runCredits - 3000),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'field_medicine': {
      const heal = run.hull < 40 ? 30 : 10;
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + heal),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'emergency_repair': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 25),
        dangerImmune: run.hull < 30 ? true : run.dangerImmune,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'structural_reinforce': {
      const newBonus = run.maxHullBonus + 10;
      return {
        ...run,
        maxHullBonus: newBonus,
        hull: Math.min(MAX_HULL + newBonus, run.hull + 10),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'adaptive_defense': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 8),
        runDangerReduction: run.runDangerReduction + 0.10,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'crew_solidarity': {
      const heal = 6 * crewCount;
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + heal),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'shield_wall_prep': {
      return {
        ...run,
        shieldCharges: run.shieldCharges + 3 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'hull_buffer': {
      const newBonus = run.maxHullBonus + 5;
      return {
        ...run,
        maxHullBonus: newBonus,
        hull: Math.min(MAX_HULL + newBonus, run.hull + 15),
        roundHistory: makeHistory(run, cardId),
      };
    }

    // ── Cooperative Rare (8 new + shield_wall already wired above) ──

    case 'last_bastion': {
      if (run.hull <= 80 || run.lastBastionUsed) return run;
      return {
        ...run,
        lastBastionUsed: true,
        shieldCharges: run.shieldCharges + 3 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'collective_recovery': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 20),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'mass_healing': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 25),
        shieldCharges: run.shieldCharges + 2 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'perimeter': {
      return {
        ...run,
        shieldCharges: run.shieldCharges + 4 + shieldGainBonus,
        runDangerReduction: run.runDangerReduction + 0.20,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'bulwark_surge': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 30),
        shieldCharges: run.shieldCharges + 3 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'fortress_lockdown': {
      const skip = run.shieldCharges >= 5
        ? Math.max(run.dangerSkipRemaining, 2)
        : Math.max(run.dangerSkipRemaining, 1);
      return {
        ...run,
        dangerSkipRemaining: skip,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'hull_fortress': {
      const newBonus = run.maxHullBonus + 15;
      return {
        ...run,
        maxHullBonus: newBonus,
        hull: Math.min(MAX_HULL + newBonus, run.hull + 40),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'crew_miracle': {
      if (run.hull > 20 || run.crewMiracleUsed) return run;
      return {
        ...run,
        crewMiracleUsed: true,
        hull: 80,
        shieldCharges: run.shieldCharges + 2 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'iron_covenant': {
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 20),
        shieldCharges: run.shieldCharges + 2 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    default:
      return null;
  }
}
