/**
 * Choices Renderer - Renders actual game cards for intro choices
 *
 * Uses larger card sizing for the intro scene with clean card visuals.
 */

import { MakkoEngine } from '@makko/engine';
import { IntroChoice } from '../../content/intro-narrative';
import { CORE_CARDS, TacticCard } from '../../content/cards';
import { renderCard } from '../../ui/dive-renderer/cards';
import {
  getCardAlpha, initializeCardAlpha,
} from '../../ui/dive-renderer/state';
import {
  INTRO_CARD_W,
  INTRO_CARD_H,
  INTRO_CARD_GAP,
  DIALOGUE_BOTTOM,
  INTRO_CARD_Y_OFFSET,
} from './layout';

// Card radius for intro cards
const CARD_RADIUS = 14;

function getCardById(cardId: string): TacticCard | undefined {
  return CORE_CARDS.find(c => c.id === cardId);
}

export function getChoiceCardRects(count: number): Array<{ x: number; y: number; w: number; h: number }> {
  const totalW = count * INTRO_CARD_W + (count - 1) * INTRO_CARD_GAP;
  const startX = (1920 - totalW) / 2;
  const y = DIALOGUE_BOTTOM - INTRO_CARD_H + INTRO_CARD_Y_OFFSET;
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * (INTRO_CARD_W + INTRO_CARD_GAP),
    y,
    w: INTRO_CARD_W,
    h: INTRO_CARD_H,
  }));
}

export function renderChoicesPanel(
  display: typeof MakkoEngine.display,
  choices: IntroChoice[],
  hoveredChoice: number,
  mouseDownOnChoice: number,
  now: number = Date.now(),
): void {
  const rects = getChoiceCardRects(choices.length);

  // Render the actual game cards using shared renderCard
  for (let i = 0; i < choices.length; i++) {
    const card = getCardById(choices[i].cardId);
    if (!card) continue;

    const rect = rects[i];
    const isHovered = hoveredChoice === i;
    const isPressed = mouseDownOnChoice === i;

    // Calculate Y offset for hover/press effects
    let offsetY = 0;
    if (isHovered && !isPressed) {
      offsetY = -15;
    }
    if (isPressed) {
      offsetY = 3;
    }

    const drawY = rect.y + offsetY;

    // Use shared renderCard at intro size (alpha is handled internally)
    renderCard(
      display,
      card,
      rect.x,
      drawY,
      isHovered && !isPressed,
      false, // isLocked
      false, // isTargetCard
      now,
      false, // useIntroDesc
      undefined, // currentEnergy
      INTRO_CARD_W,
      INTRO_CARD_H,
    );

    // Hover glow effect (renderCard doesn't do this, so we add it here)
    if (isHovered && !isPressed) {
      display.drawRoundRect(rect.x - 6, drawY - 6, INTRO_CARD_W + 12, INTRO_CARD_H + 12, CARD_RADIUS + 6, {
        stroke: '#22d3ee',
        lineWidth: 2,
        alpha: 0.3,
      });
    }

    // Press effect overlay
    if (isPressed) {
      display.drawRoundRect(rect.x + 3, drawY + 3, INTRO_CARD_W - 6, INTRO_CARD_H - 6, CARD_RADIUS, {
        fill: '#000000',
        alpha: 0.2,
      });
    }
  }

  // Instruction text
  display.drawText('CLICK A CARD TO CHOOSE', 1920 / 2, DIALOGUE_BOTTOM + 24, {
    font: '18px monospace',
    fill: '#a0aec0',
    align: 'center',
    baseline: 'top',
  });
}

/** Initialize alpha fade-in for intro choice cards */
export function triggerIntroCardBeams(choices: IntroChoice[]): void {
  for (let i = 0; i < choices.length; i++) {
    // Initialize cards with alpha=0, they will fade in via alpha tracking
    initializeCardAlpha(choices[i].cardId);
  }
}
