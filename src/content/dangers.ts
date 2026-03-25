import { RunState } from '../types/state';

export interface DangerEvent {
  id: string;
  name: string;
  description: string;
  chance: number;
}

export interface DangerResult {
  triggered: boolean;
  logMessage: string;
  runDelta: Partial<RunState>;
}

export const DANGER_LIST: DangerEvent[] = [
  { id: 'hull_creaking',     name: 'Hull Creaking',     description: 'The hull groans...',         chance: 0.20 },
  { id: 'power_surge',       name: 'Power Surge',       description: 'Electrical surge detected.', chance: 0.15 },
  { id: 'structural_stress', name: 'Structural Stress', description: 'Critical stress fracture!',  chance: 0.10 },
];

export function resolveDanger(
  danger: DangerEvent,
  run: RunState,
  dangerFactor: number = 1.0,
): DangerResult {
  const effectiveChance = danger.chance * dangerFactor * (run.analyzed ? 0.5 : 1.0);
  if (Math.random() >= effectiveChance) {
    return { triggered: false, logMessage: '', runDelta: {} };
  }

  switch (danger.id) {
    case 'hull_creaking': {
      if (run.shieldCharges > 0) {
        return {
          triggered: true,
          logMessage: 'Hull Creaking \u2014 Shield absorbed the hit!',
          runDelta: { shieldCharges: run.shieldCharges - 1 },
        };
      }
      const rawHc = run.hull - 8;
      if (rawHc <= 0 && run.deathDefianceActive) {
        return {
          triggered: true,
          logMessage: 'Hull Creaking \u2014 Death Defiance! Survived at hull 1.',
          runDelta: { hull: 1, deathDefianceActive: false },
        };
      }
      const newHull = Math.max(0, rawHc);
      return {
        triggered: true,
        logMessage: 'Hull Creaking \u2014 Hull \u22128',
        runDelta: newHull <= 0 ? { hull: newHull, phase: 'collapsed' } : { hull: newHull },
      };
    }

    case 'power_surge': {
      return {
        triggered: true,
        logMessage: 'Power Surge \u2014 Credits \u221210',
        runDelta: { runCredits: Math.max(0, run.runCredits - 10) },
      };
    }

    case 'structural_stress': {
      if (run.shieldCharges > 0) {
        return {
          triggered: true,
          logMessage: 'Structural Stress \u2014 Shield absorbed!',
          runDelta: { shieldCharges: run.shieldCharges - 1 },
        };
      }
      const rawSs = run.hull - 15;
      if (rawSs <= 0 && run.deathDefianceActive) {
        return {
          triggered: true,
          logMessage: 'Structural Stress \u2014 Death Defiance! Survived at hull 1.',
          runDelta: { hull: 1, deathDefianceActive: false },
        };
      }
      const newHull = Math.max(0, rawSs);
      return {
        triggered: true,
        logMessage: 'Structural Stress \u2014 Hull \u221215',
        runDelta: newHull <= 0 ? { hull: newHull, phase: 'collapsed' } : { hull: newHull },
      };
    }

    default:
      return { triggered: false, logMessage: '', runDelta: {} };
  }
}
