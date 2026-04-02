/**
 * Dive Screen Handler
 *
 * Handles dive gameplay including card playing, node transitions,
 * and fork choices.
 */

import { GameStore } from '../app/game-store';
import { GameState } from './game-state';
import { CORE_CARDS } from '../content/cards';
import { renderDive, DiveAction } from '../ui/dive-renderer';
import { selectLootOfferings } from '../dive/deck-manager';
import { buildLootOfferings } from '../dive/loot-pool';
import { getSignalById, pickSignalForRound } from '../content/signals';
import { pickRandomHardware } from '../dive/hardware-discovery';
import { TutorialInteraction } from '../tutorial/tutorial-context';
import { ALL_CARDS } from '../content/cards';

export function handleDive(
  state: GameState,
  store: GameStore,
  action: DiveAction | null,
  forkChoice: 'left' | 'right' | null,
): void {
  const snapBefore = store.getState();
  const run = snapBefore.currentRun;

  if (run === null) return;

  // Handle fork choice first
  if (forkChoice !== null) {
    const round = run.round as 4 | 8;
    store.dispatch({
      type: 'DIVE_EVENT',
      event: { type: 'CHOOSE_FORK', round, choice: forkChoice },
    });
    return;
  }

  // Check for cache node entry
  if (!run.cacheNodePending && run.nodeMap[run.round - 1] === 'cache') {
    // Merge found hardware this run with equipped items to avoid duplicate slot offers
    const occupiedHardware: Partial<Record<import('../content/hardware').ItemSlot, string>> = {
      ...run.foundHardware,
      ...(snapBefore.meta.equippedItems.hull ? { hull: snapBefore.meta.equippedItems.hull } : {}),
      ...(snapBefore.meta.equippedItems.scanner ? { scanner: snapBefore.meta.equippedItems.scanner } : {}),
      ...(snapBefore.meta.equippedItems.utility ? { utility: snapBefore.meta.equippedItems.utility } : {}),
    };
    const foundItem = pickRandomHardware(occupiedHardware, undefined, snapBefore.meta.doctrineLocked);
    if (foundItem) {
      store.dispatch({ type: 'DIVE_EVENT', event: { type: 'ENTER_CACHE_NODE', itemId: foundItem.id } });
      state.setScreen('cache-node');
      return;
    }
  }

  // Check for signal node entry
  if (!run.signalNodePending && run.nodeMap[run.round - 1] === 'signal') {
    store.dispatch({ type: 'DIVE_EVENT', event: { type: 'ENTER_SIGNAL_NODE' } });
    const signalId = pickSignalForRound(run.round, Math.random);
    const signal = getSignalById(signalId);
    if (signal) {
      state.setCurrentSignal(signal);
      state.setScreen('signal-node');
    }
    return;
  }

  if (action === null) return;

  // Handle redraw action
  if (action.type === 'REDRAW_HAND') {
    store.dispatch({ type: 'DIVE_EVENT', event: { type: 'REDRAW_HAND' } });
    state.runLog.push(`Round ${run.round}: Redraw hand (-1⚡)`);
    return;
  }

  // Handle Fresh Start redraw
  if (action.type === 'FRESH_START_REDRAW') {
    store.dispatch({ type: 'DIVE_EVENT', event: { type: 'FRESH_START_REDRAW' } });
    state.runLog.push(`Round ${run.round}: Fresh Start redraw (-1⚡)`);
    return;
  }

  // Handle Surgical Discard
  if (action.type === 'SURGICAL_DISCARD') {
    const cardIndex = action.cardIndex ?? 0;
    store.dispatch({ type: 'DIVE_EVENT', event: { type: 'SURGICAL_DISCARD', cardIndex } });
    state.runLog.push(`Round ${run.round}: Surgical discard (-1⚡)`);
    return;
  }

  // Handle Desperate Scramble
  if (action.type === 'DESPERATE_SCRAMBLE') {
    store.dispatch({ type: 'DIVE_EVENT', event: { type: 'DESPERATE_SCRAMBLE' } });
    state.runLog.push(`Round ${run.round}: Desperate scramble (-5 hull)`);
    return;
  }

  // Handle hardware ability action
  if (action.type === 'USE_HARDWARE_ABILITY') {
    const slot = action.hardwareSlot!;
    const overcharge = action.overcharge ?? false;
    const slotNames: Record<string, string> = { hull: 'Hull Repair', scanner: 'Deep Scan', utility: 'Shield Boost' };
    
    // Check if hardware is on cooldown
    const cooldown = run.hardwareCooldowns[slot];
    if (cooldown > 0) {
      // Hardware is on cooldown - show error toast via log
      state.runLog.push(`⚠ ${slotNames[slot]} cooling down (${cooldown} rounds remaining)`);
      return;
    }
    
    const baseCost = slot === 'hull' ? 2 : 1;
    const totalCost = overcharge ? baseCost + 1 : baseCost;
    
    store.dispatch({ type: 'DIVE_EVENT', event: { type: 'USE_HARDWARE_ABILITY', slot, overcharge } });
    state.runLog.push(`Round ${run.round}: Used ${slotNames[slot]}${overcharge ? ' (Overcharged)' : ''} (-${totalCost}⚡)`);
    
    // Check for hardware synergy bonus (2+ hardware used)
    const newHardwareUsed = (run.hardwareUsedThisRound || 0) + 1;
    if (newHardwareUsed === 2) {
      state.runLog.push(`  ↺ Hardware synergy: +1⚡ refund`);
    }
    return;
  }

  // Handle card play
  const cardId = action.cardId;
  if (cardId === null || cardId === undefined) return;

  const before = run;
  const beforeDiscardSize = before.discardPile.length;
  const overcharge = action.overcharge ?? false;
  
  // Get card info for logging
  const card = ALL_CARDS.find(c => c.id === cardId);
  const baseCost = card?.energyCost ?? 0;
  const totalCost = overcharge ? baseCost + 1 : baseCost;
  
  const dangerMessages = store.dispatchPlayCard(cardId, overcharge);
  const snap = store.getState();
  const afterSnap = snap.currentRun;

  // Log the action
  if (before) {
    const ref = afterSnap ?? store.lastEndedRun ?? before;
    const creditsDelta = ref.runCredits - before.runCredits;
    const hullDelta = ref.hull - before.hull;
    let entry = `Round ${before.round}: ${cardId}${overcharge ? ' (Overcharged)' : ''}`;
    if (creditsDelta !== 0) entry += `  ₡${creditsDelta > 0 ? '+' : ''}${creditsDelta}`;
    if (hullDelta !== 0) entry += `  hull ${hullDelta > 0 ? '+' : ''}${hullDelta}`;
    entry += ` (-${totalCost}⚡)`;
    state.runLog.push(entry);
    
    // Check for reserve burn
    if (before.energy >= before.maxEnergy && before.reserveBurnAvailable && totalCost > 0) {
      state.runLog.push(`  ↺ Reserve burn: -1⚡ discount applied`);
    }
    
    // Check for Corporate doctrine energy bonus
    if (afterSnap && afterSnap.doctrineLocked === 'corporate') {
      const energySpent = afterSnap.energySpentThisRound;
      if (energySpent >= 3 && before.energySpentThisRound < 3) {
        state.runLog.push(`  💰 Corporate bonus: +1000₡ (3+⚡ spent)`);
      }
    }
    
    // Check for Cooperative shield resonance
    if (afterSnap && afterSnap.doctrineLocked === 'cooperative') {
      const shieldCards = ['shield', 'team_shield', 'reinforced_shield', 'ablative_screen', 'shield_bash'];
      if (shieldCards.includes(cardId) && before.energy >= 2) {
        state.runLog.push(`  🛡️ Cooperative resonance: +1 shield charge`);
      }
    }
    
    // Check for Smuggler desperation bonus
    if (afterSnap && afterSnap.doctrineLocked === 'smuggler') {
      if (before.energy < 2 && cardId === 'scavenge') {
        state.runLog.push(`  ⚡ Smuggler desperation: +25% scrap yield`);
      }
    }
    
    // Info card reveal feedback
    const infoCards = ['diagnostic', 'deep_scan', 'tactical_assessment', 'emergency_telemetry'];
    if (infoCards.includes(cardId) && afterSnap) {
      if (afterSnap.exactHullRevealed && !before.exactHullRevealed) {
        const maxHull = 100 + (afterSnap.maxHullBonus || 0);
        state.runLog.push(`  👁 Hull revealed: ${afterSnap.hull}/${maxHull}`);
      }
      if (afterSnap.dangerForecast && afterSnap.dangerForecast.length > (before.dangerForecast?.length || 0)) {
        const newForecasts = afterSnap.dangerForecast.slice(before.dangerForecast?.length || 0);
        for (const forecast of newForecasts) {
          const magnitudeEmoji = forecast.magnitude === 'high' ? '🔴' : forecast.magnitude === 'medium' ? '🟡' : '🟢';
          state.runLog.push(`  👁 Danger forecast: Round ${forecast.round} ${magnitudeEmoji} ${forecast.magnitude} threat (${forecast.type})`);
        }
      }
    }
  }

  // Check for reshuffle
  if (afterSnap && beforeDiscardSize > 0 && afterSnap.discardPile.length === 0) {
    state.runLog.push('  ↺ Deck reshuffled.');
  }

  // Add danger messages
  for (const msg of dangerMessages) {
    state.runLog.push(msg);
  }

  // Handle audit node
  if (snap.currentRun?.auditNodePending) {
    handleAuditNodePending(state, store, snap.currentRun);
  }

  // Handle boss loot
  if (snap.currentRun?.isBossRound && snap.currentRun.round === 10) {
    handleBossLoot(state, store, snap.currentRun, snap.meta);
  }

  // Handle regular loot node
  if (snap.currentRun?.lootNodePending) {
    handleLootNode(state, store, snap.currentRun, snap.meta);
  }

  // Check for run end
  if (snap.currentRun === null || snap.currentRun.phase !== 'active') {
    if (snap.currentRun === null) {
      const ended = store.lastEndedRun;
      if (ended) {
        state.updateLastRun(ended, store.lastHaulValue, store.lastEchoGained);
      }
      state.setScreen('result');
    }
  }
}

