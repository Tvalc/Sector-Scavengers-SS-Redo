import { MakkoEngine } from '@makko/engine';
import { RunState, MetaState } from '../../types/state';
import { TacticCard } from '../../content/cards';
import { setBounds } from '../tutorial-bounds';
import { setCardPlayedCallback, setDeckShuffledCallback, setCardDrawnCallback } from './animation-bridge';

import { DiveAction, TutorialCardInteraction } from './types';
import { MINIMAP_X, MINIMAP_Y, MINIMAP_W, CARD_PANEL_X, ROOM_X, ROOM_Y, ROOM_W, ROOM_H } from './constants';
import {
  isLogOverlayVisible, toggleLogOverlay, closeLogOverlay,
  isStatusOverlayVisible, closeStatusOverlay,
  updateDiscardVisual, setDiscardCardBack, getRandomCardBack, resetDiscardVisual,
  updateDrawVisual, resetDrawVisual,
  updateCardAlphas, fadeOutCard,
} from './state';
import { renderDiscoveryPopup, isDiscoveryPopupVisible, dismissDiscoveryPopup } from './discovery-popup';
import { isCardLocked } from './helpers';
import { renderRoom } from './room';
import { renderMinimapAt } from './minimap';
import { renderLogOverlay } from './log';
import { renderStatusOverlay } from './status-overlay';
import {
  renderDoctrineLean,
  renderDeckEmptyWarning,
  renderDebtBar,
  renderDeckBeamPad,
  renderDiscardPile,
  renderBottomRightHud,
  handleDiscardPileClick,
  renderDiscardPileOverlay,
  closeDiscardPile,
  isDiscardPileVisible,
  renderDrawPile,
  handleDrawPileClick,
  renderDrawPileOverlay,
  closeDrawPile,
  isDrawPileVisible,
} from './hud/index';
import { renderCardPanel } from './cards';
export { registerCardDrawAnimationHandler } from './cards';
import { animatePlayCards, animateShuffle, animateDrawCards, updateCardAnimations, getVisibleCardTrackers, renderAnimatedCardBack, syncCardTrackers, resetCardPositions } from './deck-animation';

// Re-export dive renderer initialization
export { initDiveRenderer } from './init';

// Re-export types and helpers for consumers
export type { DiveAction, TutorialCardInteraction };
export { isCardLocked, toggleLogOverlay, closeLogOverlay, isLogOverlayVisible, isStatusOverlayVisible, closeStatusOverlay };
// Re-export discovery popup for card effects
export { showDiscoveryPopup, triggerSalvageDiscovery, isDiscoveryPopupVisible, dismissDiscoveryPopup } from './discovery-popup';

interface DiveRenderResult {
  action: DiveAction | null;
  forkChoice: 'left' | 'right' | null;
}

// Track last known discard count to detect 0→1 transition
let lastRenderDiscardCount = 0;

// Track last frame time for deltaTime calculation
let lastFrameTime = 0;

// Track pending cards to animate to discard
let pendingDiscardAnimations: Array<{ cardId: string; discardIndex: number }> = [];

// Track pending shuffle animation
let pendingShuffleAnimation: string[] | null = null;

// Track pending draw animations
let pendingDrawAnimations: Array<{ cardId: string; slotIndex: number }> = [];

// Register card played callback
setCardPlayedCallback((cardId: string, discardIndex: number) => {
  pendingDiscardAnimations.push({ cardId, discardIndex });
});

// Register deck shuffled callback
setDeckShuffledCallback((shuffledCardIds: string[]) => {
  pendingShuffleAnimation = shuffledCardIds;
});

// Register card drawn callback
setCardDrawnCallback((cardId: string, slotIndex: number) => {
  pendingDrawAnimations.push({ cardId, slotIndex });
});

/**
 * Render the dive UI with room-based design.
 * Each round is a distinct room with its own background/environment.
 */
