import { MakkoEngine } from '@makko/engine';

/** Fallback background asset name if no matching backgrounds found. */
const FALLBACK_BACKGROUND = 'ss-hallway-front-background';

/** Regex pattern to match room background assets. */
const ROOM_BACKGROUND_PATTERN = /Front-Background|Background-Fixed/i;

/**
 * Selects a random background asset name for a run.
 * Filters the static asset manifest for assets with:
 * - asset_type === 'background'
 * - name matching /Front-Background|Background-Fixed/i pattern
 *
 * @returns A randomly selected background asset name, or fallback if none found
 */
export function selectRandomRunBackground(): string {
  const manifest = MakkoEngine.getStaticAssetManifest();

  if (!manifest || !manifest.assets) {
    return FALLBACK_BACKGROUND;
  }

  // Filter for room backgrounds matching the pattern
  const roomBackgrounds: string[] = [];

  for (const [key, asset] of Object.entries(manifest.assets)) {
    if (
      asset.asset_type === 'background' &&
      ROOM_BACKGROUND_PATTERN.test(asset.name)
    ) {
      roomBackgrounds.push(key);
    }
  }

  // Return random selection or fallback
  if (roomBackgrounds.length === 0) {
    return FALLBACK_BACKGROUND;
  }

  const randomIndex = Math.floor(Math.random() * roomBackgrounds.length);
  return roomBackgrounds[randomIndex];
}
