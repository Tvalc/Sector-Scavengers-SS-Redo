import type { DoctrineId } from '../content/doctrine';
import type { CrewMemberId } from '../content/crew';
import type { ShipStatus } from '../content/ships';
import { SHIP_DEFS } from '../content/ships';
import type { SalvageEntry } from '../content/salvage';
import type { ItemSlot } from '../content/hardware';
import type { ModuleId } from '../content/modules';
import type { AssignmentSlotId } from '../content/crew-assignments';
import type { SalvageRewardBand, VoidRewardBand, SurvivorsSaved, ShipStateStart, DebtModifier } from '../content/intro-narrative';

export type DiveNodeType = 'salvage' | 'signal' | 'cache' | 'audit' | 'boss';

// ===== Run Path Types (Multi-Ship Expedition) =====

export type ShipNodeType = 'standard' | 'elite' | 'miniboss' | 'boss' | 'shop';

export interface PathTreeNode {
  id: string;
  layer: number;
  col: number;
  shipType: ShipNodeType;
  visited: boolean;
  parentIds: string[];
  childIds: string[];
  isReward: boolean;
}

/** Billing history entry for a single ship payment. */
export interface BillingHistoryEntry {
  shipNumber: number;
  amount: number;
  paid: boolean;
}

export interface RunPath {
  nodes: PathTreeNode[];
  layers: PathTreeNode[][];
  currentNodeId: string | null;
  pathCredits: number;
  pathSalvage: SalvageEntry[];
  pathItemsFound: string[];
  pathHull: number;
  pathShieldCharges: number;
  pathDeck: string[];
  pathDoctrineRunPoints: Record<DoctrineId, number>;
  pathBotsDeployed: number;
  seed: number;
  /** True when a loot pick is pending between ships. */
  pendingLootPick?: boolean;
  // ── Expedition Debt System ─────────────────────────────────────────────
  /** Current expedition debt (starts at calculated amount, decreases on payments). */
  expeditionDebt: number;
  /** Starting debt for this expedition (for progress calculation). */
  expeditionDebtStarting: number;
  /** Maximum debt ceiling — hit this and expedition fails immediately (10M). */
  expeditionDebtCeiling: number;
  /** Number of consecutive missed payments (strikes — 3 = fail). */
  expeditionMissedPayments: number;
  /** History of billing events per ship. */
  expeditionBillingHistory: BillingHistoryEntry[];
  /** True when debt has reached 0 (victory condition). */
  expeditionVictory: boolean;
  /** True when expedition failed (3 strikes OR hit ceiling). */
  expeditionFailed: boolean;
  /** Number of ships completed in this expedition. */
  shipsCompleted: number;
}

export interface BillingResult {
  paid: boolean;
  amount: number;
  penaltyAdded: number;
}

export interface ShipRecord {
  id: string;
  status: ShipStatus;
  repairProgress: number;
  /** Crew member assigned as captain of this ship (null = no captain). */
  captainedBy: CrewMemberId | null;
}

export interface RoundHistoryEntry {
  round: number;
  /** Cards played this round in multi-card system. Optional for backward compatibility. */
  cardsPlayed?: Array<{ cardId: string; cardName: string; overcharged?: boolean }>;
  /** @deprecated Kept for backward compatibility with old save data. Single card mode. */
  cardId?: string;
  /** @deprecated Kept for backward compatibility with old save data. Single card mode. */
  cardName?: string;
}

