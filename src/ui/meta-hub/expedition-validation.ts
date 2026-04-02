import type { MetaState, DivePrepState } from '../../types/state';
import type { ItemSlot } from '../../content/hardware';

/**
 * Check if the player has available ships that could be selected.
 * Returns true if any claimed ship has a captain assigned.
 */
export function hasAvailableShips(meta: MetaState): boolean {
  return meta.ships.some(
    (ship) => ship.status === 'claimed' && ship.captainedBy !== null
  );
}

/**
 * Check if the player has available crew that could be selected.
 * Returns true if leadId exists OR cryoPool has members.
 * Note: Starter ship (single_man_scav) does not require crew.
 */
export function hasAvailableCrew(meta: MetaState): boolean {
  const hasLead = meta.leadId !== null;
  const hasCryoCrew = meta.cryoPool.length > 0;
  return hasLead || hasCryoCrew;
}

/**
 * Check if the selected ship requires a crew member.
 * Starter ship (single_man_scav) can fly solo.
 */
function shipRequiresCrew(shipId: string | null): boolean {
  return shipId !== null && shipId !== 'single_man_scav';
}

/**
 * Check if the player has available hardware in their inventory.
 * Returns true if itemInventory has any items.
 */
export function hasAvailableHardware(meta: MetaState): boolean {
  return meta.itemInventory.length > 0;
}

/**
 * Check if any hardware is equipped in any slot.
 */
function hasEquippedHardware(equipped: Record<ItemSlot, string | null>): boolean {
  const slots: ItemSlot[] = ['hull', 'scanner', 'utility'];
  return slots.some((slot) => equipped[slot] !== null);
}

/**
 * Validate expedition readiness before starting a dive.
 * Checks if the player has selected the required resources when they have
 * available but unassigned resources.
 *
 * Returns an object indicating:
 * - valid: true if the expedition can start
 * - missing: array of missing resource categories ('ship' | 'crew' | 'hardware')
 */
export function validateExpeditionReadiness(
  meta: MetaState,
  divePrep: DivePrepState
): { valid: boolean; missing: ('ship' | 'crew' | 'hardware')[] } {
  const missing: ('ship' | 'crew' | 'hardware')[] = [];

  // Check ship selection
  // Error if player has available ships (claimed with captain), but no ship is selected
  const availableShips = hasAvailableShips(meta);
  const hasSelectedShip = divePrep.selectedShipId !== null;
  if (availableShips && !hasSelectedShip) {
    missing.push('ship');
  }

  // Check crew selection
  // Error if:
  // - Ship requires crew (not starter ship)
  // - Player has available crew (lead OR cryo)
  // - But no crew is selected
  const selectedShipRequiresCrew = shipRequiresCrew(divePrep.selectedShipId);
  const availableCrew = hasAvailableCrew(meta);
  const hasSelectedCrew = divePrep.selectedCrewId !== null;
  if (selectedShipRequiresCrew && availableCrew && !hasSelectedCrew) {
    missing.push('crew');
  }

  // Check hardware selection
  // Error if player has items in inventory, but nothing is equipped
  const availableHardware = hasAvailableHardware(meta);
  const hasEquipped = hasEquippedHardware(divePrep.equippedForDive);
  if (availableHardware && !hasEquipped) {
    missing.push('hardware');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
