import type { MetaState } from '../types/state';
import type { ResearchTrackId } from '../content/crew';

/** Research tier thresholds: points needed for T1, T2, T3 */
export const RESEARCH_THRESHOLDS: number[] = [10, 25, 50];

/** 
 * Expedition debt reduction percentages by max unlock level across all tracks.
 * Each tier unlocked in ANY track contributes to the total reduction:
 * - T1 (level 1): 10% reduction
 * - T2 (level 2): 20% reduction (cumulative)
 * - T3 (level 3): 30% reduction (cumulative)
 */
export const RESEARCH_DEBT_REDUCTION_BY_LEVEL: Record<number, number> = {
  0: 0,    // No reduction
  1: 0.10, // 10% reduction at T1
  2: 0.20, // 20% reduction at T2
  3: 0.30, // 30% reduction at T3
};

/** Research unlock definitions per track */
export const RESEARCH_TRACK_UNLOCKS: Record<
  ResearchTrackId,
  Array<{ threshold: number; cardIds: string[]; hardwareIds: string[] }>
> = {
  engineering: [
    {
      threshold: 10,
      cardIds: ['marathon', 'patch_hull'],
      hardwareIds: ['extended_tanks'],
    },
    {
      threshold: 25,
      cardIds: ['credit_forecast', 'reinforced_bots'],
      hardwareIds: ['bot_overclocker'],
    },
    {
      threshold: 50,
      cardIds: ['fortress_protocol', 'hull_investment'],
      hardwareIds: ['titanium_lattice'],
    },
  ],
  biology: [
    {
      threshold: 10,
      cardIds: ['triage_protocol', 'bio_scavenge'],
      hardwareIds: ['reactive_plating'],
    },
    {
      threshold: 25,
      cardIds: ['regenerate', 'adaptive_shields'],
      hardwareIds: ['med_scanner'],
    },
    {
      threshold: 50,
      cardIds: ['capacitor_overload', 'bio_extract'],
      hardwareIds: ['capacitor_array'],
    },
  ],
  psionics: [
    {
      threshold: 10,
      cardIds: ['void_pulse', 'entropy_gift'],
      hardwareIds: ['void_resonator'],
    },
    {
      threshold: 25,
      cardIds: ['ancestral_extract', 'premonition'],
      hardwareIds: ['echo_battery'],
    },
    {
      threshold: 50,
      cardIds: ['echo_amplifier_card', 'void_communion_card'],
      hardwareIds: ['echo_amplifier'],
    },
  ],
};

/**
 * Check if a track has reached a new tier threshold and apply unlocks.
 * Returns updated meta state with new cards/hardware added.
 */
function processTrackUnlocks(
  meta: MetaState,
  trackId: ResearchTrackId,
): MetaState {
  const currentPoints = meta.researchPoints[trackId] ?? 0;
  const currentLevel = meta.researchUnlockLevel[trackId] ?? 0;
  const unlocks = RESEARCH_TRACK_UNLOCKS[trackId];

  let updatedMeta = meta;
  let newLevel = currentLevel;

  // Check each tier threshold in order
  for (let i = currentLevel; i < unlocks.length; i++) {
    const tier = unlocks[i];
    if (currentPoints >= tier.threshold) {
      // Unlock this tier's rewards
      const newCards = tier.cardIds.filter(
        (id) => !updatedMeta.unlockedCards.includes(id),
      );
      const newHardware = tier.hardwareIds.filter(
        (id) => !updatedMeta.itemInventory.includes(id),
      );

      if (newCards.length > 0 || newHardware.length > 0) {
        updatedMeta = {
          ...updatedMeta,
          unlockedCards: [...updatedMeta.unlockedCards, ...newCards],
          itemInventory: [...updatedMeta.itemInventory, ...newHardware],
        };
      }

      newLevel = i + 1;
    } else {
      // Haven't reached this tier yet, stop checking
      break;
    }
  }

  // Update the unlock level if we unlocked anything
  if (newLevel > currentLevel) {
    updatedMeta = {
      ...updatedMeta,
      researchUnlockLevel: {
        ...updatedMeta.researchUnlockLevel,
        [trackId]: newLevel,
      },
    };
  }

  return updatedMeta;
}

/**
 * Apply research track unlocks based on accumulated points.
 * Checks all three tracks and adds any newly unlocked cards/hardware.
 *
 * @param meta - Current meta state
 * @returns Updated meta state with unlocks applied
 */
export function applyResearchUnlocks(meta: MetaState): MetaState {
  let updatedMeta = meta;

  // Process each research track
  const tracks: ResearchTrackId[] = ['engineering', 'biology', 'psionics'];
  for (const trackId of tracks) {
    updatedMeta = processTrackUnlocks(updatedMeta, trackId);
  }

  return updatedMeta;
}

/**
 * Get the next unlock threshold for a track, or null if fully unlocked.
 */
export function getNextResearchThreshold(
  trackId: ResearchTrackId,
  currentLevel: number,
): number | null {
  const unlocks = RESEARCH_TRACK_UNLOCKS[trackId];
  if (currentLevel >= unlocks.length) return null;
  return unlocks[currentLevel].threshold;
}

/**
 * Get unlock preview for a track at a specific tier.
 */
export function getResearchUnlockPreview(
  trackId: ResearchTrackId,
  tierIndex: number,
): { cardIds: string[]; hardwareIds: string[] } | null {
  const unlocks = RESEARCH_TRACK_UNLOCKS[trackId];
  if (tierIndex < 0 || tierIndex >= unlocks.length) return null;
  return {
    cardIds: unlocks[tierIndex].cardIds,
    hardwareIds: unlocks[tierIndex].hardwareIds,
  };
}

/**
 * Get the debt reduction percentage based on max research level across all tracks.
 * 
 * @param maxLevel - Highest unlock level (0-3) across all research tracks
 * @returns Debt reduction percentage (0.10 = 10%)
 */
export function getDebtReductionFromResearch(maxLevel: number): number {
  return RESEARCH_DEBT_REDUCTION_BY_LEVEL[Math.max(0, Math.min(3, maxLevel))] ?? 0;
}
