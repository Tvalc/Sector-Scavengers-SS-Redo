import { RunState, RoundHistoryEntry } from '../../types/state';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';
import { createSalvageEntry, addSalvage } from '../../content/salvage';
import { triggerSalvageDiscovery } from '../../ui/dive-renderer/discovery-popup';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

export function applyCorporateCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId } = event;

  switch (cardId) {
    case 'credit_forecast': {
      const isLateRound = run.round >= 8;
      return {
        ...run,
        analyzed: !isLateRound,
        pendingExtractBonusPct: isLateRound ? 0.30 : 0,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'marathon': {
      // 2-4 scrap + 1 extra round
      const scrapAmount = Math.floor(Math.random() * 3) + 2; // 2-4 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      return {
        ...run,
        maxRounds: run.maxRounds + 1,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'hull_investment': {
      const hullResult = applyHullDamage(run, 20);
      // 4-8 scrap for investment
      const scrapAmount = Math.floor(Math.random() * 5) + 4; // 4-8 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      return {
        ...run,
        ...hullResult,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'debt_leveraging': {
      // 3-6 scrap + debt reduction
      const scrapAmount = Math.floor(Math.random() * 4) + 3; // 3-6 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      return {
        ...run,
        debtIncrease: Math.max(-50000, run.debtIncrease - 5000),
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'hostile_extraction': {
      // 8-15 scrap, debt +15000
      const scrapAmount = Math.floor(Math.random() * 8) + 8; // 8-15 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'combat');
      return {
        ...run,
        phase: 'extracting',
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        debtIncrease: run.debtIncrease + 15000,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'calculated_risk': {
      const hullResult = applyHullDamage(run, 15);
      // 5-10 scrap for the risk
      const scrapAmount = Math.floor(Math.random() * 6) + 5; // 5-10 inclusive
      return {
        ...run,
        ...hullResult,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        runDangerReduction: run.runDangerReduction + 0.15,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'danger_profit': {
      // 2-4 scrap if no danger fired
      const noDangerFired = !run.lastRoundDangerFired;
      const scrapAmount = noDangerFired ? Math.floor(Math.random() * 3) + 2 : 0; // 2-4 inclusive
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (noDangerFired) {
        logEntries.push({
          round: run.round,
          cardId: 'danger_profit_bonus',
          cardName: 'Profit secured! +2 scrap',
        });
      }
      return {
        ...run,
        salvage: noDangerFired
          ? addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount))
          : run.salvage,
        roundHistory: logEntries,
      };
    }

    case 'hull_investment_prep': {
      const hullResult = applyHullDamage(run, 10);
      return {
        ...run,
        ...hullResult,
        pendingExtractBonusPct: 0.15,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'corporate_override':
      return {
        ...run,
        dangerSkipRemaining: Math.max(run.dangerSkipRemaining, 1),
        debtIncrease: run.debtIncrease + 5000,
        roundHistory: makeHistory(run, cardId),
      };

    case 'debt_conversion': {
      if (run.debtIncrease < 10000) return run;
      // 2-5 scrap for converting debt
      const scrapAmount = Math.floor(Math.random() * 4) + 2; // 2-5 inclusive
      return {
        ...run,
        debtIncrease: run.debtIncrease - 2000,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'profit_margin': {
      // 3-6 scrap + extraction bonus
      const scrapAmount = Math.floor(Math.random() * 4) + 3; // 3-6 inclusive
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.25,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'emergency_extraction': {
      // 4-8 scrap + extraction, bonus if hull < 40
      const baseScrap = Math.floor(Math.random() * 5) + 4; // 4-8 inclusive
      const bonusScrap = run.hull < 40 ? Math.floor(Math.random() * 4) + 3 : 0; // 3-6 bonus
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (run.hull < 40) {
        logEntries.push({
          round: run.round,
          cardId: 'emergency_bonus',
          cardName: 'Emergency bonus! +3 scrap',
        });
      }
      return {
        ...run,
        phase: 'extracting',
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', baseScrap + bonusScrap)),
        roundHistory: logEntries,
      };
    }

    case 'sector_monopoly': {
      // 6-10 scrap, debt +20000
      const scrapAmount = Math.floor(Math.random() * 5) + 6; // 6-10 inclusive
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        debtIncrease: run.debtIncrease + 20000,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'hostile_takeover': {
      const hullResult = applyHullDamage(run, 10);
      // 10-18 scrap for the takeover
      const scrapAmount = Math.floor(Math.random() * 9) + 10; // 10-18 inclusive
      return {
        ...run,
        ...hullResult,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        debtIncrease: run.debtIncrease + 30000,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'corporate_espionage': {
      // 4-8 scrap + extraction bonus + audit reduction
      const scrapAmount = Math.floor(Math.random() * 5) + 4; // 4-8 inclusive
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.10,
        auditReduction: run.auditReduction + 15,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'corporate_lockdown':
      return {
        ...run,
        dangerSkipRemaining: Math.max(run.dangerSkipRemaining, 2),
        debtIncrease: run.debtIncrease + 15000,
        roundHistory: makeHistory(run, cardId),
      };

    case 'mass_extraction': {
      const hullResult = applyHullDamage(run, 15);
      // 6-12 scrap + extraction with bonus
      const scrapAmount = Math.floor(Math.random() * 7) + 6; // 6-12 inclusive
      return {
        ...run,
        ...hullResult,
        phase: 'extracting',
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.40,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'debt_write_off': {
      if (run.oncePerRunCards.includes(cardId)) return run;
      return {
        ...run,
        debtIncrease: Math.max(-50000, run.debtIncrease - 25000),
        oncePerRunCards: [...run.oncePerRunCards, cardId],
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'executive_order': {
      // 5-10 scrap + skip dangers + debt
      const scrapAmount = Math.floor(Math.random() * 6) + 5; // 5-10 inclusive
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        dangerSkipRemaining: Math.max(run.dangerSkipRemaining, 2),
        debtIncrease: run.debtIncrease + 12000,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'mandate_override': {
      const hullResult = applyHullDamage(run, 5);
      // 2-4 scrap for the mandate
      const scrapAmount = Math.floor(Math.random() * 3) + 2; // 2-4 inclusive
      return {
        ...run,
        ...hullResult,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        debtIncrease: Math.max(-50000, run.debtIncrease - 8000),
        roundHistory: makeHistory(run, cardId),
      };
    }

    default:
      return null;
  }
}
