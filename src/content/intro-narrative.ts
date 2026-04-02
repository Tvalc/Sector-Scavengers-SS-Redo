import type { OpeningPathId } from './opening-paths';

// ===== SPEAKER & REWARD TYPES =====

export type IntroSpeaker = 'VALU' | 'PLAYER';

export type SalvageRewardBand = 'low' | 'medium' | 'high' | 'max';

export type VoidRewardBand = 'low' | 'medium' | 'high' | 'max';

export type SurvivorsSaved = 0 | 'some' | 'many';

export type ShipStateStart = 'damaged' | 'partially_repaired' | 'stabilized';

export type DebtModifier = 'low' | 'medium' | 'high';

// ===== BONUS TYPES =====

export type IntroBonus =
  | { type: 'card'; cardId: string }
  | { type: 'crew'; crewId: string }
  | { type: 'hardware'; itemId: string; slot: string }
  | { type: 'void_echo'; amount: number }
  | { type: 'credits_bonus'; amount: number }
  | { type: 'hull_boost' };

// ===== CONTENT TYPES =====

export interface IntroLine {
  speaker: IntroSpeaker;
  text: string;
}

export interface IntroChoice {
  id: string;
  label: string;
  /** Secondary line shown on the card — mechanical/narrative context. */
  subtitle?: string;
  /** The TacticCard this choice plays — renders actual card face in UI. */
  cardId: string;
}

export interface IntroNode {
  id: string;
  lines: IntroLine[];
  choices: IntroChoice[];
  /** If set, load this node after all lines are shown (for linear transitions with no choices). */
  nextNodeId?: string;
}

export interface IntroTerminalOutcome {
  nodeId: string;
  openingPathId: OpeningPathId;
  salvageRewardBand: SalvageRewardBand;
  voidRewardBand: VoidRewardBand;
  survivorsSaved: SurvivorsSaved;
  shipStateStart: ShipStateStart;
  debtModifier: DebtModifier;
  openingProfile: 'cold_extract' | 'cut_and_run' | 'duty_claim_variant';
  awakenedCrew: string[];
  introTranscriptTag: string;
  recapWhoLived: string;
  recapWhatGained: string;
  recapDebtNote: string;
  /** Rolled credits from the weighted bonus pool. */
  rolledCredits?: number;
  /** Rolled void echo from the weighted bonus pool. */
  rolledVoidEcho?: number;
  /** Bonuses granted from the weighted pool. */
  bonuses?: IntroBonus[];
  /** Starting debt for this playthrough (defaults to STARTING_DEBT). */
  startingDebt?: number;
}

// ===== NODE DEFINITIONS =====

export const INTRO_NODES: Record<string, IntroNode> = {
  opening_combined: {
    id: 'opening_combined',
    lines: [
      { speaker: 'VALU', text: 'Cryo complete. 10,004 years elapsed. Meteor impact. 847 passenger pods viable, 4 crew pods intact. Hull breached. Your existing debt: ₡1,000,000. Passenger debt transfer on rescue: ₡84,700 each. Company protocol: no dock clearance without a manifested salvage event.' },
      { speaker: 'PLAYER', text: "So the door doesn't open until I've done something worth logging. The crew pods — can I wake them?" },
      { speaker: 'VALU', text: 'Crew awakening requires power cells and adds their debt to your liability. Current crew status: JAX, IMANI, SERA, ROOK — all in cryo. Wake them now, or salvage first and decide later. Your call.' },
    ],
    choices: [],
    nextNodeId: 'choice_1',
  },

  choice_1: {
    id: 'choice_1',
    lines: [],
    choices: [
      { id: 'escape', label: 'Cold Salvage', subtitle: 'Harvest the dead for void echo.', cardId: 'risky_scavenge' },
      { id: 'repair', label: 'Repair & Rescue', subtitle: 'Save them. Inherit their debt.', cardId: 'repair' },
    ],
  },

  escape_bridge: {
    id: 'escape_bridge',
    lines: [
      { speaker: 'VALU', text: "Terminated cryo pods yield void echo — resonance crystals, our currency. Every passenger you rescue transfers their debt to your account: ₡84,700 total liability. The company profits either way: they collect echo from the dead, or debt from the living. Your choice: how much suffering to monetize." },
    ],
    choices: [
      { id: 'escape_scavenge_hard', label: 'Strip & Go', subtitle: 'Cherry-pick pods. Some survive.', cardId: 'risky_scavenge' },
      { id: 'escape_extract_now', label: 'Quick Salvage', subtitle: 'Terminate all. Maximum yield.', cardId: 'quick_extract' },
      { id: 'escape_save_some', label: 'Half Rescue', subtitle: 'Save half. Harvest half.', cardId: 'scavenge' },
    ],
  },

  escape_scavenge_hard: {
    id: 'escape_scavenge_hard',
    lines: [],
    choices: [],
  },

  escape_extract_now: {
    id: 'escape_extract_now',
    lines: [],
    choices: [],
  },

  escape_save_some: {
    id: 'escape_save_some',
    lines: [],
    choices: [],
  },

  repair_bridge: {
    id: 'repair_bridge',
    lines: [
      { speaker: 'VALU', text: 'Hull patch complete. Deep scan reveals high-grade salvage in the passenger cargo hold. Every person you save transfers their debt — but the cargo has no strings attached.' },
    ],
    choices: [
      { id: 'repair_extract_with_jax', label: 'Loot & Extract', subtitle: 'Loot cargo. Some live.', cardId: 'scavenge' },
      { id: 'repair_full_save', label: 'Full Commitment', subtitle: 'Save everyone. Drown in debt.', cardId: 'repair' },
    ],
  },

  repair_extract_with_jax: {
    id: 'repair_extract_with_jax',
    lines: [],
    choices: [],
  },

  repair_full_save: {
    id: 'repair_full_save',
    lines: [],
    choices: [],
  },
};

