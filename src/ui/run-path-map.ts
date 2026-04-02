import { MakkoEngine } from '@makko/engine';
import type { RunPath, PathTreeNode, ShipNodeType, MetaState } from '../types/state';
import { DANGER_RATING } from '../dive/run-path-generator';

import { calculateShipBilling, getDebtAfterMiss, formatStrikes } from '../dive/expedition-billing';
import { formatDebt } from '../dive/expedition-starting-debt';

// ===== Layout Constants =====

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;
const PATH_CENTER_X = 960;
const PATH_WIDTH = 1400;
const PATH_LEFT = PATH_CENTER_X - PATH_WIDTH / 2;
const LAYER_TOP_Y = 100;
const LAYER_BOTTOM_Y = 1000;
const LAYER_COUNT = 6;
const LAYER_SPACING = (LAYER_BOTTOM_Y - LAYER_TOP_Y) / (LAYER_COUNT - 1);

const NODE_W = 180;
const NODE_H = 150;
const NODE_RADIUS = 12;

// ===== Scroll State =====

let scrollOffset = 0;
let scrollInitialized = false;

/** Total map height from top of first layer to bottom of last layer. */
const MAP_TOP = LAYER_TOP_Y;
const MAP_BOTTOM = LAYER_BOTTOM_Y + NODE_H;
const MAP_HEIGHT = MAP_BOTTOM - MAP_TOP;

const SCROLL_SPEED = 30;

/** Maximum scroll so bottom of map can reach bottom of viewport. */
function maxScroll(): number {
  return Math.max(0, MAP_HEIGHT - SCREEN_HEIGHT + 120);
}

function clampScroll(value: number): number {
  return Math.max(0, Math.min(value, maxScroll()));
}

/** Reset scroll state when entering the map screen. */
export function resetRunPathScroll(): void {
  scrollOffset = 0;
  scrollInitialized = false;
}

// ===== Color Palette =====

const NODE_FILL: Record<ShipNodeType, string> = {
  standard: '#475569',
  elite: '#f59e0b',
  miniboss: '#f97316',
  boss: '#ef4444',
  shop: '#14b8a6',
};

const ICON_LETTER: Record<ShipNodeType, string> = {
  standard: 'S',
  elite: 'E',
  miniboss: 'M',
  boss: 'B',
  shop: '$',
};

// ===== Helpers =====

/** Get the screen center-x for a node based on its layer's node count and its col. */
function nodeCenterX(layer: PathTreeNode[]): ((col: number) => number) {
  const n = layer.length;
  const gap = PATH_WIDTH / (n + 1);
  return (col: number) => PATH_LEFT + gap * (col + 1);
}

/** Get the top-left y for a layer index (before scroll offset). */
function layerBaseY(layerIdx: number): number {
  return LAYER_TOP_Y + layerIdx * LAYER_SPACING;
}

/** Get the scrolled y for a layer index. */
function layerY(layerIdx: number): number {
  return layerBaseY(layerIdx) - scrollOffset;
}

/** Node center position (with scroll). */
function nodePos(node: PathTreeNode, layers: PathTreeNode[][]): { cx: number; cy: number } {
  const ly = layerY(node.layer);
  const cx = nodeCenterX(layers[node.layer])(node.col);
  return { cx, cy: ly + NODE_H / 2 };
}

/** Hit test: is (mx, my) inside the node rect? */
function hitNode(mx: number, my: number, cx: number, cy: number): boolean {
  const left = cx - NODE_W / 2;
  const top = cy - NODE_H / 2;
  return mx >= left && mx <= left + NODE_W && my >= top && my <= top + NODE_H;
}

// ===== Main Renderer =====

/**
 * Render the branching tree path map.
 * @returns Clicked node ID, or null.
 */
