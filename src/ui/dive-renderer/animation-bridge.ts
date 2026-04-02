/**
 * Animation Bridge - Pub/sub system for card draw events and discard changes
 * 
 * This bridge avoids circular imports between the game store (which triggers draws)
 * and the renderer (which handles card alpha animations). The store calls the callbacks,
 * and the renderer registers them.
 */

export type CardDrawnCallback = (cardId: string, slotIndex: number) => void;
export type DiscardChangedCallback = (count: number) => void;
export type CardPlayedCallback = (cardId: string, discardIndex: number) => void;
export type DeckShuffledCallback = (shuffledCardIds: string[]) => void;

let cardDrawnCallback: CardDrawnCallback | null = null;
let discardChangedCallback: DiscardChangedCallback | null = null;
let cardPlayedCallback: CardPlayedCallback | null = null;
let deckShuffledCallback: DeckShuffledCallback | null = null;

/**
 * Set the callback to be invoked when a card is drawn.
 * Called by the renderer to register itself.
 */
export function setCardDrawnCallback(cb: CardDrawnCallback | null): void {
  cardDrawnCallback = cb;
}

/**
 * Set the callback to be invoked when the discard pile changes.
 * Called by the renderer to register itself.
 */
export function setDiscardChangedCallback(cb: DiscardChangedCallback | null): void {
  discardChangedCallback = cb;
}

/**
 * Set the callback to be invoked when a card is played.
 * Called by the renderer to register itself.
 */
export function setCardPlayedCallback(cb: CardPlayedCallback | null): void {
  cardPlayedCallback = cb;
}

/**
 * Set the callback to be invoked when the deck is shuffled.
 * Called by the renderer to register itself.
 */
export function setDeckShuffledCallback(cb: DeckShuffledCallback | null): void {
  deckShuffledCallback = cb;
}

/**
 * Invoke the registered callback when a card is drawn.
 * Called by the game store after drawing cards.
 */
export function onCardDrawn(cardId: string, slotIndex: number): void {
  if (cardDrawnCallback) {
    cardDrawnCallback(cardId, slotIndex);
  }
}

/**
 * Invoke the registered callback when the discard pile changes.
 * Called by the game store after modifying discard pile.
 */
export function onDiscardChanged(count: number): void {
  if (discardChangedCallback) {
    discardChangedCallback(count);
  }
}

/**
 * Invoke the registered callback when a card is played.
 * Called by the game store when a card is moved to discard.
 */
export function onCardPlayed(cardId: string, discardIndex: number): void {
  if (cardPlayedCallback) {
    cardPlayedCallback(cardId, discardIndex);
  }
}

/**
 * Invoke the registered callback when the deck is shuffled.
 * Called by the game store when discard is shuffled into draw pile.
 */
export function onDeckShuffled(shuffledCardIds: string[]): void {
  if (deckShuffledCallback) {
    deckShuffledCallback(shuffledCardIds);
  }
}
