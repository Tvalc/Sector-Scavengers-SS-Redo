import { RunState, RoundHistoryEntry } from '../../types/state';
import { DoctrineId } from '../../content/doctrine';

/**
 * Check for Cooperative doctrine shield resonance bonus.
 * If cooperative doctrine locked and energy >= 2, playing a shield-type card
 * grants +1 bonus shield charge.
 */
export function checkCooperativeShieldBonus(
  run: RunState,
  cardId: string,
): { bonusShields: number; logEntry: RoundHistoryEntry | null } {
  // Only apply if cooperative doctrine is locked
  if (run.doctrineLocked !== 'cooperative') {
    return { bonusShields: 0, logEntry: null };
  }

  // Check if this is a shield-type card
  const shieldCards = ['shield', 'team_shield', 'reinforced_shield', 'ablative_screen', 'shield_bash'];
  if (!shieldCards.includes(cardId)) {
    return { bonusShields: 0, logEntry: null };
  }

  // Check if energy >= 2
  if (run.energy < 2) {
    return { bonusShields: 0, logEntry: null };
  }

  // Grant +1 bonus shield
  return {
    bonusShields: 1,
    logEntry: {
      round: run.round,
      cardId: 'cooperative_bonus',
      cardName: 'Cooperative shield resonance: +1 charge',
    },
  };
}

/**
 * Calculate Smuggler doctrine scavenge multiplier.
 * If smuggler doctrine locked and energy < 2, applies 1.25× multiplier to scavenge yields.
 */
export function getSmugglerScavengeMultiplier(run: RunState): number {
  // Only apply if smuggler doctrine is locked and energy < 2
  if (run.doctrineLocked === 'smuggler' && run.energy < 2) {
    return 1.25;
  }
  return 1.0;
}

/**
 * Create log entry for Smuggler desperation bonus.
 */
export function createSmugglerBonusLogEntry(run: RunState, bonusAmount: number): RoundHistoryEntry | null {
  if (run.doctrineLocked === 'smuggler' && run.energy < 2 && bonusAmount > 0) {
    return {
      round: run.round,
      cardId: 'smuggler_bonus',
      cardName: `Smuggler desperation bonus: +${bonusAmount} scrap`,
    };
  }
  return null;
}

/**
 * Check all doctrine synergies for a card play.
 * Returns updated run state with any bonuses applied.
 */
export function applyDoctrineSynergies(
  run: RunState,
  cardId: string,
): RunState {
  let updatedRun = { ...run };
  let newLogEntries: RoundHistoryEntry[] = [];

  // Check Cooperative shield bonus
  const coopBonus = checkCooperativeShieldBonus(run, cardId);
  if (coopBonus.bonusShields > 0) {
    updatedRun.shieldCharges += coopBonus.bonusShields;
    if (coopBonus.logEntry) {
      newLogEntries.push(coopBonus.logEntry);
    }
  }

  // Add any new log entries to round history
  if (newLogEntries.length > 0) {
    updatedRun.roundHistory = [...updatedRun.roundHistory, ...newLogEntries];
  }

  return updatedRun;
}
