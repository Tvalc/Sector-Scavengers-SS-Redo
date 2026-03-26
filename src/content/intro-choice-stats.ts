import { OPENING_PATH_CONFIG } from './opening-paths';
import { INTRO_OUTCOMES } from './intro-narrative';

export interface IntroChoiceStats {
  choiceId: string;
  label: string;
  credits: number;
  voidEcho: number;
  energy: number;
  debt: number;
  debtPressure: 'low' | 'medium' | 'high';
  crew: string[];
  shipState: 'damaged' | 'partially_repaired' | 'stabilized';
}

const DEBT_MULTIPLIERS: Record<string, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.25,
};

const SALVAGE_BONUSES: Record<string, number> = {
  low: 0,
  medium: 200,
  high: 400,
  max: 800,
};

const CHOICE_LABELS: Record<string, string> = {
  escape_scavenge_hard: 'Strip & Go',
  escape_save_some: 'Partial Evac',
  repair_extract_with_jax: 'Balanced Extract',
  repair_full_save: 'Full Commitment',
};

export function getIntroChoiceStats(choiceId: string): IntroChoiceStats | null {
  const outcome = INTRO_OUTCOMES[choiceId];
  if (!outcome) return null;

  const pathConfig = OPENING_PATH_CONFIG[outcome.openingPathId];
  if (!pathConfig) return null;

  const debtMultiplier = DEBT_MULTIPLIERS[outcome.debtModifier] ?? 1.0;
  const salvageBonus = SALVAGE_BONUSES[outcome.salvageRewardBand] ?? 0;

  const finalDebt = Math.round(pathConfig.debt * debtMultiplier);
  const finalCredits = pathConfig.startingCredits + salvageBonus;
  const crewNames = outcome.awakenedCrew.map(name => name.toUpperCase());

  return {
    choiceId,
    label: CHOICE_LABELS[choiceId] ?? choiceId,
    credits: finalCredits,
    voidEcho: pathConfig.voidEchoBonus,
    energy: pathConfig.energy,
    debt: finalDebt,
    debtPressure: outcome.debtModifier,
    crew: crewNames,
    shipState: outcome.shipStateStart,
  };
}

export function getAllIntroChoiceStats(): IntroChoiceStats[] {
  const choiceIds = Object.keys(INTRO_OUTCOMES);
  const stats: IntroChoiceStats[] = [];

  for (const choiceId of choiceIds) {
    const choiceStats = getIntroChoiceStats(choiceId);
    if (choiceStats) {
      stats.push(choiceStats);
    }
  }

  return stats;
}