export interface RunState {
  round: number;
  maxRounds: number;
  hull: number;
  runCredits: number;
  phase: 'active' | 'extracting' | 'extracted' | 'collapsed';
  /** Audit reduction percentage accumulated during dive (0-100). Reduces detection chance. */
  auditReduction: number;
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
  /** History of cards played in each round. */
  roundHistory: RoundHistoryEntry[];
  /** Number of bot cards (repair_bot, scavenge_bot) played this run. Used by Scavenger Swarm build. */
  botsDeployed: number;
  /** Number of times bulwark has been played this run. Used by Iron Fortress build. */
  bulwarkPlays: number;
  /** Whether last_stand has been used this run (can only be used once). */
  lastStandUsed: boolean;
  /** When true, next round's danger factor is reduced by 30%. Set when bulwarkPlays >= 3, consumed after danger resolution. */
  bulwarkDangerReduction: boolean;
  /** When true, danger resolution is skipped for this round. Set by last_stand, reset in NEXT_ROUND. */
  dangerImmune: boolean;
  /** When true, next hand draw discards 1 random card. Set by crew_panic danger. */
  forcedDiscard: boolean;
  /** Current draw pile (ordered, top = index 0). */
  deck: string[];
  /** Played/discarded cards waiting for reshuffle. */
  discardPile: string[];
  /** The cards currently offered to the player. */
  hand: string[];
  /** True when a loot node is waiting for player input. */
  lootNodePending: boolean;
  /** Which round triggered this loot node. */
  lootNodeRound: number;
  /** Aligned cards played THIS run (separate from meta doctrinePoints). */
  doctrineRunPoints: Record<DoctrineId, number>;
  /** Prevents double-adding signature card in one run. */
  doctrineCardAddedThisRun: boolean;
  /** True when a reshuffle occurred during play — used for UI log. */
  pendingReshuffleLog: boolean;
  /** The 10-node dive map — node types for each round (index 0 = round 1). */
  nodeMap: DiveNodeType[];
  /** Player's chosen path at fork rounds (4 and 8). */
  forkChoices: Partial<Record<4 | 8, 'left' | 'right'>>;
  /** The left/right options at each fork, generated at run start. */
  forkOptions: Partial<Record<4 | 8, [DiveNodeType, DiveNodeType]>>;
  /** True when a signal node is waiting for player choice. */
  signalNodePending: boolean;
  /** Which signal is currently active. */
  signalNodeId: string;
  /** True if audit bribe was played — consumed at Corporate Audit node. */
  auditBribed: boolean;
  /** Adds 1 extra card to next draw (from distress_response card). */
  pendingExtraDraw: boolean;
  /** Lore fragments seen this run, merged to meta on extract. */
  seenLoreFragments: string[];
  /** True when an audit node is waiting for player choice. */
  auditNodePending: boolean;
  /** True when audit has been resolved this run (prevents double-trigger). */
  auditResolved: boolean;
  /** True when this is the boss round (round 10). */
  isBossRound: boolean;
  /** True when boss loot is pending (guaranteed rare loot). */
  isBossLoot: boolean;
  /** Hardware items found this run, keyed by slot. */
  foundHardware: Partial<Record<ItemSlot, string>>;
  /** True when a cache node is waiting for player choice. */
  cacheNodePending: boolean;
  /** The hardware item id found at the current cache node. */
  cacheNodeItem: string | null;
  /** Additive danger reduction for this run (from cards like calculated_risk). */
  runDangerReduction: number;
  /** Whether a danger fired in the last round (for danger_profit card). */
  lastRoundDangerFired: boolean;
  /** Whether void_touched card was played this run (for extract bonus). */
  voidTouchedActive: boolean;
  /** Pending extract bonus percentage (e.g., 0.30 for +30%). */
  pendingExtractBonusPct: number;
  /** Credits subtracted at start of next round (ghost_claim, ghost_protocol). Consumed in NEXT_ROUND. */
  nextRoundCreditsPenalty: number;
  /** Number of future dangers to skip (corporate_lockdown, fortress_lockdown, premonition, etc.). */
  dangerSkipRemaining: number;
  /** Bonus to effective max hull (structural_reinforce, hull_buffer, hull_fortress). */
  maxHullBonus: number;
  /** Once per run flag for last_bastion. */
  lastBastionUsed: boolean;
  /** Next extract grants +1 additional voidEcho (echo_amplifier_card). */
  echoAmplifierActive: boolean;
  /** Number of extra cards to draw next round (void_communion_card draws 2). */
  pendingExtraDrawCount: number;
  /** In-run energy — starts at 3 per ship battle, regenerates 1 per round. */
  energy: number;
  /** Maximum in-run energy cap. */
  maxEnergy: number;
  /** Energy regenerated each round. */
  energyRegenPerRound: number;
  /** Whether redraw has been used this round (max 1 per round). */
  redrawUsedThisRound: boolean;
  /** Active debuff tags for mutual_aid removal tracking. */
  debuffs: string[];
  /** Hardware cooldowns per slot - rounds remaining until usable. */
  hardwareCooldowns: Record<'hull' | 'scanner' | 'utility', number>;
  /** Energy spent this round - tracks for Corporate doctrine bonus. */
  energySpentThisRound: number;
  /** Flag for UI feedback when overcharge is active. */
  overchargeActive: boolean;
  /** Reserve burn available - true when at max energy, gives -1⚡ next card. */
  reserveBurnAvailable: boolean;
  /** Number of hardware abilities used this round (for synergy bonus). */
  hardwareUsedThisRound: number;
  /** Once per run flag for crew_miracle. */
  crewMiracleUsed: boolean;
  /** Tracks which once/run cards have been used (debt_write_off, etc.). */
  oncePerRunCards: string[];
  /** Haul decisions made during extract manifest phase. */
  haulDecisions?: HaulDecision[];
  /** Audit result after manifest confirmation. */
  auditResult?: AuditResult;
  /** Corporate compliance flag - skips audit if true (+10% haul bonus). */
  corporateCompliance?: boolean;
  /** Current ship node type for danger scaling. */
  shipNodeType: ShipNodeType;
  /** Static asset name for the randomly selected room background for this run. */
  backgroundAsset?: string;
  /** Locked doctrine for this run (copied from meta at start). */
  doctrineLocked: import('../content/doctrine').DoctrineId | null;
  /** Information revelation tracking - exact hull revealed (persists until hull changes). */
  exactHullRevealed: boolean;
  /** Information revelation tracking - danger forecast from deep scans. */
  dangerForecast: Array<{ round: number; type: string; magnitude: 'low' | 'medium' | 'high' }>;
}

