import { DoctrineId } from '../../content/doctrine';
import { CARD_BACK_ASSETS } from '../card-art-map';

// ============================================================================
// Draw Pile Visual State
// ============================================================================

export interface DrawVisualState {
  cardBackAsset: string;  // Selected cardback for draw pile
  stackOffset: number;    // Visual offset per card (min(count*2, 16))
  beamGlow: number;       // Pulsing glow intensity (0.3-0.6 based on count)
}

export let drawVisual: DrawVisualState = {
  cardBackAsset: CARD_BACK_ASSETS[0],
  stackOffset: 0,
  beamGlow: 0,
};

// Track previous draw count to detect changes
let previousDrawCount = 0;

/**
 * Update draw pile visual state based on draw count and time
 * - Initializes random cardback when first cards are present
 * - Updates stackOffset (max 16px)
 * - Updates beamGlow with pulsing effect when cards present
 */
export function updateDrawVisual(drawCount: number, now: number): void {
  // Initialize random cardback when draw pile first gets cards
  if (drawCount > 0 && previousDrawCount === 0) {
    drawVisual.cardBackAsset = getRandomCardBack();
  }
  previousDrawCount = drawCount;

  // Update stack offset: grows with count but caps at 16px
  drawVisual.stackOffset = Math.min(drawCount * 2, 16);

  // Update beam glow: pulsing animation when cards present
  if (drawCount > 0) {
    const cycleProgress = (now % GLOW_CYCLE_MS) / GLOW_CYCLE_MS;
    const pulse = Math.sin(cycleProgress * Math.PI * 2); // -1 to 1
    drawVisual.beamGlow = GLOW_MIN + (pulse + 1) / 2 * (GLOW_MAX - GLOW_MIN);
  } else {
    drawVisual.beamGlow = 0;
  }
}

/**
 * Reset draw visual state (e.g., on new run)
 */
export function resetDrawVisual(): void {
  drawVisual = {
    cardBackAsset: CARD_BACK_ASSETS[0],
    stackOffset: 0,
    beamGlow: 0,
  };
  previousDrawCount = 0;
}

// ============================================================================
// Discard Pile Visual State
// ============================================================================

export interface DiscardVisualState {
  cardBackAsset: string;  // Selected cardback for discard pile
  stackOffset: number;    // Visual offset per card (min(count*2, 16))
  beamGlow: number;       // Pulsing glow intensity (0.3-0.6 based on count)
}

export let discardVisual: DiscardVisualState = {
  cardBackAsset: CARD_BACK_ASSETS[0],
  stackOffset: 0,
  beamGlow: 0,
};

// Track previous discard count to detect first time cards enter discard
let previousDiscardCount = 0;

// Pulse animation constants
const GLOW_MIN = 0.3;
const GLOW_MAX = 0.6;
const GLOW_CYCLE_MS = 2000;

/**
 * Get a random card back asset
 */
export function getRandomCardBack(): string {
  const index = Math.floor(Math.random() * CARD_BACK_ASSETS.length);
  return CARD_BACK_ASSETS[index];
}

/**
 * Set the card back asset for the discard pile
 */
export function setDiscardCardBack(assetName: string): void {
  discardVisual.cardBackAsset = assetName;
}

/**
 * Update discard pile visual state based on discard count and time
 * - Initializes random cardback when first cards are discarded
 * - Updates stackOffset (max 16px)
 * - Updates beamGlow with pulsing effect when cards present
 */
export function updateDiscardVisual(discardCount: number, now: number): void {
  // Initialize random cardback when discard pile first gets cards
  if (discardCount > 0 && previousDiscardCount === 0) {
    discardVisual.cardBackAsset = getRandomCardBack();
  }
  previousDiscardCount = discardCount;

  // Update stack offset: grows with count but caps at 16px
  discardVisual.stackOffset = Math.min(discardCount * 2, 16);

  // Update beam glow: pulsing animation when cards present
  if (discardCount > 0) {
    const cycleProgress = (now % GLOW_CYCLE_MS) / GLOW_CYCLE_MS;
    const pulse = Math.sin(cycleProgress * Math.PI * 2); // -1 to 1
    discardVisual.beamGlow = GLOW_MIN + (pulse + 1) / 2 * (GLOW_MAX - GLOW_MIN);
  } else {
    discardVisual.beamGlow = 0;
  }
}

/**
 * Reset discard visual state (e.g., on new run)
 */
