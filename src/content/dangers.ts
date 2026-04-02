import { RunState } from '../types/state';

export interface DangerEvent {
  id: string;
  name: string;
  description: string;
  chance: number;
  minRound: number;
}

export interface DangerResult {
  triggered: boolean;
  logMessage: string;
  runDelta: Partial<RunState>;
}

export const DANGER_LIST: DangerEvent[] = [
  { id: 'hull_creaking', name: 'Hull Creaking', description: 'The hull groans...', chance: 0.20, minRound: 1 },
  { id: 'power_surge', name: 'Power Surge', description: 'Electrical surge detected.', chance: 0.15, minRound: 1 },
  { id: 'structural_stress', name: 'Structural Stress', description: 'Critical stress fracture!', chance: 0.10, minRound: 1 },
  { id: 'void_leak', name: 'Void Leak', description: 'Hull breach detected. Pressure dropping.', chance: 0.18, minRound: 4 },
  { id: 'reactor_flare', name: 'Reactor Flare', description: 'Radiation spike detected.', chance: 0.14, minRound: 4 },
  { id: 'deep_fracture', name: 'Deep Fracture', description: 'Massive structural failure.', chance: 0.12, minRound: 7 },
  { id: 'crew_panic', name: 'Crew Panic', description: 'Psychological stress event.', chance: 0.10, minRound: 7 },
];

export function resolveDanger(
  danger: DangerEvent,
  run: RunState,
  dangerFactor: number = 1.0,
  round: number,
  isBossRound: boolean = false,
): DangerResult {
  // Skip dangers that haven't activated yet based on round bracket
  // Boss round: all dangers are active, ignore minRound
  if (!isBossRound && round < danger.minRound) {
    return { triggered: false, logMessage: '', runDelta: {} };
  }

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
        logMessage: 'Power Surge \u2014 Credits \u22121000',
        runDelta: { runCredits: Math.max(0, run.runCredits - 1000) },
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

    case 'void_leak': {
      // Void Leak bypasses shields entirely — both damage and credits lost
      const rawVl = run.hull - 10;
      if (rawVl <= 0 && run.deathDefianceActive) {
        return {
          triggered: true,
          logMessage: 'Void Leak \u2014 Death Defiance! Survived at hull 1, but credits still lost.',
          runDelta: { hull: 1, deathDefianceActive: false, runCredits: Math.max(0, run.runCredits - 1500) },
        };
      }
      const newHull = Math.max(0, rawVl);
      return {
        triggered: true,
        logMessage: 'Void Leak \u2014 Hull \u221210, Credits \u22121500',
        runDelta: newHull <= 0
          ? { hull: newHull, phase: 'collapsed', runCredits: Math.max(0, run.runCredits - 1500) }
          : { hull: newHull, runCredits: Math.max(0, run.runCredits - 1500) },
      };
    }

    case 'reactor_flare': {
      // Reactor Flare consumes 2 shield charges if available
      if (run.shieldCharges >= 2) {
        return {
          triggered: true,
          logMessage: 'Reactor Flare \u2014 2 shields consumed',
          runDelta: { shieldCharges: run.shieldCharges - 2 },
        };
      }
      if (run.shieldCharges === 1) {
        // 1 shield blocks but leaves 0
        return {
          triggered: true,
          logMessage: 'Reactor Flare \u2014 Shield absorbed partial, energy depleted',
          runDelta: { shieldCharges: 0 },
        };
      }
      // No shields — take hull damage
      const rawRf = run.hull - 20;
      if (rawRf <= 0 && run.deathDefianceActive) {
        return {
          triggered: true,
          logMessage: 'Reactor Flare \u2014 Death Defiance! Survived at hull 1.',
          runDelta: { hull: 1, deathDefianceActive: false },
        };
      }
      const newHull = Math.max(0, rawRf);
      return {
        triggered: true,
        logMessage: 'Reactor Flare \u2014 Hull \u221220',
        runDelta: newHull <= 0 ? { hull: newHull, phase: 'collapsed' } : { hull: newHull },
      };
    }

    case 'deep_fracture': {
      if (run.shieldCharges > 0) {
        return {
          triggered: true,
          logMessage: 'Deep Fracture \u2014 Shield absorbed!',
          runDelta: { shieldCharges: run.shieldCharges - 1 },
        };
      }
      const rawDf = run.hull - 30;
      if (rawDf <= 0 && run.deathDefianceActive) {
        return {
          triggered: true,
          logMessage: 'Deep Fracture \u2014 Death Defiance! Survived at hull 1.',
          runDelta: { hull: 1, deathDefianceActive: false },
        };
      }
      const newHull = Math.max(0, rawDf);
      return {
        triggered: true,
        logMessage: 'Deep Fracture \u2014 Hull \u221230',
        runDelta: newHull <= 0 ? { hull: newHull, phase: 'collapsed' } : { hull: newHull },
      };
    }

    case 'crew_panic': {
      return {
        triggered: true,
        logMessage: 'Crew Panic \u2014 Next draw discards 1 card randomly',
        runDelta: { forcedDiscard: true },
      };
    }

    default:
      return { triggered: false, logMessage: '', runDelta: {} };
  }
}
