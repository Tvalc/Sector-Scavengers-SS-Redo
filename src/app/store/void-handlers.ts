// Handlers for opening path, void communion, and void shop actions.

import { GameState, ShipRecord } from '../../types/state';
import { OPENING_PATH_CONFIG, OpeningPathId } from '../../content/opening-paths';
import { getTierById, getNextTierForBranch } from '../../content/void-communion';
import { getShipById, ShipStatus } from '../../content/ships';
import { getVoidShopCardById } from '../../content/void-shop';
import { getCryoPoolForPath, PASSENGER_DEBT_TRANSFER } from '../../content/cryo';
import { CrewMemberId } from '../../content/crew';
import { IntroTerminalOutcome, IntroBonus } from '../../content/intro-narrative';

export function handleChooseOpeningPath(state: GameState, path: OpeningPathId): GameState {
  if (state.meta.openingPathChosen !== false) return state;

  const cfg = OPENING_PATH_CONFIG[path];
  const crewAssignment: Record<string, { leadId: CrewMemberId | null; companionIds: CrewMemberId[] }> = {
    cold_extract: { leadId: null, companionIds: [] },
    cut_and_run:  { leadId: 'jax', companionIds: ['del'] },
    duty_claim: { leadId: 'max', companionIds: ['sera', 'rook'] },
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
      debt: cfg.debt,
      credits: state.meta.credits + cfg.startingCredits,
      extractionBonus: cfg.extractionBonus,
      leadId: crew.leadId,
      companionIds: crew.companionIds,
      ships,
      cryoPool: getCryoPoolForPath(path),
    },
  }
}

export function handleBuyVoidTier(state: GameState, tierId: string): GameState {
  const tier = getTierById(tierId);
  if (!tier) return state

  const { meta } = state
  if (meta.purchasedVoidTiers.includes(tier.id)) return state
  if (meta.voidEcho < tier.cost) return state
  if (tier.tier > 1) {
    const next = getNextTierForBranch(meta.purchasedVoidTiers, tier.branch);
    if (!next || next.id !== tier.id) return state
  }

  return {
    ...state,
    meta: {
      ...meta,
      voidEcho: meta.voidEcho - tier.cost,
      purchasedVoidTiers: [...meta.purchasedVoidTiers, tier.id],
    }
  }
}

export function handleBuyVoidShopCard(state: GameState, shopCardId: string): GameState {
  const shopCard = getVoidShopCardById(shopCardId);
  if (!shopCard) return state

  const { meta } = state
  if (meta.purchasedVoidShopCards.includes(shopCard.id)) return state
  if (meta.voidEcho < shopCard.cost) return state

  return {
    ...state,
    meta: {
      ...meta,
      voidEcho: meta.voidEcho - shopCard.cost,
      purchasedVoidShopCards: [...meta.purchasedVoidShopCards, shopCard.id],
      unlockedCards: [...meta.unlockedCards, shopCard.cardId],
    }
  }
}

