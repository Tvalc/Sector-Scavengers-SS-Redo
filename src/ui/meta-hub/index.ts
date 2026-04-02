// Core types and state
export type { MetaHubAction, LocalDivePrepState, ExpeditionErrorState, ViewportRect } from './core/types';
export {
  getLocalDivePrep,
  setLocalDivePrep,
  getExpeditionError,
  setExpeditionError,
  clearExpeditionError,
  initializeDivePrep,
  ensureDivePrepInitialized,
  rerollStartingCards,
} from './core/state';

// Rendering
export { renderMetaHub } from './render';
export { renderCardPreviews } from './render/cards';
export { renderProgressOverlay, renderExpeditionErrorPanel } from './render/panels';
export { renderElectricitySpark } from './render/effects';

// Bounds for tutorial system
export { getMetaHubBounds } from './bounds';

// Re-export expedition validation for consumers
export { validateExpeditionReadiness } from './expedition-validation';
