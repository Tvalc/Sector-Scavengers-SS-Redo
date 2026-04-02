// Extract Manifest — Right Column: Audit Risk & Crew

import { MakkoEngine } from '@makko/engine';
import { RunState, MetaState } from '../../types/state';
import { SALVAGE_DEFS } from '../../content/salvage';
import { getAuditDetectionRate } from '../../dive/audit';
import { computeModuleEffects } from '../../app/module-effects';
import { SMUGGLER_DOCTRINE_AUDIT_BONUS } from '../../config/constants';
import { COLORS, LAYOUT, FONTS } from './constants';
import { wrapText } from './helpers';
import { getCrewReaction, getSmuggledIndices, getDeclaredRatio } from './state';
import { calculateSuspicionLevel, getKeptSalvage } from './calculations';

export function renderRightColumn(
  display: typeof MakkoEngine.display,
  run: RunState,
  meta: MetaState,
  accentColor: string,
  startY: number,
): void {
  const x = LAYOUT.rightX;
  let y = startY;

  display.drawText('AUDIT RISK', x, y, {
    font: FONTS.columnTitle,
    fill: COLORS.white,
  });
  y += 70;

  y = renderAuditRiskItems(display, run, meta, x, y);
  y = renderSuspicionMeter(display, run, x, y);
  y = renderReductionSummary(display, run, meta, x, y);
  y = renderPenaltyWarning(display, run, x, y);

  renderCrewReaction(display, meta, run, accentColor, x);
}

function renderAuditRiskItems(
  display: typeof MakkoEngine.display,
  run: RunState,
  meta: MetaState,
  x: number,
  y: number,
): number {
  const smuggledIndices = getSmuggledIndices(run.salvage);

  if (smuggledIndices.length === 0) {
    display.drawText('NO CONCEALED ITEMS', x + LAYOUT.rightW / 2, y + 60, {
      font: FONTS.emptyState,
      fill: COLORS.accentGreen,
      align: 'center',
    });
    return y + 120;
  }

  const modFx = computeModuleEffects(meta.moduleLevels);
  const salvageBayReduction = (modFx.salvageBayLevel ?? 0) * 5;
  const smugglerBonus = meta.doctrineLocked === 'smuggler';

  for (const idx of smuggledIndices) {
    const entry = run.salvage[idx];
    const tierDef = SALVAGE_DEFS[entry.tier];

    let detectionRate = getAuditDetectionRate(entry.tier, run.auditReduction, smugglerBonus);
    detectionRate = Math.max(0, detectionRate - salvageBayReduction / 100);
    const detectionPct = Math.round(detectionRate * 100);

    const riskColor = detectionPct > 50 ? COLORS.red : detectionPct > 25 ? COLORS.accentAmber : COLORS.accentGreen;

    display.drawText(tierDef.label, x, y, {
      font: FONTS.riskLabel,
      fill: tierDef.color,
    });
    display.drawText(`${detectionPct}%`, x + LAYOUT.rightW - 20, y, {
      font: FONTS.riskValue,
      fill: riskColor,
      align: 'right',
    });
    y += 40;
  }

  return y + 20;
}

