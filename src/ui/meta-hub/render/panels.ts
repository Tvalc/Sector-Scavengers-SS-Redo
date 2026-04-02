import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../../types/state';
import { ALL_CARDS } from '../../../content/cards';
import { SHIP_DEFS } from '../../../content/ships';
import { DOCTRINE_COLORS, COLOR, ERROR_PANEL } from '../core/constants';
import { getPanelNameForResource, getResourceLabel } from '../core/utils';
import { MAX_DEBT_BEFORE_GAME_OVER, BASE_BILLING_AMOUNT } from '../../../config/constants';

export function renderProgressOverlay(
  display: typeof MakkoEngine.display,
  meta: MetaState,
): void {
  const startX = 1010;
  let y = -10;

  // Expand height to accommodate debt info
  display.drawRoundRect(startX - 10, y - 8, 320, 170, 8, {
    fill: '#0a0e14',
    alpha: 0.25,
  });

  // Debt indicator (most important)
  const debtPercent = meta.debt / MAX_DEBT_BEFORE_GAME_OVER;
  const debtColor = getDebtProgressColor(debtPercent);
  const debtLabel = debtPercent < 0.5 ? 'Debt' : debtPercent < 0.8 ? 'DEBT' : 'CRITICAL DEBT';

  display.drawText(`${debtLabel}: ${formatCompactCredits(meta.debt)}`, startX, y, {
    font: 'bold 16px monospace',
    fill: debtColor,
    align: 'left',
    baseline: 'top',
  });
  y += 20;

  // Debt progress mini-bar
  const barW = 100;
  const barH = 6;
  display.drawRoundRect(startX, y, barW, barH, 3, { fill: '#1e293b' });
  if (debtPercent > 0) {
    display.drawRoundRect(startX, y, barW * Math.min(debtPercent, 1), barH, 3, { fill: debtColor });
  }
  display.drawText(`${Math.round(debtPercent * 100)}%`, startX + barW + 6, y - 2, {
    font: 'bold 12px monospace',
    fill: debtColor,
    align: 'left',
    baseline: 'top',
  });
  y += 20;

  // Next billing estimate
  const activeCrew = (meta.leadId !== null ? 1 : 0) + meta.companionIds.length;
  const nextBill = BASE_BILLING_AMOUNT + activeCrew * meta.upkeepPerAwakeCrew;
  display.drawText(`Next bill: ${formatCompactCredits(nextBill)}`, startX, y, {
    font: '13px monospace',
    fill: '#718096',
    align: 'left',
    baseline: 'top',
  });
  y += 22;

  const unlockedCount = ALL_CARDS.filter(c => c.rarity === 'starter' || meta.unlockedCards.includes(c.id)).length;
  display.drawText(`Cards: ${unlockedCount}/${ALL_CARDS.length}`, startX, y, {
    font: 'bold 14px monospace',
    fill: '#000000',
    align: 'left',
    baseline: 'top',
  });
  y += 20;

  const shipsRepaired = meta.ships.filter(s => s.status === 'claimed').length;
  display.drawText(`Ships: ${shipsRepaired}/${SHIP_DEFS.length}`, startX, y, {
    font: 'bold 14px monospace',
    fill: '#000000',
    align: 'left',
    baseline: 'top',
  });
  y += 20;

  const modulesBuilt = Object.values(meta.moduleLevels).filter(l => l > 0).length;
  display.drawText(`Modules: ${modulesBuilt}/6`, startX, y, {
    font: 'bold 14px monospace',
    fill: '#000000',
    align: 'left',
    baseline: 'top',
  });
}

// ===== Debt Progress Helpers =====

function getDebtProgressColor(debtPercent: number): string {
  if (debtPercent < 0.5) return '#22c55e';    // Green (safe)
  if (debtPercent < 0.8) return '#f59e0b';   // Yellow (warning)
  return '#ef4444';                           // Red (danger)
}

function formatCompactCredits(n: number): string {
  if (n >= 1000000) return `₡${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₡${(n / 1000).toFixed(0)}K`;
  return `₡${n}`;
}

function renderDoctrineBars(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  startX: number,
  y: number,
): void {
  const doctrines = ['corporate', 'cooperative', 'smuggler'] as const;
  const barW = 80;
  const barH = 6;
  let barX = startX;

  for (const doctrine of doctrines) {
    const points = meta.doctrinePoints[doctrine];
    const color = DOCTRINE_COLORS[doctrine];
    const label = doctrine.charAt(0).toUpperCase();

    display.drawText(label, barX, y, {
      font: 'bold 12px monospace',
      fill: color,
      align: 'left',
      baseline: 'top',
    });

    const miniBarX = barX + 14;
    display.drawRoundRect(miniBarX, y + 2, barW, barH, 2, { fill: '#1e293b' });

    const progress = Math.min(1, points / 50);
    if (progress > 0) {
      display.drawRoundRect(miniBarX, y + 2, barW * progress, barH, 2, { fill: color });
    }

    display.drawText(`${points}`, miniBarX + barW + 6, y, {
      font: 'bold 11px monospace',
      fill: '#000000',
      align: 'left',
      baseline: 'top',
    });

    barX += barW + 40;
  }
}

export function renderExpeditionErrorPanel(
  display: typeof MakkoEngine.display,
  missing: ('ship' | 'crew' | 'hardware')[],
): void {
  const { x, y, w, h } = ERROR_PANEL;

  display.drawRoundRect(x, y, w, h, 8, {
    fill: COLOR.errorBg,
    stroke: COLOR.errorBorder,
    lineWidth: 3,
  });

  const headerY = y + 20;
  display.drawText('CANNOT START EXPEDITION', x + w / 2, headerY, {
    font: 'bold 18px monospace',
    fill: COLOR.error,
    align: 'center',
    baseline: 'top',
  });

  const dividerY = headerY + 28;
  display.drawLine(x + 20, dividerY, x + w - 20, dividerY, {
    stroke: COLOR.errorBorder,
    lineWidth: 1,
    alpha: 0.5,
  });

  let listY = dividerY + 16;
  const lineHeight = 22;

  for (const resource of missing) {
    display.drawText(`✗ ${getResourceLabel(resource)}`, x + 24, listY, {
      font: '14px monospace',
      fill: COLOR.errorText,
      align: 'left',
      baseline: 'top',
    });
    listY += lineHeight;
  }

  const instructionY = listY + 12;
  display.drawText(`Open ${getPanelNameForResource(missing[0])} to select`, x + w / 2, instructionY, {
    font: 'bold 13px monospace',
    fill: COLOR.error,
    align: 'center',
    baseline: 'top',
  });
}
