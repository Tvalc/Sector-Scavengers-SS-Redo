import { MakkoEngine } from '@makko/engine';
import { RunState } from '../types/state';
import { TacticCard } from '../content/cards';
import { LOG_MAX_LINES } from '../config/constants';
import { SALVAGE_DEFS } from '../content/salvage';

export interface DiveAction {
  cardId: string;
}

// Card layout
const CARD_Y = 200;
const CARD_W = 440;
const CARD_H = 200;
const CARD_XS = [200, 720, 1240];

// Log panel
const LOG_X = 160;
const LOG_Y = 820;
const LOG_W = 1600;
const LOG_H = 200;
const LOG_MAX = LOG_MAX_LINES;

// Press tracking (module-level to survive frame boundaries)
let pressedIndex = -1;

function cardAt(mx: number, my: number): number {
  for (let i = 0; i < CARD_XS.length; i++) {
    const cx = CARD_XS[i];
    if (mx >= cx && mx <= cx + CARD_W && my >= CARD_Y && my <= CARD_Y + CARD_H) return i;
  }
  return -1;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line !== '') { lines.push(line); line = word; }
    else { line = candidate; }
  }
  if (line) lines.push(line);
  return lines;
}

export function renderDive(
  run: RunState,
  draft: TacticCard[],
  log: string[],
  mx: number,
  my: number,
): DiveAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  // ── Header bar ────────────────────────────────────────────────────────────
  display.drawRect(0, 0, 1920, 70, { fill: '#0d1117' });

  display.drawText(`DIVE  Round ${run.round} / ${run.maxRounds}`, 40, 35, {
    font: 'bold 28px monospace', fill: '#e2e8f0', align: 'left', baseline: 'middle',
  });

  const hullColor = run.hull > 60 ? '#68d391' : run.hull > 30 ? '#f6e05e' : '#fc8181';
  display.drawText(`Hull: ${run.hull}`, 960, 35, {
    font: 'bold 28px monospace', fill: hullColor, align: 'center', baseline: 'middle',
  });

  if (run.shieldCharges > 0) {
    display.drawText(`Shield: ${run.shieldCharges}`, 1880, 35, {
      font: '24px monospace', fill: '#90cdf4', align: 'right', baseline: 'middle',
    });
  }

  // Run credits
  display.drawText(`Credits: \u20a1${run.runCredits}`, 1400, 35, {
    font: 'bold 24px monospace', fill: '#f6e05e', align: 'left', baseline: 'middle',
  });

  // Items found indicator
  if (run.itemsFound.length > 0) {
    display.drawText(
      `Found: ${run.itemsFound.length} item${run.itemsFound.length !== 1 ? 's' : ''}`,
      1650,
      35,
      { font: '20px monospace', fill: '#f6ad55', align: 'left', baseline: 'middle' },
    );
  }

  // Salvage haul summary
  if (run.salvage.length > 0) {
    const haulText =
      'Haul: ' +
      run.salvage
        .map((e) => `${e.quantity}× ${SALVAGE_DEFS[e.tier].label}`)
        .join(', ');
    display.drawText(haulText, 600, 35, {
      font: '20px monospace', fill: '#a0aec0', align: 'left', baseline: 'middle',
    });
  }

  // ── Prompt ────────────────────────────────────────────────────────────────
  display.drawText('Select a tactic:', 960, 140, {
    font: '22px monospace', fill: '#718096', align: 'center', baseline: 'middle',
  });

  // ── Card buttons ──────────────────────────────────────────────────────────
  let clicked: DiveAction | null = null;

  if (input.isMousePressed(0)) pressedIndex = cardAt(mx, my);

  for (let i = 0; i < draft.length; i++) {
    const card = draft[i];
    const cx = CARD_XS[i];
    const hover = cardAt(mx, my) === i;

    display.drawRect(cx, CARD_Y, CARD_W, CARD_H, {
      fill: '#1e2433',
      stroke: hover ? '#90cdf4' : '#4a5568',
      lineWidth: 2,
    });

    display.drawText(card.name, cx + CARD_W / 2, CARD_Y + 44, {
      font: 'bold 28px monospace', fill: '#ffffff', align: 'center', baseline: 'middle',
    });

    const descLines = wrapText(card.description, 36);
    for (let l = 0; l < descLines.length; l++) {
      display.drawText(descLines[l], cx + CARD_W / 2, CARD_Y + 90 + l * 28, {
        font: '20px monospace', fill: '#a0aec0', align: 'center', baseline: 'top',
      });
    }

    if (input.isMouseReleased(0) && pressedIndex === i && hover) {
      clicked = { cardId: card.id };
    }
  }

  if (input.isMouseReleased(0)) pressedIndex = -1;

  // ── Event log ─────────────────────────────────────────────────────────────
  display.drawRect(LOG_X, LOG_Y, LOG_W, LOG_H, { fill: '#0d1117', stroke: '#2d3748', lineWidth: 1 });

  const visible = log.slice(-LOG_MAX);
  for (let i = 0; i < visible.length; i++) {
    display.drawText(visible[i], LOG_X + 16, LOG_Y + 16 + i * 28, {
      font: '18px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
    });
  }

  return clicked;
}
