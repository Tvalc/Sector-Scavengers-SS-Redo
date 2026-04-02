// Expanded Hand View Renderer — No cards shown, text only

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../../types/state';
import { DivePrepAction } from '../types';
import {
  ACCENT, TEXT_SECONDARY, TEXT_MUTED
} from '../../../panel-layout';

export function renderExpandedHand(
  display: typeof MakkoEngine.display,
  _input: typeof MakkoEngine.input,
  _meta: MetaState,
  divePrep: DivePrepState,
  _mx: number,
  _my: number,
  _now: number,
  y: number,
  _h: number,
  _setAction: (a: DivePrepAction) => void,
): void {
  const deckCards = divePrep.selectedCards ?? ['scavenge', 'repair', 'extract'];

  // Info header
  display.drawText(`${deckCards.length} cards in your dive deck`, 1060, y + 40, {
    font: '24px monospace',
    fill: TEXT_SECONDARY,
    align: 'center',
    baseline: 'top',
  });

  display.drawText('Top 3 cards will be your opening hand', 1060, y + 75, {
    font: '18px monospace',
    fill: TEXT_MUTED,
    align: 'center',
    baseline: 'top',
  });

  // List first 3 cards as text
  const previewCards = deckCards.slice(0, 3);
  let cardY = y + 130;
  for (let i = 0; i < previewCards.length; i++) {
    display.drawText(`${i + 1}. ${previewCards[i]}`, 1110, cardY, {
      font: 'bold 28px monospace',
      fill: ACCENT,
      align: 'center',
      baseline: 'top',
    });
    cardY += 50;
  }
}
