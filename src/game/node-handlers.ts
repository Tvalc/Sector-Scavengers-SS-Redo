/**
 * Special Node Handlers
 *
 * Handles loot nodes, signal nodes, audit nodes, cache nodes,
 * and the debt-cleared screen.
 */

import { MakkoEngine } from '@makko/engine';
import { GameStore } from '../app/game-store';
import { GameState } from './game-state';
import { CORE_CARDS } from '../content/cards';
import { renderLootNode } from '../ui/loot-node-renderer';
import { renderSignal } from '../ui/signal-renderer';
import { renderAuditNode } from '../ui/audit-renderer';
import { renderCacheNode } from '../ui/cache-renderer';
import { renderDebtCleared } from '../ui/debt-cleared-renderer';
import { renderResult, type BillingReportInfo } from '../ui/result-renderer';
import { renderBillingForecastModal, calculateBillingForecast } from '../ui/expedition/billing-forecast-modal';
import { initLoreScreen } from '../ui/lore-screen';
import { BILLING_MISSED_PENALTY_RATE } from '../config/constants';
import { processShipBilling, checkExpeditionStatus } from '../dive/expedition-billing';
import type { ShipBillingResult } from '../dive/expedition-billing';

export function handleLootNode(
  state: GameState,
  store: GameStore,
  mx: number,
  my: number,
  now: number,
): void {
  const snap = store.getState();

  if (snap.currentRun === null) {
    // Run ended while waiting at loot node
    const ended = store.lastEndedRun;
    if (ended) {
      state.updateLastRun(ended, store.lastHaulValue, store.lastEchoGained);
    }
    state.setScreen('result');
    return;
  }

  const lootResult = renderLootNode(
    state.lootOfferings,
    snap.currentRun,
    snap.meta.unlockedCards,
    mx,
    my,
    now,
  );

  if (!lootResult.action) return;

  const action = lootResult.action;

  if (action.type === 'CHOOSE_CARD') {
    store.dispatchLootChoice(action.cardId);
    const cardName = CORE_CARDS.find(c => c.id === action.cardId)?.name ?? action.cardId;
    state.runLog.push(`⬡ Loot Node: added ${cardName}`);
  } else if (action.type === 'SKIP') {
    store.dispatchLootChoice(null);
    state.runLog.push('⬡ Loot Node: skipped');
  }

  // Check if run ended after loot choice
  const afterSnap = store.getState();
  if (afterSnap.currentRun === null || afterSnap.currentRun.phase !== 'active') {
    if (afterSnap.currentRun === null) {
      const ended = store.lastEndedRun;
      if (ended) {
        state.updateLastRun(ended, store.lastHaulValue, store.lastEchoGained);
      }
      state.setScreen('result');
    } else {
      state.setScreen('dive');
    }
  } else {
    state.setScreen('dive');
  }
}

export function handleSignalNode(
  state: GameState,
  store: GameStore,
  mx: number,
  my: number,
  now: number,
): void {
  const snap = store.getState();

  if (!state.currentSignal || !snap.currentRun) return;

  const signalResult = renderSignal(state.currentSignal, snap.currentRun, mx, my, now);

  if (!signalResult.action) return;

  const choiceIndex = signalResult.action.choiceIndex;
  const signalId = state.currentSignal.id;

  store.dispatch({
    type: 'DIVE_EVENT',
    event: { type: 'RESOLVE_SIGNAL', signalId, choiceIndex },
  });

  // Log the choice
  const choice = state.currentSignal.choices[choiceIndex];
  state.runLog.push(`◈ Signal: ${state.currentSignal.title} — chose "${choice.label}"`);

  // Clear signal and return to dive
  state.setCurrentSignal(null);
  state.setScreen('dive');
}

export function handleAuditNode(
  state: GameState,
  store: GameStore,
  mx: number,
  my: number,
  now: number,
): void {
  const snap = store.getState();

  if (!snap.currentRun) return;

  const auditResult = renderAuditNode(snap.currentRun, mx, my, now);

  if (!auditResult.action) return;

  const paid = auditResult.action.type === 'PAY';

  store.dispatch({
    type: 'DIVE_EVENT',
    event: { type: 'RESOLVE_AUDIT', paid },
  });

  // Log the choice
  if (paid) {
    state.runLog.push('⚖ Audit: Paid ₡5,000. Hull +5.');
  } else {
    state.runLog.push('⚖ Audit: Contested. Elevated danger this round. Debt +₡30,000.');
  }

  state.setScreen('dive');
}

