export type CrewMemberId = 'max' | 'imani' | 'jax' | 'sera' | 'rook' | 'del' | 'vex' | 'nyx';
export type ResearchTrackId = 'engineering' | 'biology' | 'psionics';

import type { OpeningPathId } from './opening-paths';
import type { MetaState } from '../types/state';
import type { DoctrineId } from './doctrine';

export type CrewUnlockCondition =
  | { type: 'opening_path'; pathId: OpeningPathId }
  | { type: 'total_extracts'; min: number }
  | { type: 'doctrine_locked' }
  | { type: 'debt_below'; threshold: number }
  | { type: 'total_collapses'; min: number };

export const CREW_UNLOCK_CONDITIONS: Record<CrewMemberId, CrewUnlockCondition> = {
  max:   { type: 'opening_path', pathId: 'duty_claim' },
  imani: { type: 'total_extracts', min: 3 },
  jax:   { type: 'opening_path', pathId: 'cut_and_run' },
  sera:  { type: 'opening_path', pathId: 'duty_claim' },
  rook:  { type: 'opening_path', pathId: 'duty_claim' },
  del:   { type: 'opening_path', pathId: 'cut_and_run' },
  vex:   { type: 'doctrine_locked' },
  nyx:   { type: 'total_extracts', min: 5 },
};

/** Check if a crew member is unlocked based on current meta state. */
export function isCrewUnlocked(id: CrewMemberId, meta: MetaState): boolean {
  const condition = CREW_UNLOCK_CONDITIONS[id];
  switch (condition.type) {
    case 'opening_path':
      return meta.openingPathChosen === condition.pathId;
    case 'total_extracts':
      return meta.totalExtracts >= condition.min;
    case 'doctrine_locked':
      return meta.doctrineLocked !== null;
    case 'debt_below':
      return meta.debt <= condition.threshold;
    case 'total_collapses':
      return meta.totalCollapses >= condition.min;
    default:
      return false;
  }
}

/** Get a human-readable description of the unlock condition. */
export function getCrewUnlockDescription(id: CrewMemberId): string {
  const condition = CREW_UNLOCK_CONDITIONS[id];
  switch (condition.type) {
    case 'opening_path':
      return `Unlock: Choose ${condition.pathId.replace(/_/g, ' ')}`;
    case 'total_extracts':
      return `Unlock: ${condition.min} extracts`;
    case 'doctrine_locked':
      return 'Unlock: Lock any doctrine';
    case 'debt_below':
      return `Unlock: Debt below ₡${condition.threshold}`;
    case 'total_collapses':
      return `Unlock: ${condition.min} collapses`;
    default:
      return 'Unlock: Unknown condition';
  }
}

export type CrewPassiveEffect =
  | { type: 'hull_regen'; amount: number }
  | { type: 'scavenge_bonus'; amount: number }
  | { type: 'shield_start'; amount: number }
  | { type: 'extract_bonus'; amount: number }
  | { type: 'danger_reduce'; factor: number }
  | { type: 'echo_on_collapse'; amount: number }
  | { type: 'bot_credit_bonus'; amount: number }
  | { type: 'shield_to_hull'; amount: number };

export interface CrewMember {
  id: CrewMemberId;
  name: string;
  role: string;
  passive: CrewPassiveEffect;
  passiveDesc: string;
  /** Level 2 passive (unlocked at 3 runs participated). */
  level2Passive: CrewPassiveEffect;
  level2PassiveDesc: string;
  /** Level 3 passive (unlocked at 8 runs participated, upgrades level 2). */
  level3Passive: CrewPassiveEffect;
  level3PassiveDesc: string;
  /** Doctrine affinity for card weight calculation in starting hand dealing. */
  doctrineAffinity: DoctrineId | null;
}

