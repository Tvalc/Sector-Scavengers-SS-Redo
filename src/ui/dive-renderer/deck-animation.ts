import { MakkoEngine } from '@makko/engine';
import {
  DRAW_PILE_X, DRAW_PILE_Y, DRAW_CARD_W, DRAW_CARD_H,
  CARD_PANEL_X, CARD_PANEL_Y, CARD_W, CARD_H, CARD_XS,
  DISCARD_PILE_X, DISCARD_PILE_Y, DISCARD_CARD_W, DISCARD_CARD_H,
} from './constants';
import { setCardTargetAlpha } from './state';

// ============================================================================
// Card Zone Types
// ============================================================================

export type CardZone = 'draw' | 'hand' | 'discard' | 'animating';

// ============================================================================
// Card Position Tracker
// ============================================================================

export interface CardPositionTracker {
  cardId: string;
  currentZone: CardZone;
  targetZone: CardZone;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  animationProgress: number;  // 0 to 1
  animationDuration: number;  // ms
  animationElapsed: number;   // ms
  visible: boolean;
  scale: number;
  targetScale: number;
}

// ============================================================================
// Animation Constants
// ============================================================================

const CARD_MOVEMENT_DURATION = 350;  // ms for card movements
const SHUFFLE_DURATION = 600;        // ms for shuffle animations
const SHUFFLE_SCATTER_DURATION = 200; // ms for scatter phase
const LERP_EASE_OUT = 0.15;          // Ease-out factor for smooth movement
const LERP_EASE_IN_OUT = 0.2;        // For shuffle scatter movement

// ============================================================================
// Shuffle Animation State
// ============================================================================

interface ShuffleCardState {
  cardId: string;
  startX: number;
  startY: number;
  scatterX: number;
  scatterY: number;
  endX: number;
  endY: number;
  phase: 'scatter' | 'gather';
  elapsed: number;
}

let shuffleAnimations: ShuffleCardState[] = [];
let shuffleInProgress = false;

// ============================================================================
// Card Position Registry
// ============================================================================

// Map of cardId to position tracker
const cardPositions = new Map<string, CardPositionTracker>();

// Track active animations
let activeAnimationCount = 0;

/**
 * Get the position for a card in a specific zone
 * Returns center position of the zone for animations
 */
function getZonePosition(zone: CardZone, index: number = 0): { x: number; y: number; scale: number } {
  switch (zone) {
    case 'draw':
      // Draw pile: center of pile with slight stacking offset
      return {
        x: DRAW_PILE_X + DRAW_CARD_W / 2,
        y: DRAW_PILE_Y + DRAW_CARD_H / 2,
        scale: 1,
      };
    case 'hand':
      // Hand: positioned in card panel
      return {
        x: CARD_XS[index] ?? CARD_PANEL_X + 20,
        y: CARD_PANEL_Y + 20,
        scale: 1,
      };
    case 'discard':
      // Discard pile: center of pile with slight stacking offset
      return {
        x: DISCARD_PILE_X + DISCARD_CARD_W / 2,
        y: DISCARD_PILE_Y + DISCARD_CARD_H / 2,
        scale: 1,
      };
    case 'animating':
      // Animating: use current position
      return { x: 0, y: 0, scale: 1 };
    default:
      return { x: 0, y: 0, scale: 1 };
  }
}

/**
 * Initialize or get a card's position tracker
 */
export function getCardTracker(cardId: string): CardPositionTracker {
  if (!cardPositions.has(cardId)) {
    const pos = getZonePosition('draw', 0);
    cardPositions.set(cardId, {
      cardId,
      currentZone: 'draw',
      targetZone: 'draw',
      x: pos.x,
      y: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      animationProgress: 0,
      animationDuration: 0,
      animationElapsed: 0,
      visible: false,
      scale: 0.8,
      targetScale: 0.8,
    });
  }
  return cardPositions.get(cardId)!;
}

/**
 * Move a card to a new zone with animation
 * NOTE: All positions are center-based (tracker.x/y is the center point of the card)
 */
