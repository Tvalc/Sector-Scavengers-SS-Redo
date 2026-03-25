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
  | { type: 'sale_bonus_pct';          pct: number }
  | { type: 'wake_discount';           cells: number }
  | { type: 'repair_speed';            bonus: number }
  | { type: 'energy_cap_bonus';        amount: number }
  | { type: 'danger_chance_reduction'; amount: number }
  | { type: 'market_discount';         pct: number };

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
    description: 'Refinery that increases value of sold salvage.',
    upgrades: [
      {
        level: 1,
        creditCost: 400,
        salvageCost: { scrap: 2 },
        effect: { type: 'sale_bonus_pct', pct: 10 },
        description: 'Salvage sells for 10% more.',
      },
      {
        level: 2,
        creditCost: 800,
        salvageCost: { scrap: 3, components: 1 },
        effect: { type: 'sale_bonus_pct', pct: 20 },
        description: 'Salvage sells for 20% more.',
      },
      {
        level: 3,
        creditCost: 1500,
        salvageCost: { components: 2, relic: 1 },
        effect: { type: 'sale_bonus_pct', pct: 35 },
        description: 'Salvage sells for 35% more.',
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
        creditCost: 500,
        salvageCost: { components: 1 },
        effect: { type: 'wake_discount', cells: 0 },
        description: 'Cryo systems online. No discount yet.',
      },
      {
        level: 2,
        creditCost: 900,
        salvageCost: { components: 2 },
        effect: { type: 'wake_discount', cells: 1 },
        description: 'Wake cost \u22121 power cell.',
      },
      {
        level: 3,
        creditCost: 1600,
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
        creditCost: 350,
        salvageCost: { scrap: 3 },
        effect: { type: 'repair_speed', bonus: 1 },
        description: 'Ship repairs progress 1 faster per run.',
      },
      {
        level: 2,
        creditCost: 700,
        salvageCost: { scrap: 4, components: 1 },
        effect: { type: 'repair_speed', bonus: 1 },
        description: 'Repair speed +1 (total +2).',
      },
      {
        level: 3,
        creditCost: 1200,
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
        creditCost: 600,
        salvageCost: { components: 2 },
        effect: { type: 'energy_cap_bonus', amount: 1 },
        description: 'Max energy +1.',
      },
      {
        level: 2,
        creditCost: 1100,
        salvageCost: { components: 3 },
        effect: { type: 'energy_cap_bonus', amount: 1 },
        description: 'Max energy +1 (total +2).',
      },
      {
        level: 3,
        creditCost: 2000,
        salvageCost: { relic: 1, components: 2 },
        effect: { type: 'energy_cap_bonus', amount: 1 },
        description: 'Max energy +1 (total +3).',
      },
    ],
  },

  {
    id: 'command_deck',
    name: 'Command Deck',
    description: 'Tactical systems reduce danger encounter chances.',
    upgrades: [
      {
        level: 1,
        creditCost: 450,
        salvageCost: { medtech: 1 },
        effect: { type: 'danger_chance_reduction', amount: 0.03 },
        description: 'Danger chances \u22123%.',
      },
      {
        level: 2,
        creditCost: 900,
        salvageCost: { medtech: 2 },
        effect: { type: 'danger_chance_reduction', amount: 0.03 },
        description: 'Danger chances \u22123% (total \u22126%).',
      },
      {
        level: 3,
        creditCost: 1600,
        salvageCost: { medtech: 2, relic: 1 },
        effect: { type: 'danger_chance_reduction', amount: 0.04 },
        description: 'Danger chances \u22124% (total \u221210%).',
      },
    ],
  },

  {
    id: 'market_node',
    name: 'Market Node',
    description: 'Black-market connections reduce energy recharge cost.',
    upgrades: [
      {
        level: 1,
        creditCost: 300,
        salvageCost: {},
        effect: { type: 'market_discount', pct: 10 },
        description: 'Recharge energy costs 10% less.',
      },
      {
        level: 2,
        creditCost: 600,
        salvageCost: { scrap: 3, components: 1 },
        effect: { type: 'market_discount', pct: 10 },
        description: 'Recharge 10% less (total 20%).',
      },
      {
        level: 3,
        creditCost: 1200,
        salvageCost: { components: 2 },
        effect: { type: 'market_discount', pct: 15 },
        description: 'Recharge 15% less (total 35%).',
      },
    ],
  },
];

export function getModuleDef(id: ModuleId): ModuleDef | undefined {
  return MODULE_DEFS.find((m) => m.id === id);
}
