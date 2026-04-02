// Handlers for START_DIVE, DIVE_EVENT, and path-based expedition actions.

import { GameState, RunState, RunPath, DivePrepState, ShipNodeType, PathTreeNode } from '../../types/state';
import { reduceRun, DiveEvent } from '../../dive/diveReducer';
import { getPurchasedTiersForBranch } from '../../content/void-communion';
import { getCurrentTier } from '../../content/death-lessons';
import { computeCrewEffects, CrewMemberId } from '../../content/crew';
import { computeHardwareEffects } from '../hardware-effects';
import { computeModuleEffects } from '../module-effects';
import { computeCrewAssignmentEffects } from '../crew-assignment-effects';
import { ENERGY_PER_SHIP_START, MAX_HULL } from '../../config/constants';
import { ShipStateStart } from '../../content/intro-narrative';
import { shuffleDeck, drawHand } from '../../dive/deck-manager';
import { generateRunPath } from '../../dive/run-path-generator';
import { calculateStartingDebt } from '../../dive/expedition-starting-debt';
import { resolveSignalChoice } from './signal-handler';
import { generateDiveMap } from '../../dive/map-generator';
import { selectRandomRunBackground } from '../../dive/run-background';
import { onCardDrawn } from '../../ui/dive-renderer/animation-bridge';

const SHIP_STATE_HULL_MODIFIER: Record<ShipStateStart, number> = {
  'damaged': -25,
  'partially_repaired': 0,
  'stabilized': 20,
};

/**
 * Start a new expedition (path-based multi-ship run).
 * Creates a RunPath but does NOT start the first ship.
 * The path map will be shown first, and user picks a layer-0 node.
 * Expedition debt is calculated immediately using 'standard' ship as projection.
 */
export function handleStartDive(state: GameState, divePrep?: DivePrepState): GameState | null {
  // Generate a new expedition path
  const pathSeed = Date.now() ^ (state.meta.totalRuns * 31337);
  const runPath = generateRunPath(pathSeed);

  // Calculate projected expedition debt (using 'standard' ship type as baseline)
  // This ensures the path map shows the correct debt before first ship selection
  const projectedDebt = calculateStartingDebt(state.meta, 'standard');

  // Initialize expedition debt fields with projected values
  // Initialize path credits from player's meta credits
  const initializedPath: RunPath = {
    ...runPath,
    pathCredits: state.meta.credits, // Carry over player credits to expedition
    expeditionDebt: projectedDebt, // Projected based on standard ship
    expeditionDebtStarting: projectedDebt, // Starting debt for this expedition
    expeditionDebtCeiling: 10_000_000,
    expeditionMissedPayments: 0,
    expeditionBillingHistory: [],
    expeditionVictory: false,
    expeditionFailed: false,
    shipsCompleted: 0,
  };

  // Store the path in meta (currentRun stays null until player picks a node)
  return {
    ...state,
    meta: {
      ...state.meta,
      activeRunPath: initializedPath,
      divePrep: divePrep ?? state.meta.divePrep,
    },
    currentRun: null,
  };
}

/**
 * Start a ship battle with the given node type.
 * Creates a fresh RunState initialized with the correct shipNodeType and carried-over values.
 */
