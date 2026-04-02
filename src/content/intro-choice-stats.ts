import { OPENING_PATH_CONFIG } from './opening-paths';
import { INTRO_OUTCOMES } from './intro-narrative';

export type SurvivorsCount = 0 | 'some' | 'many';

export interface IntroChoiceStats {
  choiceId: string;
  label: string;
  credits: number;
  voidEcho: number;
  debt: number;
  debtPressure: 'low' | 'medium' | 'high';
  crew: string[];
  shipState: 'damaged' | 'partially_repaired' | 'stabilized';
  survivorsSaved: SurvivorsCount;
}

const DEBT_MULTIPLIERS: Record<string, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.25,
};

const SALVAGE_BONUSES: Record<string, number> = {
  low: 0,
  medium: 20000,
  high: 40000,
  max: 80000,
};

const CHOICE_LABELS: Record<string, string> = {
  escape_scavenge_hard: 'Strip & Go',
  escape_extract_now: 'Extract Now',
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
    debt: finalDebt,
    debtPressure: outcome.debtModifier,
    crew: crewNames,
    shipState: outcome.shipStateStart,
    survivorsSaved: outcome.survivorsSaved,
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
