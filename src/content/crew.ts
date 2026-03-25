export type CrewMemberId = 'max' | 'imani' | 'jax' | 'sera' | 'rook' | 'del';

export type CrewPassiveEffect =
  | { type: 'hull_regen'; amount: number }
  | { type: 'scavenge_bonus'; amount: number }
  | { type: 'shield_start'; amount: number }
  | { type: 'extract_bonus'; amount: number }
  | { type: 'danger_reduce'; factor: number }
  | { type: 'echo_on_collapse'; amount: number };

export interface CrewMember {
  id: CrewMemberId;
  name: string;
  role: string;
  passive: CrewPassiveEffect;
  passiveDesc: string;
}

export const CREW_ROSTER: Record<CrewMemberId, CrewMember> = {
  max: {
    id: 'max',
    name: 'Max',
    role: 'Engineer',
    passive: { type: 'hull_regen', amount: 5 },
    passiveDesc: 'Patches the hull each round: +5 hull',
  },
  imani: {
    id: 'imani',
    name: 'Imani',
    role: 'Analyst',
    passive: { type: 'danger_reduce', factor: 0.8 },
    passiveDesc: 'Reduces all danger chances by 20%',
  },
  jax: {
    id: 'jax',
    name: 'Jax',
    role: 'Scavenger',
    passive: { type: 'scavenge_bonus', amount: 15 },
    passiveDesc: 'Scavenge and Risky Scavenge yield +15 \u20a1',
  },
  sera: {
    id: 'sera',
    name: 'Sera',
    role: 'Medic',
    passive: { type: 'extract_bonus', amount: 8 },
    passiveDesc: 'Banks +\u20a18 on each successful extract',
  },
  rook: {
    id: 'rook',
    name: 'Rook',
    role: 'Guard',
    passive: { type: 'shield_start', amount: 1 },
    passiveDesc: 'Starts each dive with 1 extra shield charge',
  },
  del: {
    id: 'del',
    name: 'Del',
    role: 'Broker',
    passive: { type: 'extract_bonus', amount: 50 },
    passiveDesc: 'Banks +\u20a150 on each successful extract',
  },
};

export const CREW_ORDER: CrewMemberId[] = ['max', 'imani', 'jax', 'sera', 'rook', 'del'];

export function getCrewById(id: CrewMemberId): CrewMember {
  return CREW_ROSTER[id];
}

export function computeCrewEffects(
  leadId: CrewMemberId | null,
  companionIds: CrewMemberId[],
): CrewPassiveEffect[] {
  const effects: CrewPassiveEffect[] = [];
  if (leadId !== null) effects.push(CREW_ROSTER[leadId].passive);
  for (const id of companionIds) {
    effects.push(CREW_ROSTER[id].passive);
  }
  return effects;
}