function startShipBattle(
  state: GameState,
  shipNodeType: ShipNodeType,
  divePrep?: DivePrepState,
): GameState | null {
  const freshRun = reduceRun({} as Parameters<typeof reduceRun>[0], { type: 'START_DIVE' });

  const survivorTiers = getPurchasedTiersForBranch(state.meta.purchasedVoidTiers, 'survivor');
  const vcShields = survivorTiers.reduce(
    (sum, t) => sum + (t.effect.type === 'starting_shields' ? t.effect.value : 0),
    0,
  );

  const deathTier = getCurrentTier(state.meta.totalCollapses);
  const dlShields = deathTier?.effect.type === 'starting_shield' ? deathTier.effect.amount : 0;
  const dlCredits = deathTier?.effect.type === 'starting_credits' ? deathTier.effect.amount : 0;

  // Determine effective crew selection from dive prep or fallback to meta
  const effectiveLeadId = divePrep?.selectedCrewId ?? state.meta.leadId;
  const effectiveShipId = divePrep?.selectedShipId ?? state.meta.ships.find(s => s.status === 'claimed')?.id;

  const crewEffects = computeCrewEffects(effectiveLeadId, state.meta.companionIds, state.meta.crewLevels);
  const crewShields = crewEffects.reduce(
    (sum, e) => sum + (e.type === 'shield_start' ? e.amount : 0),
    0,
  );

  // Determine effective hardware from dive prep or fallback to meta equipped items
  const effectiveHardware = divePrep?.equippedForDive ?? state.meta.equippedItems;
  const hw = computeHardwareEffects(effectiveHardware, state.currentRun?.foundHardware);
  const modFx = computeModuleEffects(state.meta.moduleLevels);

  // Calculate starting hull with modifiers
  const startingHull = Math.min(
    MAX_HULL + hw.hullMaxBonus,
    100 + hw.hullMaxBonus + SHIP_STATE_HULL_MODIFIER[state.meta.shipStateStart]
  );

  const startAwakeIds: CrewMemberId[] = [
    ...(effectiveLeadId !== null ? [effectiveLeadId] : []),
    ...state.meta.companionIds,
  ];
  const assignFx = computeCrewAssignmentEffects(state.meta.crewAssignments, startAwakeIds);

  // Build deck with 3 of each starter card (9 cards total)
  const STARTER_CARDS = ['scavenge', 'repair', 'extract'];
  let prepCards = divePrep?.selectedCards?.length ? divePrep.selectedCards : [];
  
  // Create starter deck: 3 copies of each starter card
  let starterDeck: string[] = [];
  if (prepCards.length > 0) {
    // Use selected cards from prep, ensuring 3 of each selected card
    const uniqueCards = [...new Set(prepCards)];
    uniqueCards.forEach(cardId => {
      const count = prepCards.filter(c => c === cardId).length;
      // Add at least 1, up to 3 of each
      const toAdd = Math.min(3, Math.max(1, count));
      for (let i = 0; i < toAdd; i++) {
        starterDeck.push(cardId);
      }
    });
  } else {
    // Default: 3 of each starter card
    STARTER_CARDS.forEach(cardId => {
      starterDeck.push(cardId, cardId, cardId);
    });
  }

  // Compute awake crew count and set starting debt increase
  const awakeCount = (state.meta.leadId !== null ? 1 : 0) + state.meta.companionIds.length;
  const crewDebtIncrease = awakeCount * state.meta.upkeepPerAwakeCrew;

  // Carry over path deck if continuing expedition
  const pathDeck = state.meta.activeRunPath?.pathDeck ?? [];
  
  // ALWAYS build a fresh deck of 9 starter cards for each ship
  // This ensures consistent gameplay regardless of path deck state
  let combinedDeck: string[] = [];
  
  // Add 3 copies of each starter card (9 cards total)
  STARTER_CARDS.forEach(cardId => {
    combinedDeck.push(cardId, cardId, cardId);
  });
  
  // If there are path deck cards (from previous ships), add them on top
  // but don't exceed a reasonable deck size
  pathDeck.forEach(cardId => {
    if (!combinedDeck.includes(cardId) && combinedDeck.length < 15) {
      combinedDeck.push(cardId);
    }
  });

  // Select a random background for this run
  const backgroundAsset = selectRandomRunBackground();

  let runWithBonuses: RunState = {
    ...freshRun,
    hull: Math.min(MAX_HULL + hw.hullMaxBonus, startingHull + assignFx.hullStartBonus),
    shieldCharges: freshRun.shieldCharges + vcShields + dlShields + crewShields + hw.shieldStartBonus,
    runCredits: freshRun.runCredits + dlCredits,
    voidEchoGain: freshRun.voidEchoGain + hw.voidEchoStart,
    shipNodeType,
    energy: ENERGY_PER_SHIP_START,
    backgroundAsset,
    doctrineLocked: state.meta.doctrineLocked,
  };

  // Generate dive map for this ship — use currentNodeId hash for unique seed
  const currentNodeIdStr = state.meta.activeRunPath?.currentNodeId ?? 'none';
  let nodeIdHash = 0;
  for (let i = 0; i < currentNodeIdStr.length; i++) {
    nodeIdHash = ((nodeIdHash << 5) - nodeIdHash + currentNodeIdStr.charCodeAt(i)) | 0;
  }
  const mapSeed = Date.now() ^ (state.meta.totalRuns * 31337) ^ nodeIdHash;
  const { nodeMap, forkOptions } = generateDiveMap(mapSeed);

  const isFirstShip = state.meta.activeRunPath?.currentNodeId === null
    || state.meta.activeRunPath?.nodes.every(n => !n.visited);

  if (state.meta.totalRuns === 0 && isFirstShip) {
    // Tutorial override: fixed hand for first run (one of each type)
    const tutorialHand = ['extract', 'repair', 'scavenge'];
    
    // Safety: Ensure combinedDeck has cards before filtering
    let workingDeck = combinedDeck.length > 0 ? combinedDeck : [];
    if (workingDeck.length === 0) {
      // Fallback: create a fresh deck of 9 cards
      STARTER_CARDS.forEach(cardId => {
        workingDeck.push(cardId, cardId, cardId);
      });
    }
    
    const remainingDeck = workingDeck.filter((id) => !tutorialHand.includes(id));
    
    // Safety: Ensure remainingDeck isn't empty
    const finalDeck = remainingDeck.length > 0 ? remainingDeck : workingDeck.slice(3);
    
    runWithBonuses = {
      ...runWithBonuses,
      deck: finalDeck,
      discardPile: [],
      hand: tutorialHand,
      debtIncrease: crewDebtIncrease,
      nodeMap,
      forkOptions,
      forkChoices: {},
    };
    // Trigger beam-in animations for tutorial hand
    for (let i = 0; i < tutorialHand.length; i++) {
      onCardDrawn(tutorialHand[i], i);
    }
  } else {
    // Safety: Ensure combinedDeck has cards
    let workingDeck = combinedDeck.length > 0 ? [...combinedDeck] : [];
    if (workingDeck.length === 0) {
      // Fallback: create a fresh deck of 9 cards
      STARTER_CARDS.forEach(cardId => {
        workingDeck.push(cardId, cardId, cardId);
      });
    }
    
    // Shuffle the combined deck and deal the top 3 cards as opening hand
    const shuffled = shuffleDeck([...workingDeck]);
    const hand = shuffled.slice(0, 3);
    const remainingDeck = shuffled.slice(3);

    runWithBonuses = {
      ...runWithBonuses,
      deck: remainingDeck,
      discardPile: [],
      hand,
      debtIncrease: crewDebtIncrease,
      nodeMap,
      forkOptions,
      forkChoices: {},
    };
    // Trigger beam-in animations for initial hand
    for (let i = 0; i < hand.length; i++) {
      onCardDrawn(hand[i], i);
    }
  }

  // IMPORTANT: Preserve the activeRunPath from state (which was passed from handleSelectNextNode)
  // and ensure expeditionDebt is carried forward
  return {
    ...state,
    currentRun: runWithBonuses,
    // Explicitly ensure meta.activeRunPath is preserved
    meta: {
      ...state.meta,
      // Preserve activeRunPath which was updated in handleSelectNextNode
    },
  };
}

