/**
 * TutorialContext - Tracks what UI element the tutorial expects the player to interact with.
 * Used to lock/unlock specific UI elements during guided tutorial flow.
 */

import type { HubHighlight } from '../content/tutorial-dialogue';

/**
 * Discriminated union representing possible tutorial interactions.
 * The tutorial system uses this to track what the player must click next.
 */
export type TutorialInteraction =
  | { type: 'hub-btn'; id: 'start-dive' | 'recharge' | 'scrap' | 'salvage' }
  | { type: 'hub-tab'; id: 'overview' | 'crew' | 'secondary' }
  | { type: 'dive-card'; id: string }
  | { type: 'next-btn' }
  | { type: 'route-toggle' }
  | { type: 'panel-action'; id: 'sell' | 'pay-debt' | 'buy-void' | 'equip' | 'wake' | 'upgrade' | 'focus-ship' }
  | { type: 'open-panel'; id: 'void-communion' | 'hardware' | 'cryo' | 'modules' }
  | null;

/**
 * Converts a HubHighlight string to the corresponding TutorialInteraction type.
 * Maps highlight IDs from tutorial-dialogue.ts to structured interaction objects.
 */
export function highlightToInteraction(highlight: HubHighlight): TutorialInteraction {
  if (highlight === null) return null;

  // Hub buttons
  if (highlight === 'start-dive-btn') {
    return { type: 'hub-btn', id: 'start-dive' };
  }
  if (highlight === 'recharge-btn') {
    return { type: 'hub-btn', id: 'recharge' };
  }
  if (highlight === 'scrap-btn') {
    return { type: 'hub-btn', id: 'scrap' };
  }
  if (highlight === 'salvage-btn') {
    return { type: 'hub-btn', id: 'salvage' };
  }

  // Hub tabs
  if (highlight === 'tab-overview') {
    return { type: 'hub-tab', id: 'overview' };
  }
  if (highlight === 'tab-crew') {
    return { type: 'hub-tab', id: 'crew' };
  }
  if (highlight === 'tab-secondary') {
    return { type: 'hub-tab', id: 'secondary' };
  }

  // Dive cards - map highlight to card interaction
  if (highlight === 'card-scavenge') {
    return { type: 'dive-card', id: 'scavenge' };
  }
  if (highlight === 'card-repair') {
    return { type: 'dive-card', id: 'repair' };
  }
  if (highlight === 'card-extract') {
    return { type: 'dive-card', id: 'extract' };
  }

  // Display highlights (hull, rounds, bill, route-map) don't have direct interactions
  // They are informational only, so return null
  if (highlight === 'hull-display' || highlight === 'rounds-display' || highlight === 'bill-countdown' || highlight === 'route-map') {
    return null;
  }

  // Route toggle button
  if (highlight === 'route-toggle-btn') {
    return { type: 'route-toggle' };
  }

  // Panel-specific highlights mapped to panel-action interactions
  if (highlight === 'salvage-sell-btn') {
    return { type: 'panel-action', id: 'sell' };
  }
  if (highlight === 'salvage-pay-debt') {
    return { type: 'panel-action', id: 'pay-debt' };
  }
  if (highlight === 'void-shop') {
    return { type: 'panel-action', id: 'buy-void' };
  }
  if (highlight === 'hw-equip-btn') {
    return { type: 'panel-action', id: 'equip' };
  }
  if (highlight === 'cryo-wake-btn') {
    return { type: 'panel-action', id: 'wake' };
  }
  if (highlight === 'modules-upgrade-btn') {
    return { type: 'panel-action', id: 'upgrade' };
  }
  if (highlight === 'ship-focus-btn') {
    return { type: 'panel-action', id: 'focus-ship' };
  }

  // Sub-panel navigation highlights (secondary tab buttons)
  if (highlight === 'void-communion-nav') {
    return { type: 'open-panel', id: 'void-communion' };
  }
  if (highlight === 'hardware-nav') {
    return { type: 'open-panel', id: 'hardware' };
  }
  if (highlight === 'cryo-nav') {
    return { type: 'open-panel', id: 'cryo' };
  }
  if (highlight === 'modules-nav') {
    return { type: 'open-panel', id: 'modules' };
  }

  // Default fallback
  return null;
}

/**
 * Context class that tracks the current tutorial state and expected interaction.
 * Used by UI renderers to determine which elements should be interactive.
 */
export class TutorialContext {
  /** The UI element the player is expected to interact with next */
  expectedInteraction: TutorialInteraction | null = null;

  /** Whether the UI should be locked to only the expected element */
  isLocked: boolean = false;

  /** Current index within the tutorial dialogue entries for this step */
  currentEntryIndex: number = 0;

  constructor(initialStep: number = 1, initialEntryIndex: number = 0) {
    this.currentEntryIndex = initialEntryIndex;
    // Note: expectedInteraction and isLocked are initially null/false
    // They should be set via setExpectedInteraction when tutorial entry is loaded
  }

  /**
   * Sets what interaction the tutorial is waiting for and whether to lock the UI.
   * @param interaction - The expected interaction, or null if any interaction is allowed
   * @param locked - Whether to lock the UI to only allow the expected interaction
   */
  setExpectedInteraction(interaction: TutorialInteraction | null, locked: boolean): void {
    this.expectedInteraction = interaction;
    this.isLocked = locked;
  }

  /**
   * Checks if the actual interaction matches what the tutorial expects.
   * @param actual - The interaction the player actually performed
   * @returns true if the interaction matches the expected one (or if no specific interaction is expected)
   */
  checkInteraction(actual: TutorialInteraction): boolean {
    // If no specific interaction is expected, any interaction is valid
    if (this.expectedInteraction === null) {
      return true;
    }

    // If actual is null but we expect something, it's not a match
    if (actual === null) {
      return false;
    }

    // Compare the interaction types and IDs
    const expected = this.expectedInteraction;

    if (expected.type !== actual.type) {
      return false;
    }

    // Type is the same, now compare IDs
    switch (expected.type) {
      case 'hub-btn':
        return expected.id === (actual as { type: 'hub-btn'; id: string }).id;
      case 'hub-tab':
        return expected.id === (actual as { type: 'hub-tab'; id: string }).id;
      case 'dive-card':
        return expected.id === (actual as { type: 'dive-card'; id: string }).id;
      case 'next-btn':
        return true; // next-btn is always just the type check
      case 'route-toggle':
        return true; // route-toggle is always just the type check
      case 'panel-action':
        return expected.id === (actual as { type: 'panel-action'; id: string }).id;
      case 'open-panel':
        return expected.id === (actual as { type: 'open-panel'; id: string }).id;
      default:
        return false;
    }
  }

  /**
   * Determines if a specific element can be interacted with given the current tutorial state.
   * @param element - The element to check for interactability
   * @returns true if the element is the expected one OR if the UI is not locked
   */
  canInteractWith(element: TutorialInteraction): boolean {
    // If not locked, any element can be interacted with
    if (!this.isLocked) {
      return true;
    }

    // If locked, only the expected element can be interacted with
    return this.checkInteraction(element);
  }

  /**
   * Advances to the next dialogue entry.
   * @returns The new entry index
   */
  advanceEntry(): number {
    this.currentEntryIndex++;
    return this.currentEntryIndex;
  }

  /**
   * Resets the context to initial state.
   */
  reset(): void {
    this.expectedInteraction = null;
    this.isLocked = false;
    this.currentEntryIndex = 0;
  }
}