export function resetDiscardVisual(): void {
  discardVisual = {
    cardBackAsset: CARD_BACK_ASSETS[0],
    stackOffset: 0,
    beamGlow: 0,
  };
  previousDiscardCount = 0;
}

// ============================================================================
// Card Alpha Tracking System
// ============================================================================

// Current alpha values for each card (0-1)
const cardAlphas = new Map<string, number>();
// Target alpha values for each card (0-1)
const cardAlphaTargets = new Map<string, number>();

// Alpha lerp speed (per second)
// Slightly snappier fade - feels responsive but still smooth
const ALPHA_LERP_SPEED = 1.4;

/**
 * Set the target alpha for a card
 * Card will lerp toward this value in updateCardAlphas()
 * Cards removed from tracking when they reach alpha=0 and target=0
 */
export function setCardTargetAlpha(cardId: string, alpha: number): void {
  cardAlphaTargets.set(cardId, Math.max(0, Math.min(1, alpha)));
}

/**
 * Get the current alpha for a card
 * Returns 0 if card not tracked (invisible until initialized)
 */
export function getCardAlpha(cardId: string): number {
  return cardAlphas.get(cardId) ?? 0;
}

/**
 * Update all card alphas, lerping toward their targets
 * Removes cards from tracking when they fade out completely
 */
export function updateCardAlphas(deltaTime: number): void {
  // Convert deltaTime from ms to seconds
  const dt = deltaTime / 1000;
  
  for (const [cardId, targetAlpha] of cardAlphaTargets) {
    const currentAlpha = cardAlphas.get(cardId) ?? 0;
    
    // Lerp toward target
    const newAlpha = currentAlpha + (targetAlpha - currentAlpha) * Math.min(dt * ALPHA_LERP_SPEED, 1);
    
    // Update current alpha
    cardAlphas.set(cardId, newAlpha);
    
    // Remove from tracking if fully faded out and target is 0
    if (newAlpha < 0.01 && targetAlpha === 0) {
      cardAlphas.delete(cardId);
      cardAlphaTargets.delete(cardId);
    }
  }
  
  // Clean up any cards that have alpha but no target (shouldn't happen, but safety)
  for (const [cardId, _] of cardAlphas) {
    if (!cardAlphaTargets.has(cardId)) {
      cardAlphas.delete(cardId);
    }
  }
}

/**
 * Initialize a new card with alpha=0, target=1 (will fade in)
 * Called when a card is added to the hand
 */
export function initializeCardAlpha(cardId: string): void {
  cardAlphas.set(cardId, 0);
  cardAlphaTargets.set(cardId, 1);
}

/**
 * Mark a card for fade out (target=0)
 * Card will be removed from tracking when alpha reaches 0
 */
export function fadeOutCard(cardId: string): void {
  cardAlphaTargets.set(cardId, 0);
}

/**
 * Clear all card alpha tracking (e.g., on new run or scene transition)
 */
export function clearCardAlphas(): void {
  cardAlphas.clear();
  cardAlphaTargets.clear();
}

/**
 * Get the number of cards currently being tracked for alpha animation
 */
export function getTrackedCardCount(): number {
  return cardAlphas.size;
}

// ============================================================================
// Press tracking for card interactions
export let pressedIndex = -1;
export let pressedForkRound: 4 | 8 | null = null;

// Timestamp tracking for doctrine signature flash
export let lastSignatureUnlockTime = 0;
export let lastSignatureDoctrine: DoctrineId | null = null;

// Tracks if log overlay should be shown
let logOverlayVisible = false;

export function toggleLogOverlay(): void {
  logOverlayVisible = !logOverlayVisible;
}

export function closeLogOverlay(): void {
  logOverlayVisible = false;
}

export function isLogOverlayVisible(): boolean {
  return logOverlayVisible;
}

// Tracks if status overlay should be shown
let statusOverlayVisible = false;

export function toggleStatusOverlay(): void {
  statusOverlayVisible = !statusOverlayVisible;
}

export function closeStatusOverlay(): void {
  statusOverlayVisible = false;
}

export function isStatusOverlayVisible(): boolean {
  return statusOverlayVisible;
}

export function setPressedIndex(index: number): void {
  pressedIndex = index;
}

export function resetPressedIndex(): void {
  pressedIndex = -1;
}

export function setPressedForkRound(round: 4 | 8 | null): void {
  pressedForkRound = round;
}

export function resetPressedForkRound(): void {
  pressedForkRound = null;
}

export function setSignatureUnlock(doctrine: DoctrineId, time: number): void {
  lastSignatureDoctrine = doctrine;
  lastSignatureUnlockTime = time;
}