/**
 * Handle player selecting the next node on the expedition path tree.
 * Validates the selection, updates currentNodeId, and either starts a
 * ship battle or returns state for shop display.
 */
export function handleSelectNextNode(state: GameState, nodeId: string): GameState | null {
  const path = state.meta.activeRunPath;
  if (!path) return null;

  // Find the node
  const node = path.nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // Validate: node must not be visited
  if (node.visited) return null;

  if (path.currentNodeId === null) {
    // Must pick a layer-0 node
    if (node.layer !== 0) return null;
  } else {
    // Must be a child of the current node
    if (!path.currentNodeId) return null;
    const currentNode = path.nodes.find(n => n.id === path.currentNodeId);
    if (!currentNode) return null;
    if (!currentNode.childIds.includes(nodeId)) return null;
  }

  // Update currentNodeId
  // Initialize expedition debt on first ship selection
  const isFirstShip = path.currentNodeId === null || path.nodes.every(n => !n.visited);
  let expeditionDebt = path.expeditionDebt;
  let expeditionDebtStarting = path.expeditionDebtStarting;

  if (isFirstShip && node.shipType !== 'shop') {
    // Calculate starting debt based on meta and ship type
    expeditionDebt = calculateStartingDebt(state.meta, node.shipType);
    expeditionDebtStarting = expeditionDebt;
  }

  const updatedPath: RunPath = {
    ...path,
    currentNodeId: nodeId,
    expeditionDebt,
    expeditionDebtStarting,
  };

  const stateWithPath: GameState = {
    ...state,
    meta: {
      ...state.meta,
      activeRunPath: updatedPath,
    },
  };

  // Shop nodes: don't start a battle, return state for shop UI
  if (node.shipType === 'shop') {
    return stateWithPath;
  }

  // Combat nodes: start ship battle
  return startShipBattle(stateWithPath, node.shipType);
}

