import type { DoctrineId } from './doctrine';
import type { CrewPassiveEffect } from './crew';

export type ShipStatus = 'derelict' | 'repairing' | 'claimed';

export interface ShipDef {
  id: string;
  name: string;
  description: string;
  repairCost: number;
  /** Doctrine alignment for this ship (affects captain bonus flavor). */
  doctrineAffinity: DoctrineId;
  /** Passive bonus granted when this ship has a captain assigned. */
  captainBonus: CrewPassiveEffect;
  /** Optional secondary bonus for ships with compound effects. */
  captainBonusSecondary?: CrewPassiveEffect;
  /** Description of the captain bonus effect. */
  captainBonusDesc: string;
}

export const SHIP_DEFS: ShipDef[] = [
  {
    id: 'single_man_scav',
    name: 'Scav Sprinter',
    description: 'Single-person craft with basic gear — runs on grit and duct tape',
    repairCost: 0,
    doctrineAffinity: 'smuggler',
    captainBonus: { type: 'scavenge_bonus', amount: 1000 },
    captainBonusDesc: 'Nominal bonus: +1000 credits on scavenge cards',
    // No captain needed — this is the starter personal craft
  },
  {
    id: 'wraith',
    name: 'The Wraith',
    description: 'Fast scout ship, low hull — hits first, hits hard',
    repairCost: 5,
    doctrineAffinity: 'smuggler',
    captainBonus: { type: 'scavenge_bonus', amount: 3000 },
    captainBonusDesc: 'Captain bonus: +3000 credits on scavenge cards',
  },
  {
    id: 'bulwark',
    name: 'Bulwark',
    description: 'Heavy freighter, high carry — built for the long haul',
    repairCost: 8,
    doctrineAffinity: 'cooperative',
    captainBonus: { type: 'shield_start', amount: 2 },
    captainBonusDesc: 'Captain bonus: +2 shield charges at start',
  },
  {
    id: 'vagrant',
    name: 'Vagrant',
    description: 'Salvage hauler, mid-tier — finds what others miss',
    repairCost: 6,
    doctrineAffinity: 'smuggler',
    captainBonus: { type: 'extract_bonus', amount: 5000 },
    captainBonusDesc: 'Captain bonus: +5000 credits on extract',
  },
  {
    id: 'echo_runner',
    name: 'Echo Runner',
    description: 'Void-tuned vessel — corporate efficiency in every circuit',
    repairCost: 10,
    doctrineAffinity: 'corporate',
    captainBonus: { type: 'extract_bonus', amount: 6000 },
    captainBonusSecondary: { type: 'echo_on_collapse', amount: 1 },
    captainBonusDesc: 'Captain bonus: +6000 credits on extract, +1 voidEcho on collapse',
  },
];

export function getShipById(id: string): ShipDef | undefined {
  return SHIP_DEFS.find((s) => s.id === id);
}