export function handleCacheNode(
  state: GameState,
  store: GameStore,
  mx: number,
  my: number,
  now: number,
): void {
  const snap = store.getState();

  if (!snap.currentRun) return;

  const cacheResult = renderCacheNode(snap.currentRun, mx, my, now);

  if (!cacheResult.action) return;

  const take = cacheResult.action.type === 'TAKE';

  store.dispatch({
    type: 'DIVE_EVENT',
    event: { type: 'RESOLVE_CACHE', take },
  });

  // Log the choice
  if (take) {
    const item = snap.currentRun.cacheNodeItem;
    state.runLog.push(`◆ Cache: Took ${item || 'hardware'}`);
  } else {
    state.runLog.push('◆ Cache: Left the hardware');
  }

  state.setScreen('dive');
}

export function handleDebtCleared(
  state: GameState,
  store: GameStore,
  mx: number,
  my: number,
  now: number,
): void {
  const snap = store.getState();

  const clearedResult = renderDebtCleared(snap.meta, mx, my, now);

  if (!clearedResult.action) return;

  store.debtClearedThisRun = false;
  state.setScreen('hub');
}

export function handleBillingForecast(
  state: GameState,
  store: GameStore,
  mx: number,
  my: number,
): void {
  const snap = store.getState();
  const meta = snap.meta;

  // Calculate billing forecast
  if (!state.billingForecast) {
    const path = meta.activeRunPath;
    const forecast = calculateBillingForecast({ meta, runPath: path });
    state.billingForecast = forecast;
    state.billingForecastPath = path;
  }

  // Render the forecast modal
  const forecastResult = renderBillingForecastModal(
    MakkoEngine.display,
    state.billingForecast,
    mx,
    my,
  );

  if (forecastResult === 'CONTINUE') {
    // Process the actual billing
    const path = meta.activeRunPath;
    if (path) {
      const availableCredits = path.pathCredits;
      const billingResult = processShipBilling(path, availableCredits);
      
      // Store billing result for post-ship progress display
      state.lastBillingResult = billingResult;
      
      // Update path credits after billing
      path.pathCredits = billingResult.creditsAfter;
      
      // Increment ships completed
      path.shipsCompleted++;
      
      // Check expedition status
      const expeditionStatus = checkExpeditionStatus(path);
      
      if (expeditionStatus === 'victory') {
        // VICTORY: Go to victory flow
        state.expeditionOutcome = 'victory';
        state.billingProcessed = true;
        state.billingForecast = null;
        state.setScreen('expedition-victory');
        return;
      } else if (expeditionStatus === 'failed') {
        // FAILED: Determine if ceiling death or strike out
        if (path.expeditionDebt >= path.expeditionDebtCeiling) {
          state.expeditionOutcome = 'ceiling_death';
        } else if (path.expeditionMissedPayments >= 3) {
          state.expeditionOutcome = 'strike_out';
        } else {
          state.expeditionOutcome = 'ceiling_death'; // Default
        }
        state.billingProcessed = true;
        state.billingForecast = null;
        state.setScreen('expedition-failed');
        return;
      }
      // If ongoing, continue to result screen then post-ship progress
    }
    
    state.billingProcessed = true;
    state.billingForecast = null;
    state.setScreen('result');
  }
}

