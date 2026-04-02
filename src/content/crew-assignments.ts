export type AssignmentSlotId = 'idle' | 'repairs' | 'scav_prep' | 'medbay' | 'market_ops' | 'research';

export interface AssignmentSlotDef {
  id: AssignmentSlotId;
  label: string;
  desc: string;
  bonusDesc: string;
}

export const ASSIGNMENT_SLOT_DEFS: Record<AssignmentSlotId, AssignmentSlotDef> = {
  idle: {
    id: 'idle',
    label: 'Off-Duty',
    desc: 'No station assigned.',
    bonusDesc: 'No station bonus.',
  },
  repairs: {
    id: 'repairs',
    label: 'Repair Crew',
    desc: 'Assigned to hull maintenance.',
    bonusDesc: '+1 hull repair progress per run.',
  },
  scav_prep: {
    id: 'scav_prep',
    label: 'Scav Prep',
    desc: 'Prepares scavenging equipment before each dive.',
    bonusDesc: '+₡500 scavenge bonus per dive.',
  },
  medbay: {
    id: 'medbay',
    label: 'Medbay',
    desc: 'Staffs the medical bay between dives.',
    bonusDesc: '+8 starting hull per dive.',
  },
  market_ops: {
    id: 'market_ops',
    label: 'Market Ops',
    desc: 'Manages salvage appraisal and trade contacts.',
    bonusDesc: '+5% salvage sale value. -₡100k starting debt.',
  },
  research: {
    id: 'research',
    label: 'Research Lab',
    desc: 'Contributes to station research projects.',
    bonusDesc: '+1 research point per dive. -₡50k starting debt.',
  },
};

export const ASSIGNMENT_SLOT_ORDER: AssignmentSlotId[] = [
  'idle',
  'repairs',
  'scav_prep',
  'medbay',
  'market_ops',
  'research',
];

export function getAssignmentSlotDef(id: AssignmentSlotId): AssignmentSlotDef {
  return ASSIGNMENT_SLOT_DEFS[id];
}
