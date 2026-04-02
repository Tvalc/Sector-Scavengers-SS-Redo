import type { RunPath, PathTreeNode, ShipNodeType } from '../types/state';
import type { DoctrineId } from '../content/doctrine';
import {
  EXPEDITION_DEBT_CEILING,
} from '../config/constants';

// ===== Seeded RNG =====

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = ((state * 1664525 + 1013904223) & 0xffffffff) >>> 0;
    return state / 0xffffffff;
  };
}

function pickRandom<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ===== Flavor Names =====

const SHIP_NAMES: Record<ShipNodeType, string[]> = {
  standard: ['Derelict Freighter', 'Abandoned Hauler', 'Drifting Cargo Ship', 'Scuttled Transport'],
  elite: ['Military Corvette', 'Armed Patrol Vessel', 'Black Ops Frigate'],
  miniboss: ['Hostile Warship'],
  boss: ['Command Flagship'],
  shop: ['Supply Depot', 'Trading Outpost'],
};

/** Danger rating derived from ship type. */
export const DANGER_RATING: Record<ShipNodeType, number> = {
  standard: 1,
  shop: 1,
  elite: 2,
  miniboss: 3,
  boss: 5,
};

// ===== Layer Configuration =====

const LAYER_TYPES: ShipNodeType[][] = [
  ['standard', 'shop', 'standard'],             // Layer 0: 3 nodes
  ['standard', 'elite', 'standard'],             // Layer 1: 3 nodes
  ['elite', 'standard', 'shop', 'standard'],     // Layer 2: 4 nodes
  ['standard', 'elite', 'standard'],             // Layer 3: 3 nodes
  ['elite', 'standard', 'standard', 'standard'], // Layer 4: 4 nodes
  ['boss'],                                       // Layer 5: 1 node (boss)
];

/** Layers that contain exactly one reward node. */
const REWARD_LAYERS = new Set([1, 3]);

// ===== Node Construction =====

let nodeCounter = 0;

function buildNode(
  layer: number,
  col: number,
  shipType: ShipNodeType,
  isReward: boolean,
  rand: () => number,
): PathTreeNode {
  const id = `n${nodeCounter++}_${layer}_${col}`;
  return {
    id,
    layer,
    col,
    shipType,
    visited: false,
    parentIds: [],
    childIds: [],
    isReward,
  };
}

// ===== Connection Logic =====

function linkNodes(parent: PathTreeNode, child: PathTreeNode): void {
  if (!parent.childIds.includes(child.id)) {
    parent.childIds.push(child.id);
  }
  if (!child.parentIds.includes(parent.id)) {
    child.parentIds.push(parent.id);
  }
}

function connectLayers(
  parents: PathTreeNode[],
  children: PathTreeNode[],
  rand: () => number,
): void {
  const pLen = parents.length;
  const cLen = children.length;

  // Special case: all parents connect to single child (boss convergence)
  if (cLen === 1) {
    for (const p of parents) {
      linkNodes(p, children[0]);
    }
    return;
  }

  // Primary connections: distribute parents evenly across children
  for (let p = 0; p < pLen; p++) {
    const c = Math.min(cLen - 1, Math.floor(p * cLen / pLen));
    linkNodes(parents[p], children[c]);
  }

  // Ensure every child has at least one parent
  for (let c = 0; c < cLen; c++) {
    if (children[c].parentIds.length === 0) {
      const p = Math.min(pLen - 1, Math.floor(c * pLen / cLen));
      linkNodes(parents[p], children[c]);
    }
  }

  // Add branching: extra connections (each node up to 2 connections per side)
  // Randomly add secondary child connections for ~50% of parents
  const shuffledParentIndices = Array.from({ length: pLen }, (_, i) => i);
  for (let i = shuffledParentIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffledParentIndices[i], shuffledParentIndices[j]] = [shuffledParentIndices[j], shuffledParentIndices[i]];
  }

  for (const pIdx of shuffledParentIndices) {
    const parent = parents[pIdx];
    if (parent.childIds.length >= 2) continue;
    if (rand() > 0.5) continue;

    // Find the primary child index to branch from
    const primaryChildId = parent.childIds[0];
    const primaryCIdx = children.findIndex(c => c.id === primaryChildId);

    // Try adjacent children (prefer direction based on RNG)
    const tryRight = rand() < 0.5;
    const offsets = tryRight ? [1, -1] : [-1, 1];

    for (const offset of offsets) {
      const targetCIdx = primaryCIdx + offset;
      if (targetCIdx < 0 || targetCIdx >= cLen) continue;
      const targetChild = children[targetCIdx];
      if (parent.childIds.includes(targetChild.id)) continue;
      if (targetChild.parentIds.length >= 2) continue;
      linkNodes(parent, targetChild);
      break;
    }
  }

  // Final safety: ensure no child has zero parents
  for (const child of children) {
    if (child.parentIds.length === 0) {
      linkNodes(parents[Math.floor(rand() * pLen)], child);
    }
  }
}

// ===== Path Generation =====

export function generateRunPath(seed: number): RunPath {
  nodeCounter = 0;
  const rand = createSeededRandom(seed);
  const layers: PathTreeNode[][] = [];

  // Build nodes for each layer
  for (let layerIdx = 0; layerIdx < LAYER_TYPES.length; layerIdx++) {
    const typeRow = LAYER_TYPES[layerIdx];
    const hasReward = REWARD_LAYERS.has(layerIdx);
    const rewardCol = hasReward ? Math.floor(rand() * typeRow.length) : -1;

    const layerNodes: PathTreeNode[] = typeRow.map((shipType, col) =>
      buildNode(layerIdx, col, shipType, hasReward && col === rewardCol, rand),
    );

    layers.push(layerNodes);
  }

  // Connect adjacent layers
  for (let i = 0; i < layers.length - 1; i++) {
    connectLayers(layers[i], layers[i + 1], rand);
  }

  // Flatten all nodes for lookup
  const allNodes: PathTreeNode[] = layers.flat();

  return {
    nodes: allNodes,
    layers,
    currentNodeId: null,
    pathCredits: 0,
    pathSalvage: [],
    pathItemsFound: [],
    pathHull: 100,
    pathShieldCharges: 0,
    pathDeck: [],
    pathDoctrineRunPoints: {
      corporate: 0,
      cooperative: 0,
      smuggler: 0,
    } as Record<DoctrineId, number>,
    pathBotsDeployed: 0,
    seed,
    // ── Expedition Debt System (initialized at expedition start) ───────────
    expeditionDebt: 0, // Set by expedition initialization based on crew/ship/research/modules
    expeditionDebtStarting: 0, // Set at expedition start
    expeditionDebtCeiling: EXPEDITION_DEBT_CEILING,
    expeditionMissedPayments: 0,
    expeditionBillingHistory: [],
    expeditionVictory: false,
    expeditionFailed: false,
    shipsCompleted: 0,
  };
}

// ===== Flavor Name Helper =====

/** Cosmetic ship name for a tree node. Deterministic from node id + seed. */
export function getNodeName(node: PathTreeNode, seed: number): string {
  const names = SHIP_NAMES[node.shipType];
  // Derive a stable index from node id hash
  let hash = 0;
  for (let i = 0; i < node.id.length; i++) {
    hash = ((hash << 5) - hash + node.id.charCodeAt(i)) | 0;
  }
  const idx = ((hash >>> 0) + seed) % names.length;
  return names[Math.abs(idx)];
}
