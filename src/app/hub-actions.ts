// Hub action availability helper — returns enabled/disabled state with reason strings.

import type { MetaState } from '../types/state';

export interface HubActionStatus {
  canDive: boolean;
  diveReason: string;
  nextBestHint: string;
  nextBestColor: '#68d391' | '#f6e05e' | '#f6ad55' | '#fc8181';
}

export function getHubAvailableActions(_meta: MetaState): HubActionStatus {
  return {
    canDive: true,
    diveReason: '',
    nextBestHint: '▶ START YOUR DIVE',
    nextBestColor: '#68d391',
  };
}