export function moveCardToZone(
  cardId: string,
  targetZone: CardZone,
  targetIndex: number = 0,
  options?: {
    duration?: number;
    startScale?: number;
    endScale?: number;
    instant?: boolean;
  },
): void {
  const tracker = getCardTracker(cardId);
  const duration = options?.instant ? 0 : (options?.duration ?? CARD_MOVEMENT_DURATION);

  // Get target position (center point)
  const targetPos = getZonePosition(targetZone, targetIndex);

  // Set target scale
  const targetScale = options?.endScale ?? (targetZone === 'hand' ? 1 : 0.8);

  // If instant, snap to position
  if (options?.instant) {
    tracker.currentZone = targetZone;
    tracker.targetZone = targetZone;
    tracker.x = targetPos.x;
    tracker.y = targetPos.y;
    tracker.targetX = targetPos.x;
    tracker.targetY = targetPos.y;
    tracker.scale = targetScale;
    tracker.targetScale = targetScale;
    tracker.animationProgress = 1;
    tracker.animationDuration = 0;
    tracker.animationElapsed = 0;
    tracker.visible = true;
    return;
  }

  // Start animation
  tracker.targetZone = targetZone;
  tracker.targetX = targetPos.x;
  tracker.targetY = targetPos.y;
  tracker.targetScale = targetScale;
  tracker.animationDuration = duration;
  tracker.animationElapsed = 0;
  tracker.animationProgress = 0;

  // Make visible when animating to hand or discard
  if (targetZone === 'hand' || targetZone === 'discard') {
    tracker.visible = true;
  }

  // Start from current position (animating state)
  if (tracker.currentZone !== 'animating') {
    tracker.currentZone = 'animating';
  }
}

/**
 * Update all card animations
 * Call this each frame with deltaTime in milliseconds
 */
export function updateCardAnimations(deltaTime: number): void {
  activeAnimationCount = 0;

  // Update shuffle animations first (special two-phase animation)
  if (shuffleInProgress) {
    updateShuffleAnimations(deltaTime);
    return; // Skip normal animation updates during shuffle
  }

  // Update draw animations (staggered card draws)
  if (drawInProgress) {
    updateDrawAnimations(deltaTime);
    // Continue with normal animations after draw animations
  }

  for (const tracker of cardPositions.values()) {
    // Skip if not animating
    if (tracker.currentZone !== 'animating') continue;

    // Update elapsed time
    tracker.animationElapsed += deltaTime;

    // Calculate progress (0 to 1)
    if (tracker.animationDuration > 0) {
      tracker.animationProgress = Math.min(tracker.animationElapsed / tracker.animationDuration, 1);
    } else {
      tracker.animationProgress = 1;
    }

    // Ease-out interpolation for smooth movement
    const t = tracker.animationProgress;
    const easeT = 1 - Math.pow(1 - t, 3); // Cubic ease-out

    // Lerp position
    tracker.x = tracker.x + (tracker.targetX - tracker.x) * LERP_EASE_OUT;
    tracker.y = tracker.y + (tracker.targetY - tracker.y) * LERP_EASE_OUT;

    // Lerp scale
    tracker.scale = tracker.scale + (tracker.targetScale - tracker.scale) * LERP_EASE_OUT;

    // Check if animation complete
    const distance = Math.abs(tracker.x - tracker.targetX) + Math.abs(tracker.y - tracker.targetY);
    const scaleDiff = Math.abs(tracker.scale - tracker.targetScale);

    if (tracker.animationProgress >= 1 && distance < 1 && scaleDiff < 0.01) {
      // Snap to final position
      tracker.x = tracker.targetX;
      tracker.y = tracker.targetY;
      tracker.scale = tracker.targetScale;
      tracker.currentZone = tracker.targetZone;
      tracker.animationProgress = 0;
      tracker.animationElapsed = 0;

      // Hide cards in draw pile
      if (tracker.targetZone === 'draw') {
        tracker.visible = false;
      }
    } else {
      activeAnimationCount++;
    }
  }
}

/**
 * Check if any card animations are currently running
 */
export function hasActiveCardAnimations(): boolean {
  return activeAnimationCount > 0;
}

/**
 * Get the number of currently animating cards
 */
export function getAnimatingCardCount(): number {
  return activeAnimationCount;
}

/**
 * Get all card trackers (for rendering)
 */
export function getAllCardTrackers(): CardPositionTracker[] {
  return Array.from(cardPositions.values());
}

/**
 * Get visible card trackers (for rendering)
 */
