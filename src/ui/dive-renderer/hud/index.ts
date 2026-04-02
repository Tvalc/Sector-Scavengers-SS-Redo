/**
 * HUD Module - Dive Renderer
 * 
 * Exports all HUD-related rendering functions organized by domain:
 * - Piles: Draw and discard pile visualization
 * - Top Bar: Zone/round, buttons, hull, shield, salvage
 * - Bottom Right: Ship progress, status, energy
 * - Debt/Energy: Debt bar and energy pips
 * - Path Status: Expedition progress bar
 * - Doctrine: Faction alignment indicator
 * - Deck Effects: Beam pad and empty warnings
 */

// Piles
export {
  renderDrawPile,
  handleDrawPileClick,
  renderDrawPileOverlay,
  closeDrawPile,
  isDrawPileVisible,
} from './pile-draw';

export {
  renderDiscardPile,
  handleDiscardPileClick,
  renderDiscardPileOverlay,
  closeDiscardPile,
  isDiscardPileVisible,
} from './pile-discard';

// HUD Sections
export {
  renderBottomRightHud,
  type BottomRightHudResult,
} from './hud-bottom-right';

export {
  renderTopBarHud,
} from './hud-top-bar';

export {
  renderDebtBar,
} from './hud-debt';

export {
  renderEnergyBar,
} from './hud-energy';

export {
  renderPathStatusBar,
} from './hud-path-status';

export {
  renderDoctrineLean,
} from './hud-doctrine';

export {
  renderDeckBeamPad,
  renderDeckEmptyWarning,
} from './hud-deck-effects';
