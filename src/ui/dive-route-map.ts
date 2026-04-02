import { MakkoEngine } from '@makko/engine';
import { RunState } from '../types/state';

interface RenderOptions {
  scrollOffset?: number;
  now?: number;
}

interface RenderResult {
  clickedRound: number | null;
  hoveredRound: number | null;
}

// Layout constants - scaled for 90% full screen dominance
const NODE_SPACING = 160; // Increased spacing to fill taller area
const PATH_WIDTH = 6; // Thicker path lines
const PATH_COLOR = '#2d3748';

const PAST_NODE_RADIUS = 30; // 60px diameter (was 40px)
const PAST_NODE_COLOR = '#4a5568';

const CURRENT_NODE_RADIUS = 40; // 80px diameter (was 60px)
const CURRENT_NODE_COLOR = '#22d3ee';

const FUTURE_NODE_RADIUS = 25; // 50px diameter (was 30px)
const FUTURE_NODE_FILL = '#2d3748';
const FUTURE_NODE_STROKE = '#4a5568';
const FUTURE_NODE_STROKE_WIDTH = 3; // Thicker to match scale

const HOVER_STROKE_COLOR = '#90cdf4';
const HOVER_STROKE_WIDTH = 4; // Thicker hover highlight

// Card symbol for past nodes (simple rectangle icon, scaled for larger nodes)
function drawCardSymbol(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  color: string,
): void {
  const size = 18; // Scaled up from 12 to match larger past nodes
  display.drawRect(x - size / 2, y - size / 2, size, size, {
    stroke: color,
    lineWidth: 3,
  });
  // Small inner line to suggest card detail
  display.drawLine(x - size / 4, y, x + size / 4, y, { stroke: color, lineWidth: 2 });
}

// Draw a node on the route
function drawNode(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke?: string,
  strokeWidth?: number,
  isHollow?: boolean,
): void {
  if (isHollow) {
    display.drawCircle(x, y, radius, {
      fill: fill,
      stroke: stroke,
      lineWidth: strokeWidth ?? 2,
    });
  } else {
    display.drawCircle(x, y, radius, { fill });
    if (stroke) {
      display.drawCircle(x, y, radius, { stroke, lineWidth: strokeWidth ?? 1 });
    }
  }
}

