import { RunState } from '../../types/state';

/**
 * Apply hull damage respecting Death Defiance.
 * If hull would reach <= 0 and deathDefianceActive is true, survive at hull 1.
 */
export function applyHullDamage(
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
