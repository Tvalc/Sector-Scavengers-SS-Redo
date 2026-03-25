export type ShipStatus = 'derelict' | 'repairing' | 'claimed';

export interface ShipDef {
  id: string;
  name: string;
  description: string;
  repairCost: number;
}

export const SHIP_DEFS: ShipDef[] = [
  {
    id: 'wraith',
    name: 'The Wraith',
    description: 'Fast scout ship, low hull',
    repairCost: 5,
  },
  {
    id: 'bulwark',
    name: 'Bulwark',
    description: 'Heavy freighter, high carry',
    repairCost: 8,
  },
  {
    id: 'vagrant',
    name: 'Vagrant',
    description: 'Salvage hauler, mid-tier',
    repairCost: 6,
  },
  {
    id: 'echo_runner',
    name: 'Echo Runner',
    description: 'Void-tuned vessel',
    repairCost: 10,
  },
];

export function getShipById(id: string): ShipDef | undefined {
  return SHIP_DEFS.find((s) => s.id === id);
}
