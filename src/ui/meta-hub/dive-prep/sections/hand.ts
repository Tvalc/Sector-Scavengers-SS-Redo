// Starting Hand Section Renderer — No cards shown, button only

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../../types/state';
import { HAND_X, HAND_Y, SECTION_W, SECTION_H } from '../constants';
import { DivePrepAction } from '../types';
import {
  ACCENT, TEXT_MUTED, BORDER_DEFAULT, isOver
} from '../../../panel-layout';

export function renderHandSection(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  _meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  now: number,
): DivePrepAction | null {
  let action: DivePrepAction | null = null;
  const deckCards = divePrep.selectedCards ?? ['scavenge', 'repair', 'extract'];

  // ── Section background ──────────────────────────────────────────────────
  display.drawRoundRect(HAND_X, HAND_Y, SECTION_W, SECTION_H, 12, {
    fill: '#0d1117',
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  // Corner accents
  display.drawLine(HAND_X, HAND_Y, HAND_X + 30, HAND_Y, { stroke: ACCENT, lineWidth: 3 });
  display.drawLine(HAND_X, HAND_Y, HAND_X, HAND_Y + 30, { stroke: ACCENT, lineWidth: 3 });

  // ── Header strip ────────────────────────────────────────────────────────
  display.drawText('STARTING HAND', HAND_X + 25, HAND_Y + 25, {
    font: 'bold 22px monospace',
    fill: ACCENT,
    align: 'left',
    baseline: 'top',
  });

  // ── Deck count ───────────────────────────────────────────────────────────
  display.drawText(`${deckCards.length} cards in deck`, HAND_X + SECTION_W / 2, HAND_Y + 100, {
    font: 'bold 32px monospace',
    fill: TEXT_MUTED,
    align: 'center',
    baseline: 'top',
  });

  // ── Shuffle button ─────────────────────────────────────────────────────
  const shuffleW = 120;
  const shuffleH = 40;
  const shuffleX = HAND_X + (SECTION_W - shuffleW) / 2 - 70;
  const shuffleY = HAND_Y + 200;
  const shuffleHover = isOver(mx, my, shuffleX, shuffleY, shuffleW, shuffleH);

  const pulse = Math.sin((now % 1500) / 1500 * Math.PI * 2) * 0.3 + 0.7;
  if (shuffleHover) {
    display.drawRect(shuffleX - 3, shuffleY - 3, shuffleW + 6, shuffleH + 6, {
      fill: ACCENT,
      alpha: 0.25 * pulse,
    });
  }

  display.drawRoundRect(shuffleX, shuffleY, shuffleW, shuffleH, 6, {
    fill: shuffleHover ? '#1e4a7c' : '#0e3a5f',
    stroke: ACCENT,
    lineWidth: 2,
  });
  display.drawText('SHUFFLE', shuffleX + shuffleW / 2, shuffleY + shuffleH / 2, {
    font: 'bold 16px monospace',
    fill: '#ffffff',
    align: 'center',
    baseline: 'middle',
  });

  if (shuffleHover && input.isMouseReleased(0)) {
    action = { type: 'REROLL_HAND' };
  }

  // ── Details button ──────────────────────────────────────────────────────
  const detailsW = 120;
  const detailsH = 40;
  const detailsX = shuffleX + shuffleW + 20;
  const detailsY = shuffleY;
  const detailsHover = isOver(mx, my, detailsX, detailsY, detailsW, detailsH);

  display.drawRoundRect(detailsX, detailsY, detailsW, detailsH, 6, {
    fill: detailsHover ? '#1e293b' : '#0f172a',
    stroke: detailsHover ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText('DETAILS', detailsX + detailsW / 2, detailsY + detailsH / 2, {
    font: 'bold 16px monospace',
    fill: detailsHover ? ACCENT : '#a0aec0',
    align: 'center',
    baseline: 'middle',
  });

  if (detailsHover && input.isMouseReleased(0)) {
    action = { type: 'EXPAND_DIVE_PREP' };
  }

  return action;
}
