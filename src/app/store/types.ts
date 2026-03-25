import { TacticCard } from '../../content/cards';
import { GameState } from '../../types/state';
import { DiveEvent } from '../../dive/diveReducer';
import { OpeningPathId } from '../../content/opening-paths';
import { SalvageTier } from '../../content/salvage';
import { ItemSlot } from '../../content/hardware';
import { CrewMemberId } from '../../content/crew';
import { ModuleId } from '../../content/modules';
import { AssignmentSlotId } from '../../content/crew-assignments';

export type AppAction =
  | { type: 'START_DIVE' }
  | { type: 'DIVE_EVENT'; event: DiveEvent }
  | { type: 'RECHARGE_ENERGY' }
  | { type: 'RETURN_TO_HUB' }
  | { type: 'CHOOSE_OPENING_PATH'; path: OpeningPathId }
  | { type: 'BUY_VOID_TIER'; tierId: string }
  | { type: 'SET_ACTIVE_REPAIR'; shipId: string | null }
  | { type: 'BUY_VOID_SHOP_CARD'; shopCardId: string }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'ADVANCE_TUTORIAL_STEP' }
  | { type: 'SELL_SALVAGE'; tier: SalvageTier }
  | { type: 'SELL_ALL_LOW_TIER' }
  | { type: 'PAY_DEBT'; amount: number }
  | { type: 'EQUIP_ITEM'; slot: ItemSlot; itemId: string }
  | { type: 'UNEQUIP_ITEM'; slot: ItemSlot }
  | { type: 'WAKE_CREW'; crewId: CrewMemberId }
  | { type: 'SEND_TO_CRYO'; crewId: CrewMemberId }
  | { type: 'GAIN_POWER_CELLS'; amount: number }
  | { type: 'UPGRADE_MODULE'; moduleId: ModuleId }
  | { type: 'ASSIGN_CREW'; crewId: CrewMemberId; slot: AssignmentSlotId }
  | { type: 'RECHARGE_ENERGY_EMERGENCY' };

export interface StoreSnapshot extends GameState {
  currentDraft: TacticCard[];
}
