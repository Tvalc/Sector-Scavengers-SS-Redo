import { MakkoEngine } from '@makko/engine';
import { RunState } from '../types/state';

export interface AuditAction {
  type: 'PAY' | 'CONTEST';
}

// 90% screen layout
const SCREEN_W = 1920;
const SCREEN_H = 1080;
const PANEL_W = Math.floor(SCREEN_W * 0.9);
const PANEL_H = Math.floor(SCREEN_H * 0.9);
const PANEL_X = (SCREEN_W - PANEL_W) / 2;
const PANEL_Y = (SCREEN_H - PANEL_H) / 2;

const COLORS = {
  panelBg: '#100a0a',
  panelBorder: '#fc8181',
  header: '#fc8181',
  text: '#a0aec0',
  choiceBg: '#1a202c',
  choiceBgHover: '#2d3748',
  choiceBorder: '#4a5568',
  choiceBorderHover: '#fc8181',
  disabled: '#4a5568',
  disabledBg: '#0d1117',
};

let pressedChoice: 'pay' | 'contest' | null = null;

export function renderAuditNode(
  run: RunState,
  mx: number,
  my: number,
  now: number,
): { action: AuditAction | null } {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  // Full screen dim
  display.drawRect(0, 0, SCREEN_W, SCREEN_H, { fill: '#0d1117', alpha: 0.85 });

  // Panel background
  display.drawRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, {
    fill: COLORS.panelBg,
    stroke: COLORS.panelBorder,
    lineWidth: 3,
  });

  // Header
  display.drawText('⚖ CORPORATE AUDIT', PANEL_X + PANEL_W / 2, PANEL_Y + 60, {
    font: 'bold 32px monospace',
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });

  // Body text - wrapped for 90% screen
  const auditLines = [
    'Nexus Logistics Compliance Division.',
    'Your manifest has been flagged for review.',
    'Discrepancies detected in declared salvage.',
    'Choose how to proceed with this audit.',
  ];
  let lineY = PANEL_Y + 120;
  for (const line of auditLines) {
    display.drawText(line, PANEL_X + PANEL_W / 2, lineY, {
      font: '20px monospace',
      fill: COLORS.text,
      align: 'center',
      baseline: 'top',
    });
    lineY += 32;
  }

  // Check if player can pay
  const canPay = run.runCredits >= 200;
  let action: AuditAction | null = null;

  // Button layout
  const btnWidth = 400;
  const btnHeight = 80;
  const btnGap = 40;
  const totalBtnWidth = btnWidth * 2 + btnGap;
  const startX = PANEL_X + (PANEL_W - totalBtnWidth) / 2;
  const btnY = PANEL_Y + PANEL_H - 180;

  // Pay choice
  const payX = startX;
  const payHovered = mx >= payX && mx <= payX + btnWidth &&
                     my >= btnY && my <= btnY + btnHeight;

  const payBg = canPay
    ? (payHovered ? COLORS.choiceBgHover : COLORS.choiceBg)
    : COLORS.disabledBg;
  const payBorder = canPay
    ? (payHovered ? COLORS.choiceBorderHover : COLORS.choiceBorder)
    : COLORS.disabled;

  display.drawRoundRect(payX, btnY, btnWidth, btnHeight, 10, {
    fill: payBg,
    stroke: payBorder,
    lineWidth: payHovered && canPay ? 3 : 2,
    alpha: canPay ? 1 : 0.5,
  });

  display.drawText('PAY ₡200', payX + btnWidth / 2, btnY + 24, {
    font: 'bold 22px monospace',
    fill: canPay ? '#ffffff' : COLORS.disabled,
    align: 'center',
    baseline: 'top',
  });
  display.drawText('Clear the audit · Hull +5', payX + btnWidth / 2, btnY + 50, {
    font: '18px monospace',
    fill: canPay ? '#a0aec0' : COLORS.disabled,
    align: 'center',
    baseline: 'top',
  });

  // Contest choice
  const contestX = startX + btnWidth + btnGap;
  const contestHovered = mx >= contestX && mx <= contestX + btnWidth &&
                         my >= btnY && my <= btnY + btnHeight;

  const contestBg = contestHovered ? COLORS.choiceBgHover : COLORS.choiceBg;
  const contestBorder = contestHovered ? COLORS.choiceBorderHover : COLORS.choiceBorder;

  display.drawRoundRect(contestX, btnY, btnWidth, btnHeight, 10, {
    fill: contestBg,
    stroke: contestBorder,
    lineWidth: contestHovered ? 3 : 2,
  });

  display.drawText('CONTEST', contestX + btnWidth / 2, btnY + 24, {
    font: 'bold 22px monospace',
    fill: '#ffffff',
    align: 'center',
    baseline: 'top',
  });
  display.drawText('Elevated danger · Debt +₡300', contestX + btnWidth / 2, btnY + 50, {
    font: '18px monospace',
    fill: '#a0aec0',
    align: 'center',
    baseline: 'top',
  });

  // Click handling
  if (canPay && input.isMousePressed(0) && payHovered) {
    pressedChoice = 'pay';
  }
  if (input.isMousePressed(0) && contestHovered) {
    pressedChoice = 'contest';
  }

  if (input.isMouseReleased(0)) {
    if (canPay && payHovered && pressedChoice === 'pay') {
      action = { type: 'PAY' };
    }
    if (contestHovered && pressedChoice === 'contest') {
      action = { type: 'CONTEST' };
    }
    pressedChoice = null;
  }

  return { action };
}
