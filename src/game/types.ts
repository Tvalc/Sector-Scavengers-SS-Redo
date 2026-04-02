/**
 * Game Types
 *
 * Core type definitions for the game system.
 */

export type StationScreen =
  | 'hub'
  | 'salvage-market'
  | 'research'
  | 'hardware'
  | 'cryo'
  | 'modules'
  | 'card-collection'
  | 'debt-cleared'
  | 'debt-contract'
  | 'crew'
  | 'ships'
  | 'dive-prep-expanded'
  | 'dive-prep-select-ship'
  | 'dive-prep-select-crew'
  | 'dive-prep-select-hardware'
  | 'lore'
  | 'ending'
  | 'void-shop'
  | 'void-communion';

export type RunScreen =
  | 'dive'
  | 'extracting'
  | 'result'
  | 'loot-node'
  | 'signal-node'
  | 'audit-node'
  | 'cache-node'
  | 'path-map'
  | 'intership-loot'
  | 'ship-shop'
  | 'post-ship-progress'
  | 'billing-forecast'
  | 'lore'
  | 'ending'
  | 'expedition-victory'
  | 'expedition-failed';

export type ScreenState = StationScreen | RunScreen;

export interface ToastState {
  text: string;
  expiry: number;
}

export interface LastRunInfo {
  run: import('../types/state').RunState | null;
  haulValue: number;
  echo: number;
}

export interface HubActionMap {
  action: import('../ui/hub/index').HubAction | null;
  tabClicked: import('../ui/hub/index').HubTab | null;
}
