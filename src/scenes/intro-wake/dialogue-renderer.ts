/**
 * Dialogue Renderer - Speaker badge and text box rendering
 */

import { MakkoEngine } from '@makko/engine';
import { IntroSpeaker } from '../../content/intro-narrative';
import { SPEAKER_COLORS } from './speaker-colors';
import { renderWrappedText } from './text-utils';
import {
  SPEAKER_BADGE_X,
  SPEAKER_BADGE_Y,
  SPEAKER_BADGE_W,
  SPEAKER_BADGE_H,
  TEXT_BOX_X,
  TEXT_BOX_Y,
  TEXT_BOX_W,
  TEXT_BOX_H,
} from './layout';

export function renderSpeakerBadge(display: typeof MakkoEngine.display, speaker: IntroSpeaker): void {
  const colors = SPEAKER_COLORS[speaker];

  display.drawRect(SPEAKER_BADGE_X, SPEAKER_BADGE_Y, SPEAKER_BADGE_W, SPEAKER_BADGE_H, {
    fill: colors.bg,
    stroke: colors.border,
    lineWidth: 2,
  });

  const label = speaker === 'VALU' ? 'V.A.L.U.' : 'JAX';
  display.drawText(label, SPEAKER_BADGE_X + SPEAKER_BADGE_W / 2, SPEAKER_BADGE_Y + SPEAKER_BADGE_H / 2, {
    font: 'bold 18px monospace',
    fill: colors.text,
    align: 'center',
    baseline: 'middle',
  });
}

export function renderDialogueBox(
  display: typeof MakkoEngine.display,
  text: string,
  typewriterComplete: boolean,
  awaitingChoice: boolean
): void {
  // Text box
  display.drawRect(TEXT_BOX_X, TEXT_BOX_Y, TEXT_BOX_W, TEXT_BOX_H, {
    fill: '#0d1420',
    stroke: '#2d3a4a',
    lineWidth: 1,
  });

  // Text
  renderWrappedText(text, TEXT_BOX_X + 30, TEXT_BOX_Y + 22, TEXT_BOX_W - 60, 30, '#e2e8f0');

  // Continue prompt
  if (typewriterComplete && !awaitingChoice) {
    display.drawText('SPACE to continue...', TEXT_BOX_X + TEXT_BOX_W - 30, TEXT_BOX_Y + TEXT_BOX_H - 30, {
      font: '18px monospace',
      fill: '#4a5568',
      align: 'right',
      baseline: 'bottom',
    });
  }
}
