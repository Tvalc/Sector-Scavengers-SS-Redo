import { RunState } from '../types/state';
import { MAX_HULL } from '../config/constants';
import { createSalvageEntry, addSalvage } from '../content/salvage';

/**
 * Apply hull damage respecting Death Defiance.
 * If hull would reach <= 0 and deathDefianceActive is true, survive at hull 1.
 */
function applyHullDamage(
  run: RunState,
  damage: number,
): Pick<RunState, 'hull' | 'phase' | 'deathDefianceActive'> {
  const rawHull = run.hull - damage;
  if (rawHull <= 0 && run.deathDefianceActive) {
    return { hull: 1, phase: run.phase, deathDefianceActive: false };
  }
  const newHull = Math.max(0, rawHull);
  return {
    hull: newHull,
    phase: newHull <= 0 ? 'collapsed' : run.phase,
    deathDefianceActive: run.deathDefianceActive,
  };
}

export type DiveEvent =
  | { type: 'START_DIVE' }
  | { type: 'PLAY_CARD'; cardId: string; scavengeBonus?: number }
  | { type: 'NEXT_ROUND' }
  // Shield block consumed — called before applying danger hull damage.
  | { type: 'APPLY_SHIELD_BLOCK' };

export function reduceRun(run: RunState, event: DiveEvent): RunState {
  switch (event.type) {
    case 'START_DIVE':
      return {
        round: 1,
        maxRounds: 10,
        hull: 100,
        runCredits: 0,
        phase: 'active',
        shieldCharges: 0,
        analyzed: false,
        debtIncrease: 0,
        voidEchoGain: 0,
        ancestorMemoryActive: false,
        deathDefianceActive: false,
        salvage: [],
        itemsFound: [],
        powerCellsGained: 0,
      };

    case 'PLAY_CARD': {
      switch (event.cardId) {
        case 'scavenge': {
          const bonus = event.scavengeBonus ?? 0;
          const damageHull = Math.random() < 0.15;
          const hullResult = damageHull ? applyHullDamage(run, 10) : null;
          const gainCell = Math.random() < 0.15;
          return {
            ...run,
            runCredits: run.runCredits + 20 + bonus,
            salvage: addSalvage(run.salvage, createSalvageEntry('scrap', 1)),
            powerCellsGained: gainCell ? run.powerCellsGained + 1 : run.powerCellsGained,
            ...(hullResult ?? {}),
          };
        }

        case 'repair':
          return {
            ...run,
            hull: Math.min(MAX_HULL, run.hull + 15),
          };

        case 'extract':
          return {
            ...run,
            phase: 'extracted',
          };

        case 'shield':
          return {
            ...run,
            shieldCharges: run.shieldCharges + 1,
          };

        case 'upgrade': {
          const hullResult = applyHullDamage(run, 8);
          return {
            ...run,
            maxRounds: run.maxRounds + 2,
            ...hullResult,
          };
        }

        case 'analyze':
          return {
            ...run,
            analyzed: true,
          };

        case 'risky_scavenge': {
          const bonus = event.scavengeBonus ?? 0;
          const takeDamage = Math.random() < 0.35;
          const hullResult = takeDamage ? applyHullDamage(run, 20) : null;
          // 20% chance to find a common/uncommon item
          const riskyItemPool = [
            'hull_plating', 'basic_scanner', 'power_cell',
            'ablative_armor', 'deep_scanner', 'extraction_rig',
          ];
          const foundItem =
            Math.random() < 0.20
              ? riskyItemPool[Math.floor(Math.random() * riskyItemPool.length)]
              : null;
          return {
            ...run,
            runCredits: run.runCredits + 40 + bonus,
            salvage: addSalvage(run.salvage, createSalvageEntry('components', 1)),
            itemsFound: foundItem !== null ? [...run.itemsFound, foundItem] : run.itemsFound,
            ...(hullResult ?? {}),
          };
        }

        case 'secure_extract': {
          if (run.hull < 50) return run;
          return {
            ...run,
            phase: 'extracted',
            runCredits: Math.floor(run.runCredits * 1.10),
          };
        }

        case 'quick_extract':
          return {
            ...run,
            phase: 'extracted',
            runCredits: Math.floor(run.runCredits * 0.85),
          };

        case 'patch_and_hold':
          return {
            ...run,
            hull: Math.min(MAX_HULL, run.hull + 8),
            shieldCharges: run.shieldCharges + 1,
            runCredits: Math.max(0, run.runCredits - 20),
          };

        case 'corporate_mandate':
          return {
            ...run,
            phase: 'extracted',
            runCredits: Math.floor(run.runCredits * 1.2),
            debtIncrease: run.debtIncrease + 200,
          };

        case 'crew_effort':
          return {
            ...run,
            hull: Math.min(MAX_HULL, run.hull + 12),
            shieldCharges: run.shieldCharges + 1,
          };

        case 'black_market': {
          const takeDamage = Math.random() < 0.50;
          const hullResult = takeDamage ? applyHullDamage(run, 15) : null;
          // Always drops an item: 70% common/uncommon, 30% rare
          const bmCommonPool = [
            'hull_plating', 'basic_scanner', 'power_cell',
            'ablative_armor', 'deep_scanner', 'extraction_rig',
          ];
          const bmRarePool = ['reactive_shell', 'void_sensor', 'shield_emitter'];
          const bmPool = Math.random() < 0.30 ? bmRarePool : bmCommonPool;
          const bmItem = bmPool[Math.floor(Math.random() * bmPool.length)];
          return {
            ...run,
            runCredits: run.runCredits + 60,
            salvage: addSalvage(run.salvage, createSalvageEntry('relic', 1)),
            itemsFound: [...run.itemsFound, bmItem],
            ...(hullResult ?? {}),
          };
        }

        case 'void_siphon':
          return {
            ...run,
            runCredits: run.runCredits + 30,
            voidEchoGain: run.voidEchoGain + 1,
          };

        case 'void_shield':
          return {
            ...run,
            shieldCharges: run.shieldCharges + 2,
          };

        case 'echo_extract':
          return {
            ...run,
            phase: 'extracted',
            voidEchoGain: run.voidEchoGain + 2,
          };

        case 'ancestor_memory':
          return {
            ...run,
            ancestorMemoryActive: true,
          };

        case 'death_defiance':
          return {
            ...run,
            deathDefianceActive: true,
          };

        default:
          return run;
      }
    }

    case 'APPLY_SHIELD_BLOCK':
      return {
        ...run,
        shieldCharges: Math.max(0, run.shieldCharges - 1),
      };

    case 'NEXT_ROUND': {
      if (run.phase !== 'active') return run;
      if (run.round >= run.maxRounds) {
        // max rounds reached — force collapse
        return { ...run, phase: 'collapsed' };
      }
      return { ...run, round: run.round + 1, analyzed: false };
    }
  }
}
