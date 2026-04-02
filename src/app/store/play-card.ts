// dispatchPlayCard logic: card play, danger resolution, round advance, and
// Ancestor Memory preview. Extracted from GameStore for maintainability.

import { GameState, RunState } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { reduceRun } from '../../dive/diveReducer';
import { DANGER_LIST, resolveDanger } from '../../content/dangers';
import { getDoctrine } from '../../content/doctrine';
import { getPurchasedTiersForBranch } from '../../content/void-communion';
import { computeCrewEffects, CrewMemberId } from '../../content/crew';
import { computeHardwareEffects } from '../hardware-effects';
import { computeCrewAssignmentEffects } from '../crew-assignment-effects';
import { computeModuleEffects } from '../module-effects';
import { drawHand } from '../../dive/deck-manager';
import { getDangerScaling } from '../../dive/card-effects/types';
import { onCardDrawn } from '../../ui/dive-renderer/animation-bridge';

export interface PlayCardResult {
  state: GameState;
  dangerMessages: string[];
  runEnded: boolean;
}

export function applyPlayCard(state: GameState, cardId: string, overcharge: boolean = false): PlayCardResult {
  if (state.currentRun === null) return { state, dangerMessages: [], runEnded: false };

  const { meta } = state;
  const awakeIds: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];

  // Compute bonuses
  const riskTakerTiers = getPurchasedTiersForBranch(meta.purchasedVoidTiers, 'risk_taker');
  const vcScavengeBonus = riskTakerTiers.reduce(
    (sum, t) => sum + (t.effect.type === 'scavenge_bonus' ? t.effect.value : 0),
    0,
  );
  const crewEffects = computeCrewEffects(meta.leadId, meta.companionIds, meta.crewLevels);
  const crewScavengeBonus = crewEffects.reduce(
    (sum, e) => sum + (e.type === 'scavenge_bonus' ? e.amount : 0),
    0,
  );
  const hwEffects = computeHardwareEffects(meta.equippedItems, state.currentRun?.foundHardware);
  const assignFx = computeCrewAssignmentEffects(meta.crewAssignments, awakeIds);
  const scavengeBonus = vcScavengeBonus + crewScavengeBonus + hwEffects.scavengeBonusFlat + assignFx.scavengeBonusFlat;

  const crewDangerFactor = crewEffects.some((e) => e.type === 'danger_reduce')
    ? crewEffects.reduce((f, e) => (e.type === 'danger_reduce' ? f * e.factor : f), 1.0)
    : 1.0;
  const modFx = computeModuleEffects(meta.moduleLevels);
  let dangerFactor = crewDangerFactor * (1 - hwEffects.breachChanceReduction - modFx.dangerChanceReduction);

  // Boss round: 1.8× danger factor, all dangers active (ignores minRound)
  const isBossRound = state.currentRun.isBossRound;
  if (isBossRound) {
    dangerFactor *= 1.8;
  }

  // Audit contested: 1.5× danger factor and debt increase handled in resolveDanger
  const isAuditContested =
    state.currentRun.auditResolved &&
    !state.currentRun.auditNodePending &&
    state.currentRun.round >= 7 &&
    state.currentRun.debtIncrease >= 30000;
  if (isAuditContested) {
    dangerFactor *= 1.5;
  }

  // Bulwark danger reduction: 30% reduction when active
  if (state.currentRun.bulwarkDangerReduction) {
    dangerFactor *= 0.70;
  }
  // Hull high danger reduction when hull above threshold
  if (hwEffects.hullHighDangerReduction > 0 && state.currentRun.hull > hwEffects.hullHighDangerThreshold) {
    dangerFactor = Math.max(0, dangerFactor - hwEffects.hullHighDangerReduction);
  }

  // Accumulate doctrine points
  let updatedState = state;
  const doctrine = getDoctrine(cardId);
  if (doctrine !== null) {
    if (meta.doctrineLocked === null || meta.doctrineLocked === doctrine) {
      const updatedPoints = { ...meta.doctrinePoints, [doctrine]: meta.doctrinePoints[doctrine] + 1 };
      updatedState = { ...updatedState, meta: { ...meta, doctrinePoints: updatedPoints } };
    }
  }

  // Compute additional effect bonuses
  const shieldGainBonus = hwEffects.shieldGainBonus;
  const botDamageReduction = hwEffects.botDamageReduction;
  const upgradeNoHullCost = hwEffects.upgradeNoHullCost;
  const botCreditBonusPerBot = hwEffects.botCreditBonusPerBot;
  const hullOnShieldBlock = hwEffects.hullOnShieldBlock;

  // Apply the card
  const crewCount = awakeIds.length;
  const afterCard = reduceRun(updatedState.currentRun!, { type: 'PLAY_CARD', cardId, scavengeBonus, shieldGainBonus, botDamageReduction, upgradeNoHullCost, botCreditBonusPerBot, crewCount, overcharge });
  updatedState = { ...updatedState, currentRun: afterCard };

  if (afterCard.phase === 'extracted' || afterCard.phase === 'collapsed') {
    return { state: updatedState, dangerMessages: [], runEnded: true };
  }

  // Consume pendingExtraDraw if set (from distress_response, void_communion_card, etc.)
  let runWithExtraDraw = afterCard;
  if (runWithExtraDraw.pendingExtraDraw) {
    const drawCount = runWithExtraDraw.pendingExtraDrawCount > 0 ? runWithExtraDraw.pendingExtraDrawCount : 1;
    const { hand, newDraw, newDiscard } = drawHand(runWithExtraDraw.deck, runWithExtraDraw.discardPile, drawCount);
    
    // Trigger beam-in animations for extra drawn cards (append to existing hand)
    const startSlotIndex = runWithExtraDraw.hand.length;
    for (let i = 0; i < hand.length; i++) {
      onCardDrawn(hand[i], startSlotIndex + i);
    }
    
    runWithExtraDraw = {
      ...runWithExtraDraw,
      deck: newDraw,
      discardPile: newDiscard,
      hand: [...runWithExtraDraw.hand, ...hand],
      pendingExtraDraw: false,
      pendingExtraDrawCount: 0,
    };
    updatedState = { ...updatedState, currentRun: runWithExtraDraw };
  }

  // Danger resolution
  const dangerMessages: string[] = [];
  let run = afterCard;

  // Check for danger immunity (from last_stand or dangerSkipRemaining) — skip entire danger loop
  if (run.dangerImmune || run.dangerSkipRemaining > 0) {
    run = { ...run, dangerImmune: false };
  } else {
    // Compute Nyx's shield-to-hull regen amount + hardware hullOnShieldBlock
    const shieldToHullRegen = crewEffects.reduce(
      (sum, e) => sum + (e.type === 'shield_to_hull' ? e.amount : 0),
      0,
    ) + hullOnShieldBlock;

    // Get danger scaling based on ship node type
    const scaling = getDangerScaling(run.shipNodeType);
    const shouldSkipDanger = scaling.chanceMultiplier === 0;

    for (const danger of DANGER_LIST) {
      if (run.phase !== 'active') break;
      if (shouldSkipDanger) continue;

      const hadShieldBefore = run.shieldCharges > 0;

      // Calculate effective danger factor with scaling
      let effectiveDangerFactor = dangerFactor * scaling.chanceMultiplier;

      // Boss escalation: add round × 0.1 (capped)
      if (scaling.escalationPerRound) {
        const escalation = Math.min(run.round * scaling.escalationPerRound, 0.95);
        effectiveDangerFactor *= (1 + escalation);
      }

      // Boss round: pass isBossRound flag to ignore minRound filter
      let result;
      if (scaling.guaranteed) {
        // Guaranteed danger - skip the roll and always trigger
        result = resolveDanger(danger, run, 1.0, run.round, isBossRound);
        if (result.triggered) {
          dangerMessages.push(`  ⚠ ${result.logMessage}`);
          run = { ...run, ...result.runDelta } as typeof run;
          // Apply shield-to-hull regen if shield was consumed
          if (hadShieldBefore && shieldToHullRegen > 0 && run.shieldCharges < (result.runDelta.shieldCharges ?? run.shieldCharges + 1)) {
            run = { ...run, hull: Math.min(MAX_HULL + run.maxHullBonus, run.hull + shieldToHullRegen) };
          }
        }
        // Only process one guaranteed danger per round for miniboss
        break;
      } else {
        result = resolveDanger(danger, run, effectiveDangerFactor, run.round, isBossRound);
        if (!result.triggered) continue;
        dangerMessages.push(`  ⚠ ${result.logMessage}`);
        run = { ...run, ...result.runDelta } as typeof run;
        // Apply shield-to-hull regen if shield was consumed
        if (hadShieldBefore && shieldToHullRegen > 0 && run.shieldCharges < (result.runDelta.shieldCharges ?? run.shieldCharges + 1)) {
          run = { ...run, hull: Math.min(MAX_HULL + run.maxHullBonus, run.hull + shieldToHullRegen) };
        }
      }
    }
  }

  updatedState = { ...updatedState, currentRun: run };

  if (run.phase === 'collapsed') {
    return { state: updatedState, dangerMessages, runEnded: true };
  }

  // Ancestor Memory preview
  if (run.ancestorMemoryActive) {
    for (const danger of DANGER_LIST) {
      const previewChance = danger.chance * dangerFactor * (run.analyzed ? 0.5 : 1.0);
      const pct = Math.round(previewChance * 100);
      dangerMessages.push(`  \u{1F52E} Scan: ${danger.name} ${pct}% chance next round`);
    }
    run = { ...run, ancestorMemoryActive: false };
    updatedState = { ...updatedState, currentRun: run };
  }

  // Advance round
  let afterRound = reduceRun(run, { type: 'NEXT_ROUND' });

  // Crew hull_regen passives
  if (afterRound.phase === 'active') {
    const crewHullRegen = crewEffects.reduce(
      (sum, e) => sum + (e.type === 'hull_regen' ? e.amount : 0),
      0,
    );
    if (crewHullRegen > 0) {
      afterRound = { ...afterRound, hull: Math.min(MAX_HULL + afterRound.maxHullBonus, afterRound.hull + crewHullRegen) } as RunState;
    }
  }

  updatedState = { ...updatedState, currentRun: afterRound };
  const runEnded = afterRound.phase === 'collapsed';

  return { state: updatedState, dangerMessages, runEnded };
}
