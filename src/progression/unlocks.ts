import { MetaState } from '../types/state';

// Cards unlocked at each extract milestone.
export type UnlockThreshold = { minExtracts: number; cardIds: string[] };

export const UNLOCK_THRESHOLDS: UnlockThreshold[] = [
  { minExtracts: 1, cardIds: ['risky_scavenge', 'secure_extract', 'quick_extract'] },
  { minExtracts: 3, cardIds: ['ancestor_memory', 'repair_bot', 'scavenge_bot'] },
  { minExtracts: 5, cardIds: ['hull_surge', 'bulwark'] },
  { minExtracts: 8, cardIds: ['overdrive_extract', 'last_stand'] },
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
