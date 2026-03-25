// Handlers for tutorial, repair slot, and module upgrade actions.

import { GameState } from '../../types/state';
import { ModuleId, getModuleDef } from '../../content/modules';
import { SalvageTier } from '../../content/salvage';

export function handleCompleteTutorial(state: GameState): GameState {
  return {
    ...state,
    meta: { ...state.meta, tutorialCompleted: true, tutorialStep: 6 },
  };
}

export function handleAdvanceTutorialStep(state: GameState): GameState {
  if (state.meta.tutorialCompleted) return state;
  return {
    ...state,
    meta: { ...state.meta, tutorialStep: state.meta.tutorialStep + 1 },
  };
}

export function handleSetActiveRepair(state: GameState, shipId: string | null): GameState {
  return { ...state, meta: { ...state.meta, activeRepairShipId: shipId } };
}

export function handleUpgradeModule(state: GameState, moduleId: ModuleId): GameState | null {
  const { meta } = state;
  const def = getModuleDef(moduleId);
  if (!def) return state;

  const currentLevel = meta.moduleLevels[moduleId] ?? 0;
  const nextUpgrade = def.upgrades.find((u) => u.level === currentLevel + 1);
  if (!nextUpgrade) return state;
  if (meta.credits < nextUpgrade.creditCost) return state;

  const salvageCost = nextUpgrade.salvageCost;
  for (const [tier, required] of Object.entries(salvageCost) as Array<[SalvageTier, number]>) {
    const held = meta.hubInventory.find((e) => e.tier === tier);
    if (!held || held.quantity < (required ?? 0)) return null; // signal: notify only
  }

  let newInventory = [...meta.hubInventory];
  for (const [tier, required] of Object.entries(salvageCost) as Array<[SalvageTier, number]>) {
    const idx = newInventory.findIndex((e) => e.tier === tier);
    if (idx === -1) continue;
    const newQty = newInventory[idx].quantity - (required ?? 0);
    newInventory = newQty <= 0
      ? newInventory.filter((_, i) => i !== idx)
      : newInventory.map((e, i) => i === idx ? { ...e, quantity: newQty } : e);
  }

  return {
    ...state,
    meta: {
      ...meta,
      credits: meta.credits - nextUpgrade.creditCost,
      hubInventory: newInventory,
      moduleLevels: { ...meta.moduleLevels, [moduleId]: currentLevel + 1 },
    },
  };
}
