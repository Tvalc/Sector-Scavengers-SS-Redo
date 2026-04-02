// Extract Manifest — Center Column: Salvage Manifest

import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../types/state';
import { SALVAGE_DEFS } from '../../content/salvage';
import { COLORS, LAYOUT, FONTS } from './constants';
import { hitTest } from './helpers';
import { getDecision, setDecision, getSmuggledIndices } from './state';

export function renderCenterColumn(
  display: typeof MakkoEngine.display,
  run: RunState,
  mx: number,
  my: number,
  isPressed: boolean,
  startY: number,
): void {
  const x = LAYOUT.centerX;
  let y = startY;

  display.drawText('SALVAGE MANIFEST', x, y, {
    font: FONTS.columnTitle,
    fill: COLORS.white,
  });
  y += 40;

  display.drawText('NEXUS CORP PURCHASE RATES', x, y, {
    font: FONTS.bodySmall,
    fill: COLORS.muted,
  });
  y += 40;

  if (run.salvage.length === 0) {
    renderEmptyState(display, x, y);
    return;
  }

  for (let i = 0; i < run.salvage.length; i++) {
    renderSalvageRow(display, run, i, mx, my, isPressed, x, y);
    y += LAYOUT.rowHeight;
  }
}

function renderEmptyState(display: typeof MakkoEngine.display, x: number, y: number): void {
  display.drawText('NO SALVAGE FOUND THIS RUN', x + LAYOUT.centerW / 2, y + 100, {
    font: FONTS.emptyState,
    fill: COLORS.muted,
    align: 'center',
  });
}

function renderSalvageRow(
  display: typeof MakkoEngine.display,
  run: RunState,
  index: number,
  mx: number,
  my: number,
  isPressed: boolean,
  x: number,
  y: number,
): void {
  const entry = run.salvage[index];
  const tierDef = SALVAGE_DEFS[entry.tier];
  const decision = getDecision(index);
  const isHidden = decision === 'smuggle';

  const rowBg = isHidden ? COLORS.hiddenBg : COLORS.background;
  const rowBorder = isHidden ? COLORS.hiddenBorder : COLORS.grid;

  display.drawRoundRect(x, y, LAYOUT.centerW, LAYOUT.rowHeight - 8, 8, {
    fill: rowBg,
    stroke: rowBorder,
    lineWidth: isHidden ? 3 : 2,
  });

  if (isHidden) {
    display.drawText('[HIDDEN]', x + 15, y + 14, {
      font: FONTS.buttonSmall,
      fill: COLORS.accentAmber,
    });
  }

  display.drawText(tierDef.label, x + 20, y + 42, {
    font: FONTS.body,
    fill: isHidden ? COLORS.muted : tierDef.color,
  });

  display.drawText(`×${entry.quantity}`, x + 180, y + 42, {
    font: FONTS.body,
    fill: isHidden ? COLORS.muted : COLORS.white,
  });

  display.drawText(`₡${entry.valueEach.toLocaleString()} each`, x + 260, y + 42, {
    font: FONTS.bodySmall,
    fill: COLORS.muted,
  });

  const entryTotal = entry.valueEach * entry.quantity;
  display.drawText(`= ₡${entryTotal.toLocaleString()}`, x + 420, y + 42, {
    font: FONTS.bodySmall,
    fill: isHidden ? COLORS.muted : COLORS.gold,
  });

  renderToggleButtons(display, index, decision, mx, my, isPressed, x, y);
}

function renderToggleButtons(
  display: typeof MakkoEngine.display,
  index: number,
  decision: 'declare' | 'smuggle',
  mx: number,
  my: number,
  isPressed: boolean,
  x: number,
  y: number,
): void {
  const btnWidth = 110;
  const btnHeight = 42;
  const btnY = y + 14;
  const declareX = x + LAYOUT.centerW - 240;
  const smuggleX = x + LAYOUT.centerW - 120;

  renderDeclareButton(display, declareX, btnY, btnWidth, btnHeight, decision, mx, my);
  renderSmuggleButton(display, smuggleX, btnY, btnWidth, btnHeight, decision, mx, my);

  if (isPressed) {
    const declareHovered = hitTest(mx, my, declareX, btnY, btnWidth, btnHeight);
    const smuggleHovered = hitTest(mx, my, smuggleX, btnY, btnWidth, btnHeight);

    if (declareHovered && decision !== 'declare') {
      setDecision(index, 'declare');
    } else if (smuggleHovered && decision !== 'smuggle') {
      setDecision(index, 'smuggle');
    }
  }
}

function renderDeclareButton(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  w: number,
  h: number,
  decision: 'declare' | 'smuggle',
  mx: number,
  my: number,
): void {
  const isHovered = hitTest(mx, my, x, y, w, h);
  const bgColor = decision === 'declare' ? `${COLORS.accentGreen}30` : isHovered ? '#252b3d' : COLORS.background;

  display.drawRoundRect(x, y, w, h, 8, {
    fill: bgColor,
    stroke: decision === 'declare' ? COLORS.accentGreen : COLORS.muted,
    lineWidth: 3,
  });

  display.drawText('[DECLARE]', x + w / 2, y + 28, {
    font: FONTS.buttonSmall,
    fill: decision === 'declare' ? COLORS.accentGreen : COLORS.muted,
    align: 'center',
  });
}

function renderSmuggleButton(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  w: number,
  h: number,
  decision: 'declare' | 'smuggle',
  mx: number,
  my: number,
): void {
  const isHovered = hitTest(mx, my, x, y, w, h);
  const bgColor = decision === 'smuggle' ? `${COLORS.accentAmber}30` : isHovered ? '#252b3d' : COLORS.background;

  display.drawRoundRect(x, y, w, h, 8, {
    fill: bgColor,
    stroke: decision === 'smuggle' ? COLORS.accentAmber : COLORS.muted,
    lineWidth: 3,
  });

  display.drawText('[SMUGGLE]', x + w / 2, y + 28, {
    font: FONTS.buttonSmall,
    fill: decision === 'smuggle' ? COLORS.accentAmber : COLORS.muted,
    align: 'center',
  });
}