export function getVisibleCardTrackers(): CardPositionTracker[] {
  // Include cards in shuffle animation even if they don't have trackers yet
  if (shuffleInProgress) {
    // Ensure all shuffling cards have trackers and are visible
    for (const anim of shuffleAnimations) {
      const tracker = getCardTracker(anim.cardId);
      if (tracker && !tracker.visible) {
        tracker.visible = true;
      }
    }
  }
  return getAllCardTrackers().filter(t => t.visible);
}

/**
 * Initialize card positions for a new run
 * Sets all cards to draw pile position (hidden)
 */
export function initializeCardPositions(cardIds: string[]): void {
  // Clear existing positions
  cardPositions.clear();

  // Initialize each card in draw pile
  cardIds.forEach((cardId, index) => {
    const pos = getZonePosition('draw', index);
    cardPositions.set(cardId, {
      cardId,
      currentZone: 'draw',
      targetZone: 'draw',
      x: pos.x,
      y: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      animationProgress: 0,
      animationDuration: 0,
      animationElapsed: 0,
      visible: false,
      scale: 0.8,
      targetScale: 0.8,
    });
  });
}

// ============================================================================
// Draw Animation State (Staggered draw animations)
// ============================================================================

interface DrawAnimationState {
  cardId: string;
  handIndex: number;
  startTime: number;  // Delay before animation starts
  elapsed: number;
}

let drawAnimations: DrawAnimationState[] = [];
let drawInProgress = false;
const DRAW_STAGGER_DELAY = 80; // ms between each card starting to animate

/**
 * Animate cards from draw pile to hand with staggered timing
 * Cards fly from draw pile to their hand positions one after another
 */
export function animateDrawCards(cardIds: string[], handIndices: number[]): void {
  drawInProgress = true;
  
  // Calculate draw pile center position (using exact center for proper alignment)
  const drawCenterX = DRAW_PILE_X + DRAW_CARD_W / 2;
  const drawCenterY = DRAW_PILE_Y + DRAW_CARD_H / 2;
  
  // Setup animations with staggered start times
  drawAnimations = cardIds.map((cardId, i) => {
    const tracker = getCardTracker(cardId);
    const handIndex = handIndices[i] ?? i;
    
    // Set initial position to draw pile center
    tracker.currentZone = 'animating';
    tracker.targetZone = 'hand';
    tracker.x = drawCenterX;
    tracker.y = drawCenterY;
    tracker.visible = true;
    tracker.scale = 0.8;
    
    // Clear any existing target
    tracker.targetX = drawCenterX;
    tracker.targetY = drawCenterY;
    tracker.targetScale = 0.8;
    tracker.animationDuration = 0;
    tracker.animationElapsed = 0;
    tracker.animationProgress = 0;
    
    return {
      cardId,
      handIndex,
      startTime: i * DRAW_STAGGER_DELAY,
      elapsed: 0,
    };
  });
}

/**
 * Update draw animations with staggered timing
 * Called by updateCardAnimations
 */
