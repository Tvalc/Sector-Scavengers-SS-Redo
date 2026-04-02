import { SaveManager, SaveData } from '../save/save-manager';
import { GameState, MetaState, createEmptyGame, TutorialPhase } from '../types/state';
import type { SurvivorsSaved, ShipStateStart, SalvageRewardBand, VoidRewardBand, DebtModifier } from '../content/intro-narrative';

export const SAVE_KEY = 'sector_scavengers_v6';
const SAVE_KEY_V5 = 'sector_scavengers_v5';

type SavePayload = GameState & SaveData;

const manager = new SaveManager<SavePayload>(SAVE_KEY, 6);

// ── Migration helpers ──────────────────────────────────────────────────────

function withDefaults(partial: Partial<MetaState>, defaults: MetaState): MetaState {
  const result: Record<string, unknown> = { ...(defaults as unknown as Record<string, unknown>) };
  const p = partial as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    if (p[key] !== undefined) {
      result[key] = p[key];
    }
  }
  return result as unknown as MetaState;
}

/**
 * Shared field-by-field carry-forward used by both v4 and v5 migrations.
 * Returns a Partial<MetaState> with every field safely copied from raw data
 * or left for `withDefaults` to fill.
 */
function carryForwardMetaFields(raw: unknown, defaults: MetaState): Partial<MetaState> {
  const old = raw as Record<string, unknown>;
  const m = (old['meta'] as Partial<MetaState>) ?? {};

  return {
    credits:              typeof m.credits === 'number' ? m.credits : defaults.credits,
    voidEcho:             typeof m.voidEcho === 'number' ? m.voidEcho : defaults.voidEcho,
    debt:                 typeof m.debt === 'number' ? m.debt : defaults.debt,
    unlockedCards:        Array.isArray(m.unlockedCards) ? m.unlockedCards : defaults.unlockedCards,
    totalRuns:            typeof m.totalRuns === 'number' ? m.totalRuns : defaults.totalRuns,
    totalExtracts:        typeof m.totalExtracts === 'number' ? m.totalExtracts : defaults.totalExtracts,
    totalCollapses:       typeof m.totalCollapses === 'number' ? m.totalCollapses : defaults.totalCollapses,
    openingPathChosen: (
      m.openingPathChosen === false ||
      m.openingPathChosen === 'cold_extract' ||
      m.openingPathChosen === 'cut_and_run' ||
      m.openingPathChosen === 'duty_claim'
    ) ? m.openingPathChosen : defaults.openingPathChosen,
    purchasedVoidTiers:   Array.isArray(m.purchasedVoidTiers) ? m.purchasedVoidTiers : defaults.purchasedVoidTiers,
    purchasedVoidShopCards: Array.isArray(m.purchasedVoidShopCards) ? m.purchasedVoidShopCards : defaults.purchasedVoidShopCards,
    extractionBonus:      typeof m.extractionBonus === 'number' ? m.extractionBonus : defaults.extractionBonus,
    doctrinePoints:       (m.doctrinePoints && typeof m.doctrinePoints === 'object')
                            ? m.doctrinePoints as MetaState['doctrinePoints']
                            : defaults.doctrinePoints,
    doctrineLocked:       m.doctrineLocked ?? defaults.doctrineLocked,
    leadId:               m.leadId ?? defaults.leadId,
    companionIds:         Array.isArray(m.companionIds) ? m.companionIds : defaults.companionIds,
    ships:                Array.isArray(m.ships) ? m.ships as MetaState['ships'] : defaults.ships,
    activeRepairShipId:   m.activeRepairShipId ?? defaults.activeRepairShipId,
    billingCycleRuns:     typeof m.billingCycleRuns === 'number' ? m.billingCycleRuns : defaults.billingCycleRuns,
    billingAmount:        typeof m.billingAmount === 'number' ? m.billingAmount : defaults.billingAmount,
    billingRunsUntilNext: typeof m.billingRunsUntilNext === 'number' ? m.billingRunsUntilNext : defaults.billingRunsUntilNext,
    consecutiveMissedPayments: typeof m.consecutiveMissedPayments === 'number' ? m.consecutiveMissedPayments : 0,
    lastBillingResult:    m.lastBillingResult ?? defaults.lastBillingResult,
    tutorialCompleted:    typeof m.tutorialCompleted === 'boolean' ? m.tutorialCompleted : false,
    tutorialPhase:        (m.tutorialPhase as TutorialPhase) ?? 'not-started',
    hubInventory:         Array.isArray(m.hubInventory) ? m.hubInventory as MetaState['hubInventory'] : [],
    equippedItems: (
      m.equippedItems && typeof m.equippedItems === 'object' && !Array.isArray(m.equippedItems)
    ) ? m.equippedItems as MetaState['equippedItems'] : defaults.equippedItems,
    itemInventory:        Array.isArray(m.itemInventory) ? m.itemInventory as string[] : [],
    cryoPool:             Array.isArray(m.cryoPool) ? m.cryoPool as MetaState['cryoPool'] : [],
    powerCells:           typeof m.powerCells === 'number' ? m.powerCells : defaults.powerCells,
    upkeepPerAwakeCrew:   typeof m.upkeepPerAwakeCrew === 'number' ? m.upkeepPerAwakeCrew : defaults.upkeepPerAwakeCrew,
    moduleLevels: (
      m.moduleLevels && typeof m.moduleLevels === 'object' && !Array.isArray(m.moduleLevels)
    ) ? { ...defaults.moduleLevels, ...(m.moduleLevels as Partial<MetaState['moduleLevels']>) }
      : defaults.moduleLevels,
    crewAssignments: (
      m.crewAssignments && typeof m.crewAssignments === 'object' && !Array.isArray(m.crewAssignments)
    ) ? m.crewAssignments as MetaState['crewAssignments'] : {},
    seenLoreFragments:    Array.isArray(m.seenLoreFragments) ? m.seenLoreFragments as string[] : [],
    scrapJobAvailable:    typeof m.scrapJobAvailable === 'boolean' ? m.scrapJobAvailable : false,
    survivorsSaved:       (m.survivorsSaved as SurvivorsSaved) ?? 0,
    shipStateStart:       (m.shipStateStart as ShipStateStart) ?? 'damaged',
    awakenedCrew:         Array.isArray(m.awakenedCrew) ? m.awakenedCrew as string[] : [],
    introTranscriptTag:   (m.introTranscriptTag as string) ?? '',
    salvageRewardBand:    (m.salvageRewardBand as SalvageRewardBand) ?? 'medium',
    voidRewardBand:       (m.voidRewardBand as VoidRewardBand) ?? 'medium',
    debtModifier:         (m.debtModifier as DebtModifier) ?? 'medium',
    tutorialSeenExtraction: typeof m.tutorialSeenExtraction === 'boolean' ? m.tutorialSeenExtraction : false,
    tutorialSeenCollapse: typeof m.tutorialSeenCollapse === 'boolean' ? m.tutorialSeenCollapse : false,
    debtClearedCount:     typeof m.debtClearedCount === 'number' ? m.debtClearedCount : 0,
    handicapEnabled:      typeof m.handicapEnabled === 'boolean' ? m.handicapEnabled : false,
    handicapActive:       typeof m.handicapActive === 'boolean' ? m.handicapActive : false,
    researchPoints: (
      m.researchPoints && typeof m.researchPoints === 'object' && !Array.isArray(m.researchPoints)
    ) ? { ...defaults.researchPoints, ...(m.researchPoints as Partial<MetaState['researchPoints']>) }
      : defaults.researchPoints,
    researchUnlockLevel: (
      m.researchUnlockLevel && typeof m.researchUnlockLevel === 'object' && !Array.isArray(m.researchUnlockLevel)
    ) ? { ...defaults.researchUnlockLevel, ...(m.researchUnlockLevel as Partial<MetaState['researchUnlockLevel']>) }
      : defaults.researchUnlockLevel,
    crewRunsParticipated: (
      m.crewRunsParticipated && typeof m.crewRunsParticipated === 'object'
    ) ? m.crewRunsParticipated as MetaState['crewRunsParticipated'] : {},
    crewLevels: (
      m.crewLevels && typeof m.crewLevels === 'object'
    ) ? m.crewLevels as MetaState['crewLevels'] : {},
    divePrep: migrateDivePrep(m, defaults.divePrep),
  };
}