/**
 * Handle selecting an intership loot card.
 * Adds the card to pathDeck and clears the pendingLootPick flag.
 * Does NOT start a ship battle — player returns to path map to pick next target.
 */
export function handleSelectIntershipLoot(state: GameState, cardId: string | 'SKIP'): GameState {
  if (!state.meta.activeRunPath || !state.meta.activeRunPath.pendingLootPick) {
    return state;
  }

  const path = state.meta.activeRunPath;

  // Add card to path deck if not skipped
  const updatedDeck = cardId === 'SKIP'
    ? path.pathDeck
    : [...path.pathDeck, cardId];

  const updatedPath: RunPath = {
    ...path,
    pathDeck: updatedDeck,
    pendingLootPick: false,
  };

  return {
    ...state,
    meta: {
      ...state.meta,
      activeRunPath: updatedPath,
    },
  };
}

/** Returns the new state, or null if the run should be ended (extracted/collapsed). */
export function handleDiveEvent(
  state: GameState,
  event: DiveEvent,
): { state: GameState; shouldEnd: boolean } {
  if (state.currentRun === null) return { state, shouldEnd: false };

  // Handle RESOLVE_SIGNAL by applying signal effects first, then reducing
  if (event.type === 'RESOLVE_SIGNAL') {
    const stateWithEffects = resolveSignalChoice(state, event.signalId, event.choiceIndex);
    const updatedRun = reduceRun(stateWithEffects.currentRun!, { type: 'RESOLVE_SIGNAL', signalId: event.signalId, choiceIndex: event.choiceIndex });
    if (updatedRun.phase === 'extracted' || updatedRun.phase === 'collapsed') {
      return { state: { ...stateWithEffects, currentRun: updatedRun }, shouldEnd: true };
    }
    return { state: { ...stateWithEffects, currentRun: updatedRun }, shouldEnd: false };
  }

  const updatedRun = reduceRun(state.currentRun, event);
  if (updatedRun.phase === 'extracted' || updatedRun.phase === 'collapsed') {
    return { state: { ...state, currentRun: updatedRun }, shouldEnd: true };
  }
  return { state: { ...state, currentRun: updatedRun }, shouldEnd: false };
}
