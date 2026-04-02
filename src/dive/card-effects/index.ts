import { RunState } from '../../types/state';
import { PlayCardEvent, CARD_NAME_MAP, EnergyResult } from './types';
import { applyHullDamage } from './hull';
import { handlePostCardEffects } from './post-card';
import { applyStarterCard } from './starter-cards';
import { applyCommonCard } from './common-cards';
import { applyDoctrineCard } from './doctrine-cards';
import { applyVoidCard } from './void-cards';
import { applyBotCard } from './bot-cards';
import { applyShieldCard } from './shield-cards';
import { applyCorporateCard } from './corporate-cards';
import { applyUtilityCard } from './utility-cards';
import { applyUpgradedCard } from './upgraded-cards';
import { applyRelayCard } from './relay-cards';
import { ALL_CARDS, TacticCard } from '../../content/cards';
import { CORPORATE_ENERGY_BONUS_THRESHOLD, CORPORATE_ENERGY_BONUS_CREDITS } from '../../config/constants';
import { applyOverchargeMultiplier } from './energy-utils';

export { PlayCardEvent, CARD_NAME_MAP, EnergyResult } from './types';
export { applyHullDamage } from './hull';
export { handlePostCardEffects } from './post-card';
export { applyOverchargeMultiplier } from './energy-utils';

/**
 * Check if reserve burn is available (energy at max before playing).
 * Reserve burn gives -1⚡ cost to the next card played.
 * 
 * Reserve burn is ready when:
 * - Current energy equals max energy
 * - The reserveBurnAvailable flag is true (set when reaching max energy)
 * 
 * After triggering, the flag is cleared and won't be set again until
 * energy reaches max once more.
 */
export function checkReserveBurn(run: RunState): { 
  available: boolean; 
  discount: number;
  logMessage: string | null;
} {
  const isAtMaxEnergy = run.energy >= run.maxEnergy;
  const isAvailable = isAtMaxEnergy && run.reserveBurnAvailable;
  
  if (isAvailable) {
    return {
      available: true,
      discount: 1,
      logMessage: 'Reserve burn engaged: -1⚡',
    };
  }
  
  return {
    available: false,
    discount: 0,
    logMessage: null,
  };
}

/**
 * Calculate the final energy cost for playing a card.
 * Handles base cost, reserve burn discount, overcharge cost, and doctrine bonuses.
 */
export function calculateEnergyCost(
  card: TacticCard,
  run: RunState,
  options: { overcharge?: boolean; doctrineBonus?: boolean } = {}
): EnergyResult {
  // Base cost from card
  let cost = card.energyCost ?? 0;
  let refund = 0;

  // Surge cards give energy instead of costing
  if (card.isSurge) {
    // Surge cards typically have 0 cost but the effect grants energy
    // The actual energy gain is handled by the card effect
    return { cost: 0, refund: 0, net: 0 };
  }

  // Reserve burn discount (-1⚡ if at max before playing and available)
  const reserveBurn = checkReserveBurn(run);
  if (reserveBurn.available) {
    cost = Math.max(0, cost - reserveBurn.discount);
  }

  // Overcharge cost (+1⚡ for enhanced effect)
  if (options.overcharge) {
    cost += 1;
  }

  // Corporate doctrine bonus: spend 3+⚡ in a round for 1000₡ bonus
  // This is handled separately in the run state tracking

  return { cost, refund, net: cost - refund };
}

/**
 * Process energy refund after playing a card.
 * Checks card refund conditions and returns energy to the player.
 */
export function processEnergyRefund(card: TacticCard, run: RunState): number {
  if (!card.energyRefund) return 0;

  const { condition, amount } = card.energyRefund;

  // Check specific refund conditions
  switch (condition) {
    case 'Find relic':
      // Refund triggers on relic find - checked by card effect logic
      // Return the amount for the effect to apply
      return amount;
    case 'Random 50%':
      // 50% chance to refund
      if (Math.random() < 0.5) return amount;
      return 0;
    case 'Random 0-1⚡':
      // Random 0 or 1 energy refund
      return Math.floor(Math.random() * 2); // 0 or 1
    case 'Hull <30':
      // Refund if hull is below 30
      if (run.hull < 30) return amount;
      return 0;
    default:
      // Generic condition - return the amount (specific logic handled by card effect)
      return amount;
  }
}

/**
 * Check and apply Corporate doctrine energy bonus.
 * If 3+⚡ spent this round, grant 1000₡ bonus.
 */
export function checkCorporateEnergyBonus(run: RunState): { credits: number; newRun: RunState } {
  const newEnergySpent = run.energySpentThisRound + 1;

  // Check if we crossed the threshold
  if (newEnergySpent === CORPORATE_ENERGY_BONUS_THRESHOLD) {
    return {
      credits: CORPORATE_ENERGY_BONUS_CREDITS,
      newRun: { ...run, energySpentThisRound: newEnergySpent }
    };
  }

  return {
    credits: 0,
    newRun: { ...run, energySpentThisRound: newEnergySpent }
  };
}

/**
 * Helper function to get card data by ID.
 */
function getCardById(cardId: string): TacticCard | undefined {
  return ALL_CARDS.find(c => c.id === cardId);
}

/**
 * Apply the effect of a single card.
 * Dispatches to the appropriate domain handler based on cardId.
 * Returns the updated RunState after card resolution (before deck management).
 */
export function applyCardEffect(run: RunState, event: PlayCardEvent): RunState {
  const handlers = [
    applyStarterCard,
    applyCommonCard,
    applyDoctrineCard,
    applyVoidCard,
    applyBotCard,
    applyShieldCard,
    applyCorporateCard,
    applyUtilityCard,
    applyUpgradedCard,
    applyRelayCard,
  ];

  for (const handler of handlers) {
    const result = handler(run, event);
    if (result !== null) return result;
  }

  // Unknown card — return unchanged
  return run;
}

/**
 * Full card play pipeline: apply effects then handle deck management.
 */
export function playCard(run: RunState, event: PlayCardEvent): RunState {
  const afterEffects = applyCardEffect(run, event);
  return handlePostCardEffects(afterEffects, event.cardId);
}