function handleAuditNodePending(state: GameState, store: GameStore, run: import('../types/state').RunState): void {
  if (run.auditBribed) {
    state.runLog.push('⚖ Audit satisfied — bribe accepted. No penalty.');
    store.dispatch({
      type: 'DIVE_EVENT',
      event: { type: 'RESOLVE_AUDIT', paid: true },
    });
  } else if (run.runCredits < 5000) {
    state.runLog.push('⚖ Audit: insufficient funds. Hull -20. Debt +₡30,000.');
    store.dispatch({
      type: 'DIVE_EVENT',
      event: { type: 'RESOLVE_AUDIT', paid: false },
    });
  } else {
    state.setScreen('audit-node');
  }
}

function handleBossLoot(
  state: GameState,
  store: GameStore,
  run: import('../types/state').RunState,
  meta: import('../types/state').MetaState,
): void {
  if (run.isBossLoot || run.phase !== 'active') return;

  // Use doctrine-weighted loot offerings for boss loot with round-based rarity
  const cardOfferings = buildLootOfferings(
    meta.doctrinePoints,
    meta.doctrineLocked,
    run.round,
    meta.equippedItems,
  );

  if (cardOfferings.length > 0) {
    state.setLootOfferings(cardOfferings);
  } else {
    // Fallback to original selection if no offerings
    state.setLootOfferings(selectLootOfferings(CORE_CARDS, true, meta.equippedItems));
  }

  store.dispatch({
    type: 'DIVE_EVENT',
    event: { type: 'MARK_BOSS_LOOT' },
  });

  state.setScreen('loot-node');
}

