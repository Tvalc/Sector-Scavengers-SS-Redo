import { RunState } from '../../types/state';
import { addCardToDiscard } from '../deck-manager';
import { getDoctrine, DOCTRINE_CARD_UNLOCKS } from '../../content/doctrine';
import { onDiscardChanged, onCardPlayed, onCardDrawn } from '../../ui/dive-renderer/animation-bridge';

/**
 * Handle post-card effects in multi-card system:
 * - Track doctrine points
  * - Check for signature card unlock
  * - Check for loot node triggers
  * - Trigger animations
  * 
  * Note: In multi-card system, hand management is handled by PLAY_CARD and NEXT_ROUND.
  * This function only handles tracking and triggers.
  */
export function handlePostCardEffects(run: RunState, cardId: string): RunState {
  // If run ended (extracted/collapsed), skip effects
  if (run.phase !== 'active') {
    return run;
  }

  // Trigger animation for the played card
  const discardStartIndex = run.discardPile.length - 1;
  onCardPlayed(cardId, Math.max(0, discardStartIndex));
  
  // Notify renderer of discard pile change
  onDiscardChanged(run.discardPile.length);

  // Trigger beam-in animation for newly drawn card (last in hand)
  if (run.hand.length > 0) {
    const lastCard = run.hand[run.hand.length - 1];
    onCardDrawn(lastCard, run.hand.length - 1);
  }

  // Track doctrine points for this run
  let doctrineRunPoints = { ...run.doctrineRunPoints };
  let doctrineCardAddedThisRun = run.doctrineCardAddedThisRun;
  let newDiscardPile = run.discardPile;
  
  const doctrine = getDoctrine(cardId);
  if (doctrine !== null) {
    doctrineRunPoints[doctrine]++;

    // Check for signature card unlock (5 points, not already added)
    if (doctrineRunPoints[doctrine] >= 5 && !doctrineCardAddedThisRun) {
      newDiscardPile = addCardToDiscard(newDiscardPile, DOCTRINE_CARD_UNLOCKS[doctrine]);
      doctrineCardAddedThisRun = true;
      // Notify renderer of discard pile change (signature card added)
      onDiscardChanged(newDiscardPile.length);
    }
  }

  // Check for loot node trigger (rounds 4, 7, 10) - only trigger once per round
  let lootNodePending = run.lootNodePending;
  let lootNodeRound = run.lootNodeRound;
  const nextRound = run.round + 1;
  
  if ((nextRound === 4 || nextRound === 7 || nextRound === 10) && !lootNodePending) {
    lootNodePending = true;
    lootNodeRound = run.round;
  }

  // Handle forced discard from crew_panic (rare card effect)
  let forcedDiscard = run.forcedDiscard;
  let updatedHand = run.hand;
  if (forcedDiscard && run.hand.length > 1) {
    const discardIdx = Math.floor(Math.random() * run.hand.length);
    const discardedCard = run.hand[discardIdx];
    updatedHand = run.hand.filter((_, i) => i !== discardIdx);
    newDiscardPile = addCardToDiscard(newDiscardPile, discardedCard);
    forcedDiscard = false;
  }

  return {
    ...run,
    discardPile: newDiscardPile,
    hand: updatedHand,
    doctrineRunPoints,
    doctrineCardAddedThisRun,
    forcedDiscard,
    lootNodePending,
    lootNodeRound,
  };
}
