import { SaveManager, SaveData } from '../save/save-manager';
import { GameState, MetaState, createEmptyGame } from '../types/state';
import { SHIP_DEFS } from '../content/ships';
import { MAX_ENERGY, EMERGENCY_RECHARGE_COST, BAILOUT_CREDITS, BAILOUT_ENERGY } from '../config/constants';

export const SAVE_KEY = 'sector_scavengers_v3';
// Previous keys — kept for migration chaining
const SAVE_KEY_V2 = 'sector_scavengers_v2';
const SAVE_KEY_V1 = 'sector_scavengers_v1';

// SaveManager requires a `version` field via SaveData.
// We store the full GameState plus `version: 3` as one flat object.
type SavePayload = GameState & SaveData;

const manager = new SaveManager<SavePayload>(SAVE_KEY, 3);

// ── Migration helpers ──────────────────────────────────────────────────────

function withDefaults(partial: Partial<MetaState>, defaults: MetaState): MetaState {
  const result: Record<string, unknown> = { ...(defaults as unknown as Record<string, unknown>) };
  const p = partial as Record<string, unknown>;
  // Only copy fields that are defined and not undefined
  for (const key of Object.keys(result)) {
    if (p[key] !== undefined) {
      result[key] = p[key];
    }
  }
  return result as unknown as MetaState;
}

/**
 * Migrate a v1 save to v3 directly.
 * Preserves the narrow set of fields that existed in v1; fills everything else
 * with safe defaults (including all v2 and v3 additions).
 */
function migrateFromV1(raw: unknown): GameState {
  const defaults = createEmptyGame();
  try {
    const old = raw as Record<string, unknown>;
    const oldMeta = (old['meta'] as Partial<MetaState>) ?? {};
    const v1SafeFields: Partial<MetaState> = {
      energy:        typeof oldMeta.energy === 'number'  ? oldMeta.energy  : defaults.meta.energy,
      credits:       typeof oldMeta.credits === 'number' ? oldMeta.credits : defaults.meta.credits,
      voidEcho:      typeof oldMeta.voidEcho === 'number' ? oldMeta.voidEcho : defaults.meta.voidEcho,
      debt:          typeof oldMeta.debt === 'number'    ? oldMeta.debt    : defaults.meta.debt,
      unlockedCards: Array.isArray(oldMeta.unlockedCards) ? oldMeta.unlockedCards : defaults.meta.unlockedCards,
      totalRuns:     typeof oldMeta.totalRuns === 'number'    ? oldMeta.totalRuns    : defaults.meta.totalRuns,
      totalExtracts: typeof oldMeta.totalExtracts === 'number' ? oldMeta.totalExtracts : defaults.meta.totalExtracts,
      openingPathChosen: (
        oldMeta.openingPathChosen === false ||
        oldMeta.openingPathChosen === 'cold_extract' ||
        oldMeta.openingPathChosen === 'cut_and_run' ||
        oldMeta.openingPathChosen === 'duty_claim'
      ) ? oldMeta.openingPathChosen : defaults.meta.openingPathChosen,
    };
    return {
      ...defaults,
      meta: withDefaults(v1SafeFields, defaults.meta),
      saveVersion: 3,
    };
  } catch {
    return defaults;
  }
}

/**
 * Migrate a v2 save to v3.
 * Carries forward all v2 MetaState fields, adds:
 *   - hubInventory: []      (new in v3)
 *   - tutorialCompleted: false  (added in P24 but stored as v2; default safely)
 *   - tutorialStep: 0           (same)
 */
