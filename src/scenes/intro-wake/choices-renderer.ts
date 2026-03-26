/**
 * Choices Renderer - Card-based choice display with TacticCard face
 */

import { MakkoEngine } from '@makko/engine';
import { IntroChoice } from '../../content/intro-narrative';
import { CORE_CARDS, TacticCard } from '../../content/cards';
import { getIntroChoiceStats } from '../../content/intro-choice-stats';
import { wrapText } from './text-utils';
import { CHOICE_CARD_W, CHOICE_CARD_H, CHOICE_CARD_Y, CHOICE_CARD_GAP } from './layout';

const PRESSURE_COLORS: Record<string, string> = {
  low: '#68d391',
  medium: '#f6ad55',
  high: '#e53e3e',
};

function getCardById(cardId: string): TacticCard | undefined {
  return CORE_CARDS.find(c => c.id === cardId);
}

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
  // 1. Card background + border
  display.drawRect(rect.x, rect.y, rect.w, rect.h, {
    fill: '#1e2433',
    stroke: isPressed ? '#63b3ed' : isHovered ? '#90cdf4' : '#4a5568',
    lineWidth: isHovered || isPressed ? 2 : 1,
  });

  const card = getCardById(choice.cardId);
  const cardName = card?.name ?? choice.label;

  // 2. Card name
  display.drawText(cardName, rect.x + rect.w / 2, rect.y + 44, {
    font: 'bold 26px monospace',
    fill: isHovered ? '#ffffff' : '#e2e8f0',
    align: 'center',
    baseline: 'middle',
  });

  // 3. Card type tag
  display.drawText('[ TACTIC CARD ]', rect.x + rect.w / 2, rect.y + 80, {
    font: '14px monospace',
    fill: '#4ecdc4',
    align: 'center',
    baseline: 'middle',
  });

  // 4. First divider
  const divider1Y = rect.y + 100;
  display.drawLine(rect.x + 20, divider1Y, rect.x + rect.w - 20, divider1Y, {
    stroke: '#2d3a4a',
    lineWidth: 1,
  });

  // 5. Card description
  const description = card?.description ?? '';
  const descLines = wrapText(description, rect.w - 40, '19px monospace');
  const descStartY = rect.y + 120;
  const lineHeight = 26;

  for (let l = 0; l < descLines.length; l++) {
    display.drawText(descLines[l], rect.x + 20, descStartY + l * lineHeight, {
      font: '19px monospace',
      fill: '#a0aec0',
      align: 'left',
      baseline: 'top',
    });
  }

  // 6. Second divider
  const divider2Y = rect.y + 240;
  display.drawLine(rect.x + 20, divider2Y, rect.x + rect.w - 20, divider2Y, {
    stroke: '#2d3a4a',
    lineWidth: 1,
  });

  // 7. Consequence preview (condensed)
  const stats = getIntroChoiceStats(choice.id);
  if (!stats) return;

  const statsStartY = rect.y + 260;
  const rowSpacing = 28;
  const textX = rect.x + 24;
  let row = 0;

  // Credits
  const creditsColor = stats.credits > 500 ? '#68d391' : '#e2e8f0';
  display.drawText(`₡${stats.credits}`, textX, statsStartY + row * rowSpacing, {
    font: '17px monospace',
    fill: creditsColor,
    align: 'left',
    baseline: 'top',
  });
  row++;

  // Void Echo
  display.drawText(`+${stats.voidEcho} Void Echo`, textX, statsStartY + row * rowSpacing, {
    font: '17px monospace',
    fill: '#4ecdc4',
    align: 'left',
    baseline: 'top',
  });
  row++;

  // Debt pressure
  const pressureLabel = stats.debtPressure.toUpperCase();
  const pressureColor = PRESSURE_COLORS[stats.debtPressure] ?? '#e2e8f0';
  display.drawText(`Debt: ${pressureLabel}`, textX, statsStartY + row * rowSpacing, {
    font: '17px monospace',
    fill: pressureColor,
    align: 'left',
    baseline: 'top',
  });
}