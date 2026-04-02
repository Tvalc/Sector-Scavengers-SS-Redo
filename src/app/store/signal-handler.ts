import { GameState } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { Signal, SignalChoice, getSignalById } from '../../content/signals';
import { addCardToDiscard } from '../../dive/deck-manager';
import { DoctrineId } from '../../content/doctrine';

const HARDWARE_POOL = [
  'hull_plating', 'basic_scanner', 'power_cell',
  'ablative_armor', 'deep_scanner', 'extraction_rig',
  'reactive_shell', 'void_sensor', 'shield_emitter',
  'bot_chassis', 'bulkhead_plating',
];

function pickRandomHardware(): string {
  return HARDWARE_POOL[Math.floor(Math.random() * HARDWARE_POOL.length)];
}

/**
 * Apply a single signal choice effect to the run state.
 */
function applySignalEffect(
  run: GameState['currentRun'],
  meta: GameState['meta'],
  effect: import('../../content/signals').SignalChoiceEffect,
): { run: GameState['currentRun']; meta: GameState['meta'] } {
  if (!run) return { run, meta };

  let newRun = { ...run };
  let newMeta = { ...meta };

  switch (effect.type) {
    case 'credits':
      newRun.runCredits = Math.max(0, newRun.runCredits + effect.amount);
      break;
    case 'hull':
      newRun.hull = Math.min(MAX_HULL + (newRun.maxHullBonus ?? 0), Math.max(0, newRun.hull + effect.amount));
      break;
    case 'debt':
      newRun.debtIncrease += effect.amount;
      break;
    case 'void_echo':
      newRun.voidEchoGain += effect.amount;
      break;
    case 'add_card_to_deck':
      newRun.discardPile = addCardToDiscard(newRun.discardPile, effect.cardId);
      break;
    case 'hardware_find':
      const hw = pickRandomHardware();
      newRun.itemsFound = [...newRun.itemsFound, hw];
      break;
    case 'doctrine':
      newRun.doctrineRunPoints = {
        ...newRun.doctrineRunPoints,
        [effect.alignment]: newRun.doctrineRunPoints[effect.alignment] + effect.points,
      };
      break;
    case 'lore_fragment':
      newRun.seenLoreFragments = [...newRun.seenLoreFragments, effect.tag];
      break;
    case 'audit_reduction':
      newRun.auditReduction = Math.min(100, Math.max(0, (newRun.auditReduction ?? 0) + effect.amount));
      break;
    case 'salvage':
      // Add or remove salvage from current run
      const existingIdx = newRun.salvage.findIndex((s) => s.tier === effect.tier);
      const baseValues: Record<'scrap' | 'components' | 'relic' | 'medtech', number> = {
        scrap: 1500,
        components: 4000,
        relic: 12000,
        medtech: 8000,
      };
      if (existingIdx !== -1) {
        const currentQty = newRun.salvage[existingIdx].quantity;
        const newQty = Math.max(0, currentQty + effect.amount);
        newRun.salvage = newRun.salvage.map((s, i) =>
          i === existingIdx ? { ...s, quantity: newQty } : s,
        ).filter((s) => s.quantity > 0);
      } else if (effect.amount > 0) {
        newRun.salvage = [...newRun.salvage, {
          tier: effect.tier,
          quantity: effect.amount,
          valueEach: baseValues[effect.tier],
        }];
      }
      break;
  }

  return { run: newRun, meta: newMeta };
}

/**
 * Check if a signal choice is available given current run state.
 */
export function isSignalChoiceAvailable(choice: SignalChoice, run: GameState['currentRun']): boolean {
  if (!run) return false;
  if (choice.requiresHull !== undefined && run.hull < choice.requiresHull) return false;
  if (choice.requiresCredits !== undefined && run.runCredits < choice.requiresCredits) return false;
  return true;
}

/**
 * Resolve a signal choice, applying all effects.
 * Returns the updated GameState.
 */
export function resolveSignalChoice(
  state: GameState,
  signalId: string,
  choiceIndex: number,
): GameState {
  const signal = getSignalById(signalId);
  if (!signal) return state;
  if (!state.currentRun) return state;

  const choice = signal.choices[choiceIndex];
  if (!choice) return state;

  // Guard against undefined/malformed effects
  if (!choice.effects || choice.effects.length === 0) {
    return state;
  }

  let { run, meta } = applySignalEffect(state.currentRun, state.meta, choice.effects[0]);

  for (let i = 1; i < choice.effects.length; i++) {
    const result = applySignalEffect(run, meta, choice.effects[i]);
    run = result.run;
    meta = result.meta;
  }

  return {
    ...state,
    currentRun: run,
    meta,
  };
}
