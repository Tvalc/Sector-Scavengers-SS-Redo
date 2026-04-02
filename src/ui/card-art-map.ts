// Card Art Mapping - Maps card IDs to static asset names
// Cards NOT in this map will use cardback (placeholder) art
// Asset names must match keys in static-asset-manifest.json exactly

import { MakkoEngine } from '@makko/engine';

/**
 * Mapping of card IDs to their corresponding static asset names.
 * Cards not in this list will use the cardback art.
 * Asset names must match keys in static-asset-manifest.json exactly.
 *
 * ART MAPPING RULES:
 * - ONLY cards with their own dedicated 1:1 art asset are in this map
 * - Each art asset appears ONLY ONCE in this entire map
 * - Cards without dedicated art are NOT in this map (renderer uses cardback)
 */
export const CARD_ART_MAP: Record<string, string> = {
  // ── Core Base Cards (with dedicated art) ───────────────────────────────────
  scavenge: 'ss-card-tactic-scavenge',
  repair: 'ss-tactic-card-repair',
  extract: 'ss-card-tactic-extract',
  upgrade: 'ss-card-tactic-upgrade',
  risky_scavenge: 'ss-card-tactic-risky-scavenge',
  patch_and_hold: 'ss-card-tactic-patch-and-hold',
  quick_extract: 'ss-card-tactic-quick-extract',
  secure_extract: 'ss-card-tactic-secure-extract',

  // ── Core Upgraded Cards (with dedicated art) ────────────────────────────────
  deep_scan: 'ss-card-tactic-deep-scan',

  // ── Corporate Cards ─────────────────────────────────────────────────────────
  // NO dedicated art - all use cardback

  // ── Smuggler Cards ─────────────────────────────────────────────────────────
  // NO dedicated art - all use cardback

  // ── Cooperative Cards ─────────────────────────────────────────────────────
  // NO dedicated art - all use cardback

  // ── Void Cards ─────────────────────────────────────────────────────────────
  // NO dedicated art - all use cardback
};

/**
 * Card back assets for locked/hidden cards.
 */
export const CARD_BACK_ASSETS = [
  'ss-prop-card-back',
  'ss-prop-card-back-1',
  'ss-prop-card-back-2',
  'ss-prop-card-back-3',
  'ss-prop-card-back-5',
  'ss-prop-card-back-7',
  'ss-prop-card-back-8',
  'ss-prop-card-back-9',
  'ss-prop-card-back-10',
  'ss-prop-card-back-11',
  'ss-prop-card-back-13',
  'ss-prop-card-back-14',
  'ss-prop-card-back-15',
  'ss-prop-card-back-16',
  'ss-prop-card-back-17',
  'ss-prop-card-back-20',
  'ss-prop-card-back-25',
  'ss-prop-card-back-26',
  'ss-prop-card-back-27',
];

/**
 * Get the static asset name for a card ID.
 * Returns undefined if the card has no dedicated art (should use cardback).
 */
export function getCardArtAsset(cardId: string): string | undefined {
  return CARD_ART_MAP[cardId];
}

/**
 * Check if a card has real art available.
 */
export function hasCardArt(cardId: string): boolean {
  const assetName = CARD_ART_MAP[cardId];
  if (!assetName) return false;
  return MakkoEngine.hasStaticAsset(assetName);
}

/**
 * Get a random card back asset for variety.
 */
export function getRandomCardBack(seed: number = Math.random()): string {
  const index = Math.floor(seed * CARD_BACK_ASSETS.length) % CARD_BACK_ASSETS.length;
  return CARD_BACK_ASSETS[index];
}

/**
 * Draw card art at the specified position.
 * Uses contain strategy to show full image without cropping.
 * Returns false if the card has no art (should use drawCardBack instead).
 */
export function drawCardArt(
  display: typeof MakkoEngine.display,
  cardId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha: number = 1,
): boolean {
  const assetName = CARD_ART_MAP[cardId];
  if (!assetName) return false;

  const asset = MakkoEngine.staticAsset(assetName);
  if (!asset) return false;

  // Use contain strategy (fit entire image, letterbox if needed)
  const scaleX = width / asset.width;
  const scaleY = height / asset.height;
  const scale = Math.min(scaleX, scaleY); // Use min for contain behavior

  const drawWidth = asset.width * scale;
  const drawHeight = asset.height * scale;

  // Center the image
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  display.drawImage(asset.image, drawX, drawY, drawWidth, drawHeight, { alpha });

  return true;
}

/**
 * Draw a card back image for locked/mystery cards or cards without dedicated art.
 * Uses contain strategy to show full image without cropping.
 */
export function drawCardBack(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha: number = 1,
  seed?: number,
): boolean {
  const assetName = seed !== undefined ? getRandomCardBack(seed) : CARD_BACK_ASSETS[0];
  const asset = MakkoEngine.staticAsset(assetName);
  if (!asset) return false;

  // Use contain strategy (fit entire image)
  const scaleX = width / asset.width;
  const scaleY = height / asset.height;
  const scale = Math.min(scaleX, scaleY);

  const drawWidth = asset.width * scale;
  const drawHeight = asset.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  display.drawImage(asset.image, drawX, drawY, drawWidth, drawHeight, { alpha });

  return true;
}