export function handleApplyIntroOutcome(state: GameState, outcome: IntroTerminalOutcome): GameState {
  if (state.meta.openingPathChosen !== false) return state

  // Capture pre-call void echo for rolledVoidEcho calculation
  const preCallVoidEcho = state.meta.voidEcho

  // First apply existing path-config logic (debt, credits, crew, cryo pool)
  let result = handleChooseOpeningPath(state, outcome.openingPathId)

  // Get path config for base values
  const cfg = OPENING_PATH_CONFIG[outcome.openingPathId]

  // Debt modifier multipliers
  const debtMultiplier = outcome.debtModifier === 'low' ? 0.8 :
                       outcome.debtModifier === 'high' ? 1.25 : 1.0

  // Merge awakened crew into companionIds (avoid duplicates) and calculate passenger debt
  const existingCrewSet = new Set<string>([
    ...(result.meta.leadId !== null ? [result.meta.leadId] : []),
    ...result.meta.companionIds
  ])
  const newCompanionIds = [...result.meta.companionIds]
  let passengerDebtAdded = 0
  for (const crewId of outcome.awakenedCrew) {
    if (!existingCrewSet.has(crewId)) {
      newCompanionIds.push(crewId as CrewMemberId)
      existingCrewSet.add(crewId)
      passengerDebtAdded += PASSENGER_DEBT_TRANSFER
    }
  }
  // Also add passenger debt for path-assigned crew (lead + companions)
  const pathCrewCount = result.meta.leadId !== null ? 1 + result.meta.companionIds.length : result.meta.companionIds.length
  passengerDebtAdded += pathCrewCount * PASSENGER_DEBT_TRANSFER
  // Apply rolled credits if present (replace base + salvage bonus)
  let finalCredits = result.meta.credits
  if (outcome.rolledCredits !== undefined) {
    finalCredits = result.meta.credits - cfg.startingCredits + outcome.rolledCredits
  } else {
    const salvageBonus = outcome.salvageRewardBand === 'max' ? 800 :
                         outcome.salvageRewardBand === 'high' ? 400 :
                         outcome.salvageRewardBand === 'medium' ? 200 : 0
    finalCredits += salvageBonus
  }

  // Apply rolled void echo if present
  let finalVoidEcho = result.meta.voidEcho
  if (outcome.rolledVoidEcho !== undefined) {
    finalVoidEcho = preCallVoidEcho + outcome.rolledVoidEcho
  }

  // Apply rolled ship state if present
  let finalShipStateStart = outcome.shipStateStart

  // Process bonus array
  let finalUnlockedCards = [...result.meta.unlockedCards]
  let finalCompanionIds = newCompanionIds
  let finalEquippedItems = { ...result.meta.equippedItems }

  const bonuses = outcome.bonuses ?? []
  for (const bonus of bonuses) {
    switch (bonus.type) {
      case 'card': {
        if (!finalUnlockedCards.includes(bonus.cardId)) {
          finalUnlockedCards = [...finalUnlockedCards, bonus.cardId]
        }
        break
      }

      case 'crew': {
        const crewSet = new Set<string>([
          ...(result.meta.leadId !== null ? [result.meta.leadId] : []),
          ...finalCompanionIds
        ])
        if (!crewSet.has(bonus.crewId)) {
          finalCompanionIds = [...finalCompanionIds, bonus.crewId as CrewMemberId]
        }
        break
      }

      case 'hardware': {
        if (finalEquippedItems[bonus.slot as keyof typeof finalEquippedItems] === null ||
            finalEquippedItems[bonus.slot as keyof typeof finalEquippedItems] === undefined) {
          finalEquippedItems = { ...finalEquippedItems, [bonus.slot]: bonus.itemId }
        }
        break
      }

      case 'void_echo': {
        finalVoidEcho += bonus.amount
        break
      }

      case 'credits_bonus': {
        finalCredits += bonus.amount
        break
      }

      case 'hull_boost': {
        // Upgrade ship state one tier: damaged -> partially_repaired -> stabilized
        if (finalShipStateStart === 'damaged') {
          finalShipStateStart = 'partially_repaired'
        } else if (finalShipStateStart === 'partially_repaired') {
          finalShipStateStart = 'stabilized'
        }
        // capped at stabilized
        break
      }


    }
  }

  // Overlay narrative fields and rolled values
  // Note: passengerDebtAdded is the actual debt transfer from crew rescue
  result = {
    ...result,
    meta: {
      ...result.meta,
      debt: Math.round(result.meta.debt * debtMultiplier) + passengerDebtAdded,
      credits: finalCredits,
      voidEcho: finalVoidEcho,
      companionIds: finalCompanionIds,
      unlockedCards: finalUnlockedCards,
      equippedItems: finalEquippedItems,
      survivorsSaved: outcome.survivorsSaved,
      shipStateStart: finalShipStateStart,
      awakenedCrew: outcome.awakenedCrew as CrewMemberId[],
      introTranscriptTag: outcome.introTranscriptTag,
      salvageRewardBand: outcome.salvageRewardBand,
      voidRewardBand: outcome.voidRewardBand,
      debtModifier: outcome.debtModifier,
    }
  }

  return result
}
