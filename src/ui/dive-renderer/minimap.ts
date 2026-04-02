import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../types/state';
import {
  MINIMAP_X, MINIMAP_Y, MINIMAP_W, MINIMAP_H,
  NODE_ICONS, NODE_COLORS, MINIMAP_PADDING_TOP,
} from './constants';
import {
  pressedForkRound, setPressedForkRound, resetPressedForkRound,
} from './state';

// Scaled up for larger minimap display
const NODE_SIZE = 16;
const NODE_GAP = 30;

interface MinimapResult {
  forkChoice: 'left' | 'right' | null;
}

/** Get danger magnitude color for forecast display */
function getMagnitudeColor(magnitude: 'low' | 'medium' | 'high'): string {
  switch (magnitude) {
    case 'low': return '#68d391'; // green
    case 'medium': return '#f59e0b'; // orange
    case 'high': return '#ef4444'; // red
    default: return '#718096';
  }
}

function renderForkOptions(
  display: typeof MakkoEngine.display,
  centerX: number,
  y: number,
  leftType: string,
  rightType: string,
): void {
  const leftX = centerX - 35;
  const rightX = centerX + 35;

  display.drawText(NODE_ICONS[leftType as keyof typeof NODE_ICONS], leftX, y, {
    font: '22px monospace',
    fill: NODE_COLORS[leftType as keyof typeof NODE_COLORS],
    align: 'center',
    baseline: 'middle',
  });

  display.drawText(NODE_ICONS[rightType as keyof typeof NODE_ICONS], rightX, y, {
    font: '22px monospace',
    fill: NODE_COLORS[rightType as keyof typeof NODE_COLORS],
    align: 'center',
    baseline: 'middle',
  });

  display.drawText('?', centerX, y, {
    font: 'bold 18px monospace',
    fill: '#718096',
    align: 'center',
    baseline: 'middle',
  });
}

function renderForkChoiceIndicator(
  display: typeof MakkoEngine.display,
  centerX: number,
  y: number,
  chosenType: string,
): void {
  const icon = NODE_ICONS[chosenType as keyof typeof NODE_COLORS];
  const color = NODE_COLORS[chosenType as keyof typeof NODE_COLORS];

  display.drawText(icon, centerX, y, {
    font: '22px monospace',
    fill: color,
    align: 'center',
    baseline: 'middle',
  });
}

function handleForkInput(
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  leftX: number,
  rightX: number,
  y: number,
  round: number,
  isCurrent: boolean,
): 'left' | 'right' | null {
  if (!isCurrent) return null;

  const leftHovered = mx >= leftX - 25 && mx <= leftX + 25 && my >= y - 15 && my <= y + 15;
  const rightHovered = mx >= rightX - 25 && mx <= rightX + 25 && my >= y - 15 && my <= y + 15;

  if (input.isMousePressed(0)) {
    if (leftHovered) setPressedForkRound(round as 4 | 8);
    if (rightHovered) setPressedForkRound(round as 4 | 8);
  }

  if (input.isMouseReleased(0)) {
    if (leftHovered && pressedForkRound === round) {
      resetPressedForkRound();
      return 'left';
    }
    if (rightHovered && pressedForkRound === round) {
      resetPressedForkRound();
      return 'right';
    }
    resetPressedForkRound();
  }

  return null;
}

function renderForkNode(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  run: RunState,
  mx: number,
  my: number,
  centerX: number,
  y: number,
  r: number,
  isCurrent: boolean,
  isPast: boolean,
): 'left' | 'right' | null {
  const forkOption = run.forkOptions[r as 4 | 8];
  if (!forkOption) return null;

  const [leftType, rightType] = forkOption;
  const hasChosen = run.forkChoices[r as 4 | 8] !== undefined;

  if (!hasChosen) {
    renderForkOptions(display, centerX, y, leftType, rightType);

    const leftX = centerX - 35;
    const rightX = centerX + 35;

    // Hover indicators
    if (isCurrent) {
      const leftHovered = mx >= leftX - 25 && mx <= leftX + 25 && my >= y - 15 && my <= y + 15;
      const rightHovered = mx >= rightX - 25 && mx <= rightX + 25 && my >= y - 15 && my <= y + 15;

      if (leftHovered) {
        display.drawCircle(leftX, y, 24, {
          stroke: '#90cdf4',
          lineWidth: 2,
          alpha: 0.5,
        });
      }
      if (rightHovered) {
        display.drawCircle(rightX, y, 24, {
          stroke: '#90cdf4',
          lineWidth: 2,
          alpha: 0.5,
        });
      }
    }

    return handleForkInput(input, mx, my, leftX, rightX, y, r, isCurrent);
  } else {
    const chosenChoice = run.forkChoices[r as 4 | 8];
    const chosenType = chosenChoice === 'left' ? leftType : rightType;
    renderForkChoiceIndicator(display, centerX, y, chosenType);
    return null;
  }
}