/**
 * Migrate divePrep from old saves:
 * - Remove legacy startingHandSeed (ignored if present)
 * - Add selectedCards fallback if missing
 */
function migrateDivePrep(
  raw: Partial<MetaState> | undefined,
  defaults: MetaState['divePrep'],
): MetaState['divePrep'] {
  const dp = raw as Record<string, unknown> | undefined;
  const divePrep = dp?.['divePrep'] as Record<string, unknown> | undefined;
  if (!divePrep || typeof divePrep !== 'object') return defaults;
  const selectedCards = Array.isArray(divePrep['selectedCards']) ? divePrep['selectedCards'] as string[] : defaults.selectedCards;
  return {
    selectedCrewId: (divePrep['selectedCrewId'] as MetaState['divePrep']['selectedCrewId']) ?? defaults.selectedCrewId,
    selectedShipId: (divePrep['selectedShipId'] as string | null) ?? defaults.selectedShipId,
    equippedForDive: (divePrep['equippedForDive'] && typeof divePrep['equippedForDive'] === 'object')
      ? divePrep['equippedForDive'] as MetaState['divePrep']['equippedForDive']
      : defaults.equippedForDive,
    selectedCards,
  };
}

/**
 * Build a fully migrated GameState from carried-forward meta fields.
 */