export function renderDive(
  run: RunState,
  draft: TacticCard[],
  log: string[],
  mx: number,
  my: number,
  lockedCardId?: string,
  isTutorialLocked?: boolean,
  now: number = Date.now(),
  isTutorialActive: boolean = false,
  meta?: MetaState,
): DiveRenderResult {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  const hudAlpha = isTutorialLocked ? 0.6 : 1;

  // Sync card trackers with current run state
  syncCardTrackers(run.deck, run.hand, run.discardPile);

  // Calculate deltaTime for animations
  const deltaTime = lastFrameTime > 0 ? now - lastFrameTime : 16;
  lastFrameTime = now;

  // Update card alpha animations each frame
  updateCardAlphas(deltaTime);

  // Process pending shuffle animation
  if (pendingShuffleAnimation) {
    animateShuffle(pendingShuffleAnimation);
    pendingShuffleAnimation = null;
  }

  // Process pending draw animations (staggered from draw pile to hand)
  if (pendingDrawAnimations.length > 0) {
    const cardIds = pendingDrawAnimations.map(a => a.cardId);
    const slotIndices = pendingDrawAnimations.map(a => a.slotIndex);
    animateDrawCards(cardIds, slotIndices);
    pendingDrawAnimations = [];
  }

  // Process pending discard animations
  if (pendingDiscardAnimations.length > 0) {
    const cardIds = pendingDiscardAnimations.map(a => a.cardId);
    const discardIndices = pendingDiscardAnimations.map(a => a.discardIndex);
    animatePlayCards(cardIds, discardIndices);
    
    // Fade out cards from hand
    for (const anim of pendingDiscardAnimations) {
      fadeOutCard(anim.cardId);
    }
    
    pendingDiscardAnimations = [];
  }

  // Update card position animations
  updateCardAnimations(deltaTime);

  let forkChoice: 'left' | 'right' | null = null;

  // ── Current Room (main view, 90% of screen) ───────────────────────────────
  renderRoom(display, run);

  // ── Card Panel ───────────────────────────────────────────────────────────
  // Rendered early so card alphas are updated, but actual rendering happens later
  // (Card panel handles its own rendering after state updates)

  // ── Doctrine Lean Indicator ───────────────────────────────────────────────
  renderDoctrineLean(display, run, now, ROOM_Y + 90);

  // ── Deck Empty Warning ───────────────────────────────────────────────────
  renderDeckEmptyWarning(display, run);

  // ── Main HUD removed - now in bottom right ─────────────────────────────
  // Status and Log buttons moved to bottom right HUD
  let logOpenedThisFrame = false;

  // ── Bottom Right HUD (ship progress, status, deck zones) ─────────────────
  let hudAction: DiveAction | null = null;
  if (meta) {
    const runPath = meta.activeRunPath ?? null;
    const { logClicked, action } = renderBottomRightHud(display, input, run, runPath, hudAlpha);
    if (logClicked) {
      logOpenedThisFrame = isLogOverlayVisible();
    }
    hudAction = action;
  }

  // ── Debt / Billing Bar ──────────────────────────────────────────────────
  if (meta) {
    const runPath = meta.activeRunPath ?? null;
    renderDebtBar(display, run, meta, hudAlpha, runPath);
  }

  // ── Minimap (bottom-left, larger, aligned with card panel height) ─
  const minimapResult = renderMinimapAt(display, input, run, mx, my, now, MINIMAP_X, MINIMAP_Y);
  forkChoice = minimapResult.forkChoice;

  // ── Card Panel ───────────────────────────────────────────────────────────
  const clicked = renderCardPanel(display, input, draft, {
    mx, my, lockedCardId, isTutorialLocked, now,
    currentEnergy: run.energy,
    reserveBurnAvailable: run.energy >= run.maxEnergy && run.reserveBurnAvailable,
    maxEnergy: run.maxEnergy,
  });

  // ── Animating Cards (flying between zones) ─────────────────────────────────
  // Render cards that are currently animating between zones
  const animatingCards = getVisibleCardTrackers();
  for (const tracker of animatingCards) {
    if (tracker.currentZone === 'animating' || tracker.targetZone === 'discard') {
      // Use a random card back for the animation
      const cardBackAsset = getRandomCardBack();
      renderAnimatedCardBack(display, tracker, cardBackAsset);
    }
  }

  // Deck counters removed - draw/discard piles show counts via badges

  // ── Deck Beam Pad ───────────────────────────────────────────────────────
  // Idle teleport beam effect at deck position
  renderDeckBeamPad(display, run, now);

  // ── Visual Draw Pile ────────────────────────────────────────────────────
  // Render draw pile with stacked cardbacks
  renderDrawPile(display, run, now);

  // ── Visual Discard Pile ─────────────────────────────────────────────────
  // Update discard visual state and render
  updateDiscardVisual(run.discardPile.length, now);
  lastRenderDiscardCount = run.discardPile.length;
  renderDiscardPile(display, run, now);

  // ── Draw Pile Overlay ────────────────────────────────────────────────────
  if (isDrawPileVisible()) {
    renderDrawPileOverlay(display, run);
    
    // Close on click outside or ESC
    const clickedOutside = input.isMouseReleased(0) && !handleDrawPileClick(mx, my);
    const pressedEsc = input.isKeyPressed('Escape');
    if (clickedOutside || pressedEsc) {
      closeDrawPile();
    }
  }

  // ── Discard Pile Overlay ─────────────────────────────────────────────────
  if (isDiscardPileVisible()) {
    renderDiscardPileOverlay(display, run);
    
    // Close on click outside or ESC
    const clickedOutsideDiscard = input.isMouseReleased(0) && !handleDiscardPileClick(mx, my);
    const pressedEscDiscard = input.isKeyPressed('Escape');
    if (clickedOutsideDiscard || pressedEscDiscard) {
      closeDiscardPile();
    }
  }

  // Handle draw pile click to open
  if (input.isMouseReleased(0)) {
    handleDrawPileClick(mx, my);
  }
  // Handle discard pile click to open
  if (input.isMouseReleased(0)) {
    handleDiscardPileClick(mx, my);
  }

  // ── Log Overlay ───────────────────────────────────────────────────────────
  if (isLogOverlayVisible()) {
    renderLogOverlay(display, input, mx, my, log);

    const clickedOutside = !logOpenedThisFrame && input.isMouseReleased(0);
    const pressedEsc = input.isKeyPressed('Escape');

    if (clickedOutside || pressedEsc) {
      closeLogOverlay();
    }
  }

  // ── Status Overlay ─────────────────────────────────────────────────────
  if (isStatusOverlayVisible() && meta) {
    renderStatusOverlay(display, run, meta);

    const pressedEsc = input.isKeyPressed('Escape');
    if (pressedEsc) {
      closeStatusOverlay();
    }
  }

  // ── Discovery Popup ──────────────────────────────────────────────────────
  // Rendered last so it appears on top of all other UI
  if (isDiscoveryPopupVisible()) {
    const popupBlockedInteraction = renderDiscoveryPopup(mx, my);

    // If popup is visible, block other interactions
    if (popupBlockedInteraction) {
      return { action: null, forkChoice: null };
    }
  }

  // HUD actions take priority over card clicks
  const finalAction = hudAction || clicked;
  
  return { action: finalAction, forkChoice };
}

/**
 * Reset the dive renderer state for a new run.
 */
export function resetDiveRenderer(): void {
  lastFrameTime = 0;
  resetDrawVisual();
  resetDiscardVisual();
  resetCardPositions();
  pendingDiscardAnimations = [];
  pendingShuffleAnimation = null;
  pendingDrawAnimations = [];
}
