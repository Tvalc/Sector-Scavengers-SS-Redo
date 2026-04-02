import { RunState } from '../types/state';
import { MAX_HULL, ENERGY_PER_SHIP_START, ENERGY_MAX, ENERGY_REGEN_PER_ROUND, HARDWARE_COOLDOWN_ROUNDS, CORPORATE_ENERGY_BONUS_THRESHOLD, CORPORATE_ENERGY_BONUS_CREDITS } from '../config/constants';
import { createSalvageEntry, addSalvage } from '../content/salvage';
import { drawHand, addCardToDiscard } from './deck-manager';
import { getDoctrine, DOCTRINE_CARD_UNLOCKS } from '../content/doctrine';
import { pickRandomHardware, addFoundHardware } from './hardware-discovery';
import { HARDWARE_ITEMS } from '../content/hardware';
import { applyCardEffect, handlePostCardEffects, applyHullDamage } from './card-effects';
import { ALL_CARDS, TacticCard } from '../content/cards';

export type DiveEvent =
  | { type: 'START_DIVE' }
  | { type: 'PLAY_CARD'; cardId: string; scavengeBonus?: number; shieldGainBonus?: number; shieldToHullRegen?: number; botDamageReduction?: boolean; upgradeNoHullCost?: boolean; botCreditBonusPerBot?: number; crewCount?: number; energyCost?: number; overcharge?: boolean }
  | { type: 'NEXT_ROUND' }
  | { type: 'SPEND_ENERGY'; amount: number }
  // Shield block consumed — called before applying danger hull damage.
  | { type: 'APPLY_SHIELD_BLOCK'; hullRegen?: number }
  // Fork choice at rounds 4 or 8
  | { type: 'CHOOSE_FORK'; round: 4 | 8; choice: 'left' | 'right' }
  // Signal node events
  | { type: 'ENTER_SIGNAL_NODE' }
  | { type: 'RESOLVE_SIGNAL'; signalId: string; choiceIndex: number }
  | { type: 'ENTER_AUDIT_NODE' }
  | { type: 'RESOLVE_AUDIT'; paid: boolean }
  // Cache node events
  | { type: 'ENTER_CACHE_NODE'; itemId?: string }
  | { type: 'RESOLVE_CACHE'; take: boolean }
  // Boss loot event
  | { type: 'MARK_BOSS_LOOT' }
  // Redraw hand — spend 1 energy to redraw entire hand (max 1 per round)
  | { type: 'REDRAW_HAND' }
  // Multi-modal redraw system
  | { type: 'FRESH_START_REDRAW' }
  | { type: 'SURGICAL_DISCARD'; cardIndex: number }
  | { type: 'DESPERATE_SCRAMBLE' }
  // Hardware active ability events
  | { type: 'USE_HARDWARE_ABILITY'; slot: 'hull' | 'scanner' | 'utility'; overcharge?: boolean };

