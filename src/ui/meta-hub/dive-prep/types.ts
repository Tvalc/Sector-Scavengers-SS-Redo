// Dive Preparation Action Types

import type { CrewMemberId } from '../../../content/crew';
import type { ItemSlot } from '../../../content/hardware';

export type DivePrepAction =
  | { type: 'SELECT_CREW'; crewId: CrewMemberId }
  | { type: 'SELECT_SHIP'; shipId: string }
  | { type: 'EQUIP_HARDWARE'; slot: ItemSlot; itemId: string | null }
  | { type: 'REROLL_HAND' }
  | { type: 'EXPAND_DIVE_PREP' };
