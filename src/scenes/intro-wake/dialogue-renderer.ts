/**
 * Dialogue Renderer - Speaker badge and text box rendering
 * Uses ss-ui-large-1 static asset for the dialogue container.
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

export function renderSpeakerBadge(display: typeof MakkoEngine.display, speaker: IntroSpeaker, alpha = 1): void {
  const colors = SPEAKER_COLORS[speaker];

  display.drawRect(SPEAKER_BADGE_X, SPEAKER_BADGE_Y, SPEAKER_BADGE_W, SPEAKER_BADGE_H, {
    fill: colors.bg,
    stroke: colors.border,
    lineWidth: 2,
    alpha,
  });

  const label = speaker === 'VALU' ? 'V.A.L.U.' : 'PLAYER';
  display.drawText(label, SPEAKER_BADGE_X + SPEAKER_BADGE_W / 2, SPEAKER_BADGE_Y + SPEAKER_BADGE_H / 2, {
    font: 'bold 18px monospace',
    fill: colors.text,
    align: 'center',
    baseline: 'middle',
    alpha,
  });
}

export function renderDialogueBox(
  display: typeof MakkoEngine.display,
  text: string,
  typewriterComplete: boolean,
  awaitingChoice: boolean,
  alpha = 1,
): void {
  // Draw ss-ui-large-1 as the dialogue container background
  const uiPanel = MakkoEngine.staticAsset('ss-ui-large-1');
  if (uiPanel) {
    // Scale the asset to fill the dialogue box region
    display.drawImage(uiPanel.image, TEXT_BOX_X - 20, TEXT_BOX_Y - 30, TEXT_BOX_W + 40, TEXT_BOX_H + 40, {
      alpha,
    });
  } else {
    // Fallback to drawn rectangles if asset not loaded
    display.drawRect(TEXT_BOX_X - 20, TEXT_BOX_Y - 10, TEXT_BOX_W + 40, TEXT_BOX_H + 20, {
      fill: '#0a0d14',
      alpha: 0.75 * alpha,
    });
    display.drawRect(TEXT_BOX_X, TEXT_BOX_Y, TEXT_BOX_W, TEXT_BOX_H, {
      fill: '#0d1420',
      stroke: '#2d3a4a',
      lineWidth: 1,
      alpha: 0.9 * alpha,
    });
  }

  // Text — inset proportionally to fit inside the ss-ui-large-1 prop frame
  // Native prop is 370×225, stretched to (TEXT_BOX_W+40) wide.
  // Prop has ~30px frame per side at native = ~30/370 ratio ≈ 8.1%
  const propW = TEXT_BOX_W + 40; // 1720
  const frameRatio = 30 / 370;
  const textInset = Math.ceil(propW * frameRatio); // ~140px per side
  const textX = TEXT_BOX_X - 20 + textInset;
  const textW = propW - textInset * 2;
  const textColor = '#e2e8f0';
  if (alpha > 0.01) {
    const clampedAlpha = Math.min(alpha, 1);
    renderWrappedText(text, textX, TEXT_BOX_Y + 22, textW, 30, textColor, '24px monospace', clampedAlpha);
  }

  // Continue prompt
  if (typewriterComplete && !awaitingChoice) {
    display.drawText('SPACE to continue...', textX + textW, TEXT_BOX_Y + TEXT_BOX_H - 30, {
      font: '18px monospace',
      fill: '#4a5568',
      align: 'right',
      baseline: 'bottom',
      alpha,
    });
  }
}
