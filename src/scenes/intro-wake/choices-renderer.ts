/**
 * Choices Renderer - Card-based choice display
 */

import { MakkoEngine } from '@makko/engine';
import { IntroChoice } from '../../content/intro-narrative';
import { getIntroChoiceStats } from '../../content/intro-choice-stats';
import { wrapText } from './text-utils';
import { CHOICE_CARD_W, CHOICE_CARD_H, CHOICE_CARD_Y, CHOICE_CARD_GAP } from './layout';

const PRESSURE_COLORS: Record<string, string> = {
  low: '#68d391',
  medium: '#f6ad55',
  high: '#e53e3e',
};

export function getChoiceCardRects(count: number): Array<{ x: number; y: number; w: number; h: number }> {
  const totalW = count * CHOICE_CARD_W + (count - 1) * CHOICE_CARD_GAP;
  const startX = (1920 - totalW) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * (CHOICE_CARD_W + CHOICE_CARD_GAP),
    y: CHOICE_CARD_Y,
    w: CHOICE_CARD_W,
    h: CHOICE_CARD_H,
  }));
}

export function renderChoicesPanel(
  display: typeof MakkoEngine.display,
  choices: IntroChoice[],
  hoveredChoice: number,
  mouseDownOnChoice: number
): void {
  const rects = getChoiceCardRects(choices.length);

  // Prompt
  display.drawText('Choose your path:', 960, 220, {
    font: '22px monospace',
    fill: '#718096',
    align: 'center',
    baseline: 'middle',
  });

  for (let i = 0; i < choices.length; i++) {
    renderChoiceCard(display, choices[i], rects[i], hoveredChoice === i, mouseDownOnChoice === i);
  }
}

function renderChoiceCard(
  display: typeof MakkoEngine.display,
  choice: IntroChoice,
  rect: { x: number; y: number; w: number; h: number },
  isHovered: boolean,
  isPressed: boolean
): void {
  // Card background + border
  display.drawRect(rect.x, rect.y, rect.w, rect.h, {
    fill: '#1e2433',
    stroke: isPressed ? '#63b3ed' : isHovered ? '#90cdf4' : '#4a5568',
    lineWidth: isHovered || isPressed ? 2 : 1,
  });

  renderCardTitle(display, choice.label, rect, isHovered);
  renderCardStats(display, choice.id, rect);
}

function renderCardTitle(
  display: typeof MakkoEngine.display,
  label: string,
  rect: { x: number; y: number; w: number; h: number },
  isHovered: boolean
): void {
  const labelLines = wrapText(label, rect.w - 40, 'bold 28px monospace');
  const titleY = rect.y + 40;

  for (let l = 0; l < labelLines.length; l++) {
    display.drawText(labelLines[l], rect.x + rect.w / 2, titleY + l * 36, {
      font: 'bold 28px monospace',
      fill: isHovered ? '#ffffff' : '#e2e8f0',
      align: 'center',
      baseline: 'middle',
    });
  }

  // Divider below title
  const dividerY = rect.y + 60;
  display.drawLine(rect.x + 20, dividerY, rect.x + rect.w - 20, dividerY, {
    stroke: '#2d3a4a',
    lineWidth: 1,
  });
}

function renderCardStats(
  display: typeof MakkoEngine.display,
  choiceId: string,
  rect: { x: number; y: number; w: number; h: number }
): void {
  const stats = getIntroChoiceStats(choiceId);
  if (!stats) return;

  const statsStartY = rect.y + 90;
  const rowSpacing = 32;
  const textX = rect.x + 24;
  let row = 0;

  // Credits
  const creditsColor = stats.credits > 500 ? '#68d391' : '#e2e8f0';
  display.drawText(`₡${stats.credits}`, textX, statsStartY + row * rowSpacing, {
    font: '20px monospace',
    fill: creditsColor,
    align: 'left',
    baseline: 'top',
  });
  row++;

  // Void Echo
  display.drawText(`+${stats.voidEcho} Void Echo`, textX, statsStartY + row * rowSpacing, {
    font: '20px monospace',
    fill: '#4ecdc4',
    align: 'left',
    baseline: 'top',
  });
  row++;

  // Energy
  display.drawText(`${stats.energy} Energy`, textX, statsStartY + row * rowSpacing, {
    font: '20px monospace',
    fill: '#e2e8f0',
    align: 'left',
    baseline: 'top',
  });
  row++;

  // Debt with pressure
  const pressureLabel = stats.debtPressure.toUpperCase();
  const pressureColor = PRESSURE_COLORS[stats.debtPressure] ?? '#e2e8f0';
  display.drawText(`₡${stats.debt} Debt — `, textX, statsStartY + row * rowSpacing, {
    font: '20px monospace',
    fill: '#e2e8f0',
    align: 'left',
    baseline: 'top',
  });
  const debtLabelWidth = display.measureText(`₡${stats.debt} Debt — `, { font: '20px monospace' }).width;
  display.drawText(pressureLabel, textX + debtLabelWidth, statsStartY + row * rowSpacing, {
    font: '20px monospace',
    fill: pressureColor,
    align: 'left',
    baseline: 'top',
  });
  row++;

  // Crew
  const crewText = stats.crew.length > 0 ? stats.crew.join(', ') : 'Solo';
  const crewColor = stats.crew.length > 0 ? '#f6ad55' : '#718096';
  display.drawText(crewText, textX, statsStartY + row * rowSpacing, {
    font: '20px monospace',
    fill: crewColor,
    align: 'left',
    baseline: 'top',
  });
  row++;

  // Ship State (only if not damaged)
  if (stats.shipState !== 'damaged') {
    const shipLabel = stats.shipState === 'partially_repaired' ? 'Partially Repaired' : 'Stabilized';
    display.drawText(shipLabel, textX, statsStartY + row * rowSpacing, {
      font: '20px monospace',
      fill: '#e2e8f0',
      align: 'left',
      baseline: 'top',
    });
  }
}
