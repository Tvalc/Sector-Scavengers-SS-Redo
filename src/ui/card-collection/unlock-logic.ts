// Card Collection Panel - Card Unlock Requirements Logic

import { MetaState } from '../../types/state';
import { ALL_CARDS } from '../../content/cards';
import { CardUnlockInfo } from './types';
import { getCardDoctrine } from './doctrine';

const hiddenCards = ['void_siphon', 'ancestor_memory', 'death_defiance'];

const voidShopCards = ['void_shield', 'echo_extract', 'ancestor_memory'];

const signalCards = ['salvage_override', 'distress_response', 'audit_bribe'];

interface ResearchRequirement {
  track: 'engineering' | 'biology' | 'psionics';
  threshold: number;
}

const researchCards: Record<string, ResearchRequirement> = {
  'repair_bot': { track: 'engineering', threshold: 10 },
  'scavenge_bot': { track: 'engineering', threshold: 10 },
  'marathon': { track: 'engineering', threshold: 10 },
  'patch_hull': { track: 'engineering', threshold: 10 },
  'reinforced_bots': { track: 'engineering', threshold: 25 },
  'credit_forecast': { track: 'engineering', threshold: 25 },
  'fortress_protocol': { track: 'engineering', threshold: 50 },
  'hull_investment': { track: 'engineering', threshold: 50 },
  'hull_surge': { track: 'biology', threshold: 10 },
  'last_stand': { track: 'biology', threshold: 25 },
  'triage_protocol': { track: 'biology', threshold: 10 },
  'bio_scavenge': { track: 'biology', threshold: 10 },
  'regenerate': { track: 'biology', threshold: 25 },
  'adaptive_shields': { track: 'biology', threshold: 25 },
  'capacitor_overload': { track: 'biology', threshold: 50 },
  'bio_extract': { track: 'biology', threshold: 50 },
  'void_pulse': { track: 'psionics', threshold: 10 },
  'entropy_gift': { track: 'psionics', threshold: 10 },
  'ancestral_extract': { track: 'psionics', threshold: 25 },
  'premonition': { track: 'psionics', threshold: 25 },
  'echo_amplifier_card': { track: 'psionics', threshold: 50 },
  'void_communion_card': { track: 'psionics', threshold: 50 },
};

/** Define unlock requirements for all cards */
export function getCardUnlockInfo(cardId: string, meta: MetaState): CardUnlockInfo {
  const card = ALL_CARDS.find(c => c.id === cardId);
  if (!card) {
    return {
      card: ALL_CARDS[0],
      unlocked: false,
      unlockRequirement: 'Unknown',
      hidden: true
    };
  }

  const isUnlocked = meta.unlockedCards.includes(cardId);
  const doctrine = getCardDoctrine(cardId);

  // Starter cards - always unlocked
  if (card.rarity === 'starter') {
    return {
      card,
      unlocked: true,
      unlockRequirement: 'Starting card',
      hidden: false,
      doctrineAlignment: doctrine !== 'neutral' ? doctrine : undefined,
    };
  }

  // Hidden/lore cards - discovered through play
  if (hiddenCards.includes(cardId) && !isUnlocked) {
    return {
      card,
      unlocked: false,
      unlockRequirement: 'Discover through play',
      hidden: true,
    };
  }

  // Doctrine unlocks (threshold 5 points)
  if (doctrine !== 'neutral') {
    const points = meta.doctrinePoints[doctrine] || 0;
    const threshold = 5;
    return {
      card,
      unlocked: isUnlocked,
      unlockRequirement: `${doctrine.charAt(0).toUpperCase() + doctrine.slice(1)} ${threshold} pts`,
      progress: `${points}/${threshold}`,
      hidden: false,
      doctrineAlignment: doctrine,
      doctrinePointsRequired: threshold,
    };
  }

  // Research track unlocks
  if (researchCards[cardId]) {
    const req = researchCards[cardId];
    const currentPoints = meta.researchPoints[req.track] || 0;
    return {
      card,
      unlocked: isUnlocked,
      unlockRequirement: `${req.track.charAt(0).toUpperCase() + req.track.slice(1)} research ${req.threshold} pts`,
      progress: `${currentPoints}/${req.threshold}`,
      hidden: false,
    };
  }

  // Void shop cards
  if (voidShopCards.includes(cardId)) {
    return {
      card,
      unlocked: isUnlocked,
      unlockRequirement: 'Void Shop purchase',
      progress: `${meta.voidEcho} echo`,
      hidden: false,
    };
  }

  // Death lesson unlocks
  if (cardId === 'void_siphon') {
    return {
      card,
      unlocked: isUnlocked,
      unlockRequirement: 'Collapse 3 times',
      progress: `${meta.totalCollapses}/3`,
      hidden: !isUnlocked,
    };
  }

  // Signal node cards
  if (signalCards.includes(cardId)) {
    return {
      card,
      unlocked: isUnlocked,
      unlockRequirement: 'Signal node encounter',
      hidden: false,
    };
  }

  // Loot node eligible cards
  if (card.lootNodeEligible) {
    return {
      card,
      unlocked: isUnlocked,
      unlockRequirement: 'Cache node find',
      hidden: false,
    };
  }

  // Default
  return {
    card,
    unlocked: isUnlocked,
    unlockRequirement: 'Complete dives',
    hidden: false,
  };
}