/** Tutorial phase tracking for progressive hands-on guidance. */
/** Dive preparation selections stored transiently before starting a dive. */
export interface DivePrepState {
  selectedCrewId: CrewMemberId | null;
  selectedShipId: string | null;
  equippedForDive: Record<ItemSlot, string | null>;
  /** Card IDs selected by the player for this dive's starting deck. */
  selectedCards: string[];
}

export type TutorialPhase =
  | 'not-started'
  // Dual-mode tutorial phases
  | 'meta-hub-welcome'
  | 'meta-hub-cards'
  | 'meta-hub-start-dive'
  | 'dive-mode-welcome'
  | 'dive-mode-hull'
  | 'dive-mode-extract'
  // Legacy phases (kept for backward compatibility)
  | 'hub-welcome'
  | 'dive-round1'
  | 'dive-round2'
  | 'dive-round3plus'
  | 'result-extracted'
  | 'result-collapsed'
  | 'hub-return-pending'
  | 'hub-return'
  // Panel tutorial phases (steps 6-10)
  | 'salvage-tutorial-1'
  | 'salvage-tutorial-2'
  | 'salvage-tutorial-3'
  | 'salvage-tutorial-4'
  | 'salvage-tutorial-5'
  | 'void-tutorial-1'
  | 'void-tutorial-2'
  | 'void-tutorial-3'
  | 'void-tutorial-4'
  | 'void-tutorial-5'
  | 'hw-tutorial-1'
  | 'hw-tutorial-2'
  | 'hw-tutorial-3'
  | 'cryo-tutorial-1'
  | 'cryo-tutorial-2'
  | 'cryo-tutorial-3'
  | 'modules-tutorial-1'
  | 'modules-tutorial-2'
  | 'modules-tutorial-3'
  | 'ships-tutorial-1'
  | 'ships-tutorial-2'
  | 'ships-tutorial-3'
  // Hub transition phases between panel tutorials
  | 'hub-pre-void'
  | 'hub-pre-hardware'
  | 'hub-pre-cryo'
  | 'hub-pre-modules'
  | 'hub-pre-ships'
  // Expedition debt education phases
  | 'debt-contract-intro'
  | 'billing-forecast-intro'
  | 'post-ship-progress-intro'
  | 'completed';

