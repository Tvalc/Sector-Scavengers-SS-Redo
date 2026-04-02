import { RunState, RoundHistoryEntry } from '../../types/state';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';
import { createSalvageEntry, addSalvage } from '../../content/salvage';
import { triggerSalvageDiscovery } from '../../ui/dive-renderer/discovery-popup';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

export function applyVoidCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId, shieldGainBonus = 0 } = event;

  switch (cardId) {
    case 'void_siphon':
      return {
        ...run,
        runCredits: run.runCredits + 3000,
        voidEchoGain: run.voidEchoGain + 1,
        roundHistory: makeHistory(run, cardId),
      };

    case 'void_shield':
      return {
        ...run,
        shieldCharges: run.shieldCharges + 2 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };

    case 'echo_extract':
      return {
        ...run,
        phase: 'extracting',
        voidEchoGain: run.voidEchoGain + 2,
        roundHistory: makeHistory(run, cardId),
      };

    case 'ancestor_memory':
      return {
        ...run,
        ancestorMemoryActive: true,
        roundHistory: makeHistory(run, cardId),
      };

    case 'death_defiance':
      return {
        ...run,
        deathDefianceActive: true,
        roundHistory: makeHistory(run, cardId),
      };

    case 'echo_drain': {
      const hullResult = applyHullDamage(run, 10);
      return {
        ...run,
        ...hullResult,
        voidEchoGain: run.voidEchoGain + run.round,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'void_touched':
      return {
        ...run,
        voidEchoGain: run.voidEchoGain + 1,
        voidTouchedActive: true,
        roundHistory: makeHistory(run, cardId),
      };

    case 'desperate_measures': {
      const hullResult = applyHullDamage(run, 20);
      return {
        ...run,
        ...hullResult,
        runCredits: run.runCredits + 10000,
        shieldCharges: run.shieldCharges + 2 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'debt_renegotiation':
      return {
        ...run,
        debtIncrease: Math.max(-50000, run.debtIncrease - 20000),
        runCredits: Math.max(0, run.runCredits - 5000),
        roundHistory: makeHistory(run, cardId),
      };

    case 'last_gasp': {
      const isDesperate = run.hull <= 25;
      return {
        ...run,
        runCredits: run.runCredits + (isDesperate ? 8000 : 2000),
        shieldCharges: isDesperate
          ? run.shieldCharges + 2 + shieldGainBonus
          : run.shieldCharges + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'scorched_extract': {
      const hullResult = applyHullDamage(run, 30);
      return {
        ...run,
        phase: 'extracting',
        ...hullResult,
        voidEchoGain: run.voidEchoGain + 3,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'bitter_experience': {
      const isLowHull = run.hull <= 35;
      return {
        ...run,
        runCredits: run.runCredits + (isLowHull ? 6000 : 2000),
        dangerImmune: isLowHull ? true : run.dangerImmune,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'defiant_last_stand': {
      const isDesperate = run.hull <= 20 && run.shieldCharges === 0;
      return {
        ...run,
        shieldCharges: isDesperate
          ? run.shieldCharges + 3 + shieldGainBonus
          : run.shieldCharges + shieldGainBonus,
        runCredits: run.runCredits + (isDesperate ? 5000 : 0),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'survivors_instinct': {
      const isHighDebt = run.debtIncrease > 100000;
      return {
        ...run,
        pendingExtractBonusPct: isHighDebt ? 0.50 : 0,
        runCredits: run.runCredits + (isHighDebt ? 0 : 3000),
        roundHistory: makeHistory(run, cardId),
      };
    }

    // ── Void Research Cards (7 cards) ──

    case 'scrap_memory': {
      triggerSalvageDiscovery('scrap', 2, 'exploration');
      const newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', 2));
      const echoBonus = run.hull < 40 ? 1 : 0;
      return {
        ...run,
        runCredits: run.runCredits + 4000,
        salvage: newSalvage,
        voidEchoGain: run.voidEchoGain + echoBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'void_pulse': {
      const spendCount = run.shieldCharges;
      const hullResult = applyHullDamage(run, 5 * spendCount);
      return {
        ...run,
        ...hullResult,
        shieldCharges: 0,
        voidEchoGain: run.voidEchoGain + spendCount + 1,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'entropy_gift': {
      const shieldBonus = run.hull < 40 ? 1 + shieldGainBonus : 0;
      return {
        ...run,
        runCredits: run.runCredits + 4000,
        shieldCharges: run.shieldCharges + shieldBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'ancestral_extract':
      return {
        ...run,
        phase: 'extracting',
        voidEchoGain: run.voidEchoGain + 2,
        roundHistory: makeHistory(run, cardId),
      };

    case 'premonition':
      return {
        ...run,
        ancestorMemoryActive: true,
        dangerSkipRemaining: Math.max(run.dangerSkipRemaining, 1),
        roundHistory: makeHistory(run, cardId),
      };

    case 'echo_amplifier_card':
      return {
        ...run,
        voidEchoGain: run.voidEchoGain + 1,
        echoAmplifierActive: true,
        roundHistory: makeHistory(run, cardId),
      };

    case 'void_communion_card': {
      const hullResult = applyHullDamage(run, 15);
      return {
        ...run,
        ...hullResult,
        voidEchoGain: run.voidEchoGain + 2,
        pendingExtraDraw: true,
        pendingExtraDrawCount: run.pendingExtraDrawCount + 2,
        roundHistory: makeHistory(run, cardId),
      };
    }

    default:
      return null;
  }
}
