import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../../types/state';
import { HubAction } from '../types';
import { setBounds } from '../../tutorial-bounds';
import { isOver } from '../helpers';
import { isInteractionAllowed } from '../tutorial';
import { LEFT_PANEL_X, LEFT_PANEL_W, LEFT_PANEL_Y } from '../constants';
import type { TutorialInteraction } from '../../../tutorial/tutorial-context';
import { MAX_DEBT_BEFORE_GAME_OVER, BASE_BILLING_AMOUNT } from '../../../config/constants';

const doctrineColors: Record<string, string> = {
  corporate: '#f6ad55',
  cooperative: '#68d391',
  smuggler: '#9f7aea',
};

const doctrineLabels: Record<string, string> = {
  corporate: 'COR',
  cooperative: 'COOP',
  smuggler: 'SMUG',
};

interface SecondaryButton {
  label: string;
  id: string;
  enabled: boolean;
  action: HubAction;
}

/** Render left panel with debt, resources, and action buttons */
export function renderLeftPanel(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  mx: number,
  my: number,
  lockedInteraction?: TutorialInteraction,
  now: number = Date.now(),
): HubAction | null {
  let clicked: HubAction | null = null;
  const x = LEFT_PANEL_X;
  let y = LEFT_PANEL_Y;

  display.drawRect(x, y, LEFT_PANEL_W, 720, {
    fill: '#0a0e14',
    stroke: '#2d3748',
    lineWidth: 2,
  });

  y += 25;

  // Debt section
  const debtBlockTop = y;
  y = renderDebtSection(display, x, y, meta);
  setBounds('debt-display', { x: x + 20, y: debtBlockTop, w: LEFT_PANEL_W - 40, h: y - debtBlockTop });

  // Bill countdown
  const billY = y;
  y = renderBillCountdown(display, x, y, meta);
  setBounds('bill-countdown', { x: x + 20, y: billY - 2, w: LEFT_PANEL_W - 40, h: 24 });

  y += 15;

  // Action buttons
  display.drawLine(x + 20, y, x + LEFT_PANEL_W - 20, y, { stroke: '#2d3748', lineWidth: 1 });
  y += 25;

  y = renderDiveButton(display, input, x, y, lockedInteraction, now, (action) => { clicked = action; });

  const secondaryBtns = buildSecondaryButtons();
  y = renderSecondaryButtons(display, input, x, y, secondaryBtns, lockedInteraction, mx, my, (action) => { clicked = action; });

  // Crew info
  y = renderCrewInfo(display, x, y, meta);

  // Doctrine points
  y = renderDoctrineSection(display, x, y, meta);

  return clicked;
}

function renderDebtSection(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  meta: MetaState,
): number {
  const debtPercent = meta.debt / MAX_DEBT_BEFORE_GAME_OVER;
  const warningLevel = getDebtWarningLevel(debtPercent);
  const debtColor = getDebtColor(warningLevel);

  display.drawText('CORPORATE DEBT', x + 20, y, { font: '22px monospace', fill: '#718096', align: 'left', baseline: 'top' });
  y += 26;

  // Debt amount with color coding
  display.drawText(formatCompactCredits(meta.debt), x + 20, y, { font: 'bold 36px monospace', fill: debtColor, align: 'left', baseline: 'top' });
  y += 42;

  // Debt progress bar
  const barW = LEFT_PANEL_W - 40;
  const barH = 10;
  display.drawRoundRect(x + 20, y, barW, barH, 5, { fill: '#1e293b' });
  if (debtPercent > 0) {
    display.drawRoundRect(x + 20, y, barW * Math.min(debtPercent, 1), barH, 5, { fill: debtColor });
  }

  // Percentage label
  const pctText = `${Math.round(debtPercent * 100)}% of ${formatCompactCredits(MAX_DEBT_BEFORE_GAME_OVER)} limit`;
  display.drawText(pctText, x + 20 + barW / 2, y + 16, {
    font: '12px monospace',
    fill: debtColor,
    align: 'center',
    baseline: 'top',
  });
  y += 32;

  // Warning indicator for high debt
  if (warningLevel === 'danger') {
    display.drawRoundRect(x + 20, y, barW, 24, 4, {
      fill: '#2e0a0a',
      stroke: '#ef4444',
      lineWidth: 1,
    });
    display.drawText('⚠ CRITICAL DEBT LEVEL', x + 20 + barW / 2, y + 12, {
      font: 'bold 12px monospace',
      fill: '#ef4444',
      align: 'center',
      baseline: 'middle',
    });
    y += 30;
  } else if (warningLevel === 'warning') {
    display.drawText('⚠ Approaching debt limit', x + 20, y, {
      font: '11px monospace',
      fill: '#f59e0b',
      align: 'left',
      baseline: 'top',
    });
    y += 18;
  }

  y += 10;

  // Echo - primary currency
  display.drawText(`⬡ ${meta.voidEcho}`, x + 20, y, { font: 'bold 24px monospace', fill: '#9f7aea', align: 'left', baseline: 'top' });
  y += 32;

  return y;
}

