import { RunState, RoundHistoryEntry } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { createSalvageEntry, addSalvage } from '../../content/salvage';
import { pickRandomHardware, addFoundHardware } from '../hardware-discovery';
import { triggerSalvageDiscovery } from '../../ui/dive-renderer/discovery-popup';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

export function applyCommonCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId, scavengeBonus = 0, botDamageReduction = false, shieldGainBonus = 0 } = event;

  switch (cardId) {
    case 'risky_scavenge': {
      const baseDamageChance = 0.35;
      const damageChance = botDamageReduction && run.botsDeployed > 0
        ? baseDamageChance * 0.5
        : baseDamageChance;
      const takeDamage = Math.random() < damageChance;
      const damageAmount = takeDamage ? Math.floor(Math.random() * 16) + 15 : 0; // 15-30 inclusive
      const hullResult = takeDamage ? applyHullDamage(run, damageAmount) : null;

      // 2-6 scrap + 0-2 components
      const scrapAmount = Math.floor(Math.random() * 5) + 2; // 2-6 inclusive
      const compAmount = Math.floor(Math.random() * 3); // 0-2 inclusive

      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));

      // Trigger discovery popups
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');

      if (compAmount > 0) {
        newSalvage = addSalvage(newSalvage, createSalvageEntry('components', compAmount));
        triggerSalvageDiscovery('components', compAmount, 'exploration');
      }

      // 20% chance of relic
      const foundRelic = Math.random() < 0.20;
      const salvageWithRelic = foundRelic
        ? addSalvage(newSalvage, createSalvageEntry('relic', 1))
        : newSalvage;

      if (foundRelic) {
        triggerSalvageDiscovery('relic', 1, 'exploration');
      }

      // 30% chance of finding item (hardware)
      let newFoundHardware = run.foundHardware;
      if (Math.random() < 0.30) {
        const foundItem = pickRandomHardware(run.foundHardware);
        if (foundItem) {
          newFoundHardware = addFoundHardware(run.foundHardware, foundItem);
        }
      }

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (foundRelic) {
        logEntries.push({
          round: run.round,
          cardId: 'risky_scavenge_relic',
          cardName: 'Relic discovered!',
        });
      }

      return {
        ...run,
        salvage: salvageWithRelic,
        foundHardware: newFoundHardware,
        roundHistory: logEntries,
        ...(hullResult ?? {}),
      };
    }

    case 'secure_extract': {
      if (run.hull < 50) return run;
      // Adds +10% extraction bonus (applies to final salvage sale)
      return {
        ...run,
        phase: 'extracting',
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.10,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'quick_extract': {
      // Extraction with breach chance reduced by half
      const baseBreachChance = 0.10;
      const breachChancePerRound = 0.03;
      const breachChance = (baseBreachChance + (run.round * breachChancePerRound)) * 0.5; // half chance

      const breachOccurred = Math.random() < breachChance;
      let finalHull = run.hull;
      let phase: RunState['phase'] = 'extracting';

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);

      if (breachOccurred) {
        const breachDamage = Math.floor(Math.random() * 16) + 10;
        finalHull = Math.max(0, run.hull - breachDamage);
        logEntries.push({
          round: run.round,
          cardId: 'quick_extract_breach',
          cardName: `Hull breach! −${breachDamage} hull`,
        });

        if (finalHull <= 0) {
          phase = 'collapsed';
          logEntries.push({
            round: run.round,
            cardId: 'quick_extract_collapse',
            cardName: 'Extraction failed! Run collapsed!',
          });
        }
      }

      return {
        ...run,
        hull: finalHull,
        phase,
        roundHistory: logEntries,
      };
    }

    case 'patch_and_hold': {
      // Hull +5-12 (random)
      const healAmount = Math.floor(Math.random() * 8) + 5; // 5-12 inclusive
      const newHull = Math.min(MAX_HULL + run.maxHullBonus, run.hull + healAmount);

      // 10% chance of 3-8 hull damage from stress
      const stressChance = 0.10;
      const stressDamage = Math.floor(Math.random() * 6) + 3; // 3-8 inclusive
      const stressOccurred = Math.random() < stressChance;

      const finalHull = stressOccurred
        ? Math.max(0, newHull - stressDamage)
        : newHull;

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (stressOccurred) {
        logEntries.push({
          round: run.round,
          cardId: 'patch_stress',
          cardName: `Stress damage! −${stressDamage} hull`,
        });
      }

      return {
        ...run,
        hull: finalHull,
        shieldCharges: run.shieldCharges + 1 + shieldGainBonus,
        roundHistory: logEntries,
      };
    }

    default:
      return null;
  }
}