export function renderRunPathMap(
  display: typeof MakkoEngine.display,
  runPath: RunPath,
  mx: number,
  my: number,
  now?: number,
  meta?: MetaState,
): string | null {
  const input = MakkoEngine.input;
  const timestamp = now ?? Date.now();
  const { layers, nodes } = runPath;

  // Build lookup: nodeId → node
  const nodeMap = new Map<string, PathTreeNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Determine current node
  const currentNode = runPath.currentNodeId ? nodeMap.get(runPath.currentNodeId) ?? null : null;

  // Auto-scroll to center on current node on first render
  if (!scrollInitialized) {
    const targetLayer = currentNode ? currentNode.layer : 0;
    const targetBaseY = layerBaseY(targetLayer) + NODE_H / 2;
    scrollOffset = clampScroll(targetBaseY - SCREEN_HEIGHT / 2);
    scrollInitialized = true;
  }

  // Handle scrolling via mouse wheel
  if (input.isScrollingUp()) {
    scrollOffset = clampScroll(scrollOffset - SCROLL_SPEED);
  }
  if (input.isScrollingDown()) {
    scrollOffset = clampScroll(scrollOffset + SCROLL_SPEED);
  }

  // Determine clickable node IDs
  const clickableIds = new Set<string>();
  if (!currentNode) {
    for (const n of layers[0]) {
      if (!n.visited) clickableIds.add(n.id);
    }
  } else {
    for (const cid of currentNode.childIds) {
      const child = nodeMap.get(cid);
      if (child && !child.visited) clickableIds.add(child.id);
    }
  }

  // Determine which nodes are on the visited path
  const visitedIds = new Set<string>();
  for (const n of nodes) {
    if (n.visited) visitedIds.add(n.id);
  }

  // Mouse state
  const isMouseReleased = input.isMouseReleased(0);
  let hoveredId: string | null = null;

  // ---- Background ----
  display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, { fill: '#0a0d14' });

  // ---- Title (fixed, not scrolled) ----
  display.drawText('SELECT YOUR TARGET', SCREEN_WIDTH / 2, 50, {
    font: 'bold 28px monospace',
    fill: '#ffffff',
    align: 'center',
  });

  // ---- Connecting Lines (bezier curves, scrolled) ----
  for (const node of nodes) {
    const { cx: x1, cy: y1 } = nodePos(node, layers);
    // Bottom center of parent node
    const startY = y1 + NODE_H / 2;
    for (const childId of node.childIds) {
      const child = nodeMap.get(childId);
      if (!child) continue;
      const { cx: x2, cy: y2 } = nodePos(child, layers);
      // Top center of child node
      const endY = y2 - NODE_H / 2;

      const bothVisited = node.visited && child.visited;
      const onActivePath = visitedIds.has(node.id) || clickableIds.has(child.id);

      const color = bothVisited ? '#4a5568' : '#1e293b';
      const alpha = onActivePath ? (bothVisited ? 1.0 : 0.4) : 0.15;

      // Bezier curve: control points at vertical midpoint
      const midY = (startY + endY) / 2;
      display.drawBezierCurve(
        x1, startY,
        x1, midY,
        x2, midY,
        x2, endY,
        {
          stroke: color,
          lineWidth: 3,
          alpha,
        },
      );
    }
  }

  // ---- Nodes (layer by layer, scrolled) ----
  for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
    const layerNodes = layers[layerIdx];
    const yTop = layerY(layerIdx);
    const getCX = nodeCenterX(layerNodes);

    for (const node of layerNodes) {
      const cx = getCX(node.col);
      const cy = yTop + NODE_H / 2;
      const isCurrent = currentNode !== null && node.id === currentNode.id;
      const isClickable = clickableIds.has(node.id);
      const isFuture = !node.visited && !isClickable && !isCurrent;
      const isHovered = hitNode(mx, my, cx, cy) && isClickable;

      if (isHovered) hoveredId = node.id;

      // Alpha
      let alpha = 1.0;
      if (node.visited && !isCurrent) alpha = 0.3;
      else if (isFuture) alpha = 0.15;
      else if (isCurrent) alpha = 0.6 + 0.4 * Math.sin(timestamp / 500);

      // Node background
      display.drawRoundRect(cx - NODE_W / 2, cy - NODE_H / 2, NODE_W, NODE_H, NODE_RADIUS, {
        fill: NODE_FILL[node.shipType],
        alpha,
      });

      // Border
      if (isCurrent) {
        display.drawRoundRect(cx - NODE_W / 2, cy - NODE_H / 2, NODE_W, NODE_H, NODE_RADIUS, {
          stroke: '#ffffff',
          lineWidth: 3,
          alpha: 0.6 + 0.4 * Math.sin(timestamp / 500),
        });
      } else if (isClickable) {
        display.drawRoundRect(cx - NODE_W / 2, cy - NODE_H / 2, NODE_W, NODE_H, NODE_RADIUS, {
          stroke: isHovered ? '#22d3ee' : '#ffffff',
          lineWidth: isHovered ? 3 : 2,
          alpha: isHovered ? 1.0 : 0.8,
        });
      } else {
        display.drawRoundRect(cx - NODE_W / 2, cy - NODE_H / 2, NODE_W, NODE_H, NODE_RADIUS, {
          stroke: '#1e293b',
          lineWidth: 1,
          alpha,
        });
      }

      // Hover glow for clickable (4px padding)
      if (isHovered) {
        display.drawRoundRect(
          cx - NODE_W / 2 - 4, cy - NODE_H / 2 - 4,
          NODE_W + 8, NODE_H + 8,
          NODE_RADIUS + 4,
          {
            stroke: '#22d3ee',
            lineWidth: 2,
            alpha: 0.4,
          },
        );
      }

      // Icon letter
      display.drawText(ICON_LETTER[node.shipType], cx, cy, {
        font: 'bold 36px sans-serif',
        fill: '#ffffff',
        align: 'center',
        baseline: 'middle',
        alpha: node.visited && !isCurrent ? 0.4 : 1.0,
      });

      // Current node indicator
      if (isCurrent) {
        display.drawText('◄ YOU ARE HERE', cx, cy - NODE_H / 2 - 18, {
          font: 'bold 12px monospace',
          fill: '#22d3ee',
          align: 'center',
        });
      }

      // Visited checkmark
      if (node.visited && !isCurrent) {
        display.drawText('✓', cx + NODE_W / 2 - 16, cy - NODE_H / 2 + 16, {
          font: 'bold 14px sans-serif',
          fill: '#22c55e',
          align: 'center',
          alpha: 0.8,
        });
      }
    }
  }

  // ---- Cursor ----
  display.setCursor(hoveredId ? 'pointer' : 'default');

  // ---- Stats Panel (fixed overlay, top-right, always visible) ----
  // Redesigned layout: larger panel with better spacing and 16px minimum fonts
  const statsX = 1540;
  const statsY = 80;
  const statsW = 350;
  const statsH = 420;
  const padding = 24;

  // Semi-transparent background panel
  display.drawRoundRect(statsX - padding, statsY - padding, statsW, statsH, 12, {
    fill: '#0a0d14',
    alpha: 0.9,
    stroke: '#334155',
    lineWidth: 2,
  });

  // Determine current ship number (1-based)
  const shipNumber = currentNode ? currentNode.layer + 1 : 1;

  // Title section
  let currentY = statsY;
  display.drawText('EXPEDITION STATUS', statsX, currentY, {
    font: 'bold 20px monospace',
    fill: '#ffffff',
    align: 'left',
  });

  currentY += 32;
  display.drawText(`SHIP ${shipNumber} OF 6`, statsX, currentY, {
    font: '16px monospace',
    fill: '#94a3b8',
    align: 'left',
  });

  // Credits section
  currentY += 28;
  display.drawText(`CREDITS: ₡${runPath.pathCredits.toLocaleString()}`, statsX, currentY, {
    font: 'bold 16px monospace',
    fill: '#f59e0b',
    align: 'left',
  });

  // Hull and Deck row
  currentY += 26;
  const hullColor = runPath.pathHull > 50 ? '#22c55e' : runPath.pathHull > 25 ? '#f59e0b' : '#ef4444';
  display.drawText(`HULL: ${runPath.pathHull}  |  DECK: ${runPath.pathDeck.length}`, statsX, currentY, {
    font: '16px monospace',
    fill: hullColor,
    align: 'left',
  });

  // Ships completed
  currentY += 24;
  display.drawText(`SHIPS COMPLETED: ${runPath.shipsCompleted}`, statsX, currentY, {
    font: '16px monospace',
    fill: '#94a3b8',
    align: 'left',
  });

  // Section separator line
  currentY += 24;
  display.drawLine(statsX, currentY, statsX + statsW - padding * 2, currentY, {
    stroke: '#334155',
    lineWidth: 1,
  });

  // ===== DEBT SECTION =====
  currentY += 24;
  const debtSectionStart = currentY;
  const barW = statsW - padding * 2;
  const barH = 12;

  // Current debt header
  display.drawText('EXPEDITION DEBT', statsX, currentY, {
    font: 'bold 18px monospace',
    fill: '#ffffff',
    align: 'left',
  });

  currentY += 26;
  const debtPercent = runPath.expeditionDebt / runPath.expeditionDebtCeiling;
  const debtWarningLevel = getDebtWarningLevel(debtPercent);
  const debtColor = getDebtColor(debtWarningLevel);

  display.drawText(`${formatDebt(runPath.expeditionDebt)}`, statsX, currentY, {
    font: 'bold 20px monospace',
    fill: debtColor,
    align: 'left',
  });

  // Debt ceiling bar
  currentY += 30;
  display.drawRoundRect(statsX, currentY, barW, barH, 6, { fill: '#1e293b' });
  if (debtPercent > 0) {
    display.drawRoundRect(statsX, currentY, barW * Math.min(debtPercent, 1), barH, 6, { fill: debtColor });
  }

  currentY += 20;
  display.drawText(`CEILING: ${formatDebt(runPath.expeditionDebtCeiling)}`, statsX + barW, currentY, {
    font: '14px monospace',
    fill: '#94a3b8',
    align: 'right',
    baseline: 'top',
  });

  // ===== NEXT BILLING SECTION =====
  currentY += 30;
  const nextBillingAmount = calculateShipBilling(runPath.expeditionDebt);
  const debtAfterPay = runPath.expeditionDebt - nextBillingAmount;
  const debtAfterMiss = getDebtAfterMiss(runPath.expeditionDebt);
  const debtAfterMissPercent = debtAfterMiss / runPath.expeditionDebtCeiling;

  display.drawText('NEXT BILLING (30%)', statsX, currentY, {
    font: 'bold 16px monospace',
    fill: '#ffffff',
    align: 'left',
  });

  currentY += 24;
  display.drawText(`${formatDebt(nextBillingAmount)}`, statsX, currentY, {
    font: 'bold 18px monospace',
    fill: '#f59e0b',
    align: 'left',
  });

  // Payment outcome preview
  currentY += 26;
  if (debtAfterMissPercent >= 0.8) {
    display.drawText(`⚠ MISS = ${formatDebt(debtAfterMiss)}`, statsX, currentY, {
      font: 'bold 16px monospace',
      fill: '#ef4444',
      align: 'left',
    });
  } else {
    display.drawText(`PAID → ${formatDebt(Math.max(0, debtAfterPay))}`, statsX, currentY, {
      font: '16px monospace',
      fill: '#22c55e',
      align: 'left',
    });
  }

  // ===== STRIKES SECTION =====
  currentY += 32;
  const strikesColor = runPath.expeditionMissedPayments >= 2 ? '#ef4444' : '#f59e0b';
  display.drawText(`STRIKES: ${formatStrikes(runPath.expeditionMissedPayments)}`, statsX, currentY, {
    font: 'bold 18px monospace',
    fill: strikesColor,
    align: 'left',
  });

  // ===== VICTORY/FAILED INDICATORS =====
  currentY += 32;
  if (runPath.expeditionVictory) {
    display.drawText('✓ DEBT CLEARED!', statsX, currentY, {
      font: 'bold 18px monospace',
      fill: '#22c55e',
      align: 'left',
    });
  } else if (runPath.expeditionFailed) {
    display.drawText('✗ EXPEDITION FAILED', statsX, currentY, {
      font: 'bold 18px monospace',
      fill: '#ef4444',
      align: 'left',
    });
  }

  // ---- Click Handling ----
  if (isMouseReleased && hoveredId && clickableIds.has(hoveredId)) {
    return hoveredId;
  }

  return null;
}

// ===== Debt Progress Helpers =====

type DebtWarningLevel = 'safe' | 'warning' | 'danger';

function getDebtWarningLevel(debtPercent: number): DebtWarningLevel {
  if (debtPercent < 0.5) return 'safe';
  if (debtPercent < 0.8) return 'warning';
  return 'danger';
}

function getDebtColor(level: DebtWarningLevel): string {
  switch (level) {
    case 'safe': return '#22c55e';    // Green
    case 'warning': return '#f59e0b'; // Yellow/Orange
    case 'danger': return '#ef4444'; // Red
    default: return '#94a3b8';
  }
}

function formatCompactCredits(n: number): string {
  if (n >= 1000000) return `₡${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₡${(n / 1000).toFixed(0)}K`;
  return `₡${n}`;
}