function migrateFromV2(raw: unknown): GameState {
  const defaults = createEmptyGame();
  try {
    const old = raw as Record<string, unknown>;
    const oldMeta = (old['meta'] as Partial<MetaState>) ?? {};

    // Carry forward every field that was valid in v2
    const v2SafeFields: Partial<MetaState> = {
      energy:               typeof oldMeta.energy === 'number'  ? oldMeta.energy  : defaults.meta.energy,
      credits:              typeof oldMeta.credits === 'number' ? oldMeta.credits : defaults.meta.credits,
      voidEcho:             typeof oldMeta.voidEcho === 'number' ? oldMeta.voidEcho : defaults.meta.voidEcho,
      debt:                 typeof oldMeta.debt === 'number'    ? oldMeta.debt    : defaults.meta.debt,
      unlockedCards:        Array.isArray(oldMeta.unlockedCards) ? oldMeta.unlockedCards : defaults.meta.unlockedCards,
      totalRuns:            typeof oldMeta.totalRuns === 'number'     ? oldMeta.totalRuns     : defaults.meta.totalRuns,
      totalExtracts:        typeof oldMeta.totalExtracts === 'number' ? oldMeta.totalExtracts : defaults.meta.totalExtracts,
      totalCollapses:       typeof oldMeta.totalCollapses === 'number' ? oldMeta.totalCollapses : defaults.meta.totalCollapses,
      openingPathChosen: (
        oldMeta.openingPathChosen === false ||
        oldMeta.openingPathChosen === 'cold_extract' ||
        oldMeta.openingPathChosen === 'cut_and_run' ||
        oldMeta.openingPathChosen === 'duty_claim'
      ) ? oldMeta.openingPathChosen : defaults.meta.openingPathChosen,
      purchasedVoidTiers:   Array.isArray(oldMeta.purchasedVoidTiers) ? oldMeta.purchasedVoidTiers : defaults.meta.purchasedVoidTiers,
      purchasedVoidShopCards: Array.isArray(oldMeta.purchasedVoidShopCards) ? oldMeta.purchasedVoidShopCards : defaults.meta.purchasedVoidShopCards,
      extractionBonus:      typeof oldMeta.extractionBonus === 'number' ? oldMeta.extractionBonus : defaults.meta.extractionBonus,
      doctrinePoints:       (oldMeta.doctrinePoints && typeof oldMeta.doctrinePoints === 'object')
                              ? oldMeta.doctrinePoints as MetaState['doctrinePoints']
                              : defaults.meta.doctrinePoints,
      doctrineLocked:       oldMeta.doctrineLocked ?? defaults.meta.doctrineLocked,
      leadId:               oldMeta.leadId ?? defaults.meta.leadId,
      companionIds:         Array.isArray(oldMeta.companionIds) ? oldMeta.companionIds : defaults.meta.companionIds,
      ships:                Array.isArray(oldMeta.ships) ? oldMeta.ships as MetaState['ships'] : defaults.meta.ships,
      activeRepairShipId:   oldMeta.activeRepairShipId ?? defaults.meta.activeRepairShipId,
      billingCycleRuns:     typeof oldMeta.billingCycleRuns === 'number' ? oldMeta.billingCycleRuns : defaults.meta.billingCycleRuns,
      billingAmount:        typeof oldMeta.billingAmount === 'number' ? oldMeta.billingAmount : defaults.meta.billingAmount,
      billingRunsUntilNext: typeof oldMeta.billingRunsUntilNext === 'number' ? oldMeta.billingRunsUntilNext : defaults.meta.billingRunsUntilNext,
      lastBillingResult:    oldMeta.lastBillingResult ?? defaults.meta.lastBillingResult,
      // Tutorial fields may or may not exist in the v2 save (added in P24)
      tutorialCompleted:    typeof oldMeta.tutorialCompleted === 'boolean' ? oldMeta.tutorialCompleted : false,
      tutorialStep:         typeof oldMeta.tutorialStep === 'number' ? oldMeta.tutorialStep : 0,
      // v3 additions (T4 — salvage inventory)
      hubInventory:         Array.isArray(oldMeta.hubInventory) ? oldMeta.hubInventory as MetaState['hubInventory'] : [],
      // v3 additions (T7 — hardware)
      equippedItems: (
        oldMeta.equippedItems &&
        typeof oldMeta.equippedItems === 'object' &&
        !Array.isArray(oldMeta.equippedItems)
      ) ? oldMeta.equippedItems as MetaState['equippedItems']
        : defaults.meta.equippedItems,
      itemInventory:        Array.isArray(oldMeta.itemInventory) ? oldMeta.itemInventory as string[] : [],
      // v3 additions (T10 — cryo)
      cryoPool:             Array.isArray(oldMeta.cryoPool) ? oldMeta.cryoPool as MetaState['cryoPool'] : [],
      powerCells:           typeof oldMeta.powerCells === 'number' ? oldMeta.powerCells : defaults.meta.powerCells,
      upkeepPerAwakeCrew:   typeof oldMeta.upkeepPerAwakeCrew === 'number' ? oldMeta.upkeepPerAwakeCrew : defaults.meta.upkeepPerAwakeCrew,
      // v3 additions (T12 — station modules)
      moduleLevels: (
        oldMeta.moduleLevels &&
        typeof oldMeta.moduleLevels === 'object' &&
        !Array.isArray(oldMeta.moduleLevels)
      ) ? { ...defaults.meta.moduleLevels, ...(oldMeta.moduleLevels as Partial<MetaState['moduleLevels']>) }
        : defaults.meta.moduleLevels,
      // v3 additions (crew assignment feature)
      crewAssignments: (
        oldMeta.crewAssignments &&
        typeof oldMeta.crewAssignments === 'object' &&
        !Array.isArray(oldMeta.crewAssignments)
      ) ? oldMeta.crewAssignments as MetaState['crewAssignments']
        : {},
    };

    const state: GameState = {
      ...defaults,
      meta: withDefaults(v2SafeFields, defaults.meta),
      currentRun: null,           // discard any in-flight run from v2
      saveVersion: 3,
    };
    // Ensure all ships present
    state.meta = ensureShips(state.meta, defaults.meta);
    return state;
  } catch {
    return defaults;
  }
}

