import { ShipPanelAction } from '../ship-panel';

// HubTab nomenclature after reorganization:
// - 'overview'   = Status tab (debt, credits, ship status, card unlocks)
// - 'crew-modules' = Crew tab (crew assignment and modules)
// - 'secondary'  = Ships tab (ship hardware and configuration)
// Note: The left column is now the "Actions" tab panel (Start Dive, etc.)
export type HubTab = 'overview' | 'crew-modules' | 'secondary';

export type HubAction =
  | 'START_DIVE'
  | 'SCRAP_JOB'
  | 'OPEN_VOID_COMMUNION'
  | 'OPEN_SALVAGE_MARKET'
  | 'OPEN_HARDWARE'
  | 'OPEN_CRYO'
  | 'OPEN_MODULES'
  | 'OPEN_CARD_COLLECTION'
  | ShipPanelAction;
