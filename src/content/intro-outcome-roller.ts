import type { IntroBonus, ShipStateStart } from './intro-narrative';

// ===== SEEDED LCG =====

const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 2 ** 32;

interface LCG {
  next(): number;
  nextFloat(): number;
}

function lcg(seed: number): LCG {
  let state = seed >>> 0;

  return {
    next(): number {
      state = (LCG_MULTIPLIER * state + LCG_INCREMENT) % LCG_MODULUS;
      return state;
    },
    nextFloat(): number {
      return this.next() / LCG_MODULUS;
    },
  };
}

// ===== ROLLED OUTCOME TYPES =====

export interface RolledOutcome {
  credits: number;
  voidEcho: number;
  shipState: ShipStateStart;
  bonuses: IntroBonus[];
}

// ===== BONUS POOL ENTRY =====

interface BonusPoolEntry {
  weight: number;
  bonus: IntroBonus;
}

interface OutcomeEnvelope {
  creditsMin: number;
  creditsMax: number;
  voidEchoMin: number;
  voidEchoMax: number;
  shipState: ShipStateStart | { probable: true; threshold: number; primary: ShipStateStart; fallback: ShipStateStart };
  draws: number;
  pool: BonusPoolEntry[];
}

// ===== ENVELOPE + POOL TABLE =====

const OUTCOME_ENVELOPES: Record<string, OutcomeEnvelope> = {
  escape_scavenge_hard: {
    creditsMin: 60000,
    creditsMax: 100000,
    voidEchoMin: 2,
    voidEchoMax: 4,
    shipState: 'damaged',
    draws: 1,
    pool: [
      { weight: 40, bonus: { type: 'card', cardId: 'risky_scavenge' } },
      { weight: 30, bonus: { type: 'credits_bonus', amount: 20000 } },
      { weight: 20, bonus: { type: 'hardware', itemId: 'deep_scanner', slot: 'scanner' } },
      { weight: 10, bonus: { type: 'void_echo', amount: 1 } },
    ],
  },

  escape_extract_now: {
    creditsMin: 15000,
    creditsMax: 35000,
    voidEchoMin: 2,
    voidEchoMax: 3,
    shipState: 'damaged',
    draws: 1,
    pool: [
      { weight: 50, bonus: { type: 'card', cardId: 'quick_extract' } },
      { weight: 30, bonus: { type: 'card', cardId: 'secure_extract' } },
      { weight: 20, bonus: { type: 'void_echo', amount: 1 } },
    ],
  },

  escape_save_some: {
    creditsMin: 30000,
    creditsMax: 60000,
    voidEchoMin: 1,
    voidEchoMax: 2,
    shipState: { probable: true, threshold: 0.6, primary: 'partially_repaired', fallback: 'damaged' },
    draws: 1,
    pool: [
      { weight: 40, bonus: { type: 'crew', crewId: 'imani' } },
      { weight: 30, bonus: { type: 'card', cardId: 'scavenge' } },
      { weight: 20, bonus: { type: 'hull_boost' } },
      { weight: 10, bonus: { type: 'credits_bonus', amount: 15000 } },
    ],
  },

  repair_extract_with_jax: {
    creditsMin: 30000,
    creditsMax: 55000,
    voidEchoMin: 1,
    voidEchoMax: 2,
    shipState: 'partially_repaired',
    draws: 1,
    pool: [
      { weight: 40, bonus: { type: 'card', cardId: 'patch_and_hold' } },
      { weight: 30, bonus: { type: 'crew', crewId: 'sera' } },
      { weight: 20, bonus: { type: 'card', cardId: 'repair' } },
      { weight: 10, bonus: { type: 'credits_bonus', amount: 10000 } },
    ],
  },

  repair_full_save: {
    creditsMin: 10000,
    creditsMax: 30000,
    voidEchoMin: 0,
    voidEchoMax: 1,
    shipState: 'stabilized',
    draws: 2,
    pool: [
      { weight: 35, bonus: { type: 'card', cardId: 'crew_effort' } },
      { weight: 25, bonus: { type: 'card', cardId: 'repair' } },
      { weight: 10, bonus: { type: 'credits_bonus', amount: 10000 } },
    ],
  },
};

// ===== WEIGHTED SELECTION =====

function getBonusId(bonus: IntroBonus): string {
  switch (bonus.type) {
    case 'card':
      return `card:${bonus.cardId}`;
    case 'crew':
      return `crew:${bonus.crewId}`;
    case 'hardware':
      return `hardware:${bonus.itemId}`;
    case 'void_echo':
      return 'void_echo';
    case 'credits_bonus':
      return 'credits_bonus';
    case 'hull_boost':
      return 'hull_boost';
    default:
      return 'unknown';
  }
}

function selectFromPool(pool: BonusPoolEntry[], rng: LCG): IntroBonus {
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng.nextFloat() * totalWeight;

  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.bonus;
    }
  }

  // Fallback to last entry (shouldn't reach here with valid weights)
  return pool[pool.length - 1].bonus;
}

function selectUniqueBonuses(pool: BonusPoolEntry[], rng: LCG, draws: number): IntroBonus[] {
  const bonuses: IntroBonus[] = [];
  const selectedIds = new Set<string>();

  for (let i = 0; i < draws; i++) {
    let bonus = selectFromPool(pool, rng);
    let bonusId = getBonusId(bonus);

    // Deduplicate: re-roll once on collision
    if (selectedIds.has(bonusId)) {
      bonus = selectFromPool(pool, rng);
      bonusId = getBonusId(bonus);
    }

    // Accept even if duplicate after re-roll
    bonuses.push(bonus);
    selectedIds.add(bonusId);
  }

  return bonuses;
}

// ===== ROLL OUTCOME =====

export function rollOutcome(nodeId: string, seed: number): RolledOutcome | null {
  const envelope = OUTCOME_ENVELOPES[nodeId];
  if (!envelope) {
    return null;
  }

  const rng = lcg(seed);

  // Roll credits (rounded to nearest 50)
  const creditRange = envelope.creditsMax - envelope.creditsMin;
  const rawCredits = envelope.creditsMin + rng.nextFloat() * creditRange;
  const credits = Math.round(rawCredits / 50) * 50;

  // Roll void echo (integer range)
  const voidEchoRange = envelope.voidEchoMax - envelope.voidEchoMin;
  const voidEcho = envelope.voidEchoMin + (rng.next() % (voidEchoRange + 1));

  // Roll ship state
  let shipState: ShipStateStart;
  if (typeof envelope.shipState === 'string') {
    shipState = envelope.shipState;
  } else {
    // Probabilistic ship state
    shipState = rng.nextFloat() < envelope.shipState.threshold
      ? envelope.shipState.primary
      : envelope.shipState.fallback;
  }

  // Roll bonuses
  const bonuses = selectUniqueBonuses(envelope.pool, rng, envelope.draws);

  return {
    credits,
    voidEcho,
    shipState,
    bonuses,
  };
}
