import { RunState, RoundHistoryEntry } from '../../types/state';
import { createSalvageEntry, addSalvage, removeSalvage } from '../../content/salvage';
import { triggerSalvageDiscovery } from '../../ui/dive-renderer/discovery-popup';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';

function makeHistory(run: RunState, cardId: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName: cardId }];
}

/**
 * Relay Cards - Mid-run salvage extraction to base.
 * 
 * These cards send salvage back to base BEFORE extraction, allowing players
 * to secure some value even if they collapse. However, using ship systems
 * to transmit salvage back creates electromagnetic signatures that may
 * attract dangers - causing severe hull damage (20-30).
 * 
 * Risk/Reward:
 * - Basic Relay: Low reward (1 scrap), moderate risk (30% chance of -20 hull)
 * - Secure Channel: Medium reward (1-2 salvage), no risk (requires tech/stealth)
 * - Smuggler's Relay: High reward (2-3 salvage + component), high risk (50% chance of -30 hull)
 * - Quantum Drop: All-or-nothing (all scrap), very high risk (40% chance of -25 hull, skip round)
 */

export function applyRelayCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId } = event;

  switch (cardId) {
    // ── Basic Relay ─────────────────────────────────────────────────────────
    case 'basic_relay': {
      const damageChance = 0.30;
      const takeDamage = Math.random() < damageChance;
      const damageAmount = takeDamage ? 20 : 0; // Fixed 20 hull damage
      const hullResult = takeDamage ? applyHullDamage(run, damageAmount) : null;

      // Send 1 scrap to base (add to run salvage which becomes hub inventory on extract)
      const newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', 1));
      triggerSalvageDiscovery('scrap', 1, 'relay');

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (takeDamage) {
        logEntries.push({
          round: run.round,
          cardId: 'basic_relay_damage',
          cardName: `Signal detected! −${damageAmount} hull from countermeasures`,
        });
      }

      return {
        ...run,
        salvage: newSalvage,
        roundHistory: logEntries,
        ...(hullResult ?? {}),
      };
    }

    // ── Secure Channel ──────────────────────────────────────────────────────
    case 'secure_channel': {
      // No hull damage - secure transmission
      const scrapAmount = Math.floor(Math.random() * 2) + 1; // 1-2 scrap

      const newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      triggerSalvageDiscovery('scrap', scrapAmount, 'relay');

      return {
        ...run,
        salvage: newSalvage,
        roundHistory: makeHistory(run, cardId),
      };
    }

    // ── Smuggler's Relay (replaces Black Market) ─────────────────────────────
    case 'smugglers_relay': {
      const damageChance = 0.50; // 50% chance
      const takeDamage = Math.random() < damageChance;
      const damageAmount = takeDamage ? 30 : 0; // Severe 30 hull damage
      const hullResult = takeDamage ? applyHullDamage(run, damageAmount) : null;

      // High reward: 2-3 salvage + 1 guaranteed component
      const scrapAmount = Math.floor(Math.random() * 2) + 2; // 2-3

      let newSalvage = addSalvage(run.salvage, createSalvageEntry('scrap', scrapAmount));
      newSalvage = addSalvage(newSalvage, createSalvageEntry('components', 1));

      triggerSalvageDiscovery('scrap', scrapAmount, 'relay');
      triggerSalvageDiscovery('components', 1, 'relay');

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);
      if (takeDamage) {
        logEntries.push({
          round: run.round,
          cardId: 'smugglers_relay_damage',
          cardName: `Hostile tracking! −${damageAmount} hull from torpedo strike`,
        });
      }

      return {
        ...run,
        salvage: newSalvage,
        roundHistory: logEntries,
        ...(hullResult ?? {}),
      };
    }

    // ── Quantum Drop ────────────────────────────────────────────────────────
    case 'quantum_drop': {
      const damageChance = 0.40; // 40% chance
      const takeDamage = Math.random() < damageChance;
      const damageAmount = takeDamage ? 25 : 0; // 25 hull damage
      const hullResult = takeDamage ? applyHullDamage(run, damageAmount) : null;

      // Send ALL scrap currently held
      const currentScrap = run.salvage.find(s => s.tier === 'scrap')?.quantity ?? 0;
      let newSalvage = run.salvage;

      if (currentScrap > 0) {
        // Remove from current salvage (it gets sent to base)
        newSalvage = removeSalvage(run.salvage, 'scrap', currentScrap);
        triggerSalvageDiscovery('scrap', currentScrap, 'relay');
      }

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId);

      if (currentScrap > 0) {
        logEntries.push({
          round: run.round,
          cardId: 'quantum_drop_sent',
          cardName: `Quantum drop sent ${currentScrap} scrap to base`,
        });
      }

      if (takeDamage) {
        logEntries.push({
          round: run.round,
          cardId: 'quantum_drop_damage',
          cardName: `Signature traced! −${damageAmount} hull`,
        });
      }

      // Skip next round (exhausted from emergency protocols)
      return {
        ...run,
        salvage: newSalvage,
        round: run.round + 1, // Skip to next round
        roundHistory: logEntries,
        ...(hullResult ?? {}),
      };
    }

    default:
      return null;
  }
}
