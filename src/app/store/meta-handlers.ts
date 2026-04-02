// Handlers for tutorial, repair slot, and module upgrade actions.

import { GameState, TutorialPhase } from '../../types/state';
import { ModuleId, getModuleDef } from '../../content/modules';
import { SalvageTier } from '../../content/salvage';
import type { CrewMemberId } from '../../content/crew';

export function handleCompleteTutorial(state: GameState): GameState {
  return {
    ...state,
    meta: { ...state.meta, tutorialCompleted: true, tutorialPhase: 'completed' as TutorialPhase },
  };
}

export function handleAdvanceTutorialPhase(state: GameState, phase: TutorialPhase): GameState {
  if (state.meta.tutorialCompleted) return state;
  const flagUpdates: Partial<Pick<GameState['meta'], 'tutorialSeenExtraction' | 'tutorialSeenCollapse'>> = {};
  if (phase === 'result-extracted') flagUpdates.tutorialSeenExtraction = true;
  if (phase === 'result-collapsed') flagUpdates.tutorialSeenCollapse = true;
  return {
    ...state,
    meta: { ...state.meta, tutorialPhase: phase, ...flagUpdates },
  };
}

export function handleSetActiveRepair(state: GameState, shipId: string | null): GameState {
  return { ...state, meta: { ...state.meta, activeRepairShipId: shipId } };
}

/**
 * Assign a crew member as captain of a claimed ship.
 * Returns null if ship is not claimed or crew is already captaining another ship.
 */
export function handleAssignCaptain(
  state: GameState,
  shipId: string,
  crewId: CrewMemberId,
): GameState | null {
  const ship = state.meta.ships.find((s) => s.id === shipId);
  if (!ship || ship.status !== 'claimed') return null;

  // Check if crew is already captaining another ship
  const alreadyCaptain = state.meta.ships.some((s) => s.captainedBy === crewId);
  if (alreadyCaptain) return null;

  // Check if crew is awake (in leadId or companionIds)
  const isAwake =
    state.meta.leadId === crewId ||
    state.meta.companionIds.includes(crewId);
  if (!isAwake) return null;

  const updatedShips = state.meta.ships.map((s) =>
    s.id === shipId ? { ...s, captainedBy: crewId } : s,
  );

  return { ...state, meta: { ...state.meta, ships: updatedShips } };
}

/**
 * Unassign captain from a ship.
 */
export function handleUnassignCaptain(state: GameState, shipId: string): GameState | null {
  const ship = state.meta.ships.find((s) => s.id === shipId);
  if (!ship || ship.status !== 'claimed') return null;
  if (ship.captainedBy === null) return null;

  const updatedShips = state.meta.ships.map((s) =>
    s.id === shipId ? { ...s, captainedBy: null } : s,
  );

  return { ...state, meta: { ...state.meta, ships: updatedShips } };
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
