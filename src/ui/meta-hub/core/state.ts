import { MetaState } from '../../../types/state';
import { LocalDivePrepState, ExpeditionErrorState } from './types';
import { resetDivePrepPagination } from '../dive-prep';

let localDivePrep: LocalDivePrepState | null = null;
let expeditionError: ExpeditionErrorState | null = null;

export function getLocalDivePrep(): LocalDivePrepState | null {
  return localDivePrep;
}

export function setLocalDivePrep(state: LocalDivePrepState | null): void {
  localDivePrep = state;
}

export function getExpeditionError(): ExpeditionErrorState | null {
  return expeditionError;
}

export function setExpeditionError(error: ExpeditionErrorState | null): void {
  expeditionError = error;
}

export function clearExpeditionError(): void {
  expeditionError = null;
}

export function initializeDivePrep(meta: MetaState): LocalDivePrepState {
  const claimedShips = meta.ships.filter(s => s.status === 'claimed');
  const shipWithCaptain = claimedShips.find(s => s.captainedBy !== null);
  const defaultShipId = shipWithCaptain?.id ?? null;

  return {
    selectedCrewId: meta.divePrep?.selectedCrewId ?? meta.leadId,
    selectedShipId: meta.divePrep?.selectedShipId ?? defaultShipId,
    equippedForDive: meta.divePrep?.equippedForDive ?? { ...meta.equippedItems },
    selectedCards: meta.divePrep?.selectedCards ?? ['scavenge', 'repair', 'extract'],
  };
}

export function ensureDivePrepInitialized(meta: MetaState): LocalDivePrepState {
  if (localDivePrep === null) {
    localDivePrep = initializeDivePrep(meta);
    resetDivePrepPagination();
  }
  return localDivePrep;
}

export function rerollStartingCards(newCards: string[]): void {
  if (localDivePrep) {
    localDivePrep.selectedCards = newCards;
  }
}