// Register migration function on manager (handles both v1 and v2 payloads)
manager.setMigration((data) => {
  const version = (data as SaveData).version;
  let migrated: GameState;
  if (version <= 1) {
    migrated = migrateFromV1(data);
  } else {
    // version 2
    migrated = migrateFromV2(data);
  }
  const payload = migrated as GameState & SaveData;
  payload.version = 3;
  return payload;
});

// ── Public API ────────────────────────────────────────────────────────────

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
    // First try the v3 key
    const raw = manager.load();

    if (raw !== null) {
      if (raw.version > 3) {
        console.warn('Unknown save version, resetting to defaults');
        return { state: defaults, wasReset: true };
      }
      // version 3 — reconstruct, filling any missing fields with defaults.
      // `withDefaults` copies every key from `createEmptyGame().meta` and
      // only overwrites it when the saved value is defined. This means any
      // field added after a save was written (e.g. `crewAssignments` added
      // in the crew-assignment feature) is automatically seeded with the
      // correct empty default without a version bump.
      const { version: _v, ...gameState } = raw;
      const state: GameState = {
        saveVersion: 3,
        meta: withDefaults(gameState.meta ?? {}, defaults.meta),
        currentRun: gameState.currentRun ?? null,
      };
      state.meta = ensureShips(state.meta, defaults.meta);
      const bailed = applyBailoutIfNeeded(state);
      return { state: bailed, wasReset: false };
    }

    // No v3 save — check for a v2 save to migrate
    const v2Raw = localStorage.getItem(SAVE_KEY_V2);
    if (v2Raw !== null) {
      try {
        const parsed = JSON.parse(v2Raw) as unknown;
        const migrated = migrateFromV2(parsed);
        const bailed = applyBailoutIfNeeded(migrated);
        serialize(bailed);
        return { state: bailed, wasReset: false };
      } catch {
        // v2 parse failed — fall through
      }
    }

    // Check for a legacy v1 save
    const v1Raw = localStorage.getItem(SAVE_KEY_V1);
    if (v1Raw !== null) {
      try {
        const parsed = JSON.parse(v1Raw) as unknown;
        const migrated = migrateFromV1(parsed);
        const bailed = applyBailoutIfNeeded(migrated);
        serialize(bailed);
        return { state: bailed, wasReset: false };
      } catch {
        // v1 parse failed — fall through to fresh game
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
  localStorage.removeItem(SAVE_KEY_V2);
  localStorage.removeItem(SAVE_KEY_V1);
}

// ── Bailout ───────────────────────────────────────────────────────────────

/**
 * Detect a deadlocked save (energy=0, no credits for emergency recharge,
 * no sellable salvage, and scrap job already spent) and inject recovery
 * resources. Safe to call on every load — no-ops if not deadlocked.
 */
function applyBailoutIfNeeded(state: GameState): GameState {
  const { meta } = state;
  const hasSellableSalvage = meta.hubInventory.some((e) => e.quantity > 0);
  const deadlocked =
    meta.energy === 0 &&
    meta.credits < EMERGENCY_RECHARGE_COST &&
    !hasSellableSalvage &&
    !meta.scrapJobAvailable;

  if (!deadlocked) return state;

  console.warn('Bailout applied to deadlocked save');
  return {
    ...state,
    meta: {
      ...meta,
      credits: meta.credits + BAILOUT_CREDITS,
      energy: Math.min(meta.energy + BAILOUT_ENERGY, MAX_ENERGY),
      scrapJobAvailable: true,
    },
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────

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
