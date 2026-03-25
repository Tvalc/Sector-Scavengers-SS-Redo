// Handlers for crew and equipment actions: equip/unequip, cryo, assignments.

import { GameState } from '../../types/state';
import { ItemSlot, getItemById } from '../../content/hardware';
import { CrewMemberId } from '../../content/crew';
import { AssignmentSlotId } from '../../content/crew-assignments';
import { computeModuleEffects } from '../module-effects';
import { WAKE_COST_POWER_CELLS, WAKE_DEBT_COST } from '../../content/cryo';

export function handleEquipItem(state: GameState, slot: ItemSlot, itemId: string): GameState {
  const { meta } = state;
  const item = getItemById(itemId);
  if (!item) return state;
  if (item.slot !== slot) return state;
  if (!meta.itemInventory.includes(itemId)) return state;

  let newInventory = meta.itemInventory.filter((id) => id !== itemId);
  const displaced = meta.equippedItems[slot];
  if (displaced !== null) {
    newInventory = [...newInventory, displaced];
  }

  return {
    ...state,
    meta: {
      ...meta,
      equippedItems: { ...meta.equippedItems, [slot]: itemId },
      itemInventory: newInventory,
    },
  };
}

export function handleUnequipItem(state: GameState, slot: ItemSlot): GameState {
  const { meta } = state;
  const equipped = meta.equippedItems[slot];
  if (equipped === null) return state;

  return {
    ...state,
    meta: {
      ...meta,
      equippedItems: { ...meta.equippedItems, [slot]: null },
      itemInventory: [...meta.itemInventory, equipped],
    },
  };
}

export function handleWakeCrew(state: GameState, crewId: CrewMemberId): GameState {
  const { meta } = state;
  if (!meta.cryoPool.includes(crewId)) return state;

  const wakeMod = computeModuleEffects(meta.moduleLevels);
  const effectiveWakeCost = Math.max(1, WAKE_COST_POWER_CELLS - wakeMod.wakeDiscount);
  if (meta.powerCells < effectiveWakeCost) return state;

  return {
    ...state,
    meta: {
      ...meta,
      cryoPool: meta.cryoPool.filter((id) => id !== crewId),
      companionIds: [...meta.companionIds, crewId],
      powerCells: meta.powerCells - effectiveWakeCost,
      debt: meta.debt + WAKE_DEBT_COST,
    },
  };
}

export function handleSendToCryo(state: GameState, crewId: CrewMemberId): GameState {
  const { meta } = state;
  if (meta.leadId === crewId) return state;
  if (!meta.companionIds.includes(crewId)) return state;

  const assignmentsAfterCryo = { ...meta.crewAssignments };
  delete assignmentsAfterCryo[crewId];

  return {
    ...state,
    meta: {
      ...meta,
      companionIds: meta.companionIds.filter((id) => id !== crewId),
      cryoPool: [...meta.cryoPool, crewId],
      crewAssignments: assignmentsAfterCryo,
    },
  };
}

export function handleAssignCrew(
  state: GameState,
  crewId: CrewMemberId,
  slot: AssignmentSlotId,
): GameState {
  const { meta } = state;
  const awake: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];
  if (!awake.includes(crewId)) return state;

  const updated = { ...meta.crewAssignments };

  if (slot === 'idle') {
    delete updated[crewId];
  } else {
    for (const [existing, existingSlot] of Object.entries(updated) as Array<[CrewMemberId, AssignmentSlotId]>) {
      if (existingSlot === slot && existing !== crewId) {
        delete updated[existing];
        break;
      }
    }
    updated[crewId] = slot;
  }

  return { ...state, meta: { ...meta, crewAssignments: updated } };
}
