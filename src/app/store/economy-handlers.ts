// Handlers for echo economy actions: market purchases and debt payments.

import { GameState } from '../../types/state';
import { getMarketListing } from '../../content/salvage-market';

/**
 * Minimum amount for early debt payments (₡1,000).
 */
const MIN_PAYMENT_AMOUNT = 1000;

/**
 * Process early debt payment during expedition.
 * Allows players to pay down debt using accumulated expedition credits between ships.
 *
 * Validation:
 * - Cannot pay more than expedition credits accumulated
 * - Cannot pay more than total debt
 * - Minimum payment of ₡1,000
 *
 * Returns updated state with reduced path credits and meta debt.
 */
export function handlePayDebtEarly(state: GameState, amount: number): GameState {
  const { meta } = state;

  // Check if there's an active expedition with accumulated credits
  if (!meta.activeRunPath) return state;

  const path = meta.activeRunPath;
  const availableCredits = path.pathCredits;

  // Validate minimum payment
  if (amount < MIN_PAYMENT_AMOUNT) return state;

  // Validate cannot pay more than available credits
  if (amount > availableCredits) return state;

  // Validate cannot pay more than total debt
  const maxPayable = Math.min(amount, meta.debt);
  if (maxPayable <= 0) return state;

  // Calculate new values
  const newPathCredits = availableCredits - maxPayable;
  const newDebt = Math.max(0, meta.debt - maxPayable);

  return {
    ...state,
    meta: {
      ...meta,
      debt: newDebt,
      activeRunPath: {
        ...path,
        pathCredits: newPathCredits,
      },
    },
  };
}

export function handleBuyMarketItem(state: GameState, hardwareId: string): GameState {
  const { meta } = state;
  const listing = getMarketListing(hardwareId);
  if (!listing) return state;

  // Check if already owned
  const equippedValues = Object.values(meta.equippedItems).filter(Boolean);
  if (equippedValues.includes(hardwareId) || meta.itemInventory.includes(hardwareId)) {
    return state;
  }

  // Check echo affordability
  if (meta.voidEcho < listing.echoCost) return state;

  // Check salvage affordability
  const salvageEntry = meta.hubInventory.find(
    (e) => e.tier === listing.salvageTier,
  );
  if (!salvageEntry || salvageEntry.quantity < listing.salvageCost) return state;

  // Deduct echo
  const newEcho = meta.voidEcho - listing.echoCost;

  // Deduct salvage
  const newQuantity = salvageEntry.quantity - listing.salvageCost;
  const newInventory = newQuantity === 0
    ? meta.hubInventory.filter((e) => e.tier !== listing.salvageTier)
    : meta.hubInventory.map((e) =>
        e.tier === listing.salvageTier ? { ...e, quantity: newQuantity } : e,
      );

  // Add to item inventory
  const newItemInventory = [...meta.itemInventory, hardwareId];

  return {
    ...state,
    meta: {
      ...meta,
      voidEcho: newEcho,
      hubInventory: newInventory,
      itemInventory: newItemInventory,
    },
  };
}
