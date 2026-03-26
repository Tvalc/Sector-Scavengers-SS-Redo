import type { OpeningPathId } from './opening-paths';

// ===== SPEAKER & REWARD TYPES =====

export type IntroSpeaker = 'VALU' | 'PLAYER';

export type SalvageRewardBand = 'low' | 'medium' | 'high' | 'max';

export type VoidRewardBand = 'low' | 'medium' | 'high' | 'max';

export type SurvivorsSaved = 0 | 'some' | 'many';

export type ShipStateStart = 'damaged' | 'partially_repaired' | 'stabilized';

export type DebtModifier = 'low' | 'medium' | 'high';

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
}

// ===== NODE DEFINITIONS =====

export const INTRO_NODES: Record<string, IntroNode> = {
  opening: {
    id: 'opening',
    lines: [
      { speaker: 'VALU', text: 'Good morning, Asset 7C-991. You slept 10,004 years in cryofreeze. Meteor impact has opened the hull. Your debt of ₡8,000 remains payable. Credits are how you service it.' },
      { speaker: 'PLAYER', text: 'So: hull breach, ten millennia of back-rent, and someone left the lights on. What are my options?' },
    ],
    choices: [],
    nextNodeId: 'choice_1',
  },

  choice_1: {
    id: 'choice_1',
    lines: [],
    choices: [
      { id: 'escape', label: 'Self-Extract', subtitle: 'Solo run. High debt pressure.', cardId: 'extract' },
      { id: 'repair', label: 'Duty Claim', subtitle: 'Jax wakes. Shield comes online.', cardId: 'repair' },
    ],
  },

  escape_bridge: {
    id: 'escape_bridge',
    lines: [
      { speaker: 'VALU', text: 'Note: void resonance is harvested from loss events. The more that does not survive, the more echo accumulates in your account. Echo purchases upgrades between runs.' },
      { speaker: 'PLAYER', text: 'Leaving people to die pays dividends. Understood. How hard do I want to commit to that?' },
    ],
    choices: [
      { id: 'escape_scavenge_hard', label: 'Strip & Go', subtitle: 'Max credits. Max void echo. No survivors.', cardId: 'risky_scavenge' },
      { id: 'escape_extract_now', label: 'Extract Now', subtitle: 'Fast exit. High echo. Empty pockets.', cardId: 'quick_extract' },
      { id: 'escape_save_some', label: 'Save Some Then Leave', subtitle: 'Medium credits. Medium echo. Some survive.', cardId: 'scavenge' },
    ],
  },

  escape_scavenge_hard: {
    id: 'escape_scavenge_hard',
    lines: [
      { speaker: 'VALU', text: 'Outcome: zero survivors. Salvage: maximum. Void echo harvested: HIGH — ₡800 starting credits, 3 echo banked. Cold comfort. Debt pressure elevated.' },
      { speaker: 'PLAYER', text: 'Rich, alone, and slightly haunted. That tracks. Proceed to Hub.' },
    ],
    choices: [],
  },

  escape_extract_now: {
    id: 'escape_extract_now',
    lines: [
      { speaker: 'VALU', text: 'Outcome: zero survivors. Fast extraction. Salvage: above base. Void echo harvested: HIGH. Credits reduced by extraction penalty. Debt pressure elevated.' },
      { speaker: 'PLAYER', text: 'Penalised for leaving quickly AND everyone died. Efficient. Proceed to Hub.' },
    ],
    choices: [],
  },

  escape_save_some: {
    id: 'escape_save_some',
    lines: [
      { speaker: 'VALU', text: 'Outcome: partial survivors. JAX awakened. Salvage: moderate. Void echo: MEDIUM — some loss events recorded. Debt pressure: medium.' },
      { speaker: 'PLAYER', text: 'Some people made it. Jax is judging me from engineering. Medium outcomes. Proceed to Hub.' },
    ],
    choices: [],
  },

  repair_bridge: {
    id: 'repair_bridge',
    lines: [
      { speaker: 'VALU', text: 'Patch and Hold applied. Hull +8. One shield charge online — next incoming damage is negated. Cost: ₡20. One engineer awakened: JAX. Proceed or commit.' },
      { speaker: 'PLAYER', text: 'Ship has a shield. Jax is up. I can loot and run with some survivors, or burn the shield finishing this and save everyone.' },
    ],
    choices: [
      { id: 'repair_extract_with_jax', label: 'Loot & Extract', subtitle: 'Medium credits. Some survive. Shield carries.', cardId: 'scavenge' },
      { id: 'repair_full_save', label: 'Full Commitment', subtitle: 'Shield consumed. No echo. Everyone lives.', cardId: 'repair' },
    ],
  },

  repair_extract_with_jax: {
    id: 'repair_extract_with_jax',
    lines: [
      { speaker: 'VALU', text: 'Outcome: partial survivors. JAX operational. Shield charge carried. Salvage: moderate. Void echo: MEDIUM. Debt pressure: medium.' },
      { speaker: 'PLAYER', text: 'Took what we could, left with a shield still armed. Jax seemed okay with it. Proceed to Hub.' },
    ],
    choices: [],
  },

  repair_full_save: {
    id: 'repair_full_save',
    lines: [
      { speaker: 'VALU', text: 'Outcome: all passengers recovered. Ship stabilized. Shield consumed in final sequence. Void echo: NONE — no loss events recorded. Energy: 4. Debt pressure elevated.' },
      { speaker: 'PLAYER', text: 'Saved everyone. Made nothing. No echo. I\'ll feel that later. Worth it. Maybe. Proceed to Hub.' },
    ],
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
    openingPathId: 'cold_extract',
    salvageRewardBand: 'max',
    voidRewardBand: 'max',
    survivorsSaved: 0,
    shipStateStart: 'damaged',
    debtModifier: 'high',
    openingProfile: 'cold_extract',
    awakenedCrew: [],
    introTranscriptTag: 'escape_scavenge_hard',
    recapWhoLived: 'No one. The pods are gone.',
    recapWhatGained: 'Maximum salvage. Maximum void echo.',
    recapDebtNote: 'Debt pressure: HIGH',
  },

  escape_extract_now: {
    nodeId: 'escape_extract_now',
    openingPathId: 'cold_extract',
    salvageRewardBand: 'high',
    voidRewardBand: 'high',
    survivorsSaved: 0,
    shipStateStart: 'damaged',
    debtModifier: 'high',
    openingProfile: 'cold_extract',
    awakenedCrew: [],
    introTranscriptTag: 'escape_extract_now',
    recapWhoLived: 'No survivors. Fast extract.',
    recapWhatGained: 'High salvage. High void echo.',
    recapDebtNote: 'Debt pressure: HIGH',
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
    awakenedCrew: ['jax'],
    introTranscriptTag: 'escape_save_some',
    recapWhoLived: 'Three pod clusters stable. JAX awake.',
    recapWhatGained: 'Moderate salvage. Moderate void echo.',
    recapDebtNote: 'Debt pressure: MEDIUM',
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
    awakenedCrew: ['jax'],
    introTranscriptTag: 'repair_extract_jax',
    recapWhoLived: 'Some passengers. JAX leads.',
    recapWhatGained: 'Moderate salvage. Moderate void echo.',
    recapDebtNote: 'Debt pressure: MEDIUM',
  },

  repair_full_save: {
    nodeId: 'repair_full_save',
    openingPathId: 'duty_claim',
    salvageRewardBand: 'low',
    voidRewardBand: 'low',
    survivorsSaved: 'many',
    shipStateStart: 'stabilized',
    debtModifier: 'low',
    openingProfile: 'duty_claim_variant',
    awakenedCrew: ['jax'],
    introTranscriptTag: 'repair_full_save',
    recapWhoLived: 'Most passengers. JAX committed.',
    recapWhatGained: 'Low immediate salvage. Low void echo. Ship stabilized.',
    recapDebtNote: 'Debt pressure: LOW',
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