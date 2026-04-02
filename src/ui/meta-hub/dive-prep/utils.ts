// Utility Functions for Dive Preparation

import { getItemById } from '../../../content/hardware';
import {
  CREW_X, CREW_Y, SHIP_X, SHIP_Y, HARDWARE_X, HARDWARE_Y, HAND_X, HAND_Y,
  SECTION_W, SECTION_H
} from './constants';

type HardwareItem = ReturnType<typeof getItemById>;

export function formatHardwareEffect(item: HardwareItem | null): string {
  if (!item) return '';

  const e = item.effect;
  switch (e.type) {
    case 'breach_chance_down':
      return `Danger −${Math.round(e.reduction * 100)}%`;
    case 'extract_bonus_flat':
      return `Extract +₡${e.amount}`;
    case 'starting_energy_bonus':
      return e.amount > 0 ? `Energy +${e.amount}` : 'No passive';
    case 'scavenge_bonus_flat':
      return `Scavenge +₡${e.amount}`;
    case 'hull_max_bonus':
      return `Hull max +${e.amount}`;
    case 'shield_start_bonus':
      return `Shields +${e.amount}`;
    case 'bot_damage_reduction':
      return 'Bot damage reduced';
    case 'hull_high_danger_reduction':
      return `Danger −${Math.round(e.reduction * 100)}% when hull > ${e.threshold}`;
    case 'shield_gain_bonus':
      return `Shield gains +${e.amount}`;
    case 'upgrade_no_hull_cost':
      return 'Upgrades cost no hull';
    case 'bot_credit_bonus_per_bot':
      return `+₡${e.amount} per bot on extract`;
    case 'hull_on_shield_block':
      return `+${e.amount} hull when blocking`;
    case 'shield_gain_and_danger_reduction':
      return `Shields +${e.shieldBonus}`;
    case 'void_echo_on_extract':
      return `+${e.amount} Echo on extract`;
    case 'void_echo_on_collapse':
      return `+${e.amount} Echo on collapse`;
    case 'void_echo_start':
      return `Start +${e.amount} Echo`;
    case 'hull_regen_per_round':
      return `Hull +${e.amount}/round`;
    case 'danger_reduction_at_hull':
      return `Danger −${Math.round(e.reduction * 100)}% when hull < ${e.threshold}`;
    case 'scavenge_danger_reduction':
      return `Scav danger −${Math.round(e.amount * 100)}%`;
    case 'relic_bonus_chance':
      return `${Math.round(e.chance * 100)}% relic chance`;
    default:
      return '';
  }
}

export function getDivePrepSectionBounds(): Record<string, { x: number; y: number; w: number; h: number }> {
  return {
    crew: { x: CREW_X, y: CREW_Y, w: SECTION_W, h: SECTION_H },
    ship: { x: SHIP_X, y: SHIP_Y, w: SECTION_W, h: SECTION_H },
    hardware: { x: HARDWARE_X, y: HARDWARE_Y, w: SECTION_W, h: SECTION_H },
    hand: { x: HAND_X, y: HAND_Y, w: SECTION_W, h: SECTION_H },
  };
}