function renderBillCountdown(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  meta: MetaState,
): number {
  const activeCrew = (meta.leadId !== null ? 1 : 0) + meta.companionIds.length;
  const nextBill = BASE_BILLING_AMOUNT + activeCrew * meta.upkeepPerAwakeCrew;

  // Background box for billing info
  display.drawRoundRect(x + 20, y - 5, LEFT_PANEL_W - 40, 50, 6, {
    fill: '#0d1117',
    stroke: meta.billingRunsUntilNext === 1 ? '#f59e0b' : '#2d3748',
    lineWidth: 1,
  });

  display.drawText(`NEXT BILL: ${formatCompactCredits(nextBill)}`, x + 30, y + 5, {
    font: '14px monospace',
    fill: '#a0aec0',
    align: 'left', baseline: 'top',
  });

  display.drawText(`(${activeCrew} crew × ${formatCompactCredits(meta.upkeepPerAwakeCrew)})`, x + 30, y + 24, {
    font: '12px monospace',
    fill: '#718096',
    align: 'left', baseline: 'top',
  });

  return y + 55;
}

function renderDiveButton(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  x: number,
  y: number,
  lockedInteraction: TutorialInteraction | undefined,
  now: number,
  onClick: (action: HubAction) => void,
): number {
  const diveLocked = lockedInteraction && !isInteractionAllowed({ type: 'hub-btn', id: 'start-dive' }, lockedInteraction);
  const diveTarget = lockedInteraction?.type === 'hub-btn' && lockedInteraction.id === 'start-dive';
  const diveHover = !diveLocked && isOver(input.mouseX, input.mouseY, x + 20, y, LEFT_PANEL_W - 40, 55);

  if (diveTarget) {
    const p = Math.sin((now % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
    display.drawRect(x + 16, y - 4, LEFT_PANEL_W - 32, 63, { fill: '#1e3a5f', alpha: 0.3 + p * 0.2 });
    display.drawRect(x + 20, y, LEFT_PANEL_W - 40, 55, {
      fill: diveHover ? '#1e4a7c' : '#1e3a5f',
      stroke: p > 0.5 ? '#63b3ed' : '#90cdf4',
      lineWidth: 3 + p * 2,
    });
  } else {
    display.drawRect(x + 20, y, LEFT_PANEL_W - 40, 55, {
      fill: diveLocked ? '#1a202c' : diveHover ? '#1e4a7c' : '#1e3a5f',
      stroke: diveTarget ? '#22d3ee' : diveLocked ? '#4a5568' : '#63b3ed',
      lineWidth: diveTarget ? 3 : 2,
    });
  }

  display.drawText('▶ START DIVE', x + LEFT_PANEL_W / 2, y + 27, {
    font: 'bold 28px monospace',
    fill: diveLocked ? '#4a5568' : '#ffffff',
    align: 'center', baseline: 'middle',
  });

  setBounds('start-dive-btn', { x: x + 20, y: y, w: LEFT_PANEL_W - 40, h: 55 });
  if (diveHover && input.isMouseReleased(0)) onClick('START_DIVE');

  return y + 70;
}

function buildSecondaryButtons(): SecondaryButton[] {
  return [
    {
      label: '⊛ MODULES',
      id: 'modules',
      enabled: true,
      action: 'OPEN_MODULES',
    },
  ];
}

function renderSecondaryButtons(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  x: number,
  y: number,
  buttons: SecondaryButton[],
  lockedInteraction: TutorialInteraction | undefined,
  mx: number,
  my: number,
  onClick: (action: HubAction) => void,
): number {
  for (const btn of buttons) {
    const btnLocked = lockedInteraction && !isInteractionAllowed({ type: 'hub-btn', id: btn.id } as TutorialInteraction, lockedInteraction);
    const btnTarget = lockedInteraction?.type === 'hub-btn' && lockedInteraction.id === btn.id;
    const btnHover = btn.enabled && !btnLocked && isOver(mx, my, x + 20, y, LEFT_PANEL_W - 40, 44);

    renderSecondaryButton(display, x, y, btn, btnLocked, btnTarget, btnHover);

    if (btnHover && input.isMouseReleased(0)) onClick(btn.action);
    setBounds(`${btn.id}-btn`, { x: x + 20, y: y, w: LEFT_PANEL_W - 40, h: 44 });
    y += 50;
  }
  return y;
}

function renderSecondaryButton(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  btn: SecondaryButton,
  isLocked: boolean,
  isTarget: boolean,
  isHovered: boolean,
): void {
  if (isTarget) {
    const p = Math.sin((Date.now() % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
    display.drawRect(x + 16, y - 3, LEFT_PANEL_W - 32, 50, { fill: '#1e3a5f', alpha: 0.3 + p * 0.2 });
    display.drawRect(x + 20, y, LEFT_PANEL_W - 40, 44, {
      fill: isHovered ? '#2d3748' : '#1a202c',
      stroke: p > 0.5 ? '#63b3ed' : '#90cdf4',
      lineWidth: 3 + p * 2,
    });
  } else {
    display.drawRect(x + 20, y, LEFT_PANEL_W - 40, 44, {
      fill: isLocked ? '#0d1117' : isHovered ? '#2d3748' : '#1a202c',
      stroke: isTarget ? '#63b3ed' : '#4a5568',
      lineWidth: isTarget ? 2 : 1,
    });
  }

  display.drawText(btn.label, x + LEFT_PANEL_W / 2, y + 22, {
    font: '24px monospace',
    fill: isLocked ? '#4a5568' : btn.enabled ? '#a0aec0' : '#4a5568',
    align: 'center', baseline: 'middle',
  });
}

function renderCrewInfo(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  meta: MetaState,
): number {
  y += 30;
  const activeCrewCount = (meta.leadId !== null ? 1 : 0) + meta.companionIds.length;
  if (activeCrewCount > 0) {
    display.drawText(`CREW: ${activeCrewCount}`, x + LEFT_PANEL_W / 2, y, {
      font: '24px monospace', fill: '#a0aec0', align: 'center', baseline: 'top',
    });
    y += 26;
    const diveUpkeep = activeCrewCount * meta.upkeepPerAwakeCrew;
    display.drawText(`Crew debt this dive: ₡${diveUpkeep}`, x + LEFT_PANEL_W / 2, y, {
      font: '22px monospace', fill: '#fc8181', align: 'center', baseline: 'top',
    });
  }
  return y + 20;
}

function renderDoctrineSection(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  meta: MetaState,
): number {
  y += 20;
  display.drawLine(x + 20, y, x + LEFT_PANEL_W - 20, y, { stroke: '#2d3748', lineWidth: 1 });
  y += 18;
  display.drawText('DOCTRINE', x + 20, y, { font: '26px monospace', fill: '#718096', align: 'left', baseline: 'top' });
  y += 28;

  for (const d of ['corporate', 'cooperative', 'smuggler'] as const) {
    const isLocked = meta.doctrineLocked === d;
    const label = doctrineLabels[d];
    const points = meta.doctrinePoints[d];
    const color = doctrineColors[d];
    const dimColor = isLocked ? color : '#4a5568';
    const text = `${label}: ${points}${isLocked ? ' [LOCKED]' : ''}`;
    display.drawText(text, x + 20, y, {
      font: isLocked ? 'bold 24px monospace' : '24px monospace',
      fill: dimColor,
      align: 'left',
      baseline: 'top',
    });
    y += 26;
  }

  return y + 15;
}

// ===== Debt Progress Helpers =====

type DebtWarningLevel = 'safe' | 'warning' | 'danger';

function getDebtWarningLevel(debtPercent: number): DebtWarningLevel {
  if (debtPercent < 0.5) return 'safe';
  if (debtPercent < 0.8) return 'warning';
  return 'danger';
}

function getDebtColor(level: DebtWarningLevel): string {
  switch (level) {
    case 'safe': return '#22c55e';    // Green
    case 'warning': return '#f59e0b'; // Yellow/Orange
    case 'danger': return '#ef4444'; // Red
    default: return '#94a3b8';
  }
}

function formatCompactCredits(n: number): string {
  if (n >= 1000000) return `₡${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₡${(n / 1000).toFixed(0)}K`;
  return `₡${n}`;
}