function updateDrawAnimations(deltaTime: number): void {
  if (!drawInProgress || drawAnimations.length === 0) {
    drawInProgress = false;
    return;
  }
  
  let allComplete = true;
  
  for (const anim of drawAnimations) {
    anim.elapsed += deltaTime;
    
    // Skip if not yet time to start this card's animation
    if (anim.elapsed < anim.startTime) {
      allComplete = false;
      continue;
    }
    
    const tracker = getCardTracker(anim.cardId);
    if (!tracker) continue;
    
    // Get target hand position
    const targetPos = getZonePosition('hand', anim.handIndex);
    
    // Calculate progress for this card's animation
    const animElapsed = anim.elapsed - anim.startTime;
    const progress = Math.min(animElapsed / CARD_MOVEMENT_DURATION, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    
    // Lerp from draw pile center to hand position
    // Animation starts at center of draw pile
    const startX = DRAW_PILE_X + DRAW_CARD_W / 2;
    const startY = DRAW_PILE_Y + DRAW_CARD_H / 2;
    
    tracker.x = startX + (targetPos.x - startX) * easeProgress;
    tracker.y = startY + (targetPos.y - startY) * easeProgress;
    tracker.scale = 0.8 + (0.2 * easeProgress); // 0.8 -> 1.0
    
    if (progress < 1) {
      allComplete = false;
    } else {
      // Animation complete - snap to final position
      tracker.x = targetPos.x;
      tracker.y = targetPos.y;
      tracker.scale = 1;
      tracker.currentZone = 'hand';
      tracker.visible = true;
      
      // Reset card alpha to fully visible for the hand card
      setCardTargetAlpha(anim.cardId, 1);
    }
  }
  
  if (allComplete) {
    drawInProgress = false;
    drawAnimations = [];
  }
}

/**
 * Animate cards from hand to discard pile (playing cards)
 * Cards fly from their hand positions to the center of discard pile
 */
export function animatePlayCards(cardIds: string[], discardIndices: number[]): void {
  cardIds.forEach((cardId, i) => {
    const tracker = getCardTracker(cardId);
    
    // Animate to center of discard pile (not offset by index)
    const targetX = DISCARD_PILE_X + DISCARD_CARD_W / 2;
    const targetY = DISCARD_PILE_Y + DISCARD_CARD_H / 2;
    
    tracker.targetZone = 'discard';
    tracker.targetX = targetX;
    tracker.targetY = targetY;
    tracker.targetScale = 0.8;
    tracker.animationDuration = CARD_MOVEMENT_DURATION;
    tracker.animationElapsed = 0;
    tracker.animationProgress = 0;
    tracker.visible = true;
    
    if (tracker.currentZone !== 'animating') {
      tracker.currentZone = 'animating';
    }
  });
}

/**
 * Animate shuffle: discard pile cards fly to draw pile with scatter effect
 * Cards scatter outward then gather into the draw pile
 */
export function animateShuffle(cardIds: string[]): void {
  shuffleInProgress = true;
  shuffleAnimations = [];

  // Calculate draw pile center
  const drawCenterX = DRAW_PILE_X + DRAW_CARD_W / 2;
  const drawCenterY = DRAW_PILE_Y + DRAW_CARD_H / 2;

  // Calculate discard pile center (cards start here)
  const discardCenterX = DISCARD_PILE_X + DISCARD_CARD_W / 2;
  const discardCenterY = DISCARD_PILE_Y + DISCARD_CARD_H / 2;

  // Create scatter animation for each card
  cardIds.forEach((cardId, index) => {
    const tracker = getCardTracker(cardId);
    
    // Set up initial position - exactly at center of discard pile
    tracker.currentZone = 'animating';
    tracker.targetZone = 'draw';
    tracker.x = discardCenterX;
    tracker.y = discardCenterY;
    tracker.visible = true;
    tracker.scale = 0.8;
    
    // Calculate scatter position (explode outward from discard pile center)
    const angle = (Math.PI * 2 * index) / cardIds.length + Math.random() * 0.5;
    const scatterDistance = 50 + Math.random() * 80;
    const scatterX = discardCenterX + Math.cos(angle) * scatterDistance;
    const scatterY = discardCenterY + Math.sin(angle) * scatterDistance;
    
    // Calculate final position - exactly at center of draw pile
    const finalX = drawCenterX;
    const finalY = drawCenterY;
    
    shuffleAnimations.push({
      cardId,
      startX: discardCenterX,
      startY: discardCenterY,
      scatterX,
      scatterY,
      endX: finalX,
      endY: finalY,
      phase: 'scatter',
      elapsed: index * 30, // Stagger start times by 30ms
    });
  });
}

/**
 * Update shuffle animations
 * Called by updateCardAnimations to handle the two-phase scatter/gather
 */
function updateShuffleAnimations(deltaTime: number): void {
  if (!shuffleInProgress || shuffleAnimations.length === 0) return;
  
  let allComplete = true;
  
  for (const anim of shuffleAnimations) {
    anim.elapsed += deltaTime;
    
    const tracker = getCardTracker(anim.cardId);
    if (!tracker) continue;
    
    if (anim.phase === 'scatter') {
      // Phase 1: Scatter outward from discard pile
      const progress = Math.min(anim.elapsed / SHUFFLE_SCATTER_DURATION, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 2); // Ease out
      
      tracker.x = anim.startX + (anim.scatterX - anim.startX) * easeProgress;
      tracker.y = anim.startY + (anim.scatterY - anim.startY) * easeProgress;
      
      // Add slight rotation effect by wiggling
      const wiggle = Math.sin(progress * Math.PI * 4) * 5;
      tracker.x += wiggle;
      
      if (progress < 1) {
        allComplete = false;
      } else {
        anim.phase = 'gather';
        anim.elapsed = 0;
      }
    } else {
      // Phase 2: Gather into draw pile
      const gatherDuration = SHUFFLE_DURATION - SHUFFLE_SCATTER_DURATION;
      const progress = Math.min(anim.elapsed / gatherDuration, 1);
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress  // Ease in
        : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Ease out
      
      tracker.x = anim.scatterX + (anim.endX - anim.scatterX) * easeProgress;
      tracker.y = anim.scatterY + (anim.endY - anim.scatterY) * easeProgress;
      
      // Fade out as cards reach draw pile
      if (progress > 0.7) {
        tracker.visible = progress < 0.9; // Hide at end
      }
      
      if (progress < 1) {
        allComplete = false;
      } else {
        // Snap to final state
        tracker.x = anim.endX;
        tracker.y = anim.endY;
        tracker.currentZone = 'draw';
        tracker.visible = false;
      }
    }
  }
  
  if (allComplete) {
    shuffleInProgress = false;
    shuffleAnimations = [];
  }
}

/**
 * Reset all card positions (for scene transitions)
 */
export function resetCardPositions(): void {
  cardPositions.clear();
  activeAnimationCount = 0;
}

/**
 * Render a card back at a specific tracker position
 * Used for animating cards between zones
 * NOTE: tracker.x/y represents the CENTER of the card
 */
export function renderAnimatedCardBack(
  display: typeof MakkoEngine.display,
  tracker: CardPositionTracker,
  cardBackAsset: string,
): void {
  if (!tracker.visible) return;

  const asset = MakkoEngine.staticAsset(cardBackAsset);
  if (!asset) return;

  // Calculate scaled dimensions
  const baseWidth = DISCARD_CARD_W;
  const baseHeight = DISCARD_CARD_H;
  const drawWidth = baseWidth * tracker.scale;
  const drawHeight = baseHeight * tracker.scale;

  // tracker.x/y is the CENTER point, so offset by half dimensions
  const drawX = tracker.x - drawWidth / 2;
  const drawY = tracker.y - drawHeight / 2;

  // Calculate contain scaling for the cardback image
  const scaleX = drawWidth / asset.width;
  const scaleY = drawHeight / asset.height;
  const scale = Math.min(scaleX, scaleY);

  const imgWidth = asset.width * scale;
  const imgHeight = asset.height * scale;
  const imgX = drawX + (drawWidth - imgWidth) / 2;
  const imgY = drawY + (drawHeight - imgHeight) / 2;

  display.drawImage(asset.image, imgX, imgY, imgWidth, imgHeight);
}

/**
 * Sync card trackers with run state
 * Ensures all cards in deck, hand, and discard are tracked
 */
export function syncCardTrackers(deck: string[], hand: string[], discard: string[]): void {
  const allCardIds = new Set([...deck, ...hand, ...discard]);

  // Remove trackers for cards that no longer exist
  for (const [cardId, tracker] of cardPositions) {
    if (!allCardIds.has(cardId)) {
      cardPositions.delete(cardId);
    }
  }

  // Initialize missing trackers in their appropriate zones
  deck.forEach((cardId, index) => {
    if (!cardPositions.has(cardId)) {
      const pos = getZonePosition('draw', index);
      cardPositions.set(cardId, {
        cardId,
        currentZone: 'draw',
        targetZone: 'draw',
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        animationProgress: 0,
        animationDuration: 0,
        animationElapsed: 0,
        visible: false,
        scale: 0.8,
        targetScale: 0.8,
      });
    }
  });

  hand.forEach((cardId, index) => {
    if (!cardPositions.has(cardId)) {
      const pos = getZonePosition('hand', index);
      cardPositions.set(cardId, {
        cardId,
        currentZone: 'hand',
        targetZone: 'hand',
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        animationProgress: 0,
        animationDuration: 0,
        animationElapsed: 0,
        visible: true,
        scale: 1,
        targetScale: 1,
      });
      
      // Ensure hand cards have proper alpha (reset any stuck fade-outs)
      setCardTargetAlpha(cardId, 1);
    }
  });

  discard.forEach((cardId, index) => {
    if (!cardPositions.has(cardId)) {
      // Cards in discard are stacked but centered
      const pos = getZonePosition('discard', index);
      cardPositions.set(cardId, {
        cardId,
        currentZone: 'discard',
        targetZone: 'discard',
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        animationProgress: 0,
        animationDuration: 0,
        animationElapsed: 0,
        visible: true,
        scale: 0.8,
        targetScale: 0.8,
      });
    }
  });
}
