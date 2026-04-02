// Extract Manifest — Left Column: Haul Summary

import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../types/state';
import { COLORS, LAYOUT, FONTS } from './constants';
import { formatCredits } from './helpers';
import { getDeclaredValue, getExtractionBonusPercent, getFinalHaulValue } from './calculations';
import { getSmuggledCount } from './state';

export function renderLeftColumn(
  display: typeof MakkoEngine.display,
  run: RunState,
  startY: number,
): void {
  const x = LAYOUT.leftX;
  let y = startY;

  display.drawText('HAUL SUMMARY', x, y, {
    font: FONTS.columnTitle,
    fill: COLORS.white,
  });
  y += 60;

  const declaredValue = getDeclaredValue(run.salvage);
  display.drawText('DECLARED SALVAGE', x, y, {
    font: FONTS.label,
    fill: COLORS.muted,
  });
  display.drawText(formatCredits(declaredValue), x + LAYOUT.leftW - 20, y, {
    font: FONTS.value,
    fill: COLORS.gold,
    align: 'right',
  });
  y += 50;

  const bonusPercent = getExtractionBonusPercent(run);
  if (bonusPercent > 0) {
    display.drawText(`+ EXTRACTION BONUS (${bonusPercent}%)`, x, y, {
      font: FONTS.label,
      fill: COLORS.accentCyan,
    });
    const bonusAmount = getFinalHaulValue(run) - declaredValue;
    display.drawText(formatCredits(bonusAmount), x + LAYOUT.leftW - 20, y, {
      font: FONTS.value,
      fill: COLORS.accentCyan,
      align: 'right',
    });
    y += 55;
  } else {
    y += 30;
  }

  display.drawLine(x, y, x + LAYOUT.leftW, y, {
    stroke: COLORS.grid,
    lineWidth: 2,
  });
  y += 35;

  const finalHaul = getFinalHaulValue(run);
  display.drawText('= TOTAL PAYOUT', x, y, {
    font: FONTS.body,
    fill: COLORS.white,
  });
  display.drawText(formatCredits(finalHaul), x + LAYOUT.leftW - 20, y, {
    font: FONTS.valueLarge,
    fill: COLORS.gold,
    align: 'right',
  });
  y += 70;

  display.drawText('DEBT REDUCTION', x, y, {
    font: FONTS.label,
    fill: COLORS.muted,
  });
  display.drawText(formatCredits(finalHaul), x + LAYOUT.leftW - 20, y, {
    font: FONTS.value,
    fill: COLORS.gold,
    align: 'right',
  });
  y += 60;

  renderKeptSalvage(display, run, x, y);
}

function renderKeptSalvage(
  display: typeof MakkoEngine.display,
  run: RunState,
  x: number,
  y: number,
): void {
  const totalValue = run.salvage.reduce((sum, entry) => sum + entry.valueEach * entry.quantity, 0);
  const declaredValue = getDeclaredValue(run.salvage);
  const keptValue = totalValue - declaredValue;

  if (keptValue <= 0) return;

  display.drawText('KEPT FOR BASE', x, y, {
    font: FONTS.label,
    fill: COLORS.muted,
  });
  display.drawText(formatCredits(keptValue), x + LAYOUT.leftW - 20, y, {
    font: FONTS.bodySmall,
    fill: COLORS.accentAmber,
    align: 'right',
  });
  y += 50;

  const smuggledCount = getSmuggledCount(run.salvage);
  display.drawText(`${smuggledCount} items marked [HIDDEN]`, x, y, {
    font: FONTS.bodySmall,
    fill: COLORS.accentAmber,
  });
}
