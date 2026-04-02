// Station module definitions — 6 modules × 3 upgrade levels each.

import { SalvageTier } from './salvage';

export type ModuleId =
  | 'salvage_bay'
  | 'cryo_ward'
  | 'workshop'
  | 'power_core'
  | 'command_deck'
  | 'market_node';

export type ModuleEffect =
  | { type: 'audit_detection_reduction'; pct: number }
  | { type: 'wake_discount';           cells: number }
  | { type: 'repair_speed';            bonus: number }
  | { type: 'energy_cap_bonus';        amount: number }
  | { type: 'danger_chance_reduction'; amount: number }
  | { type: 'market_discount';         pct: number }
  | { type: 'debt_reduction';          amount: number };

export interface ModuleUpgrade {
  level: number;
  creditCost: number;
  salvageCost: Partial<Record<SalvageTier, number>>;
  effect: ModuleEffect;
  description: string;
}

export interface ModuleDef {
  id: ModuleId;
  name: string;
  description: string;
  upgrades: ModuleUpgrade[];
}

export const MODULE_DEFS: ModuleDef[] = [
  {
    id: 'salvage_bay',
    name: 'Salvage Bay',
    description: 'Off-manifest routing systems reduce audit detection rates.',
    upgrades: [
      {
        level: 1,
        creditCost: 8000,
        salvageCost: { scrap: 2 },
        effect: { type: 'audit_detection_reduction', pct: 5 },
        description: 'Audit detection \u22125%.',
      },
      {
        level: 2,
        creditCost: 18000,
        salvageCost: { scrap: 3, components: 1 },
        effect: { type: 'audit_detection_reduction', pct: 5 },
        description: 'Audit detection \u22125% (total \u221210%).',
      },
      {
        level: 3,
        creditCost: 40000,
        salvageCost: { components: 2, relic: 1 },
        effect: { type: 'audit_detection_reduction', pct: 5 },
        description: 'Audit detection \u22125% (total \u221215%).',
      },
    ],
  },

  {
    id: 'cryo_ward',
    name: 'Cryo Ward',
    description: 'Upgraded cryo systems reduce crew wake costs.',
    upgrades: [
      {
        level: 1,
        creditCost: 10000,
        salvageCost: { components: 1 },
        effect: { type: 'wake_discount', cells: 0 },
        description: 'Cryo systems online. No discount yet.',
      },
      {
        level: 2,
        creditCost: 22000,
        salvageCost: { components: 2 },
        effect: { type: 'wake_discount', cells: 1 },
        description: 'Wake cost \u22121 power cell.',
      },
      {
        level: 3,
        creditCost: 45000,
        salvageCost: { relic: 1 },
        effect: { type: 'wake_discount', cells: 1 },
        description: 'Wake cost \u22121 power cell (cumulative \u22122).',
      },
    ],
  },

  {
    id: 'workshop',
    name: 'Workshop',
    description: 'Speeds up ship repair progress each run.',
    upgrades: [
      {
        level: 1,
        creditCost: 7000,
        salvageCost: { scrap: 3 },
        effect: { type: 'repair_speed', bonus: 1 },
        description: 'Ship repairs progress 1 faster per run.',
      },
      {
        level: 2,
        creditCost: 16000,
        salvageCost: { scrap: 4, components: 1 },
        effect: { type: 'repair_speed', bonus: 1 },
        description: 'Repair speed +1 (total +2).',
      },
      {
        level: 3,
        creditCost: 35000,
        salvageCost: { components: 3 },
        effect: { type: 'repair_speed', bonus: 2 },
        description: 'Repair speed +2 (total +4).',
      },
    ],
  },

  {
    id: 'power_core',
    name: 'Power Core',
    description: 'Expands station power, increasing max energy.',
    upgrades: [
      {
        level: 1,
        creditCost: 12000,
        salvageCost: { components: 2 },
        effect: { type: 'energy_cap_bonus', amount: 1 },
        description: 'Max energy +1.',
      },
      {
        level: 2,
        creditCost: 28000,
        salvageCost: { components: 3 },
        effect: { type: 'energy_cap_bonus', amount: 1 },
        description: 'Max energy +1 (total +2).',
      },
      {
        level: 3,
        creditCost: 55000,
        salvageCost: { relic: 1, components: 2 },
        effect: { type: 'energy_cap_bonus', amount: 1 },
        description: 'Max energy +1 (total +3).',
      },
    ],
  },

  {
    id: 'command_deck',
    name: 'Command Deck',
    description: 'Tactical command center. Reduces danger and expedition debt pressure.',
    upgrades: [
      {
        level: 1,
        creditCost: 9000,
        salvageCost: { medtech: 1 },
        effect: { type: 'danger_chance_reduction', amount: 0.03 },
        description: 'Danger chances \u22123%. -₡100k starting debt.',
      },
      {
        level: 2,
        creditCost: 22000,
        salvageCost: { medtech: 2 },
        effect: { type: 'danger_chance_reduction', amount: 0.03 },
        description: 'Danger chances \u22123% (total \u22126%). -₡100k starting debt (total \u2212200k).',
      },
      {
        level: 3,
        creditCost: 45000,
        salvageCost: { medtech: 2, relic: 1 },
        effect: { type: 'danger_chance_reduction', amount: 0.04 },
        description: 'Danger chances \u22124% (total \u221210%). -₡100k starting debt (total \u2212300k).',
      },
    ],
  },

  {
    id: 'market_node',
    name: 'Market Node',
    description: 'Black-market connections reduce energy recharge cost and debt pressure.',
    upgrades: [
      {
        level: 1,
        creditCost: 6000,
        salvageCost: {},
        effect: { type: 'market_discount', pct: 10 },
        description: 'Recharge energy costs 10% less. -₡50k starting debt.',
      },
      {
        level: 2,
        creditCost: 14000,
        salvageCost: { scrap: 3, components: 1 },
        effect: { type: 'market_discount', pct: 10 },
        description: 'Recharge 10% less (total 20%). -₡50k starting debt (total \u2212100k).',
      },
      {
        level: 3,
        creditCost: 32000,
        salvageCost: { components: 2 },
        effect: { type: 'market_discount', pct: 15 },
        description: 'Recharge 15% less (total 35%). -₡50k starting debt (total \u2212150k).',
      },
    ],
  },
];

export function getModuleDef(id: ModuleId): ModuleDef | undefined {
  return MODULE_DEFS.find((m) => m.id === id);
}