export interface MetaState {
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
  /** Number of consecutive missed billing payments. Game over at 3. */
  consecutiveMissedPayments: number;
  purchasedVoidShopCards: string[];
  tutorialCompleted: boolean;
  /** Current tutorial phase for progressive hands-on guidance. */
  tutorialPhase: TutorialPhase;
  /** @deprecated Use tutorialPhase instead. Kept for save migration. */
  tutorialStep?: number;
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
  /** Debt pressure level from intro choice. */
  debtModifier: DebtModifier;
  /** Whether the player has seen the extraction result tutorial during the guided tutorial. */
  tutorialSeenExtraction: boolean;
  /** Whether the player has seen the collapse result tutorial during the guided tutorial. */
  tutorialSeenCollapse: boolean;
  /** Whether the player has seen the debt contract tutorial. */
  tutorialSeenDebtContract: boolean;
  /** Whether the player has seen the billing forecast tutorial. */
  tutorialSeenBillingForecast: boolean;
  /** Whether the player has seen the post-ship progress tutorial. */
  tutorialSeenPostShipProgress: boolean;
  /** Whether the player has seen the energy system tutorial. */
  tutorialSeenEnergyTutorial: boolean;
  /** Lore fragments seen across all runs. */
  seenLoreFragments: string[];
  /** Number of times debt has been cleared (reached 0). */
  debtClearedCount: number;
  /** Whether handicap mode is unlocked (after first debt clearance). */
  handicapEnabled: boolean;
  /** Whether handicap mode is currently active for the next run. */
  handicapActive: boolean;
  /** Research points accumulated per track. */
  researchPoints: Record<import('../content/crew').ResearchTrackId, number>;
  /** Research unlock level per track (0–3). */
  researchUnlockLevel: Record<import('../content/crew').ResearchTrackId, number>;
  /** Runs participated per crew member (for XP tracking). */
  crewRunsParticipated: Partial<Record<CrewMemberId, number>>;
  /** Current level per crew member (1-3). Level 2 at 3 runs, Level 3 at 8 runs. */
  crewLevels: Partial<Record<CrewMemberId, number>>;
  /** Transient dive preparation state — selections made before starting a dive. Not persisted across sessions. */
  divePrep: DivePrepState;
  /** Active multi-ship expedition path, null when not on a run. */
  activeRunPath: RunPath | null;
}

/** A single haul item decision during extract manifest. */
export interface HaulDecision {
  itemTier: import('../content/salvage').SalvageTier;
  quantity: number;
  valueEach: number;
  action: 'declare' | 'smuggle';
}

/** Result of the audit after extract manifest. */
export interface AuditResult {
  caught: SalvageEntry[];
  cleared: SalvageEntry[];
  debtPenalty: number;
}

export interface GameState {
  meta: MetaState;
  currentRun: RunState | null;
  saveVersion: 6;
}

export function createEmptyGame(): GameState {
  return {
    meta: {
      credits: 0,
      voidEcho: 0,
      debt: 1000000, // 1 million starting debt
      unlockedCards: ['scavenge', 'repair', 'extract'], // Start with 3 cards only
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
        status: def.id === 'single_man_scav' ? 'claimed' : 'derelict',
        repairProgress: 0,
        captainedBy: def.id === 'single_man_scav' ? null : null,
      })),
      activeRepairShipId: null,
      billingCycleRuns: 3,
      billingAmount: 500000, // 500K base per billing cycle
      billingRunsUntilNext: 3,
      lastBillingResult: null,
      consecutiveMissedPayments: 0,
      purchasedVoidShopCards: [],
      tutorialCompleted: false,
      tutorialPhase: 'not-started',
      hubInventory: [],
      equippedItems: { hull: null, scanner: null, utility: null },
      itemInventory: [],
      cryoPool: [],
      powerCells: 0,
      upkeepPerAwakeCrew: 50000, // 50K per crew member per billing cycle
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
      debtModifier: 'medium',
      tutorialSeenExtraction: false,
      tutorialSeenCollapse: false,
      tutorialSeenDebtContract: false,
      tutorialSeenBillingForecast: false,
      tutorialSeenPostShipProgress: false,
      tutorialSeenEnergyTutorial: false,
      seenLoreFragments: [],
      debtClearedCount: 0,
      handicapEnabled: false,
      handicapActive: false,
      researchPoints: { engineering: 0, biology: 0, psionics: 0 },
      researchUnlockLevel: { engineering: 0, biology: 0, psionics: 0 },
      crewRunsParticipated: {},
      crewLevels: {},
      divePrep: {
        selectedCrewId: null,
        selectedShipId: null,
        equippedForDive: { hull: null, scanner: null, utility: null },
        selectedCards: ['scavenge', 'repair', 'extract'],
      },
      activeRunPath: null,
    },
    currentRun: null,
    saveVersion: 6,
  };
}
