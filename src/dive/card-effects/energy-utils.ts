import { ENERGY_OVERCHARGE_MULTIPLIER } from '../../config/constants';

/**
 * Apply overcharge multiplier to a value.
 * Returns the value multiplied by the overcharge multiplier (1.5×).
 */
export function applyOverchargeMultiplier(value: number): number {
  return Math.floor(value * ENERGY_OVERCHARGE_MULTIPLIER);
}
