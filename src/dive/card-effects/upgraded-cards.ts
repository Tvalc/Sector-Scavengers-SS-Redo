import { RunState, RoundHistoryEntry } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { createSalvageEntry, addSalvage } from '../../content/salvage';
import { triggerSalvageDiscovery } from '../../ui/dive-renderer/discovery-popup';
import { pickRandomHardware, addFoundHardware } from '../hardware-discovery';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

/**
 * Apply upgraded core card effects.
 * These are enhanced versions of base cards with better outcomes or reduced risk.
 */
export function applyUpgradedCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId, scavengeBonus = 0, botDamageReduction = false, shieldGainBonus = 0 } = event;

  switch (cardId) {
    // ── Upgraded Scavenge ────────────────────────────────────────────────────
    case 'precision_scavenge': {
      const damageChance = botDamageReduction && run.botsDeployed > 0 ? 0.05 : 0.10;
      const takeDamage = Math.random() < damageChance;
      const damageAmount = takeDamage ? Math.floor(Math.random() * 6) + 5 : 0; // 5-10
      const hullResult = takeDamage ? applyHullDamage(run, damageAmount) : null;

      const scrapAmount = Math.floor(Math.random() * 5) + 3; // 3-7
      const compAmount = Math.floor(Math.random() * 3) + 1; // 1-3

      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      newSalvage = addSalvage(newSalvage, createSalvageEntry('components', compAmount));

      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      triggerSalvageDiscovery('components', compAmount, 'exploration');

      const foundRelic = Math.random() < 0.25;
      if (foundRelic) {
        newSalvage = addSalvage(newSalvage, createSalvageEntry('relic', 1));
        triggerSalvageDiscovery('relic', 1, 'exploration');
      }

      let newFoundHardware = run.foundHardware;
      if (Math.random() < 0.35) {
        const foundItem = pickRandomHardware(run.foundHardware);
        if (foundItem) {
          newFoundHardware = addFoundHardware(run.foundHardware, foundItem);
        }
      }

      return {
        ...run,
        salvage: newSalvage,
        foundHardware: newFoundHardware,
        roundHistory: makeHistory(run, cardId),
        ...(hullResult ?? {}),
      };
    }

    case 'salvage_beacon': {
      const damageChance = botDamageReduction && run.botsDeployed > 0 ? 0.10 : 0.15;
      const takeDamage = Math.random() < damageChance;
      const damageAmount = takeDamage ? Math.floor(Math.random() * 8) + 8 : 0; // 8-15
      const hullResult = takeDamage ? applyHullDamage(run, damageAmount) : null;

      const scrapAmount = Math.floor(Math.random() * 6) + 4; // 4-9
      const compAmount = Math.floor(Math.random() * 3) + 2; // 2-4

      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      newSalvage = addSalvage(newSalvage, createSalvageEntry('components', compAmount));

      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');
      triggerSalvageDiscovery('components', compAmount, 'exploration');

      // Guaranteed +1 item find
      let newFoundHardware = run.foundHardware;
      const foundItem = pickRandomHardware(run.foundHardware);
      if (foundItem) {
        newFoundHardware = addFoundHardware(run.foundHardware, foundItem);
      }

      return {
        ...run,
        salvage: newSalvage,
        foundHardware: newFoundHardware,
        roundHistory: makeHistory(run, cardId),
        ...(hullResult ?? {}),
      };
    }

    // ── Upgraded Repair ─────────────────────────────────────────────────────
    case 'field_repair': {
      const healAmount = Math.floor(Math.random() * 11) + 15; // 15-25
      const newHull = Math.min(MAX_HULL + run.maxHullBonus, run.hull + healAmount);

      const stressChance = 0.10;
      const stressDamage = Math.floor(Math.random() * 6) + 3; // 3-8
      const stressOccurred = Math.random() < stressChance;

      const finalHull = stressOccurred ? Math.max(0, newHull - stressDamage) : newHull;

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (stressOccurred) {
        logEntries.push({
          round: run.round,
          cardId: 'field_repair_stress',
          cardName: `Stress damage! −${stressDamage} hull`,
        });
      }

      return {
        ...run,
        hull: finalHull,
        roundHistory: logEntries,
      };
    }

    case 'emergency_overhaul': {
      const healAmount = Math.floor(Math.random() * 16) + 25; // 25-40
      const newHull = Math.min(MAX_HULL + run.maxHullBonus, run.hull + healAmount);

      const failureChance = 0.15;
      const failureDamage = Math.floor(Math.random() * 11) + 10; // 10-20
      const failureOccurred = Math.random() < failureChance;

      const finalHull = failureOccurred ? Math.max(0, newHull - failureDamage) : newHull;

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (failureOccurred) {
        logEntries.push({
          round: run.round,
          cardId: 'overhaul_failure',
          cardName: `Critical failure! −${failureDamage} hull`,
        });
      }

      return {
        ...run,
        hull: finalHull,
        shieldCharges: run.shieldCharges + 1 + shieldGainBonus,
        roundHistory: logEntries,
      };
    }

    // ── Upgraded Shield ──────────────────────────────────────────────────────
    case 'reinforced_shield': {
      return {
        ...run,
        shieldCharges: run.shieldCharges + 2 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'ablative_screen': {
      // Ablative screen: +1 shield with 20% damage reduction while active
      // Damage reduction implemented in danger resolution
      return {
        ...run,
        shieldCharges: run.shieldCharges + 1 + shieldGainBonus,
        roundHistory: makeHistory(run, cardId),
      };
    }

    // ── Upgraded Extract ────────────────────────────────────────────────────
    case 'priority_extract': {
      return {
        ...run,
        phase: 'extracting',
        pendingExtractBonusPct: run.pendingExtractBonusPct + 0.05,
        roundHistory: makeHistory(run, cardId),
      };
    }

    case 'emergency_beacon': {
      return {
        ...run,
        phase: 'extracting',
        pendingExtractBonusPct: run.pendingExtractBonusPct - 0.10, // Penalty
        roundHistory: makeHistory(run, cardId),
      };
    }

    default:
      return null;
  }
}