export function handleResult(
  state: GameState,
  store: GameStore,
  mx: number,
  my: number,
  now: number,
): void {
  const lastRun = state.lastRun.run;
  if (!lastRun) {
    // No run data - force transition to hub to prevent soft lock
    state.setScreen('hub');
    return;
  }

  const snap = store.getState();
  const meta = snap.meta;

  // Check if this is a path-continuing result (mid-expedition ship cleared)
  // Tree model: expedition continues if current node has unvisited children
  const currentNode = meta.activeRunPath?.currentNodeId
    ? meta.activeRunPath.nodes.find(n => n.id === meta.activeRunPath!.currentNodeId)
    : null;
  const hasChildren = currentNode
    ? currentNode.childIds.some(cid => {
        const child = meta.activeRunPath!.nodes.find(n => n.id === cid);
        return child && !child.visited;
      })
    : false;
  const isPathContinuing = !!(
    meta.activeRunPath &&
    lastRun.phase === 'extracted' &&
    !store.debtClearedThisRun &&
    hasChildren
  );

  // Check if expedition is ending (boss/no children or collapse) - need billing forecast first
  const isExpeditionEnding = !!(
    meta.activeRunPath &&
    !isPathContinuing &&
    !state.billingProcessed &&
    !store.debtClearedThisRun
  );

  // If expedition is ending and we haven't shown billing forecast yet, redirect to it
  if (isExpeditionEnding) {
    state.setScreen('billing-forecast');
    return;
  }

  const delta = state.preRunMeta !== null
    ? {
        haulValueBefore: 0, // Haul value is reset each run
        debtBefore: state.preRunMeta.debt,
        voidBefore: state.preRunMeta.voidEcho,
        inventoryCountBefore: state.preRunMeta.hubInventory.reduce((s, e) => s + e.quantity, 0),
      }
    : null;

  // Use salvage/items from lastEndedRun if available, otherwise from the run state itself
  const salvage = store.lastEndedRun?.salvage ?? lastRun.salvage ?? [];
  const itemsFound = store.lastEndedRun?.itemsFound ?? lastRun.itemsFound ?? [];

  // Get accumulated path credits for display
  const pathCredits = meta.activeRunPath?.pathCredits ?? 0;

  // Build billing report when not path-continuing and not debt-cleared
  const debtCleared = store.lastExtractDebtCleared;
  const collapsed = lastRun.phase === 'collapsed';
  let billingReport: BillingReportInfo | null = null;

  if (!isPathContinuing && collapsed) {
    // Collapse: simplified billing note
    billingReport = {
      billingAmount: meta.billingAmount,
      upkeepPerAwakeCrew: meta.upkeepPerAwakeCrew,
      awakeCrewCount: (meta.leadId ? 1 : 0) + meta.companionIds.length,
      totalBill: 0, // Not computed for collapse
      creditsEarned: 0,
      paid: false,
      penalty: 0,
      consecutiveMissedPayments: meta.consecutiveMissedPayments,
      currentDebt: meta.debt,
      isCollapse: true,
    };
  } else if (!isPathContinuing && debtCleared === false) {
    // Extracted but debt not cleared: show full billing report
    const awakeCrew = (meta.leadId ? 1 : 0) + meta.companionIds.length;
    const totalBill = meta.billingAmount + awakeCrew * meta.upkeepPerAwakeCrew;
    const creditsEarned = state.lastRun.haulValue;
    const paid = creditsEarned >= totalBill;
    const penalty = paid ? 0 : Math.ceil(totalBill * BILLING_MISSED_PENALTY_RATE);
    billingReport = {
      billingAmount: meta.billingAmount,
      upkeepPerAwakeCrew: meta.upkeepPerAwakeCrew,
      awakeCrewCount: awakeCrew,
      totalBill,
      creditsEarned,
      paid,
      penalty,
      consecutiveMissedPayments: meta.consecutiveMissedPayments,
      currentDebt: meta.debt,
      isCollapse: false,
    };
  }

  const resultAction = renderResult(
    lastRun,
    state.lastRun.haulValue,
    state.lastRun.echo,
    salvage,
    itemsFound,
    mx,
    my,
    delta,
    store.lastExtractDebtCleared,
    isPathContinuing,
    pathCredits,
    billingReport,
  );

  if (resultAction === 'CONTINUE') {
    state.preRunMeta = null;
    state.billingProcessed = false; // Reset for next expedition
    state.billingForecast = null;
    state.billingForecastPath = null;

    if (isPathContinuing) {
      // Mid-path: show post-ship progress, then go to intership loot or path map
      state.setScreen('post-ship-progress');
    } else if (store.debtClearedThisRun && store.pendingLoreFragments.length > 0) {
      // Final victory with lore
      initLoreScreen(store.pendingLoreFragments, store.pendingLoreAttributionCrewId);
      store.pendingLoreFragments = [];
      store.pendingLoreAttributionCrewId = null;
      state.setScreen('lore');
    } else if (store.debtClearedThisRun) {
      state.setScreen('ending');
    } else {
      // Collapse or single-run end
      state.setScreen('hub');
    }
  }
}