function renderNormalNode(
  display: typeof MakkoEngine.display,
  centerX: number,
  y: number,
  nodeType: string,
  isCurrent: boolean,
  isPast: boolean,
  now: number,
): void {
  const icon = NODE_ICONS[nodeType as keyof typeof NODE_ICONS];
  const color = NODE_COLORS[nodeType as keyof typeof NODE_COLORS];

  let displayColor = color;
  let displayIcon = icon;

  if (isCurrent) {
    const pulse = Math.sin((now % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
    display.drawCircle(centerX, y, 22 + pulse * 3, {
      stroke: '#22d3ee',
      lineWidth: 2,
      alpha: 0.3,
    });
    displayColor = '#22d3ee';
  } else if (isPast) {
    displayColor = '#48bb78';
    displayIcon = '✓';
  } else {
    displayColor = '#4a5568';
  }

  display.drawText(displayIcon, centerX, y, {
    font: '22px monospace',
    fill: displayColor,
    align: 'center',
    baseline: 'middle',
  });
}

function renderConnectingLine(
  display: typeof MakkoEngine.display,
  centerX: number,
  y: number,
  isPast: boolean,
): void {
  display.drawLine(centerX, y - NODE_GAP + 5, centerX, y - 8, {
    stroke: isPast ? '#48bb78' : '#2d3748',
    lineWidth: isPast ? 2 : 1,
  });
}

/** Render the minimap showing the dive node map */
export function renderMinimapAt(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  run: RunState,
  mx: number,
  my: number,
  now: number,
  mmX: number = MINIMAP_X,
  mmY: number = MINIMAP_Y,
): MinimapResult {
  // Minimap background - larger with rounded corners
  display.drawRoundRect(mmX, mmY, MINIMAP_W, MINIMAP_H, 12, {
    fill: '#0d1117',
    stroke: '#2d3748',
    lineWidth: 2,
  });

  // Label
  display.drawText('ROUTE', mmX + MINIMAP_W / 2, mmY + 12, {
    font: '14px monospace',
    fill: '#718096',
    align: 'center',
    baseline: 'top',
  });

  const startY = mmY + MINIMAP_PADDING_TOP; // Extra padding below ROUTE label
  const centerX = mmX + MINIMAP_W / 2;

  let forkChoice: 'left' | 'right' | null = null;

  for (let r = 1; r <= run.maxRounds; r++) {
    const y = startY + (r - 1) * NODE_GAP;
    const nodeIndex = r - 1;
    const nodeType = run.nodeMap[nodeIndex];
    const isCurrent = r === run.round;
    const isPast = r < run.round;
    const isFork = r === 4 || r === 8;

    if (isFork) {
      const choice = renderForkNode(display, input, run, mx, my, centerX, y, r, isCurrent, isPast);
      if (choice) forkChoice = choice;
    } else if (nodeType) {
      renderNormalNode(display, centerX, y, nodeType, isCurrent, isPast, now);
    } else {
      display.drawText('?', centerX, y, {
        font: '20px monospace',
        fill: '#4a5568',
        align: 'center',
        baseline: 'middle',
      });
    }

    // Render danger forecast indicator if available for this round
    const forecast = run.dangerForecast?.find(f => f.round === r);
    if (forecast && !isPast) {
      const forecastColor = getMagnitudeColor(forecast.magnitude);
      // Small indicator dot to the right of the node
      display.drawCircle(centerX + 20, y, 4, {
        fill: forecastColor,
        alpha: isCurrent ? 1 : 0.7,
      });
      // Magnitude letter
      display.drawText(forecast.magnitude[0].toUpperCase(), centerX + 20, y + 1, {
        font: 'bold 8px monospace',
        fill: '#0d1117',
        align: 'center',
        baseline: 'middle',
      });
    }

    if (r > 1) {
      renderConnectingLine(display, centerX, y, isPast);
    }
  }

  if (input.isMouseReleased(0) && pressedForkRound !== null) {
    resetPressedForkRound();
  }

  return { forkChoice };
}
