import type { DoctrineId } from '../content/doctrine';
import type { CrewMemberId } from '../content/crew';
import type { ShipStatus } from '../content/ships';
import { SHIP_DEFS } from '../content/ships';
import type { SalvageEntry } from '../content/salvage';
import type { ItemSlot } from '../content/hardware';
import type { ModuleId } from '../content/modules';
import type { AssignmentSlotId } from '../content/crew-assignments';
import type { SalvageRewardBand, VoidRewardBand, SurvivorsSaved, ShipStateStart } from '../content/intro-narrative';

export interface BillingResult {
  paid: boolean;
  amount: number;
  penaltyAdded: number;
}

export interface ShipRecord {
  id: string;
  status: ShipStatus;
  repairProgress: number;
}

export interface RunState {
  round: number;
  maxRounds: number;
  hull: number;
  runCredits: number;
  phase: 'active' | 'extracted' | 'collapsed';
  shieldCharges: number;
  analyzed: boolean;
  debtIncrease: number;
  voidEchoGain: number;
  ancestorMemoryActive: boolean;
  deathDefianceActive: boolean;
  /** Salvage collected this run. Merged into hubInventory on extract; lost on collapse. */
  salvage: SalvageEntry[];
  /** Hardware item ids discovered this run. Added to itemInventory on extract; lost on collapse. */
  itemsFound: string[];
  /** Power cells gained this run (from scavenge chance). Added to powerCells on extract. */
  powerCellsGained: number;
}

export interface MetaState {
  energy: number;
  credits: number;
  voidEcho: number;
  debt: number;
  unlockedCards: string[];
  totalRuns: number;
  totalExtracts: number;
  openingPathChosen: false | 'cold_extract' | 'cut_and_run' | 'duty_claim';
  purchasedVoidTiers: string[];
  extractionBonus: number;
  doctrinePoints: Record<DoctrineId, number>;
  doctrineLocked: DoctrineId | null;
  totalCollapses: number;
  leadId: CrewMemberId | null;
  companionIds: CrewMemberId[];
  ships: ShipRecord[];
  activeRepairShipId: string | null;
  billingCycleRuns: number;
  billingAmount: number;
  billingRunsUntilNext: number;
  lastBillingResult: BillingResult | null;
  purchasedVoidShopCards: string[];
  tutorialCompleted: boolean;
  /** 0 = not started, 1–5 = in progress, 6+ = done */
  tutorialStep: number;
  /** Persistent salvage stash held at the hub between runs. */
  hubInventory: SalvageEntry[];
  /** Currently equipped hardware item id per slot (null = empty). */
  equippedItems: Record<ItemSlot, string | null>;
  /** Hardware items in hub storage (not equipped). Array of item ids. */
  itemInventory: string[];
  /** Crew members currently in cryo stasis (available to wake). */
  cryoPool: CrewMemberId[];
  /** Consumable resource used to wake crew from cryo. */
  powerCells: number;
  /** Extra billing debt pressure added per awake crew member per billing cycle. */
  upkeepPerAwakeCrew: number;
  /** Current upgrade level for each station module (0 = not built). */
  moduleLevels: Record<ModuleId, number>;
  /** Job slot assigned to each awake crew member (omitted = idle). */
  crewAssignments: Partial<Record<CrewMemberId, AssignmentSlotId>>;
  /** Whether the zero-cost scrap job action is available (reset to true after each run). */
  scrapJobAvailable: boolean;
  /** Narrative outcome fields from intro sequence */
  survivorsSaved: SurvivorsSaved;
  shipStateStart: ShipStateStart;
  awakenedCrew: string[];
  introTranscriptTag: string;
  salvageRewardBand: SalvageRewardBand;
  voidRewardBand: VoidRewardBand;
}

export interface GameState {
  meta: MetaState;
  currentRun: RunState | null;
  saveVersion: 3;
}

export function createEmptyGame(): GameState {
  return {
    meta: {
      energy: 3,
      credits: 500,
      voidEcho: 0,
      debt: 8000,
      unlockedCards: ['scavenge', 'repair', 'extract'],
      totalRuns: 0,
      totalExtracts: 0,
      openingPathChosen: false,
      purchasedVoidTiers: [],
      extractionBonus: 0,
      doctrinePoints: { corporate: 0, cooperative: 0, smuggler: 0 },
      doctrineLocked: null,
      totalCollapses: 0,
      leadId: null,
      companionIds: [],
      ships: SHIP_DEFS.map((def) => ({
        id: def.id,
        status: 'derelict',
        repairProgress: 0,
      })),
      activeRepairShipId: null,
      billingCycleRuns: 3,
      billingAmount: 500,
      billingRunsUntilNext: 3,
      lastBillingResult: null,
      purchasedVoidShopCards: [],
      tutorialCompleted: false,
      tutorialStep: 0,
      hubInventory: [],
      equippedItems: { hull: null, scanner: null, utility: null },
      itemInventory: [],
      cryoPool: [],
      powerCells: 4,
      upkeepPerAwakeCrew: 50,
      moduleLevels: {
        salvage_bay:   0,
        cryo_ward:     0,
        workshop:      0,
        power_core:    0,
        command_deck:  0,
        market_node:   0,
      },
      crewAssignments: {},
      scrapJobAvailable: true,
      survivorsSaved: 0,
      shipStateStart: 'damaged',
      awakenedCrew: [],
      introTranscriptTag: '',
      salvageRewardBand: 'medium',
      voidRewardBand: 'medium',
    },
    currentRun: null,
    saveVersion: 3,
  };
}