function renderSuspicionMeter(
  display: typeof MakkoEngine.display,
  run: RunState,
  x: number,
  y: number,
): number {
  const smuggledCount = getSmuggledIndices(run.salvage).length;
  if (smuggledCount === 0) return y;

  display.drawText('SUSPICION LEVEL', x, y, {
    font: FONTS.body,
    fill: COLORS.accentAmber,
  });
  y += 40;

  const meterW = LAYOUT.rightW;
  const meterH = 24;

  display.drawRoundRect(x, y, meterW, meterH, 12, {
    fill: COLORS.background,
    stroke: COLORS.grid,
    lineWidth: 2,
  });

  const suspicionPct = calculateSuspicionLevel(run.salvage);
  const fillW = meterW * suspicionPct;
  const fillColor = suspicionPct > 0.5 ? COLORS.accentRed : suspicionPct > 0.25 ? COLORS.accentAmber : COLORS.accentGreen;

  if (fillW > 0) {
    display.drawRoundRect(x, y, fillW, meterH, 12, {
      fill: fillColor,
    });
  }

  y += 50;

  if (suspicionPct > 0.5) {
    display.drawText('HIGH CONCEALMENT RISK', x + meterW / 2, y, {
      font: FONTS.body,
      fill: COLORS.accentRed,
      align: 'center',
    });
  } else if (suspicionPct > 0.25) {
    display.drawText('MODERATE CONCEALMENT', x + meterW / 2, y, {
      font: FONTS.bodySmall,
      fill: COLORS.accentAmber,
      align: 'center',
    });
  }

  return y + 50;
}

function renderReductionSummary(
  display: typeof MakkoEngine.display,
  run: RunState,
  meta: MetaState,
  x: number,
  y: number,
): number {
  const modFx = computeModuleEffects(meta.moduleLevels);
  const salvageBayReduction = (modFx.salvageBayLevel ?? 0) * 5;
  const totalReduction = run.auditReduction + salvageBayReduction;

  display.drawLine(x, y, x + LAYOUT.rightW, y, {
    stroke: COLORS.grid,
    lineWidth: 2,
  });
  y += 30;

  display.drawText(`MANIFEST REDUCTION: −${totalReduction}%`, x, y, {
    font: FONTS.body,
    fill: COLORS.accentGreen,
  });
  y += 40;

  if (meta.doctrineLocked === 'smuggler') {
    display.drawText(`SMUGGLER BONUS: −${SMUGGLER_DOCTRINE_AUDIT_BONUS}%`, x, y, {
      font: FONTS.body,
      fill: COLORS.accentPurple,
    });
    y += 40;
  }

  return y;
}

function renderPenaltyWarning(
  display: typeof MakkoEngine.display,
  run: RunState,
  x: number,
  y: number,
): number {
  const smuggledIndices = getSmuggledIndices(run.salvage);
  if (smuggledIndices.length === 0) return y;

  y += 20;

  let maxValue = 0;
  for (const idx of smuggledIndices) {
    const entry = run.salvage[idx];
    const itemValue = entry.valueEach * entry.quantity;
    if (itemValue > maxValue) maxValue = itemValue;
  }

  const AUDIT_PENALTY_MULTIPLIER = 2;
  const exampleFine = Math.floor(maxValue * AUDIT_PENALTY_MULTIPLIER);

  display.drawText('CATCH PENALTY', x, y, {
    font: FONTS.body,
    fill: COLORS.accentRed,
  });
  y += 35;
  display.drawText(`Caught items lost + ₡${exampleFine.toLocaleString()} fine`, x, y, {
    font: FONTS.bodySmall,
    fill: COLORS.muted,
  });

  return y + 60;
}

function renderCrewReaction(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  run: RunState,
  accentColor: string,
  x: number,
): void {
  const y = LAYOUT.crewPanelY;
  const declaredRatio = getDeclaredRatio(run.salvage);
  const crewLine = getCrewReaction(meta, declaredRatio);

  if (!crewLine) return;

  display.drawRoundRect(x, y, LAYOUT.rightW, 160, 10, {
    fill: COLORS.background,
    stroke: accentColor,
    lineWidth: 2,
  });

  display.drawText(`${crewLine.speaker}:`, x + 20, y + 30, {
    font: FONTS.crewSpeaker,
    fill: accentColor,
  });

  const maxWidth = LAYOUT.rightW - 40;
  const lines = wrapText(display, crewLine.line, maxWidth, FONTS.crewText);
  let lineY = y + 65;

  for (const line of lines) {
    display.drawText(line, x + 20, lineY, {
      font: FONTS.crewText,
      fill: COLORS.white,
    });
    lineY += 26;
  }
}
