// Handlers for START_DIVE and DIVE_EVENT actions.

import { GameState, RunState } from '../../types/state';
import { reduceRun } from '../../dive/diveReducer';
import { getPurchasedTiersForBranch } from '../../content/void-communion';
import { getCurrentTier } from '../../content/death-lessons';
import { computeCrewEffects, CrewMemberId } from '../../content/crew';
import { computeHardwareEffects } from '../hardware-effects';
import { computeModuleEffects } from '../module-effects';
import { computeCrewAssignmentEffects } from '../crew-assignment-effects';
import { MAX_ENERGY } from '../../config/constants';

export function handleStartDive(state: GameState): GameState | null {
  if (state.meta.energy < 1) return null;

  const freshRun = reduceRun({} as Parameters<typeof reduceRun>[0], { type: 'START_DIVE' });

  const survivorTiers = getPurchasedTiersForBranch(state.meta.purchasedVoidTiers, 'survivor');
  const vcShields = survivorTiers.reduce(
    (sum, t) => sum + (t.effect.type === 'starting_shields' ? t.effect.value : 0),
    0,
  );

  const deathTier = getCurrentTier(state.meta.totalCollapses);
  const dlShields = deathTier?.effect.type === 'starting_shield' ? deathTier.effect.amount : 0;
  const dlCredits = deathTier?.effect.type === 'starting_credits' ? deathTier.effect.amount : 0;

  const crewEffects = computeCrewEffects(state.meta.leadId, state.meta.companionIds);
  const crewShields = crewEffects.reduce(
    (sum, e) => sum + (e.type === 'shield_start' ? e.amount : 0),
    0,
  );

  const hw = computeHardwareEffects(state.meta.equippedItems);
  const modFx = computeModuleEffects(state.meta.moduleLevels);
  const effectiveCap = MAX_ENERGY + modFx.energyCapBonus;
  const energyAfterBonus = Math.min(effectiveCap, state.meta.energy + hw.startingEnergyBonus);
  const startingHull = Math.min(150, 100 + hw.hullMaxBonus);

  const startAwakeIds: CrewMemberId[] = [
    ...(state.meta.leadId !== null ? [state.meta.leadId] : []),
    ...state.meta.companionIds,
  ];
  const assignFx = computeCrewAssignmentEffects(state.meta.crewAssignments, startAwakeIds);

  const runWithBonuses: RunState = {
    ...freshRun,
    hull: Math.min(150, startingHull + assignFx.hullStartBonus),
    shieldCharges: freshRun.shieldCharges + vcShields + dlShields + crewShields + hw.shieldStartBonus,
    runCredits: freshRun.runCredits + dlCredits,
  };

  return {
    ...state,
    meta: { ...state.meta, energy: energyAfterBonus - 1 },
    currentRun: runWithBonuses,
  };
}

/** Returns the new state, or null if the run should be ended (extracted/collapsed). */
export function handleDiveEvent(
  state: GameState,
  event: Parameters<typeof reduceRun>[1],
): { state: GameState; shouldEnd: boolean } {
  if (state.currentRun === null) return { state, shouldEnd: false };

  const updatedRun = reduceRun(state.currentRun, event);
  if (updatedRun.phase === 'extracted' || updatedRun.phase === 'collapsed') {
    return { state: { ...state, currentRun: updatedRun }, shouldEnd: true };
  }
  return { state: { ...state, currentRun: updatedRun }, shouldEnd: false };
}
