import { RunState, RoundHistoryEntry } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

export function applyBotCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId, botCreditBonusPerBot = 0 } = event;

  switch (cardId) {
    case 'repair_bot': {
      const newBotsDeployed = run.botsDeployed + 1;
      const fullRepair = newBotsDeployed >= 3;
      const cap = MAX_HULL + run.maxHullBonus;
      return {
        ...run,
        botsDeployed: newBotsDeployed,
        hull: fullRepair ? cap : Math.min(cap, run.hull + 10),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'scavenge_bot':
      return {
        ...run,
        botsDeployed: run.botsDeployed + 1,
        runCredits: run.runCredits + 3000,
        roundHistory: makeHistory(run, cardId),
      };

    case 'overdrive_extract': {
      const jackpot = run.botsDeployed >= 3 && run.round === run.maxRounds;
      return {
        ...run,
        phase: 'extracted',
        runCredits: jackpot ? Math.floor(run.runCredits * 1.5) : run.runCredits,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'bot_swarm': {
      const botBonus = run.botsDeployed * (1000 + botCreditBonusPerBot);
      return {
        ...run,
        botsDeployed: run.botsDeployed + 2,
        runCredits: run.runCredits + botBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'calculated_scrap': {
      const hasBots = run.botsDeployed >= 3;
      if (hasBots) {
        const hullResult = applyHullDamage(run, 5);
        return {
          ...run,
          runCredits: run.runCredits + 6000,
          roundHistory: makeHistory(run, cardId),
          ...hullResult,
        };
      }
      return {
        ...run,
        runCredits: run.runCredits + 2000,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'overclock_bots':
      return {
        ...run,
        runCredits: run.runCredits + run.botsDeployed * (2000 + botCreditBonusPerBot),
        roundHistory: makeHistory(run, cardId),
      };

    case 'bot_army': {
      const hullResult = applyHullDamage(run, 10);
      return {
        ...run,
        botsDeployed: run.botsDeployed + 3,
        roundHistory: makeHistory(run, cardId),
        ...hullResult,
      };
    }

    default:
      return null;
  }
}
