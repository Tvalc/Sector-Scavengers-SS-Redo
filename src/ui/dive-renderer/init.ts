import {
  updateDiscardVisual, setDiscardCardBack, getRandomCardBack, resetDiscardVisual,
} from './state';
import { setDiscardChangedCallback } from './animation-bridge';

// Track last known discard count to detect 0→1 transition
let lastRenderDiscardCount = 0;

/**
 * Initialize the dive renderer callbacks.
 * Should be called once when entering the run scene.
 */
export function initDiveRenderer(): void {
  // Register discard change callback
  setDiscardChangedCallback((count: number) => {
    const now = Date.now();
    
    // If discard count went from 0 to >0, select a random cardback
    if (count > 0 && lastRenderDiscardCount === 0) {
      setDiscardCardBack(getRandomCardBack());
    }
    
    // Reset visual state if discard is cleared (reshuffle)
    if (count === 0) {
      resetDiscardVisual();
    }
    
    lastRenderDiscardCount = count;
    updateDiscardVisual(count, now);
  });
}
