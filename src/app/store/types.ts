import { TacticCard } from '../../content/cards';
import { GameState } from '../../types/state';
import { DiveEvent } from '../../dive/diveReducer';
import { OpeningPathId } from '../../content/opening-paths';
import { SalvageTier } from '../../content/salvage';
import { ItemSlot } from '../../content/hardware';
import { CrewMemberId } from '../../content/crew';
import { ModuleId } from '../../content/modules';
import { AssignmentSlotId } from '../../content/crew-assignments';
import { IntroTerminalOutcome } from '../../content/intro-narrative';
import { TutorialPhase, DivePrepState } from '../../types/state';

export type AppAction =
  | { type: 'START_DIVE'; divePrep?: DivePrepState }
  | { type: 'DIVE_EVENT'; event: DiveEvent }
  | { type: 'RETURN_TO_HUB'; haulDecisions?: import('../../types/state').HaulDecision[]; auditResult?: import('../../types/state').AuditResult }
  | { type: 'CHOOSE_OPENING_PATH'; path: OpeningPathId }
  | { type: 'BUY_VOID_TIER'; tierId: string }
  | { type: 'SET_ACTIVE_REPAIR'; shipId: string | null }
  | { type: 'BUY_VOID_SHOP_CARD'; shopCardId: string }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'ADVANCE_TUTORIAL_PHASE'; phase: TutorialPhase }

  | { type: 'EQUIP_ITEM'; slot: ItemSlot; itemId: string }
  | { type: 'UNEQUIP_ITEM'; slot: ItemSlot }
  | { type: 'WAKE_CREW'; crewId: CrewMemberId }
  | { type: 'SEND_TO_CRYO'; crewId: CrewMemberId }

  | { type: 'UPGRADE_MODULE'; moduleId: ModuleId }
  | { type: 'ASSIGN_CREW'; crewId: CrewMemberId; slot: AssignmentSlotId }

  | { type: 'APPLY_INTRO_OUTCOME'; outcome: IntroTerminalOutcome }
  | { type: 'ASSIGN_CAPTAIN'; shipId: string; crewId: CrewMemberId }
  | { type: 'UNASSIGN_CAPTAIN'; shipId: string }
  | { type: 'BUY_MARKET_ITEM'; hardwareId: string }
  | { type: 'SET_DIVE_PREP_CREW'; crewId: CrewMemberId | null }
  | { type: 'SET_DIVE_PREP_SHIP'; shipId: string }
  | { type: 'SET_DIVE_PREP_HARDWARE'; slot: ItemSlot; itemId: string | null }
  | { type: 'REROLL_DIVE_PREP_HAND' }
  | { type: 'DIVE_PREP_SELECT_SHIP'; shipId: string }
  | { type: 'DIVE_PREP_SELECT_CREW'; crewId: CrewMemberId | null }
  | { type: 'DIVE_PREP_EQUIP_HARDWARE'; slot: ItemSlot; itemId: string | null }

  // Path-based expedition actions
  | { type: 'SELECT_NEXT_NODE'; nodeId: string }
  | { type: 'PICK_INTERSHIP_LOOT'; cardId: string | null }

  // Early debt payment during expeditions
  | { type: 'PAY_DEBT_EARLY'; amount: number };

export interface StoreSnapshot extends GameState {
  currentDraft: TacticCard[];
}
