// Extract Manifest — State Management

import { RunState, MetaState } from '../../types/state';
import { SalvageEntry } from '../../content/salvage';
import { CrewVoiceLine, getExtractionReaction } from '../../content/crew-voice';

export type DecisionType = 'declare' | 'smuggle';

interface CrewReactionCache {
  crewId: string;
  line: CrewVoiceLine;
  ratio: number;
}

let decisionsMap = new Map<number, DecisionType>();
let crewReactionCache: CrewReactionCache | null = null;

export function initDecisions(salvage: SalvageEntry[]): void {
  if (decisionsMap.size !== salvage.length) {
    decisionsMap = new Map();
    for (let i = 0; i < salvage.length; i++) {
      decisionsMap.set(i, 'declare');
    }
    crewReactionCache = null;
  }
}

export function getDecision(index: number): DecisionType {
  return decisionsMap.get(index) ?? 'declare';
}

export function setDecision(index: number, decision: DecisionType): void {
  decisionsMap.set(index, decision);
  crewReactionCache = null;
}

export function declareAll(count: number): void {
  for (let i = 0; i < count; i++) {
    decisionsMap.set(i, 'declare');
  }
  crewReactionCache = null;
}

export function getCrewReaction(meta: MetaState, declaredRatio: number): CrewVoiceLine | null {
  if (crewReactionCache && Math.abs(crewReactionCache.ratio - declaredRatio) < 0.1) {
    return crewReactionCache.line;
  }

  const crewId = meta.leadId ?? meta.companionIds[0];
  if (!crewId) return null;

  const line = getExtractionReaction(crewId, declaredRatio);
  crewReactionCache = { crewId, line, ratio: declaredRatio };
  return line;
}

export function getDeclaredRatio(salvage: SalvageEntry[]): number {
  if (salvage.length === 0) return 1;
  const smuggled = getSmuggledCount(salvage);
  return (salvage.length - smuggled) / salvage.length;
}

export function getSmuggledCount(salvage: SalvageEntry[]): number {
  let count = 0;
  for (let i = 0; i < salvage.length; i++) {
    if (decisionsMap.get(i) === 'smuggle') count++;
  }
  return count;
}

export function getSmuggledIndices(salvage: SalvageEntry[]): number[] {
  const indices: number[] = [];
  for (let i = 0; i < salvage.length; i++) {
    if (decisionsMap.get(i) === 'smuggle') {
      indices.push(i);
    }
  }
  return indices;
}

export function resetState(): void {
  decisionsMap = new Map();
  crewReactionCache = null;
}
