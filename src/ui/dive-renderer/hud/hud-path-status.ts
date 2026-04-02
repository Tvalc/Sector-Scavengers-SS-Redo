import { MakkoEngine } from '@makko/engine';
import { RunState, RunPath, ShipNodeType } from '../../../types/state';

const NODE_COLORS: Record<ShipNodeType, string> = {
  standard: '#64748b',
  elite: '#f59e0b',
  miniboss: '#f97316',
  boss: '#ef4444',
  shop: '#14b8a6',
};

const NODE_LABELS: Record<ShipNodeType, string> = {
  standard: 'SALVAGE',
  elite: 'ELITE',
  miniboss: 'HOSTILE',
  boss: 'COMMAND',
  shop: 'DEPOT',
};

/** Render path status bar between HUD and card area */
export function renderPathStatusBar(
  display: typeof MakkoEngine.display,
  run: RunState,
  path: RunPath | null,
  x: number,
  y: number,
  width: number,
  alpha: number,
): void {
  if (!path) return;

  const barHeight = 40;
  // Tree model: count visited nodes for ship progress, total ships = 6
  const visitedCount = path.nodes.filter(n => n.visited).length;
  const currentShipNum = visitedCount + (path.currentNodeId && !path.nodes.find(n => n.id === path.currentNodeId)?.visited ? 1 : 0);
  const totalShips = 6;
  const nodeType = run.shipNodeType;
  const nodeColor = NODE_COLORS[nodeType];
  const nodeLabel = NODE_LABELS[nodeType];

  // Background bar
  display.drawRoundRect(x, y, width, barHeight, 6, {
    fill: '#0f172a',
    stroke: '#1e293b',
    lineWidth: 1,
    alpha,
  });

  // Ship indicator: "SHIP 3/6 — ELITE"
  display.drawText(
    `SHIP ${currentShipNum}/${totalShips} — ${nodeLabel}`,
    x + 20,
    y + barHeight / 2,
    {
      font: 'bold 14px monospace',
      fill: nodeColor,
      align: 'left',
      baseline: 'middle',
      alpha,
    },
  );

  // Path credits
  display.drawText(
    `PATH CREDITS: ₡${path.pathCredits.toLocaleString()}`,
    x + width / 2,
    y + barHeight / 2,
    {
      font: 'bold 13px monospace',
      fill: '#fbbf24',
      align: 'center',
      baseline: 'middle',
      alpha,
    },
  );

  // Path hull - HIDDEN: players track their own ship, not the path aggregate
  // The path hull is an internal mechanic, not something players should see
}
