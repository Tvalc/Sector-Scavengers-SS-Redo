import { RunState, RoundHistoryEntry } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { createSalvageEntry, addSalvage } from '../../content/salvage';
import { triggerSalvageDiscovery } from '../../ui/dive-renderer/discovery-popup';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

export function applyDoctrineCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId, shieldGainBonus = 0 } = event;

  switch (cardId) {
    case 'corporate_mandate':
      return {
        ...run,
        phase: 'extracting',
        runCredits: Math.floor(run.runCredits * 1.2),
        debtIncrease: run.debtIncrease + 20000,
        corporateCompliance: true,
        roundHistory: makeHistory(run, cardId),
      };

    case 'crew_effort':
      return {
        ...run,
        hull: Math.min(MAX_HULL + run.maxHullBonus, run.hull + 12),
        shieldCharges: run.shieldCharges + 1 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };

    // black_market replaced by smugglers_relay (mid-run salvage extraction)
    // This case is deprecated - use smugglers_relay instead
    case 'black_market': {
      // Legacy fallback: convert to basic relay behavior
      const takeDamage = Math.random() < 0.30;
      const hullResult = takeDamage ? applyHullDamage(run, 20) : null;
      const salvageAmount = Math.floor(Math.random() * 2) + 1; // 1-2 scrap
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', salvageAmount)),
        roundHistory: makeHistory(run, cardId),
        ...(hullResult ?? {}),
      };
    }

    default:
      return null;
  }
}
