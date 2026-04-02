import { RunState, RoundHistoryEntry } from '../../types/state';
import { MAX_HULL } from '../../config/constants';
import { createSalvageEntry, addSalvage } from '../../content/salvage';
import { triggerSalvageDiscovery } from '../../ui/dive-renderer/discovery-popup';
import { PlayCardEvent } from './types';
import { applyHullDamage } from './hull';
import { applyOverchargeMultiplier } from './energy-utils';
import { getSmugglerScavengeMultiplier, createSmugglerBonusLogEntry, checkCooperativeShieldBonus } from './doctrine-synergies';

function makeHistory(run: RunState, cardId: string, cardName: string): RoundHistoryEntry[] {
  return [...run.roundHistory, { round: run.round, cardId, cardName }];
}

export function applyStarterCard(run: RunState, event: PlayCardEvent): RunState | null {
  const { cardId, scavengeBonus = 0, botDamageReduction = false } = event;
  const cardName: string = cardId; // caller maps name

  switch (cardId) {
    case 'scavenge': {
      const baseDamageChance = 0.15;
      const damageChance = botDamageReduction && run.botsDeployed > 0
        ? baseDamageChance * 0.5
        : baseDamageChance;
      const damageHull = Math.random() < damageChance;
      // Damage range: 5-12 hull
      const damageAmount = damageHull ? Math.floor(Math.random() * 8) + 5 : 0;
      const hullResult = damageHull ? applyHullDamage(run, damageAmount) : null;
      const gainCell = Math.random() < 0.15;

      // Roll salvage: 1-4 scrap (or 1-6 with overcharge)
      let scrapAmount = Math.floor(Math.random() * 4) + 1; // 1-4 inclusive
      
      // Apply overcharge multiplier (+50% scrap)
      if (event.overcharge) {
        scrapAmount = applyOverchargeMultiplier(scrapAmount);
      }

      // Apply Smuggler desperation multiplier (1.25x if energy < 2)
      const smugglerMultiplier = getSmugglerScavengeMultiplier(run);
      const baseScrapAmount = scrapAmount;
      scrapAmount = Math.floor(scrapAmount * smugglerMultiplier);
      const smugglerBonus = scrapAmount - baseScrapAmount;

      // 10% chance for bonus component
      const bonusComponentChance = 0.10;
      const gainBonusComponent = Math.random() < bonusComponentChance;

      // Build salvage entries
      let salvageEntries = run.salvage;
      salvageEntries = addSalvage(salvageEntries, createSalvageEntry('scrap', scrapAmount));
      triggerSalvageDiscovery('scrap', scrapAmount, 'exploration');

      if (gainBonusComponent) {
        salvageEntries = addSalvage(salvageEntries, createSalvageEntry('components', 1));
        triggerSalvageDiscovery('components', 1, 'exploration');
      }

      // Build log entries
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId, cardName);
      
      // Log Smuggler bonus if applicable
      const smugglerLogEntry = createSmugglerBonusLogEntry(run, smugglerBonus);
      if (smugglerLogEntry) {
        logEntries.push(smugglerLogEntry);
      }
      
      if (gainBonusComponent) {
        logEntries.push({
          round: run.round,
          cardId: 'scavenge_bonus',
          cardName: 'Bonus component found!',
        });
      }

      return {
        ...run,
        salvage: salvageEntries,
        powerCellsGained: gainCell ? run.powerCellsGained + 1 : run.powerCellsGained,
        roundHistory: logEntries,
        ...(hullResult ?? {}),
      };
    }

    case 'repair': {
      // Roll healing amount: 10-20 hull (15-30 with overcharge)
      let healAmount = Math.floor(Math.random() * 11) + 10; // 10-20 inclusive
      
      // Apply overcharge multiplier (+50% hull repair)
      if (event.overcharge) {
        healAmount = applyOverchargeMultiplier(healAmount);
      }
      
      const newHull = Math.min(MAX_HULL + run.maxHullBonus, run.hull + healAmount);

      // 15% chance of malfunction causing 5-10 hull damage
      const malfunctionChance = 0.15;
      const malfunctionDamage = Math.floor(Math.random() * 6) + 5; // 5-10 inclusive
      const malfunctionOccurred = Math.random() < malfunctionChance;

      const finalHull = malfunctionOccurred
        ? Math.max(0, newHull - malfunctionDamage)
        : newHull;

      // Create log entries
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId, cardName);
      if (malfunctionOccurred) {
        logEntries.push({
          round: run.round,
          cardId: 'repair_malfunction',
          cardName: `Repair malfunction! Hull −${malfunctionDamage}`,
        });
      }

      return {
        ...run,
        hull: finalHull,
        roundHistory: logEntries,
      };
    }

    case 'extract': {
      // Calculate breach chance: 10% base + 3% per round
      const baseBreachChance = 0.10;
      const breachChancePerRound = 0.03;
      const breachChance = baseBreachChance + (run.round * breachChancePerRound);

      // Roll for hull breach
      const breachOccurred = Math.random() < breachChance;
      let finalHull = run.hull;
      let phase: RunState['phase'] = 'extracting';

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId, cardName);

      if (breachOccurred) {
        // Roll breach damage: 10-25 hull damage
        const breachDamage = Math.floor(Math.random() * 16) + 10; // 10-25 inclusive
        finalHull = Math.max(0, run.hull - breachDamage);

        logEntries.push({
          round: run.round,
          cardId: 'extract_breach',
          cardName: `Hull breach! −${breachDamage} hull`,
        });

        // Check if hull reached 0 - run collapses
        if (finalHull <= 0) {
          phase = 'collapsed';
          logEntries.push({
            round: run.round,
            cardId: 'extract_collapse',
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

    case 'shield': {
      // Check for Cooperative shield resonance bonus
      const coopBonus = checkCooperativeShieldBonus(run, cardId);
      const totalShields = 1 + (event.shieldGainBonus ?? 0) + coopBonus.bonusShields;
      
      // Build log entries
      const logEntries = makeHistory(run, cardId, cardName);
      if (coopBonus.logEntry) {
        logEntries.push(coopBonus.logEntry);
      }
      
      return {
        ...run,
        shieldCharges: run.shieldCharges + totalShields,
        roundHistory: logEntries,
      };
    }

    case 'upgrade': {
      const hullResult = event.upgradeNoHullCost ? null : applyHullDamage(run, 8);
      return {
        ...run,
        maxRounds: run.maxRounds + 2,
        roundHistory: makeHistory(run, cardId, cardName),
        ...(hullResult ?? {}),
      };
    }

    case 'analyze':
      return {
        ...run,
        analyzed: true,
        roundHistory: makeHistory(run, cardId, cardName),
      };

    // ── Diagnostic Cards (Hull Information) ─────────────────────────────────
    case 'diagnostic': {
      // Reveals current hull integrity but may stress damaged systems
      const stressChance = 0.20;
      const stressDamage = 5;
      const stressOccurred = Math.random() < stressChance;

      const finalHull = stressOccurred
        ? Math.max(0, run.hull - stressDamage)
        : run.hull;

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId, cardName);

      // The key effect: reveal hull to player via log message
      logEntries.push({
        round: run.round,
        cardId: 'diagnostic_result',
        cardName: `Hull integrity: ${finalHull}%`,
      });

      if (stressOccurred) {
        logEntries.push({
          round: run.round,
          cardId: 'diagnostic_stress',
          cardName: `System stress! −${stressDamage} hull`,
        });
      }

      return {
        ...run,
        hull: finalHull,
        roundHistory: logEntries,
      };
    }

    case 'deep_scan': {
      // Upgraded diagnostic: reveals hull + next danger type
      const feedbackChance = 0.15;
      const feedbackDamage = Math.floor(Math.random() * 3) + 3; // 3-5
      const feedbackOccurred = Math.random() < feedbackChance;

      const finalHull = feedbackOccurred
        ? Math.max(0, run.hull - feedbackDamage)
        : run.hull;

      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId, cardName);

      // Reveal hull
      logEntries.push({
        round: run.round,
        cardId: 'deep_scan_hull',
        cardName: `Hull integrity: ${finalHull}%`,
      });

      // Peek next round's danger type
      const nextRound = run.round + 1;
      const nextNode = nextRound <= run.nodeMap.length ? run.nodeMap[nextRound - 1] : 'unknown';
      const dangerNames: Record<string, string> = {
        salvage: 'Standard salvage conditions',
        signal: 'Unknown signal detected',
        cache: 'Secure cache - possible danger',
        audit: 'Corporate audit pending',
        boss: 'COMMAND PRESENCE DETECTED',
        unknown: 'Unknown sector ahead',
      };

      logEntries.push({
        round: run.round,
        cardId: 'deep_scan_danger',
        cardName: `Scan result: ${dangerNames[nextNode] || dangerNames.unknown}`,
      });

      if (feedbackOccurred) {
        logEntries.push({
          round: run.round,
          cardId: 'deep_scan_feedback',
          cardName: `Scanner feedback! −${feedbackDamage} hull`,
        });
      }

      return {
        ...run,
        hull: finalHull,
        roundHistory: logEntries,
      };
    }

    case 'tactical_assessment': {
      // Rare upgraded diagnostic: reveals everything, no risk
      const logEntries: RoundHistoryEntry[] = makeHistory(run, cardId, cardName);

      // Reveal hull
      logEntries.push({
        round: run.round,
        cardId: 'tactical_hull',
        cardName: `Hull integrity: ${run.hull}%`,
      });

      // Calculate salvage value
      const salvageValue = run.salvage.reduce((sum, s) => sum + (s.quantity * s.valueEach), 0);
      logEntries.push({
        round: run.round,
        cardId: 'tactical_salvage',
        cardName: `Current haul value: ₡${salvageValue.toLocaleString()}`,
      });

      // Peek next danger
      const nextRound = run.round + 1;
      const nextNode = nextRound <= run.nodeMap.length ? run.nodeMap[nextRound - 1] : 'unknown';
      const dangerNames: Record<string, string> = {
        salvage: 'Standard salvage conditions',
        signal: 'Unknown signal detected',
        cache: 'Secure cache - possible danger',
        audit: 'Corporate audit pending',
        boss: 'COMMAND PRESENCE DETECTED',
        unknown: 'Unknown sector ahead',
      };

      logEntries.push({
        round: run.round,
        cardId: 'tactical_danger',
        cardName: `Threat assessment: ${dangerNames[nextNode] || dangerNames.unknown}`,
      });

      return {
        ...run,
        roundHistory: logEntries,
      };
    }

    default:
      return null;
  }
}