function buildMigratedState(raw: unknown, metaOverrides: Partial<MetaState>): GameState {
  const defaults = createEmptyGame();
  const carried = carryForwardMetaFields(raw, defaults.meta);
  const merged = { ...carried, ...metaOverrides };
  const old = raw as Partial<GameState>;

  const state: GameState = {
    ...defaults,
    meta: withDefaults(merged, defaults.meta),
    currentRun: old.currentRun ?? null,
    saveVersion: 6,
  };
  state.meta = ensureShips(state.meta, defaults.meta);
  return state;
}

// ── Migration functions ────────────────────────────────────────────────────

/**
 * Migrate v4 save to v6.
 * Zeros out credits and powerCells (economy redesign).
 */
function migrateFromV4(raw: unknown): GameState {
  try {
    return buildMigratedState(raw, { credits: 0, powerCells: 0 });
  } catch {
    return createEmptyGame();
  }
}

/**
 * Migrate v5 save to v6.
 * RunPath changed to branching tree model — old activeRunPath is incompatible, discard it.
 */
function migrateFromV5(raw: unknown): GameState {
  try {
    return buildMigratedState(raw, { activeRunPath: null });
  } catch {
    return createEmptyGame();
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface LoadResult {
  state: GameState;
  wasReset: boolean;
}

export function serialize(game: GameState): void {
  manager.save({ ...game });
}

export function loadSave(): LoadResult {
  const defaults = createEmptyGame();

  try {
    // Try the v6 key
    const raw = manager.load();

    if (raw !== null) {
      if (raw.version > 6) {
        console.warn('Unknown save version, resetting to defaults');
        return { state: defaults, wasReset: true };
      }
      if (raw.version === 6) {
        const { version: _v, ...gameState } = raw;
        const state: GameState = {
          saveVersion: 6,
          meta: withDefaults(gameState.meta ?? {}, defaults.meta),
          currentRun: gameState.currentRun ?? null,
        };
        state.meta = ensureShips(state.meta, defaults.meta);
        return { state, wasReset: false };
      }
      // version ≤ 5 — manager.load() already ran setMigration path, but
      // fall through to manual v5 key check for saves not yet migrated
    }

    // No v6 save — check for a v5 save to migrate
    const v5Raw = localStorage.getItem(SAVE_KEY_V5);
    if (v5Raw !== null) {
      try {
        const parsed = JSON.parse(v5Raw) as unknown;
        const migrated = migrateFromV5(parsed);
        serialize(migrated);
        return { state: migrated, wasReset: false };
      } catch {
        // v5 parse failed — fall through
      }
    }

    // No save at all
    return { state: defaults, wasReset: false };

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn('Save load failed, starting fresh:', err.message);
    return { state: defaults, wasReset: true };
  }
}

export function clearSave(): void {
  manager.delete();
  localStorage.removeItem(SAVE_KEY_V5);
}

// ── Internal helpers ───────────────────────────────────────────────────────

/**
 * Ensure meta.ships contains an entry for every ship in SHIP_DEFS.
 * Adds missing ships as derelict without disturbing existing records.
 */
function ensureShips(meta: MetaState, defaults: MetaState): MetaState {
  const existing = Array.isArray(meta.ships) ? meta.ships : [];
  const existingIds = new Set(existing.map((s) => s.id));
  const missing = defaults.ships.filter((s) => !existingIds.has(s.id));
  if (missing.length === 0) return meta;
  return { ...meta, ships: [...existing, ...missing] };
}
