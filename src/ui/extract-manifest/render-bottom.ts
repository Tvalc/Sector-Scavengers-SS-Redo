// Extract Manifest — Bottom Bar: Action Buttons

import { MakkoEngine } from '@makko/engine';
import { RunState, MetaState } from '../../types/state';
import { COLORS, LAYOUT, FONTS } from './constants';
import { ExtractManifestAction } from './types';
import { hitTest, drawButton } from './helpers';
import { declareAll } from './state';
import { buildDecisions } from './calculations';

export function renderBottomBar(
  display: typeof MakkoEngine.display,
  run: RunState,
  meta: MetaState,
  mx: number,
  my: number,
  isPressed: boolean,
  accentColor: string,
): ExtractManifestAction | null {
  const y = LAYOUT.bottomBarY;
  const btnHeight = LAYOUT.buttonHeight;

  const declareResult = renderDeclareAllButton(display, run, mx, my, isPressed, y, btnHeight);
  if (declareResult) return declareResult;

  renderCorporateBonusText(display, meta, y);

  const confirmResult = renderConfirmButton(display, run, mx, my, isPressed, accentColor, y, btnHeight);
  if (confirmResult) return confirmResult;

  return null;
}

function renderDeclareAllButton(
  display: typeof MakkoEngine.display,
  run: RunState,
  mx: number,
  my: number,
  isPressed: boolean,
  y: number,
  btnHeight: number,
): ExtractManifestAction | null {
  const declareAllWidth = 320;
  const declareAllX = 100;
  const declareAllHovered = hitTest(mx, my, declareAllX, y, declareAllWidth, btnHeight);

  const corporateBonus = false;
  const corporateBonusText = corporateBonus ? ' (+10%)' : '';
  const declareAllLabel = `DECLARE ALL${corporateBonusText}`;

  const clicked = drawButton(
    display,
    declareAllLabel,
    declareAllX,
    y,
    declareAllWidth,
    btnHeight,
    mx,
    my,
    isPressed && declareAllHovered,
    { stroke: COLORS.accentGreen, text: COLORS.accentGreen },
  );

  if (clicked) {
    declareAll(run.salvage.length);
    return { type: 'DECLARE_ALL' };
  }

  return null;
}

function renderCorporateBonusText(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  y: number,
): void {
  if (meta.doctrineLocked !== 'corporate') return;

  display.drawText('Corporate compliance bonus active', 100 + 320 / 2, y - 30, {
    font: FONTS.bodySmall,
    fill: COLORS.accentPurple,
    align: 'center',
  });
}

function renderConfirmButton(
  display: typeof MakkoEngine.display,
  run: RunState,
  mx: number,
  my: number,
  isPressed: boolean,
  accentColor: string,
  y: number,
  btnHeight: number,
): ExtractManifestAction | null {
  const confirmWidth = 280;
  const confirmX = display.width - confirmWidth - 100;
  const confirmHovered = hitTest(mx, my, confirmX, y, confirmWidth, btnHeight);

  const confirmBg = confirmHovered ? accentColor : COLORS.background;
  display.drawRoundRect(confirmX, y, confirmWidth, btnHeight, 10, {
    fill: confirmBg,
    stroke: accentColor,
    lineWidth: 3,
  });

  const confirmLabel = '[CONFIRM EXTRACTION]';
  const confirmMetrics = display.measureText(confirmLabel, { font: FONTS.button });
  display.drawText(confirmLabel, confirmX + (confirmWidth - confirmMetrics.width) / 2, y + btnHeight / 2 + 8, {
    font: FONTS.button,
    fill: confirmHovered ? COLORS.background : accentColor,
  });

  if (isPressed && confirmHovered) {
    return { type: 'CONFIRM_EXTRACT', decisions: buildDecisions(run.salvage) };
  }

  return null;
}