// ===== BRANCH MAP =====

export const INTRO_BRANCH_MAP: Record<string, string> = {
  // choice_1 choices
  escape: 'escape_bridge',
  repair: 'repair_bridge',

  // escape_bridge choices
  escape_scavenge_hard: 'escape_scavenge_hard',
  escape_extract_now: 'escape_extract_now',
  escape_save_some: 'escape_save_some',

  // repair_bridge choices
  repair_extract_with_jax: 'repair_extract_with_jax',
  repair_full_save: 'repair_full_save',
};

// ===== TERMINAL NODES =====

export const TERMINAL_NODES = new Set([
  'escape_scavenge_hard',
  'escape_extract_now',
  'escape_save_some',
  'repair_extract_with_jax',
  'repair_full_save',
]);

// ===== OUTCOMES =====

export const INTRO_OUTCOMES: Record<string, IntroTerminalOutcome> = {
  escape_scavenge_hard: {
    nodeId: 'escape_scavenge_hard',
    openingPathId: 'cut_and_run',
    salvageRewardBand: 'high',
    voidRewardBand: 'high',
    survivorsSaved: 'some',
    shipStateStart: 'damaged',
    debtModifier: 'low',
    openingProfile: 'cut_and_run',
    awakenedCrew: [],
    introTranscriptTag: 'escape_scavenge_hard',
    recapWhoLived: 'Some passengers survived. The rest became salvage.',
    recapWhatGained: 'High salvage. High void resonance.',
    recapDebtNote: 'Debt pressure: LOW.',
  },

  escape_extract_now: {
    nodeId: 'escape_extract_now',
    openingPathId: 'cold_extract',
    salvageRewardBand: 'max',
    voidRewardBand: 'max',
    survivorsSaved: 0,
    shipStateStart: 'damaged',
    debtModifier: 'low',
    openingProfile: 'cold_extract',
    awakenedCrew: [],
    introTranscriptTag: 'escape_extract_now',
    recapWhoLived: 'No one. Fast termination. Maximum yield.',
    recapWhatGained: 'Maximum salvage. Maximum void resonance.',
    recapDebtNote: 'Debt pressure: LOW.',
  },

  escape_save_some: {
    nodeId: 'escape_save_some',
    openingPathId: 'cut_and_run',
    salvageRewardBand: 'medium',
    voidRewardBand: 'medium',
    survivorsSaved: 'some',
    shipStateStart: 'partially_repaired',
    debtModifier: 'medium',
    openingProfile: 'cut_and_run',
    awakenedCrew: ['imani'],
    introTranscriptTag: 'escape_save_some',
    recapWhoLived: 'Some passengers and IMANI survived. JAX, SERA, ROOK secured in cryo.',
    recapWhatGained: 'Moderate salvage. Moderate void. New crew: IMANI.',
    recapDebtNote: 'Debt pressure: MEDIUM.',
  },

  repair_extract_with_jax: {
    nodeId: 'repair_extract_with_jax',
    openingPathId: 'cut_and_run',
    salvageRewardBand: 'medium',
    voidRewardBand: 'medium',
    survivorsSaved: 'some',
    shipStateStart: 'partially_repaired',
    debtModifier: 'medium',
    openingProfile: 'cut_and_run',
    awakenedCrew: ['sera'],
    introTranscriptTag: 'repair_extract_jax',
    recapWhoLived: 'Some passengers recovered. SERA awakened to stabilize survivors. JAX, IMANI, ROOK secured in cryo.',
    recapWhatGained: 'Moderate salvage. Moderate void. New crew: SERA.',
    recapDebtNote: 'Debt pressure: MEDIUM.',
  },

  repair_full_save: {
    nodeId: 'repair_full_save',
    openingPathId: 'duty_claim',
    salvageRewardBand: 'low',
    voidRewardBand: 'low',
    survivorsSaved: 'many',
    shipStateStart: 'stabilized',
    debtModifier: 'high',
    openingProfile: 'duty_claim_variant',
    awakenedCrew: [],
    introTranscriptTag: 'repair_full_save',
    recapWhoLived: 'Most passengers survived. Full crew MAX, SERA, ROOK active. JAX, IMANI, DEL remain in cryo.',
    recapWhatGained: 'Low immediate salvage. Low void. Ship stabilized. Full crew complement.',
    recapDebtNote: 'Debt pressure: HIGH.',
  },
};

// ===== UTILITY FUNCTIONS =====

export function isTerminalNode(nodeId: string): boolean {
  return TERMINAL_NODES.has(nodeId);
}

export function getNextNodeId(choiceId: string): string | undefined {
  return INTRO_BRANCH_MAP[choiceId];
}

export function getOutcome(nodeId: string): IntroTerminalOutcome | undefined {
  return INTRO_OUTCOMES[nodeId];
}