export function reduceRun(run: RunState, event: DiveEvent): RunState {
  switch (event.type) {
    case 'START_DIVE':
      return {
        round: 1,
        maxRounds: 10,
        hull: 100,
        runCredits: 0,
        phase: 'active',
        shieldCharges: 0,
        analyzed: false,
        debtIncrease: 0,
        voidEchoGain: 0,
        ancestorMemoryActive: false,
        deathDefianceActive: false,
        salvage: [],
        itemsFound: [],
        powerCellsGained: 0,
        roundHistory: [],
        botsDeployed: 0,
        bulwarkPlays: 0,
        lastStandUsed: false,
        bulwarkDangerReduction: false,
        dangerImmune: false,
        forcedDiscard: false,
        deck: [],
        discardPile: [],
        hand: [],
        lootNodePending: false,
        lootNodeRound: 0,
        doctrineRunPoints: { corporate: 0, cooperative: 0, smuggler: 0 },
        doctrineCardAddedThisRun: false,
        pendingReshuffleLog: false,
        nodeMap: [],
        forkOptions: {},
        forkChoices: {},
        signalNodePending: false,
        signalNodeId: '',
        auditBribed: false,
        pendingExtraDraw: false,
        seenLoreFragments: [],
        auditNodePending: false,
        auditResolved: false,
        isBossRound: false,
        isBossLoot: false,
        foundHardware: {},
        cacheNodePending: false,
        cacheNodeItem: null,
        runDangerReduction: 0,
        lastRoundDangerFired: false,
        voidTouchedActive: false,
        pendingExtractBonusPct: 0,
        nextRoundCreditsPenalty: 0,
        dangerSkipRemaining: 0,
        maxHullBonus: 0,
        lastBastionUsed: false,
        echoAmplifierActive: false,
        pendingExtraDrawCount: 0,
        debuffs: [],
        crewMiracleUsed: false,
        oncePerRunCards: [],
        auditReduction: 0,
        energy: ENERGY_PER_SHIP_START,
        maxEnergy: ENERGY_MAX,
        energyRegenPerRound: ENERGY_REGEN_PER_ROUND,
        redrawUsedThisRound: false,
        shipNodeType: 'standard',
        hardwareCooldowns: { hull: 0, scanner: 0, utility: 0 },
        energySpentThisRound: 0,
        overchargeActive: false,
        reserveBurnAvailable: false,
        hardwareUsedThisRound: 0,
        doctrineLocked: null,
        exactHullRevealed: true, // Start revealed for tutorial/first run clarity
        dangerForecast: [],
      };

    case 'PLAY_CARD': {
      const card = ALL_CARDS.find(c => c.id === event.cardId);
      if (!card) return run;

      // Calculate base energy cost
      let energyCost = card.energyCost ?? 0;
      let refundAmount = 0;
      let reserveBurnTriggered = false;

      // Reserve burn discount (-1⚡ if at max energy before playing and available)
      if (run.energy >= run.maxEnergy && run.reserveBurnAvailable) {
        energyCost = Math.max(0, energyCost - 1);
        reserveBurnTriggered = true;
      }

      // Overcharge cost (+1⚡ for enhanced effect)
      if (event.overcharge) {
        energyCost += 1;
      }

      // Check if player has enough energy
      if (run.energy < energyCost) {
        // Insufficient energy — block the play, return unchanged
        return run;
      }

      // Find or create current round history entry
      let currentRoundEntry = run.roundHistory.find(r => r.round === run.round);
      let updatedRoundHistory = run.roundHistory;
      
      if (!currentRoundEntry) {
        // Create new entry for this round
        currentRoundEntry = { round: run.round, cardsPlayed: [] };
        updatedRoundHistory = [...run.roundHistory, currentRoundEntry];
      }

      // Add card to cardsPlayed for this round (handle undefined for backward compatibility)
      const existingCards = currentRoundEntry.cardsPlayed ?? [];
      const updatedCardsPlayed = [...existingCards, {
        cardId: event.cardId,
        cardName: card.name,
        overcharged: event.overcharge,
      }];

      // Update the round history entry
      updatedRoundHistory = updatedRoundHistory.map(r => 
        r.round === run.round 
          ? { ...r, cardsPlayed: updatedCardsPlayed }
          : r
      );

      // Deduct energy cost and track spent energy
      let runAfterEnergy = {
        ...run,
        energy: run.energy - energyCost,
        energySpentThisRound: run.energySpentThisRound + energyCost,
        overchargeActive: event.overcharge ?? false,
        roundHistory: updatedRoundHistory,
        // Clear reserve burn if it was triggered, keep previous state otherwise
        reserveBurnAvailable: reserveBurnTriggered ? false : run.reserveBurnAvailable,
      };

      // Remove played card from hand
      const cardIndex = run.hand.indexOf(event.cardId);
      const newHand = run.hand.filter((_, i) => i !== cardIndex);
      const newDiscard = addCardToDiscard(run.discardPile, event.cardId);

      // Draw replacement card to maintain 3-card hand
      const drawnResult = drawHand(run.deck, newDiscard, 1);
      const replenishedHand = [...newHand, ...drawnResult.hand];

      runAfterEnergy = {
        ...runAfterEnergy,
        hand: replenishedHand,
        deck: drawnResult.newDraw,
        discardPile: drawnResult.newDiscard,
        pendingReshuffleLog: drawnResult.reshuffled,
      };

      // Log reserve burn trigger
      if (reserveBurnTriggered) {
        runAfterEnergy.roundHistory = runAfterEnergy.roundHistory.map(r =>
          r.round === run.round
            ? { ...r, cardsPlayed: [...r.cardsPlayed, { cardId: 'reserve_burn', cardName: 'Reserve burn engaged: -1⚡' }] }
            : r
        );
      }

      // Check for Corporate doctrine energy bonus (3+⚡ spent = 1000₡)
      const newEnergySpent = runAfterEnergy.energySpentThisRound;
      if (newEnergySpent === CORPORATE_ENERGY_BONUS_THRESHOLD && runAfterEnergy.doctrineLocked === 'corporate') {
        runAfterEnergy = {
          ...runAfterEnergy,
          runCredits: runAfterEnergy.runCredits + CORPORATE_ENERGY_BONUS_CREDITS,
        };
      }

      // Process energy refund based on card conditions
      if (card.energyRefund) {
        const { condition, amount } = card.energyRefund;
        switch (condition) {
          case 'Find relic':
            // Refund handled by card effect on actual relic find
            break;
          case 'Random 50%':
            if (Math.random() < 0.5) refundAmount = amount;
            break;
          case 'Random 0-1⚡':
            refundAmount = Math.floor(Math.random() * 2);
            break;
          case 'Hull <30':
            if (run.hull < 30) refundAmount = amount;
            break;
          default:
            refundAmount = amount;
        }
      }

      if (refundAmount > 0) {
        const newEnergyWithRefund = Math.min(runAfterEnergy.maxEnergy, runAfterEnergy.energy + refundAmount);
        runAfterEnergy = {
          ...runAfterEnergy,
          energy: newEnergyWithRefund,
        };
      }

      // Update reserve burn availability: set to true if now at max energy (but wasn't triggered this play)
      const isAtMaxNow = runAfterEnergy.energy >= runAfterEnergy.maxEnergy;
      if (isAtMaxNow && !reserveBurnTriggered) {
        runAfterEnergy = {
          ...runAfterEnergy,
          reserveBurnAvailable: true,
        };
      }

      // Apply card effect using card-effects module
      const nextRun = applyCardEffect(runAfterEnergy, event);

      // If run ended (extracted/collapsed), skip post-card deck management
      if (nextRun.phase !== 'active') {
        return nextRun;
      }

      // Handle post-card effects (doctrine points, loot checks - but NOT full hand redraw)
      return handlePostCardEffects(nextRun, event.cardId);
    }

    case 'APPLY_SHIELD_BLOCK': {
      const hullRegen = event.hullRegen ?? 0;
      const cap = MAX_HULL + run.maxHullBonus;
      return {
        ...run,
        shieldCharges: Math.max(0, run.shieldCharges - 1),
        hull: hullRegen > 0 ? Math.min(cap, run.hull + hullRegen) : run.hull,
      };
    }

    case 'NEXT_ROUND': {
      if (run.phase !== 'active') return run;
      if (run.round >= run.maxRounds) {
        return { ...run, phase: 'collapsed' };
      }
      const nextRound = run.round + 1;
      const isBossRound = nextRound === 10;

      // Check if entering audit node (round 7)
      const isAuditNode = run.nodeMap[nextRound - 1] === 'audit' && !run.auditResolved;

      // Apply next-round credits penalty
      const runCredits = Math.max(0, run.runCredits - run.nextRoundCreditsPenalty);

      // Decrement danger skip counter; if remaining, grant danger immunity this round
      const dangerSkipRemaining = Math.max(0, run.dangerSkipRemaining - 1);
      const dangerImmune = dangerSkipRemaining > 0 || run.dangerImmune;

      // Regenerate energy at start of round
      const energy = Math.min(run.maxEnergy, run.energy + run.energyRegenPerRound);

      // Discard any remaining hand cards and draw fresh 3-card hand
      const discardWithRemaining = [...run.discardPile, ...run.hand];
      const drawnResult = drawHand(run.deck, discardWithRemaining, 3);

      // Clear danger forecast entries that are now in the past
      const updatedForecast = run.dangerForecast.filter(f => f.round > nextRound);

      return {
        ...run,
        round: nextRound,
        runCredits,
        energy,
        hand: drawnResult.hand,
        deck: drawnResult.newDraw,
        discardPile: drawnResult.newDiscard,
        analyzed: false,
        bulwarkDangerReduction: false,
        dangerImmune,
        pendingReshuffleLog: drawnResult.reshuffled,
        isBossRound,
        auditNodePending: isAuditNode ? true : run.auditNodePending,
        nextRoundCreditsPenalty: 0,
        dangerSkipRemaining,
        redrawUsedThisRound: false,
        energySpentThisRound: 0,
        overchargeActive: false,
        hardwareUsedThisRound: 0,
        hardwareCooldowns: {
          hull: Math.max(0, run.hardwareCooldowns.hull - 1),
          scanner: Math.max(0, run.hardwareCooldowns.scanner - 1),
          utility: Math.max(0, run.hardwareCooldowns.utility - 1),
        },
        // Reset exact hull reveal (player needs to scan again after hull changes)
        exactHullRevealed: false,
        dangerForecast: updatedForecast,
      };
    }

    case 'SPEND_ENERGY': {
      const amount = Math.max(0, event.amount);
      return {
        ...run,
        energy: Math.max(0, run.energy - amount),
      };
    }

    case 'CHOOSE_FORK': {
      const { round, choice } = event;
      const forkOption = run.forkOptions[round];
      if (!forkOption) return run;

      const chosenNodeType = choice === 'left' ? forkOption[0] : forkOption[1];
      const nodeIndex = round - 1; // nodeMap is 0-indexed

      return {
        ...run,
        forkChoices: { ...run.forkChoices, [round]: choice },
        nodeMap: run.nodeMap.map((node, i) => (i === nodeIndex ? chosenNodeType : node)),
      };
    }

    case 'ENTER_SIGNAL_NODE': {
      // Signal node is entered - this is handled by the signal handler
      // The reducer just marks that we're in a signal node pending state
      return {
        ...run,
        signalNodePending: true,
      };
    }

    case 'RESOLVE_SIGNAL': {
      // Signal choice is resolved - clear pending state
      // Replace nodeMap entry with 'salvage' to prevent re-entry
      return {
        ...run,
        signalNodePending: false,
        signalNodeId: '',
        nodeMap: run.nodeMap.map((node, i) => (i === run.round - 1 ? 'salvage' : node)),
      };
    }

    case 'ENTER_AUDIT_NODE': {
      return {
        ...run,
        auditNodePending: true,
        auditResolved: false,
      };
    }

    case 'RESOLVE_AUDIT': {
      const { paid } = event;
      let updates: Partial<RunState> = {
        auditNodePending: false,
        auditResolved: true,
      };

      if (paid) {
        // Player paid the audit fee
        updates = {
          ...updates,
          runCredits: Math.max(0, run.runCredits - 5000),
          hull: Math.min(MAX_HULL + run.maxHullBonus, run.hull + 5),
        };
      } else {
        // Player contested — elevated danger handled by danger factor
        updates = {
          ...updates,
          debtIncrease: run.debtIncrease + 30000,
        };
      }

      return { ...run, ...updates };
    }

    case 'ENTER_CACHE_NODE': {
      return {
        ...run,
        cacheNodePending: true,
        cacheNodeItem: event.itemId ?? null,
      };
    }

    case 'RESOLVE_CACHE': {
      const { take } = event;

      // Replace nodeMap entry with 'salvage' to prevent re-entry
      const updatedNodeMap = run.nodeMap.map((node, i) => (i === run.round - 1 ? 'salvage' : node));

      if (take && run.cacheNodeItem) {
        // Player took the item — look up the item to get its slot for the key
        const item = HARDWARE_ITEMS.find(i => i.id === run.cacheNodeItem);
        if (item) {
          return {
            ...run,
            foundHardware: { ...run.foundHardware, [item.slot]: item.id },
            cacheNodePending: false,
            cacheNodeItem: null,
            nodeMap: updatedNodeMap,
          };
        }
      }

      // Player left it or item lookup failed
      return {
        ...run,
        cacheNodePending: false,
        cacheNodeItem: null,
        nodeMap: updatedNodeMap,
      };
    }

    case 'MARK_BOSS_LOOT': {
      return {
        ...run,
        isBossLoot: true,
      };
    }

    case 'REDRAW_HAND': {
      // Check if already used this round or insufficient energy
      if (run.redrawUsedThisRound || run.energy < 1) {
        return run;
      }

      // Discard current hand, draw new cards
      const newDiscard = [...run.discardPile, ...run.hand];
      const drawnResult = drawHand(run.deck, newDiscard, 3);

      return {
        ...run,
        energy: run.energy - 1,
        redrawUsedThisRound: true,
        hand: drawnResult.hand,
        deck: drawnResult.newDraw,
        discardPile: drawnResult.newDiscard,
        pendingReshuffleLog: drawnResult.reshuffled,
      };
    }

    case 'FRESH_START_REDRAW': {
      // Fresh Start: 1⚡, full redraw, once/round
      if (run.redrawUsedThisRound || run.energy < 1 || run.hand.length === 0) {
        return run;
      }

      // Discard current hand, draw new cards
      const newDiscard = [...run.discardPile, ...run.hand];
      const drawnResult = drawHand(run.deck, newDiscard, 3);

      // Log the redraw action
      const logEntries = [...run.roundHistory, {
        round: run.round,
        cardId: 'fresh_start_redraw',
        cardName: 'Fresh Start: Hand redrawn (1⚡)',
      }];

      return {
        ...run,
        energy: run.energy - 1,
        redrawUsedThisRound: true,
        hand: drawnResult.hand,
        deck: drawnResult.newDraw,
        discardPile: drawnResult.newDiscard,
        pendingReshuffleLog: drawnResult.reshuffled,
        roundHistory: logEntries,
      };
    }

    case 'SURGICAL_DISCARD': {
      // Surgical Discard: 1⚡, discard 1 draw 1, unlimited
      const { cardIndex } = event;
      
      if (run.energy < 1 || cardIndex < 0 || cardIndex >= run.hand.length) {
        return run;
      }

      // Get the discarded card
      const discardedCardId = run.hand[cardIndex];
      const newHand = [...run.hand.slice(0, cardIndex), ...run.hand.slice(cardIndex + 1)];
      const newDiscard = [...run.discardPile, discardedCardId];

      // Draw one card to replace it
      const drawnResult = drawHand(run.deck, newDiscard, 1);

      // Log the action
      const logEntries = [...run.roundHistory, {
        round: run.round,
        cardId: 'surgical_discard',
        cardName: `Surgical Discard: Replaced card (1⚡)`,
      }];

      return {
        ...run,
        energy: run.energy - 1,
        hand: [...newHand, ...drawnResult.hand],
        deck: drawnResult.newDraw,
        discardPile: drawnResult.newDiscard,
        pendingReshuffleLog: drawnResult.reshuffled,
        roundHistory: logEntries,
      };
    }

    case 'DESPERATE_SCRAMBLE': {
      // Desperate Scramble: 0⚡, 5 hull damage, full redraw, unlimited
      const hullDamage = 5;
      const newHull = Math.max(0, run.hull - hullDamage);

      // Discard current hand, draw new cards
      const newDiscard = [...run.discardPile, ...run.hand];
      const drawnResult = drawHand(run.deck, newDiscard, 3);

      // Log the action with warning
      const logEntries = [...run.roundHistory, {
        round: run.round,
        cardId: 'desperate_scramble',
        cardName: `Desperate Scramble: Hull −${hullDamage} (free redraw)`,
      }];

      // Check if this kills the run
      if (newHull <= 0) {
        return {
          ...run,
          hull: 0,
          phase: 'collapsed',
          roundHistory: [...logEntries, {
            round: run.round,
            cardId: 'desperate_death',
            cardName: 'Hull critical! Run collapsed!',
          }],
        };
      }

      return {
        ...run,
        hull: newHull,
        hand: drawnResult.hand,
        deck: drawnResult.newDraw,
        discardPile: drawnResult.newDiscard,
        pendingReshuffleLog: drawnResult.reshuffled,
        roundHistory: logEntries,
      };
    }

    case 'USE_HARDWARE_ABILITY': {
      const { slot, overcharge } = event;

      // Check if hardware is on cooldown
      if (run.hardwareCooldowns[slot] > 0) {
        // Log blocked attempt
        const logEntries = [...run.roundHistory, {
          round: run.round,
          cardId: 'hardware_cooldown',
          cardName: `${slot} hardware cooling down (${run.hardwareCooldowns[slot]} rounds)`,
        }];
        return { ...run, roundHistory: logEntries };
      }

      // Base costs
      const baseCosts = { hull: 2, scanner: 1, utility: 1 };
      let energyCost = baseCosts[slot];
      
      // Overcharge adds +1⚡ cost
      if (overcharge) {
        energyCost += 1;
      }

      // Check energy
      if (run.energy < energyCost) {
        return run;
      }

      // Calculate effect values
      const baseHullHeal = 15;
      const overchargeHullHeal = 22; // ~50% stronger
      
      let effectResult: Partial<RunState> = {};
      let logMessage: string;

      switch (slot) {
        case 'hull': {
          const healAmount = overcharge ? overchargeHullHeal : baseHullHeal;
          effectResult = { hull: Math.min(MAX_HULL + run.maxHullBonus, run.hull + healAmount) };
          logMessage = overcharge 
            ? `Hull System (Overcharged): +${healAmount} hull (3⚡)`
            : `Hull System: +${healAmount} hull (2⚡)`;
          break;
        }
        case 'scanner': {
          // Scanner has two modes:
          // Quick Scan (1⚡): Reveals next node type only
          // Deep Scan (2⚡, overcharge): Reveals exact hull + next node + danger magnitude estimate
          if (overcharge) {
            // Deep Scan - full intel
            const nextRound = run.round + 1;
            const nextNode = nextRound <= run.nodeMap.length ? run.nodeMap[nextRound - 1] : 'unknown';
            
            // Estimate danger magnitude based on node type and round
            let magnitude: 'low' | 'medium' | 'high' = 'low';
            if (nextNode === 'boss') magnitude = 'high';
            else if (nextNode === 'audit') magnitude = 'medium';
            else if (nextNode === 'signal') magnitude = 'low';
            else if (run.round > 7) magnitude = 'high';
            else if (run.round > 4) magnitude = 'medium';
            
            // Add to danger forecast
            const newForecast = [...run.dangerForecast, {
              round: nextRound,
              type: nextNode,
              magnitude,
            }];
            
            effectResult = { 
              analyzed: true,
              exactHullRevealed: true,
              dangerForecast: newForecast,
            };
            logMessage = `Deep Scan: Hull ${run.hull}/${MAX_HULL + run.maxHullBonus} | Next: ${nextNode} (${magnitude} threat) (2⚡)`;
          } else {
            // Quick Scan - basic intel
            effectResult = { analyzed: true };
            logMessage = `Quick Scan: Next node revealed (1⚡)`;
          }
          break;
        }
        case 'utility': {
          const shieldsGained = overcharge ? 2 : 1;
          effectResult = { shieldCharges: run.shieldCharges + shieldsGained };
          logMessage = overcharge
            ? `Utility System (Overcharged): +${shieldsGained} shields (2⚡)`
            : `Utility System: +${shieldsGained} shields (1⚡)`;
          break;
        }
        default:
          return run;
      }

      // Deduct energy
      let newEnergy = run.energy - energyCost;
      let newHardwareUsed = run.hardwareUsedThisRound + 1;
      let synergyRefund = 0;
      
      // Hardware synergy bonus: 2+ hardware used = +1⚡ refund
      if (newHardwareUsed === 2) {
        synergyRefund = 1;
        newEnergy = Math.min(run.maxEnergy, newEnergy + synergyRefund);
        logMessage += ' [SYNERGY: +1⚡ refund]';
      }

      // Build log entry
      const logEntries = [...run.roundHistory, {
        round: run.round,
        cardId: `hardware_${slot}`,
        cardName: logMessage,
      }];

      return {
        ...run,
        energy: newEnergy,
        hardwareCooldowns: { ...run.hardwareCooldowns, [slot]: HARDWARE_COOLDOWN_ROUNDS },
        hardwareUsedThisRound: newHardwareUsed,
        roundHistory: logEntries,
        ...effectResult,
      };
    }
  }
}
