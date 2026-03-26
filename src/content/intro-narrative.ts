import type { OpeningPathId } from './opening-paths';

// ===== SPEAKER & REWARD TYPES =====

export type IntroSpeaker = 'VALU' | 'JAX';

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
      { speaker: 'VALU', text: 'You wake up. Meteor impact breached the ship. You owe debt for 10,000 years of cryofreeze.' },
      { speaker: 'VALU', text: 'Contract status: active. Debt collectible. Survival optional.' },
    ],
    choices: [],
    nextNodeId: 'choice_1',
  },

  choice_1: {
    id: 'choice_1',
    lines: [],
    choices: [
      { id: 'escape', label: 'Self-Extract', subtitle: 'Get out. The debt collectors can sort the rest.' },
      { id: 'repair', label: 'Duty Claim', subtitle: 'Jax is in engineering. Some pods are still intact.' },
    ],
  },

  escape_bridge: {
    id: 'escape_bridge',
    lines: [
      { speaker: 'VALU', text: 'Psych profile: sociopathic tendency detected. Acceptable. Prove asset value through salvage and your escape request will be approved.' },
    ],
    choices: [
      { id: 'escape_scavenge_hard', label: 'Strip & Go', subtitle: 'Maximum salvage before evac. Nobody waits. Debt pressure: HIGH.' },
      { id: 'escape_save_some', label: 'Partial Evac', subtitle: 'Three pod clusters stable. Take what you can carry.' },
    ],
  },

  escape_scavenge_hard: {
    id: 'escape_scavenge_hard',
    lines: [
      { speaker: 'VALU', text: 'Profit confirmed. Human loss accepted.' },
    ],
    choices: [],
  },

  escape_save_some: {
    id: 'escape_save_some',
    lines: [
      { speaker: 'JAX', text: "You actually came back? Then move. I can keep three pods stable, tops." },
    ],
    choices: [],
  },

  repair_bridge: {
    id: 'repair_bridge',
    lines: [
      { speaker: 'VALU', text: 'Recommendation: extract with recoverable assets.' },
      { speaker: 'JAX', text: "I'm Jax. Bulkhead's gone. We can still save people if we stop pretending this is clean." },
    ],
    choices: [
      { id: 'repair_extract_with_jax', label: 'Balanced Extract', subtitle: 'Coordinate with Jax. Survivors and salvage both. Debt pressure: MEDIUM.' },
      { id: 'repair_full_save', label: 'Full Commitment', subtitle: 'Every pod. No half measures. Jax leads. Debt pressure: LOW.' },
    ],
  },

  repair_extract_with_jax: {
    id: 'repair_extract_with_jax',
    lines: [
      { speaker: 'JAX', text: 'Take what we need, then we go.' },
    ],
    choices: [],
  },

  repair_full_save: {
    id: 'repair_full_save',
    lines: [
      { speaker: 'JAX', text: 'Then commit. No half measures.' },
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
  escape_save_some: 'escape_save_some',

  // repair_bridge choices
  repair_extract_with_jax: 'repair_extract_with_jax',
  repair_full_save: 'repair_full_save',
};

// ===== TERMINAL NODES =====

export const TERMINAL_NODES = new Set([
  'escape_scavenge_hard',
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
