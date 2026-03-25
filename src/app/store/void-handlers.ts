// Handlers for opening path, void communion, and void shop actions.

import { GameState, ShipRecord } from '../../types/state';
import { OPENING_PATH_CONFIG, OpeningPathId } from '../../content/opening-paths';
import { getTierById, getNextTierForBranch } from '../../content/void-communion';
import { getShipById, ShipStatus } from '../../content/ships';
import { getVoidShopCardById } from '../../content/void-shop';
import { getCryoPoolForPath } from '../../content/cryo';
import { CrewMemberId } from '../../content/crew';

export function handleChooseOpeningPath(state: GameState, path: OpeningPathId): GameState {
  if (state.meta.openingPathChosen !== false) return state;

  const cfg = OPENING_PATH_CONFIG[path];
  const crewAssignment: Record<string, { leadId: CrewMemberId | null; companionIds: CrewMemberId[] }> = {
    cold_extract: { leadId: null, companionIds: [] },
    cut_and_run:  { leadId: 'jax', companionIds: ['del'] },
    duty_claim:   { leadId: 'max', companionIds: ['sera', 'rook'] },
  };
  const crew = crewAssignment[path] ?? { leadId: null, companionIds: [] };

  let ships = state.meta.ships;
  if (path === 'duty_claim') {
    const wraithDef = getShipById('wraith');
    if (wraithDef) {
      ships = ships.map((s): ShipRecord =>
        s.id === 'wraith'
          ? { ...s, status: 'claimed' as ShipStatus, repairProgress: wraithDef.repairCost }
          : s,
      );
    }
  }

  return {
    ...state,
    meta: {
      ...state.meta,
      openingPathChosen: path,
      voidEcho: state.meta.voidEcho + cfg.voidEchoBonus,
      energy: cfg.energy,
      debt: cfg.debt,
      credits: state.meta.credits + cfg.startingCredits,
      extractionBonus: cfg.extractionBonus,
      leadId: crew.leadId,
      companionIds: crew.companionIds,
      ships,
      cryoPool: getCryoPoolForPath(path),
    },
  };
}

export function handleBuyVoidTier(state: GameState, tierId: string): GameState {
  const tier = getTierById(tierId);
  if (!tier) return state;

  const { meta } = state;
  if (meta.purchasedVoidTiers.includes(tier.id)) return state;
  if (meta.voidEcho < tier.cost) return state;
  if (tier.tier > 1) {
    const next = getNextTierForBranch(meta.purchasedVoidTiers, tier.branch);
    if (!next || next.id !== tier.id) return state;
  }

  return {
    ...state,
    meta: {
      ...meta,
      voidEcho: meta.voidEcho - tier.cost,
      purchasedVoidTiers: [...meta.purchasedVoidTiers, tier.id],
    },
  };
}

export function handleBuyVoidShopCard(state: GameState, shopCardId: string): GameState {
  const shopCard = getVoidShopCardById(shopCardId);
  if (!shopCard) return state;

  const { meta } = state;
  if (meta.purchasedVoidShopCards.includes(shopCard.id)) return state;
  if (meta.voidEcho < shopCard.cost) return state;

  return {
    ...state,
    meta: {
      ...meta,
      voidEcho: meta.voidEcho - shopCard.cost,
      purchasedVoidShopCards: [...meta.purchasedVoidShopCards, shopCard.id],
      unlockedCards: [...meta.unlockedCards, shopCard.cardId],
    },
  };
}