export const CREW_ROSTER: Record<CrewMemberId, CrewMember> = {
  max: {
    id: 'max',
    name: 'Max',
    role: 'Engineer',
    passive: { type: 'hull_regen', amount: 5 },
    passiveDesc: 'Patches the hull each round: +5 hull',
    level2Passive: { type: 'hull_regen', amount: 8 },
    level2PassiveDesc: 'Max gets faster: +8 hull/round',
    level3Passive: { type: 'hull_regen', amount: 12 },
    level3PassiveDesc: 'Max becomes legendary: +12 hull/round',
    doctrineAffinity: 'cooperative',
  },
  imani: {
    id: 'imani',
    name: 'Imani',
    role: 'Analyst',
    passive: { type: 'danger_reduce', factor: 0.8 },
    passiveDesc: 'Reduces all danger chances by 20%',
    level2Passive: { type: 'danger_reduce', factor: 0.65 },
    level2PassiveDesc: "Imani's analysis sharpens: -35% danger",
    level3Passive: { type: 'danger_reduce', factor: 0.5 },
    level3PassiveDesc: "Imani sees the future: -50% danger",
    doctrineAffinity: 'corporate',
  },
  jax: {
    id: 'jax',
    name: 'Jax',
    role: 'Scavenger',
    passive: { type: 'scavenge_bonus', amount: 1500 },
    passiveDesc: 'Scavenge and Risky Scavenge yield +1500 \u20a1',
    level2Passive: { type: 'scavenge_bonus', amount: 2500 },
    level2PassiveDesc: "Jax knows the good spots: +2500 scav",
    level3Passive: { type: 'scavenge_bonus', amount: 3500 },
    level3PassiveDesc: "Jax owns the wreck: +3500 scav",
    doctrineAffinity: 'smuggler',
  },
  sera: {
    id: 'sera',
    name: 'Sera',
    role: 'Medic',
    passive: { type: 'extract_bonus', amount: 800 },
    passiveDesc: 'Banks +\u20a1800 on each successful extract',
    level2Passive: { type: 'extract_bonus', amount: 1500 },
    level2PassiveDesc: "Sera negotiates: +1500 on extract",
    level3Passive: { type: 'extract_bonus', amount: 2500 },
    level3PassiveDesc: "Sera commands respect: +2500 on extract",
    doctrineAffinity: 'cooperative',
  },
  rook: {
    id: 'rook',
    name: 'Rook',
    role: 'Guard',
    passive: { type: 'shield_start', amount: 1 },
    passiveDesc: 'Starts each dive with 1 extra shield charge',
    level2Passive: { type: 'shield_start', amount: 2 },
    level2PassiveDesc: "Rook doubles down: +2 starting shields",
    level3Passive: { type: 'shield_start', amount: 3 },
    level3PassiveDesc: "Rook is immovable: +3 starting shields",
    doctrineAffinity: 'corporate',
  },
  del: {
    id: 'del',
    name: 'Del',
    role: 'Broker',
    passive: { type: 'extract_bonus', amount: 5000 },
    passiveDesc: 'Banks +\u20a15000 on each successful extract',
    level2Passive: { type: 'extract_bonus', amount: 8000 },
    level2PassiveDesc: "Del's network grows: +8000 on extract",
    level3Passive: { type: 'extract_bonus', amount: 12000 },
    level3PassiveDesc: "Del owns the dock: +12000 on extract",
    doctrineAffinity: 'smuggler',
  },
  vex: {
    id: 'vex',
    name: 'Vex',
    role: 'Scrap Tech',
    passive: { type: 'bot_credit_bonus', amount: 1500 },
    passiveDesc: 'On extract, gain +\u20a11500 for each bot deployed this run',
    level2Passive: { type: 'bot_credit_bonus', amount: 2500 },
    level2PassiveDesc: "Vex optimizes: +\u20a12500 per bot",
    level3Passive: { type: 'bot_credit_bonus', amount: 4000 },
    level3PassiveDesc: "Vex builds empires: +\u20a14000 per bot",
    doctrineAffinity: 'corporate',
  },
  nyx: {
    id: 'nyx',
    name: 'Nyx',
    role: 'Shieldwright',
    passive: { type: 'shield_to_hull', amount: 5 },
    passiveDesc: 'Each time a shield charge is consumed, restore 5 hull',
    level2Passive: { type: 'echo_on_collapse', amount: 1 },
    level2PassiveDesc: "Nyx communes with the void: gain +1 voidEcho on collapse",
    level3Passive: { type: 'shield_to_hull', amount: 12 },
    level3PassiveDesc: "Nyx becomes one with the shields: +12 hull per shield",
    doctrineAffinity: 'smuggler',
  },
};

export const CREW_ORDER: CrewMemberId[] = ['max', 'imani', 'jax', 'sera', 'rook', 'del', 'vex', 'nyx'];

export function getCrewById(id: CrewMemberId): CrewMember {
  return CREW_ROSTER[id];
}

/** Get the doctrine affinity for a crew member, or null if none. */
export function getCrewDoctrineAffinity(crewId: CrewMemberId): DoctrineId | null {
  return CREW_ROSTER[crewId]?.doctrineAffinity ?? null;
}

export function computeCrewEffects(
  leadId: CrewMemberId | null,
  companionIds: CrewMemberId[],
  crewLevels?: Partial<Record<CrewMemberId, number>>,
): CrewPassiveEffect[] {
  const effects: CrewPassiveEffect[] = [];

  const getPassiveForCrew = (id: CrewMemberId): CrewPassiveEffect => {
    const level = crewLevels?.[id] ?? 1;
    const crew = CREW_ROSTER[id];
    if (level >= 3) return crew.level3Passive;
    if (level >= 2) return crew.level2Passive;
    return crew.passive;
  };

  if (leadId !== null) effects.push(getPassiveForCrew(leadId));
  for (const id of companionIds) {
    effects.push(getPassiveForCrew(id));
  }
  return effects;
}
