import type { DiveNodeType } from '../types/state';

/**
 * Simple seeded LCG random number generator.
 * Returns values in range [0, 1).
 */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = ((state * 1664525 + 1013904223) & 0xffffffff) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Generate a 10-node dive map with fork choices at rounds 4 and 8.
 *
 * Structure:
 * - Round 1: salvage
 * - Round 2: signal (30% chance) or salvage (70% chance)
 * - Round 3: salvage (loot node follows this round)
 * - Round 4: fork — left=salvage, right=signal (player chooses)
 * - Round 5: salvage
 * - Round 6: cache (70%) or salvage (30%)
 * - Round 7: audit
 * - Round 8: fork — left=salvage, right=signal (player chooses)
 * - Round 9: salvage (loot node follows this round)
 * - Round 10: boss
 *
 * Fork nodes initially have null in nodeMap until player makes choice.
 */
export function generateDiveMap(seed: number): {
  nodeMap: (DiveNodeType | null)[];
  forkOptions: Partial<Record<number, [DiveNodeType, DiveNodeType]>>;
} {
  const rand = createSeededRandom(seed);

  const nodeMap: (DiveNodeType | null)[] = [];
  const forkOptions: Partial<Record<number, [DiveNodeType, DiveNodeType]>> = {};

  // Round 1: salvage
  nodeMap.push('salvage');

  // Round 2: signal (30%) or salvage (70%)
  nodeMap.push(rand() < 0.3 ? 'signal' : 'salvage');

  // Round 3: salvage (loot node follows)
  nodeMap.push('salvage');

  // Round 4: fork — left=salvage, right=signal
  forkOptions[4] = ['salvage', 'signal'];
  nodeMap.push(null); // Will be resolved when player chooses

  // Round 5: salvage
  nodeMap.push('salvage');

  // Round 6: cache (70%) or salvage (30%)
  nodeMap.push(rand() < 0.7 ? 'cache' : 'salvage');

  // Round 7: audit
  nodeMap.push('audit');

  // Round 8: fork — left=salvage, right=signal
  forkOptions[8] = ['salvage', 'signal'];
  nodeMap.push(null); // Will be resolved when player chooses

  // Round 9: salvage (loot node follows)
  nodeMap.push('salvage');

  // Round 10: boss
  nodeMap.push('boss');

  return { nodeMap, forkOptions };
}
