import { MetaState } from '../../../types/state';
import { CrewMemberId } from '../../../content/crew';
import { ItemSlot } from '../../../content/hardware';

export type MetaHubAction =
  | { type: 'START_DIVE'; divePrep?: { selectedCrewId: CrewMemberId | null; selectedShipId: string | null; equippedForDive: Record<ItemSlot, string | null>; selectedCards: string[] } }
  | 'OPEN_CARD_COLLECTION' | 'OPEN_RESEARCH' | 'OPEN_MODULES' | 'OPEN_CREW'
  | 'OPEN_SHIPS' | 'OPEN_HARDWARE' | 'OPEN_DIVE_PREP_EXPANDED' | 'OPEN_VOID_SHOP'
  | 'OPEN_VOID_COMMUNION'
  | 'DIVE_PREP_SELECT_SHIP' | 'DIVE_PREP_SELECT_CREW' | 'DIVE_PREP_EQUIP_HARDWARE'
  | 'TOGGLE_COMMAND_DECK_BACKGROUND';

export interface LocalDivePrepState {
  selectedCrewId: CrewMemberId | null;
  selectedShipId: string | null;
  equippedForDive: Record<ItemSlot, string | null>;
  selectedCards: string[];
}

export interface ExpeditionErrorState {
  show: boolean;
  missing: ('ship' | 'crew' | 'hardware')[];
}

export interface ViewportRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NavButtonDef {
  label: string;
  action: MetaHubAction;
  y: number;
}