// Check if point is within a circular node
function hitTestNode(mx: number, my: number, x: number, y: number, radius: number): boolean {
  const dx = mx - x;
  const dy = my - y;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Render the dive route map as a vertical scrolling path.
 *
 * @param run - Current run state for round/maxRounds
 * @param mx - Mouse X in game coordinates
 * @param my - Mouse Y in game coordinates
 * @param options - Render options including scrollOffset and timestamp
 * @returns Object with clickedRound (past node clicked) and hoveredRound (node under mouse)
 *
 * Layout:
 * - Past nodes (1 to current-1): filled 40px circles at 120px spacing
 * - Current node: 60px pulsing circle with "ROUND X" label
 * - Future nodes: 30px hollow circles
 * - Vertical scroll support via scrollOffset (0 = start at current node area)
 */
export function renderDiveRouteMap(
  run: RunState,
  mx: number,
  my: number,
  options: RenderOptions = {},
): RenderResult {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  const { scrollOffset = 0, now = Date.now() } = options;

  const result: RenderResult = {
    clickedRound: null,
    hoveredRound: null,
  };

  const centerX = display.width / 2;
  const startY = display.height - 80; // Bottom anchor point

  // Total rounds to display
  const totalRounds = run.maxRounds;
  const currentRound = run.round;

  // Calculate positions for all rounds
  // scrollOffset: 0 means current round is near bottom visible area
  // Positive scrollOffset moves view up (shows more past rounds)
  const baseY = startY - scrollOffset;

  // Current round Y position (fixed relative to scroll)
  const currentRoundY = baseY - (currentRound - 1) * NODE_SPACING;

  // Collect all node positions
  const nodes: Array<{
    round: number;
    x: number;
    y: number;
    type: 'past' | 'current' | 'future';
  }> = [];

  for (let r = 1; r <= totalRounds; r++) {
    const y = baseY - (r - 1) * NODE_SPACING;
    let type: 'past' | 'current' | 'future';
    if (r < currentRound) type = 'past';
    else if (r === currentRound) type = 'current';
    else type = 'future';

    nodes.push({ round: r, x: centerX, y, type });
  }

  // Only render nodes that are visible on screen (with some padding)
  const visiblePadding = 100;
  const visibleNodes = nodes.filter(
    (n) => n.y > -visiblePadding && n.y < display.height + visiblePadding,
  );

  // Draw path lines connecting visible nodes
  if (visibleNodes.length > 1) {
    for (let i = 0; i < visibleNodes.length - 1; i++) {
      const curr = visibleNodes[i];
      const next = visibleNodes[i + 1];

      // Draw line from curr to next (bottom to top visually)
      display.drawLine(curr.x, curr.y, next.x, next.y, {
        stroke: PATH_COLOR,
        lineWidth: PATH_WIDTH,
      });
    }
  }

  // Draw nodes and handle interaction
  let hoveredNode: (typeof nodes)[0] | null = null;

  for (const node of visibleNodes) {
    // Hit test first to determine hover state
    let hitRadius: number;
    if (node.type === 'past') hitRadius = PAST_NODE_RADIUS + 5; // Larger hit area
    else if (node.type === 'current') hitRadius = CURRENT_NODE_RADIUS + 5;
    else hitRadius = FUTURE_NODE_RADIUS + 5;

    const isHovered = hitTestNode(mx, my, node.x, node.y, hitRadius);
    if (isHovered) {
      hoveredNode = node;
      result.hoveredRound = node.round;
    }

    // Draw based on node type
    if (node.type === 'past') {
      // Past node: filled circle with card symbol
      const hoverStroke = isHovered ? HOVER_STROKE_COLOR : undefined;
      const hoverWidth = isHovered ? HOVER_STROKE_WIDTH : undefined;

      drawNode(
        display,
        node.x,
        node.y,
        PAST_NODE_RADIUS,
        PAST_NODE_COLOR,
        hoverStroke,
        hoverWidth,
        false,
      );

      // Draw card symbol inside
      drawCardSymbol(display, node.x, node.y, '#1a202c');

      // Check click (only past nodes are clickable)
      if (isHovered && input.isMousePressed(0)) {
        result.clickedRound = node.round;
      }
    } else if (node.type === 'current') {
      // Current node: pulsing circle with label
      // Pulsing effect: radius oscillates slightly
      const pulse = Math.sin((now % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
      const pulseRadius = CURRENT_NODE_RADIUS + pulse * 4;

      // Outer glow ring
      display.drawCircle(node.x, node.y, pulseRadius + 8, {
        stroke: CURRENT_NODE_COLOR,
        lineWidth: 2,
        alpha: 0.3 + pulse * 0.2,
      });

      // Main node
      const hoverStroke = isHovered ? HOVER_STROKE_COLOR : undefined;
      const hoverWidth = isHovered ? HOVER_STROKE_WIDTH : undefined;

      drawNode(
        display,
        node.x,
        node.y,
        CURRENT_NODE_RADIUS,
        CURRENT_NODE_COLOR,
        hoverStroke,
        hoverWidth,
        false,
      );

      // "ROUND X" label above node
      display.drawText(`ROUND ${node.round}`, node.x, node.y - CURRENT_NODE_RADIUS - 25, {
        font: 'bold 18px monospace',
        fill: CURRENT_NODE_COLOR,
        align: 'center',
        baseline: 'bottom',
      });
    } else {
      // Future node: hollow circle
      const hoverStroke = isHovered ? HOVER_STROKE_COLOR : FUTURE_NODE_STROKE;
      const hoverWidth = isHovered ? HOVER_STROKE_WIDTH : FUTURE_NODE_STROKE_WIDTH;

      drawNode(
        display,
        node.x,
        node.y,
        FUTURE_NODE_RADIUS,
        FUTURE_NODE_FILL,
        hoverStroke,
        hoverWidth,
        true,
      );
    }
  }

  return result;
}
