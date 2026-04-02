import { RunState, RoundHistoryEntry } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';
import { createSalvageEntry, addSalvage } from '../../content/salvage';
import { pickRandomHardware, addFoundHardware } from '../hardware-discovery';
import { triggerSalvageDiscovery } from '../../ui/dive-renderer/discovery-popup';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

function effectiveMaxHull(run: RunState): number {
  return MAX_HULL + run.maxHullBonus;
}

export function applyUtilityCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId, shieldGainBonus = 0 } = event;

  switch (cardId) {
    case 'salvage_sweep':
    case 'credit_sweep': {
      // 4-8 scrap + extra draw (handles both old and new card id)
      const scrapAmount = Math.floor(Math.random() * 5) + 4; // 4-8 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        pendingExtraDraw: true,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'routine_extract':
      // Grants extraction bonus (+15% to final salvage sale), no credit bonus
      return {
        ...run,
        phase: 'extracting',
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.15,
        roundHistory: makeHistory(run, cardId),
      };

    case 'protocol_scan':
      return {
        ...run,
        ancestorMemoryActive: true,
        runDangerReduction: run.runDangerReduction + 0.10,
        roundHistory: makeHistory(run, cardId),
      };

    case 'debt_audit':
      return {
        ...run,
        debtIncrease: Math.max(-50000, run.debtIncrease - 3000),
        roundHistory: makeHistory(run, cardId),
      };

    case 'risk_assessment': {
      // 2-4 scrap + analyze next danger
      const scrapAmount = Math.floor(Math.random() * 3) + 2; // 2-4 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        analyzed: true,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'salvage_override': {
      const hullResult = applyHullDamage(run, 5);
      const newDebtIncrease = Math.max(-50000, run.debtIncrease - 8000);
      return {
        ...run,
        debtIncrease: newDebtIncrease,
        roundHistory: makeHistory(run, cardId),
        ...hullResult,
      };
    }

    case 'distress_response':
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + 8),
        pendingExtraDraw: true,
        roundHistory: makeHistory(run, cardId),
      };

    case 'audit_bribe':
      return {
        ...run,
        auditBribed: true,
        runCredits: Math.max(0, run.runCredits - 10000),
        roundHistory: makeHistory(run, cardId),
      };

    case 'efficiency_drive':
      // Grants extraction bonus (+25% to final salvage sale), no credit bonus
      return {
        ...run,
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.25,
        roundHistory: makeHistory(run, cardId),
      };

    case 'audit_immunity': {
      // 2-4 scrap + audit protection
      const scrapAmount = Math.floor(Math.random() * 3) + 2; // 2-4 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      return {
        ...run,
        auditBribed: true,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        auditReduction: run.auditReduction + 50,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'sector_lockdown':
      return {
        ...run,
        dangerSkipRemaining: Math.max(run.dangerSkipRemaining, 1),
        debtIncrease: run.debtIncrease + 3000,
        roundHistory: makeHistory(run, cardId),
      };

    case 'extended_contract': {
      // 4-8 scrap + 2 extra rounds
      const scrapAmount = Math.floor(Math.random() * 5) + 4; // 4-8 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      return {
        ...run,
        maxRounds: run.maxRounds + 2,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'efficiency_protocol': {
      // 5-10 scrap but danger increases
      const scrapAmount = Math.floor(Math.random() * 6) + 5; // 5-10 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        runDangerReduction: run.runDangerReduction - 0.20,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'threat_analysis':
      return {
        ...run,
        ancestorMemoryActive: true,
        runDangerReduction: run.runDangerReduction + 0.15,
        roundHistory: makeHistory(run, cardId),
      };

    case 'full_audit': {
      if (run.debtIncrease <= 0) {
        return {
          ...run,
          debtIncrease: 0,
          roundHistory: makeHistory(run, cardId),
        };
      }
      const creditGain = Math.floor(run.debtIncrease / 2);
      return {
        ...run,
        debtIncrease: 0,
        runCredits: run.runCredits + creditGain,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'quick_loot': {
      const scrapAmount = Math.floor(Math.random() * 3) + 1;
      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (Math.random() < 0.20) {
        newSalvage = addSalvage(newSalvage, createSalvageEntry('components', 1));
        triggerSalvageDiscovery('components', 1, 'exploration');
        logEntries.push({
          round: run.round,
          cardId: 'quick_loot_bonus',
          cardName: 'Bonus component found!',
        });
      }
      return {
        ...run,
        salvage: newSalvage,
        roundHistory: logEntries,
      };
    }

    case 'shadow_run': {
      const scrapAmount = Math.floor(Math.random() * 3) + 2;
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        runDangerReduction: run.runDangerReduction + 0.10,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'off_books': {
      const scrapAmount = Math.floor(Math.random() * 4) + 2;
      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      const damageRoll = Math.random();
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (damageRoll < 0.30) {
        const damageAmount = Math.floor(Math.random() * 6) + 10;
        const hullResult = applyHullDamage(run, damageAmount);
        return {
          ...run,
          salvage: newSalvage,
          auditReduction: run.auditReduction + 20,
          roundHistory: logEntries,
          ...hullResult,
        };
      }
      return {
        ...run,
        salvage: newSalvage,
        auditReduction: run.auditReduction + 20,
        roundHistory: logEntries,
      };
    }

    case 'salvage_grab': {
      const scrapAmount = Math.floor(Math.random() * 4) + 3;
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'risk_it': {
      const scrapAmount = Math.floor(Math.random() * 5) + 4;
      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (Math.random() < 0.35) {
        const damageAmount = Math.floor(Math.random() * 11) + 12;
        const hullResult = applyHullDamage(run, damageAmount);
        return {
          ...run,
          salvage: newSalvage,
          roundHistory: logEntries,
          ...hullResult,
        };
      }
      return {
        ...run,
        salvage: newSalvage,
        roundHistory: logEntries,
      };
    }

    case 'opportunist': {
      const baseScrap = Math.floor(Math.random() * 3) + 1;
      const bonusScrap = run.lastRoundDangerFired ? Math.floor(Math.random() * 2) + 1 : 0;
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (run.lastRoundDangerFired) {
        logEntries.push({
          round: run.round,
          cardId: 'opportunist_bonus',
          cardName: 'Danger bonus! +1 scrap',
        });
      }
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', baseScrap + bonusScrap)),
        roundHistory: logEntries,
      };
    }

    case 'street_deal': {
      const scrapAmount = Math.floor(Math.random() * 3) + 2;
      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (Math.random() < 0.25) {
        newSalvage = addSalvage(newSalvage, createSalvageEntry('components', 1));
        logEntries.push({
          round: run.round,
          cardId: 'street_deal_bonus',
          cardName: 'Component deal struck!',
        });
      }
      return {
        ...run,
        salvage: newSalvage,
        roundHistory: logEntries,
      };
    }

    case 'adrenaline_junkie': {
      // 4-10 scrap, bonus if danger fired last round
      const baseScrap = Math.floor(Math.random() * 7) + 4; // 4-10 inclusive
      const bonusScrap = run.lastRoundDangerFired ? Math.floor(Math.random() * 5) + 3 : 0; // 3-7 bonus
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (run.lastRoundDangerFired) {
        logEntries.push({
          round: run.round,
          cardId: 'adrenaline_bonus',
          cardName: 'Adrenaline rush! Bonus scrap!',
        });
      }
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', baseScrap + bonusScrap)),
        roundHistory: logEntries,
      };
    }

    case 'deep_salvage': {
      const scrapAmount = Math.floor(Math.random() * 7) + 6;
      const compAmount = Math.floor(Math.random() * 3) + 1;
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      triggerSalvageDiscovery('components', compAmount, 'exploration');
      let newSalvage = addSalvage(
        addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        createSalvageEntry('components', compAmount),
      );
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (Math.random() < 0.40) {
        const damageAmount = Math.floor(Math.random() * 11) + 15;
        const hullResult = applyHullDamage(run, damageAmount);
        return {
          ...run,
          salvage: newSalvage,
          roundHistory: logEntries,
          ...hullResult,
        };
      }
      return { ...run, salvage: newSalvage, roundHistory: logEntries };
    }

    case 'sector_sweep': {
      const scrapAmount = Math.floor(Math.random() * 5) + 3;
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      let hullResult: ReturnType<typeof applyHullDamage> | null = null;
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (Math.random() < 0.30) {
        newSalvage = addSalvage(newSalvage, createSalvageEntry('relic', 1));
        triggerSalvageDiscovery('relic', 1, 'exploration');
        logEntries.push({
          round: run.round,
          cardId: 'sector_sweep_relic',
          cardName: 'Relic recovered!',
        });
      }
      if (Math.random() < 0.30) {
        const damageAmount = Math.floor(Math.random() * 8) + 8;
        hullResult = applyHullDamage(run, damageAmount);
      }
      return {
        ...run,
        salvage: newSalvage,
        ...(hullResult ?? {}),
        roundHistory: logEntries,
      };
    }

    case 'ghost_claim': {
      // 5-12 scrap, skip danger, next round salvage penalty tracked via flag
      const scrapAmount = Math.floor(Math.random() * 8) + 5; // 5-12 inclusive
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      logEntries.push({
        round: run.round,
        cardId: 'ghost_claim_warning',
        cardName: 'Next round salvage yield reduced!',
      });
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        dangerSkipRemaining: Math.max(run.dangerSkipRemaining, 1),
        roundHistory: logEntries,
      };
    }

    case 'salvage_protocol': {
      const scrapAmount = Math.floor(Math.random() * 4) + 2;
      const hullResult = applyHullDamage(run, 5);
      const newSalvage = addSalvage(
        addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        createSalvageEntry('components', 1),
      );
      return {
        ...run,
        ...hullResult,
        salvage: newSalvage,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'danger_rush': {
      // 6-14 scrap, increased danger
      const dangerScrap = Math.floor(Math.random() * 9) + 6; // 6-14 inclusive
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', dangerScrap)),
        runDangerReduction: run.runDangerReduction - 0.25,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'reinforced_bots': {
      const heal = run.botsDeployed * 5;
      return {
        ...run,
        hull: Math.min(effectiveMaxHull(run), run.hull + heal),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'void_run': {
      const scrapAmount = Math.floor(Math.random() * 5) + 4;
      const hullResult = applyHullDamage(run, 15);
      return {
        ...run,
        ...hullResult,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        voidEchoGain: run.voidEchoGain + 2,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'high_stakes': {
      // 10-20 scrap, 50% chance 20-35 hull damage
      const scrapAmount = Math.floor(Math.random() * 11) + 10; // 10-20 inclusive
      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (Math.random() < 0.50) {
        const damageAmount = Math.floor(Math.random() * 16) + 20; // 20-35 inclusive
        const hullResult = applyHullDamage(run, damageAmount);
        return {
          ...run,
          salvage: newSalvage,
          ...hullResult,
          shieldCharges: 0,
          roundHistory: logEntries,
        };
      }
      return { ...run, salvage: newSalvage, roundHistory: logEntries };
    }

    case 'black_ops': {
      const scrapAmount = Math.floor(Math.random() * 3) + 2;
      return {
        ...run,
        salvage: addSalvage(
          addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
          createSalvageEntry('relic', 2),
        ),
        debtIncrease: run.debtIncrease + 15000,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'salvage_king': {
      // 8-18 scrap + 1-3 components + 50% chance relic, 10 hull cost
      const scrapAmount = Math.floor(Math.random() * 11) + 8; // 8-18 inclusive
      const compAmount = Math.floor(Math.random() * 3) + 1; // 1-3 inclusive
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      triggerSalvageDiscovery('components', compAmount, 'exploration');
      const hullResult = applyHullDamage(run, 10);
      let newSalvage = addSalvage(
        addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        createSalvageEntry('components', compAmount),
      );
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (Math.random() < 0.50) {
        newSalvage = addSalvage(newSalvage, createSalvageEntry('relic', 1));
        triggerSalvageDiscovery('relic', 1, 'exploration');
        logEntries.push({
          round: run.round,
          cardId: 'salvage_king_relic',
          cardName: 'King\'s relic!',
        });
      }
      return {
        ...run,
        ...hullResult,
        salvage: newSalvage,
        roundHistory: logEntries,
      };
    }

    case 'ghost_protocol': {
      const scrapAmount = Math.floor(Math.random() * 4) + 3;
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        dangerSkipRemaining: Math.max(run.dangerSkipRemaining, 2),
        auditReduction: run.auditReduction + 25,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'maximum_risk': {
      // 12-25 scrap, 25 hull damage, shield -2
      const scrapAmount = Math.floor(Math.random() * 14) + 12; // 12-25 inclusive
      const hullResult = applyHullDamage(run, 25);
      return {
        ...run,
        ...hullResult,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        shieldCharges: Math.max(0, run.shieldCharges - 2),
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'bot_empire':
      return {
        ...run,
        botsDeployed: run.botsDeployed + 5,
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.20,
        roundHistory: makeHistory(run, cardId),
      };

    case 'underworld_contact': {
      // 6-12 scrap, hardware find chance
      const scrapAmount = Math.floor(Math.random() * 7) + 6; // 6-12 inclusive
      const hw = pickRandomHardware(run.foundHardware);
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (hw) {
        logEntries.push({
          round: run.round,
          cardId: 'underworld_hardware',
          cardName: 'Hardware contact made!',
        });
      }
      const base = {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        roundHistory: logEntries,
      };
      if (hw) {
        return {
          ...base,
          foundHardware: addFoundHardware(run.foundHardware, hw),
        };
      }
      return base;
    }

    case 'shadow_extraction': {
      // 30% extraction bonus, +2 echo, no credit multiplier
      const shadowScrap = Math.floor(Math.random() * 5) + 4; // 4-8 scrap
      return {
        ...run,
        phase: 'extracting',
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', shadowScrap)),
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.30,
        voidEchoGain: run.voidEchoGain + 2,
        auditReduction: run.auditReduction + 20,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'void_smuggler': {
      const scrapAmount = Math.floor(Math.random() * 5) + 6;
      return {
        ...run,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        voidEchoGain: run.voidEchoGain + 3,
        debtIncrease: run.debtIncrease + 25000,
        auditReduction: run.auditReduction + 15,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'calculated_scrap': {
      // Bots ≥3: 6-10 scrap hull −5, Else 2-4 scrap
      const hasEnoughBots = run.botsDeployed >= 3;
      const scrapAmount = hasEnoughBots ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 3) + 2;
      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (hasEnoughBots) {
        const hullResult = applyHullDamage(run, 5);
        logEntries.push({
          round: run.round,
          cardId: 'calculated_scrap_bonus',
          cardName: 'Bot bonus activated!',
        });
        return {
          ...run,
          salvage: newSalvage,
          roundHistory: logEntries,
          ...hullResult,
        };
      }
      return {
        ...run,
        salvage: newSalvage,
        roundHistory: logEntries,
      };
    }

    case 'calculated_risk': {
      // Hull −15, 5-10 scrap, Dng −15% rest of run
      const scrapAmount = Math.floor(Math.random() * 6) + 5;
      const hullResult = applyHullDamage(run, 15);
      return {
        ...run,
        ...hullResult,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount)),
        runDangerReduction: run.runDangerReduction + 0.15,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'danger_profit': {
      // 4-8 scrap if no danger fired this round
      const noDangerFired = !run.lastRoundDangerFired;
      const scrapAmount = noDangerFired ? Math.floor(Math.random() * 5) + 4 : 0;
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (noDangerFired) {
        logEntries.push({
          round: run.round,
          cardId: 'danger_profit_bonus',
          cardName: 'Profit secured! +4 scrap',
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

    case 'bot_swarm':
      // Deploy 2 bots, 2-4 scrap per bot
      return {
        ...run,
        botsDeployed: run.botsDeployed + 2,
        salvage: addSalvage(run.salvage, createSalvageEntry('scrap', Math.floor(Math.random() * 3) + 2)),
        roundHistory: makeHistory(run, cardId),
      };

    case 'bot_army':
      // Deploy 3 bots, 10 hull damage
      return {
        ...run,
        botsDeployed: run.botsDeployed + 3,
        hull: Math.max(0, run.hull - 10),
        roundHistory: makeHistory(run, cardId),
      };

    case 'overclock_bots':
      // All bots give +1 salvage each (tracked as a flag/bonus)
      return {
        ...run,
        // Store overclock bonus in a way that can be used - for now just log it
        roundHistory: [...makeHistory(run, cardId), {
          round: run.round,
          cardId: 'overclock_active',
          cardName: `Bots overclocked! +${run.botsDeployed} scrap on extract`,
        }],
      };

    default:
      return null;
  }
}
