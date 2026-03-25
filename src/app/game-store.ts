/**
 * Public re-export barrel.
 * All implementation has moved to src/app/store/.
 * Existing imports from '../app/game-store' continue to work unchanged.
 */
export type { AppAction, StoreSnapshot } from './store/types';
export { GameStore } from './store/game-store';
