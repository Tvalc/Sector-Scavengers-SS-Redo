// dispatchPlayCard logic: card play, danger resolution, round advance, and
// Ancestor Memory preview. Extracted from GameStore for maintainability.

import { GameState, RunState } from '../../types/state';
import { reduceRun } from '../../dive/diveReducer';
import { DANGER_LIST, resolveDanger } from '../../content/dangers';
import { getDoctrine } from '../../content/doctrine';
import { getPurchasedTiersForBranch } from '../../content/void-communion';
import { computeCrewEffects, CrewMemberId } from '../../content/crew';
import { computeHardwareEffects } from '../hardware-effects';
import { computeCrewAssignmentEffects } from '../crew-assignment-effects';
import { computeModuleEffects } from '../module-effects';

export interface PlayCardResult {
  state: GameState;
  dangerMessages: string[];
  runEnded: boolean;
}

export function applyPlayCard(state: GameState, cardId: string): PlayCardResult {
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
  const crewEffects = computeCrewEffects(meta.leadId, meta.companionIds);
  const crewScavengeBonus = crewEffects.reduce(
    (sum, e) => sum + (e.type === 'scavenge_bonus' ? e.amount : 0),
    0,
  );
  const hwEffects = computeHardwareEffects(meta.equippedItems);
  const assignFx = computeCrewAssignmentEffects(meta.crewAssignments, awakeIds);
  const scavengeBonus = vcScavengeBonus + crewScavengeBonus + hwEffects.scavengeBonusFlat + assignFx.scavengeBonusFlat;

  const crewDangerFactor = crewEffects.some((e) => e.type === 'danger_reduce')
    ? crewEffects.reduce((f, e) => (e.type === 'danger_reduce' ? f * e.factor : f), 1.0)
    : 1.0;
  const modFx = computeModuleEffects(meta.moduleLevels);
  const dangerFactor = crewDangerFactor * (1 - hwEffects.breachChanceReduction - modFx.dangerChanceReduction);

  // Accumulate doctrine points
  let updatedState = state;
  const doctrine = getDoctrine(cardId);
  if (doctrine !== null) {
    if (meta.doctrineLocked === null || meta.doctrineLocked === doctrine) {
      const updatedPoints = { ...meta.doctrinePoints, [doctrine]: meta.doctrinePoints[doctrine] + 1 };
      updatedState = { ...updatedState, meta: { ...meta, doctrinePoints: updatedPoints } };
    }
  }

  // Apply the card
  const afterCard = reduceRun(updatedState.currentRun!, { type: 'PLAY_CARD', cardId, scavengeBonus });
  updatedState = { ...updatedState, currentRun: afterCard };

  if (afterCard.phase === 'extracted' || afterCard.phase === 'collapsed') {
    return { state: updatedState, dangerMessages: [], runEnded: true };
  }

  // Danger resolution
  const dangerMessages: string[] = [];
  let run = afterCard;

  for (const danger of DANGER_LIST) {
    if (run.phase !== 'active') break;
    const result = resolveDanger(danger, run, dangerFactor);
    if (!result.triggered) continue;
    dangerMessages.push(`  ⚠ ${result.logMessage}`);
    run = { ...run, ...result.runDelta } as typeof run;
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
      afterRound = { ...afterRound, hull: Math.min(100, afterRound.hull + crewHullRegen) } as RunState;
    }
  }

  updatedState = { ...updatedState, currentRun: afterRound };
  const runEnded = afterRound.phase === 'collapsed';

  return { state: updatedState, dangerMessages, runEnded };
}
