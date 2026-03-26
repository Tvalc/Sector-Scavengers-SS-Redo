// Handlers for opening path, void communion, and void shop actions.

import { GameState, ShipRecord } from '../../types/state';
import { OPENING_PATH_CONFIG, OpeningPathId } from '../../content/opening-paths';
import { getTierById, getNextTierForBranch } from '../../content/void-communion';
import { getShipById, ShipStatus } from '../../content/ships';
import { getVoidShopCardById } from '../../content/void-shop';
import { getCryoPoolForPath } from '../../content/cryo';
import { CrewMemberId } from '../../content/crew';
import { IntroTerminalOutcome } from '../../content/intro-narrative';

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

export function handleApplyIntroOutcome(state: GameState, outcome: IntroTerminalOutcome): GameState {
  // Idempotent guard — only apply once
  if (state.meta.openingPathChosen !== false) return state;

  // First apply existing path-config logic (energy, debt, credits, crew, cryo pool)
  let result = handleChooseOpeningPath(state, outcome.openingPathId);

  // Debt modifier multipliers
  const debtMultiplier = outcome.debtModifier === 'low' ? 0.8 :
                         outcome.debtModifier === 'high' ? 1.25 : 1.0;

  // Salvage reward band credit bonuses
  const salvageBonus = outcome.salvageRewardBand === 'max' ? 800 :
                       outcome.salvageRewardBand === 'high' ? 400 :
                       outcome.salvageRewardBand === 'medium' ? 200 : 0;

  // Merge awakened crew into companionIds (avoid duplicates)
  const existingCrewSet = new Set<string>([
    ...(result.meta.leadId !== null ? [result.meta.leadId] : []),
    ...result.meta.companionIds,
  ]);
  const newCompanionIds = [...result.meta.companionIds];
  for (const crewId of outcome.awakenedCrew) {
    if (!existingCrewSet.has(crewId)) {
      newCompanionIds.push(crewId as CrewMemberId);
      existingCrewSet.add(crewId);
    }
  }

  // Overlay narrative fields
  result = {
    ...result,
    meta: {
      ...result.meta,
      debt: Math.round(result.meta.debt * debtMultiplier),
      credits: result.meta.credits + salvageBonus,
      companionIds: newCompanionIds,
      survivorsSaved: outcome.survivorsSaved,
      shipStateStart: outcome.shipStateStart,
      awakenedCrew: outcome.awakenedCrew as CrewMemberId[],
      introTranscriptTag: outcome.introTranscriptTag,
      salvageRewardBand: outcome.salvageRewardBand,
      voidRewardBand: outcome.voidRewardBand,
    },
  };

  return result;
}
