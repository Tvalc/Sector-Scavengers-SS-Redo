import { MetaState } from '../types/state';

// Cards unlocked at each extract milestone.
const UNLOCK_THRESHOLDS: Array<{ minExtracts: number; cardIds: string[] }> = [
  { minExtracts: 1, cardIds: ['shield', 'secure_extract', 'quick_extract'] },
  { minExtracts: 2, cardIds: ['risky_scavenge'] },
  { minExtracts: 3, cardIds: ['upgrade', 'analyze'] },
  { minExtracts: 4, cardIds: ['patch_and_hold'] },
];

export function checkAndUnlock(meta: MetaState): MetaState {
  let unlocked = meta.unlockedCards;

  for (const tier of UNLOCK_THRESHOLDS) {
    if (meta.totalExtracts >= tier.minExtracts) {
      for (const cardId of tier.cardIds) {
        if (!unlocked.includes(cardId)) {
          unlocked = [...unlocked, cardId];
        }
      }
    }
  }

  if (unlocked === meta.unlockedCards) return meta;
  return { ...meta, unlockedCards: unlocked };
}
