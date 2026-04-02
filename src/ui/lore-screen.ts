/**
 * Lore Screen — displays earned lore fragments after successful extracts.
 *
 * Dark background, crew attribution if applicable, typewriter-style text.
 * Returns 'CONTINUE' when dismissed via space or click.
 */

import { MakkoEngine } from '@makko/engine';
import type { CrewMemberId } from '../content/crew';
import { CREW_ROSTER } from '../content/crew';

const MAX_WIDTH = 900;
const LINE_HEIGHT = 28;
const FADE_DURATION = 500;
const TEXT_COLOR = '#e2e8f0';
const DIM_COLOR = '#718096';
const ACCENT_COLOR = '#22d3ee';

interface LoreScreenState {
  currentFragmentIndex: number;
  displayedChars: number;
  lastUpdateTime: number;
  complete: boolean;
  textStartY: number;
}

let state: LoreScreenState | null = null;
let fragments: string[] = [];
let crewId: CrewMemberId | null = null;

export function initLoreScreen(loreFragments: string[], attributionCrewId: CrewMemberId | null = null): void {
  fragments = loreFragments;
  crewId = attributionCrewId;
  state = {
    currentFragmentIndex: 0,
    displayedChars: 0,
    lastUpdateTime: performance.now(),
    complete: false,
    textStartY: 0,
  };
}

export function renderLoreScreen(
  display: typeof MakkoEngine.display,
  mx: number,
  my: number,
  now: number,
): 'CONTINUE' | null {
  if (!state || fragments.length === 0) return 'CONTINUE';

  const currentText = fragments[state.currentFragmentIndex];

  // Dark background
  display.drawRect(0, 0, display.width, display.height, {
    fill: '#0a0d14',
  });

  // Title
  display.drawText('LORE FRAGMENT', display.width / 2, 100, {
    font: 'bold 24px monospace',
    fill: ACCENT_COLOR,
    align: 'center',
    baseline: 'middle',
  });

  // Speaker badge (if crew-attributed)
  let speakerY = 160;
  if (crewId) {
    const crew = CREW_ROSTER[crewId];
    display.drawRect(display.width / 2 - 100, 140, 200, 36, {
      fill: '#1a2a3a',
      stroke: ACCENT_COLOR,
      lineWidth: 1,
    });
    display.drawText(`${crew.name} — ${crew.role}`, display.width / 2, 158, {
      font: 'bold 14px monospace',
      fill: ACCENT_COLOR,
      align: 'center',
      baseline: 'middle',
    });
    speakerY = 200;
  }

  // Calculate text layout
  const centerX = display.width / 2;
  const maxLineWidth = MAX_WIDTH;
  const textY = speakerY + 40;

  // Word wrap the current fragment
  const wrappedLines = wrapText(display, currentText, maxLineWidth);
  state.textStartY = textY;

  // Render wrapped lines with typewriter effect
  const totalChars = currentText.length;
  const typewriterSpeed = 30; // chars per second
  const elapsed = now - state.lastUpdateTime;
  const targetDisplayedChars = Math.min(totalChars, Math.floor(elapsed * typewriterSpeed / 1000));

  if (!state.complete && targetDisplayedChars >= totalChars) {
    state.complete = true;
  }
  state.displayedChars = targetDisplayedChars;

  // Render lines
  let charsRemaining = state.displayedChars;
  let currentY = textY;

  for (const line of wrappedLines) {
    if (charsRemaining <= 0) break;

    const charsToShow = Math.min(line.length, charsRemaining);
    const visibleText = line.substring(0, charsToShow);

    display.drawText(visibleText, centerX, currentY, {
      font: '18px monospace',
      fill: TEXT_COLOR,
      align: 'center',
      baseline: 'top',
    });

    charsRemaining -= charsToShow;
    currentY += LINE_HEIGHT;
  }

  // Fragment counter
  const counterText = `${state.currentFragmentIndex + 1} / ${fragments.length}`;
  display.drawText(counterText, display.width / 2, display.height - 180, {
    font: '14px monospace',
    fill: DIM_COLOR,
    align: 'center',
    baseline: 'middle',
  });

  // Continue prompt
  if (state.complete) {
    const pulse = Math.sin((now % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
    const alpha = 0.5 + pulse * 0.5;
    display.drawText('[ PRESS SPACE OR CLICK TO CONTINUE ]', display.width / 2, display.height - 100, {
      font: '16px monospace',
      fill: '#ffffff',
      align: 'center',
      baseline: 'middle',
      alpha,
    });
  }

  // Handle input
  const input = MakkoEngine.input;
  if (state.complete && (input.isKeyPressed('Space') || input.isMouseReleased(0))) {
    // Advance to next fragment or finish
    if (state.currentFragmentIndex < fragments.length - 1) {
      state.currentFragmentIndex++;
      state.displayedChars = 0;
      state.lastUpdateTime = now;
      state.complete = false;
    } else {
      // All fragments shown
      state = null;
      fragments = [];
      crewId = null;
      return 'CONTINUE';
    }
  }

  return null;
}

/**
 * Word wrap text into lines that fit within max width.
 */
function wrapText(display: typeof MakkoEngine.display, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = display.measureText(testLine, { font: '18px monospace' });

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Check if lore screen has pending fragments.
 */
export function hasPendingLore(): boolean {
  return fragments.length > 0;
}

/**
 * Clear lore screen state.
 */
export function clearLoreScreen(): void {
  state = null;
  fragments = [];
  crewId = null;
}