function handleLootNode(
  state: GameState,
  store: GameStore,
  run: import('../types/state').RunState,
  meta: import('../types/state').MetaState,
): void {
  // Tutorial guard: skip loot node on first run
  if (meta.totalRuns === 0) {
    store.dispatchLootChoice(null);
  } else {
    // Use doctrine-weighted loot offerings with round-based rarity
    const cardOfferings = buildLootOfferings(
      meta.doctrinePoints,
      meta.doctrineLocked,
      run.lootNodeRound,
      meta.equippedItems,
    );

    if (cardOfferings.length > 0) {
      state.setLootOfferings(cardOfferings);
    } else {
      // Fallback to original selection if no offerings
      state.setLootOfferings(selectLootOfferings(CORE_CARDS, false, meta.equippedItems));
    }
    state.setScreen('loot-node');
  }
}

export function renderAndHandleDive(
  state: GameState,
  store: GameStore,
  mx: number,
  my: number,
  now: number,
  tutorialActive: boolean,
): void {
  const snap = store.getState();
  const meta = snap.meta;

  let lockedCardId: string | undefined;
  let isTutorialLocked = false;

  if (state.tutorialContext?.isLocked) {
    const expectedType = state.tutorialContext.expectedInteraction?.type;
    if (expectedType === 'dive-card') {
      lockedCardId = state.tutorialContext.expectedInteraction?.id;
      isTutorialLocked = true;
    } else if (expectedType === 'route-toggle') {
      isTutorialLocked = true;
    }
  }

  const diveResult = renderDive(
    snap.currentRun!,
    snap.currentDraft,
    state.runLog,
    mx,
    my,
    lockedCardId,
    isTutorialLocked,
    now,
    !meta.tutorialCompleted,
    meta,
  );

  if (diveResult.action) {
    const cardInteraction: TutorialInteraction = {
      type: 'dive-card',
      id: diveResult.action.cardId ?? 'unknown',
    };
    if (state.tutorialContext?.checkInteraction(cardInteraction)) {
      state.tutorialDialoguePlayer?.advance();
    }
  }

  handleDive(state, store, diveResult.action, diveResult.forkChoice);
}
