import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';

export interface DebtClearedAction {
  type: 'CONTINUE';
}

const COLORS = {
  background: '#000000',
  pulse: '#1a0a2e',
  title: '#68d391',
  subtitle: '#a0aec0',
  loreBorder: '#2d3748',
  loreBg: '#0d1117',
  loreHeader: '#9f7aea',
  loreText: '#a0aec0',
  handicap: '#f6e05e',
  button: '#2d3748',
  buttonHover: '#4a5568',
};

let pulsePhase = 0;
let pressedContinue = false;

export function renderDebtCleared(
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
): { action: DebtClearedAction | null } {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  // Full screen background with pulse
  display.drawRect(0, 0, 1920, 1080, { fill: COLORS.background });
  
  // Pulse animation
  pulsePhase = (now / 3000) * Math.PI * 2;
  const pulseAlpha = 0.3 + Math.sin(pulsePhase) * 0.2;
  display.drawRect(0, 0, 1920, 1080, { fill: COLORS.pulse, alpha: pulseAlpha });

  // Title glow
  const glowAlpha = 0.5 + Math.sin(pulsePhase) * 0.3;
  display.drawText('DEBT: CLEARED', 960, 300, {
    font: 'bold 72px monospace',
    fill: COLORS.title,
    align: 'center',
    baseline: 'middle',
    alpha: glowAlpha,
  });

  // Subtitle
  display.drawText('₡0.00 — Balance settled.', 960, 420, {
    font: '24px monospace',
    fill: COLORS.subtitle,
    align: 'center',
    baseline: 'middle',
  });

  // Lore fragment panel
  const panelW = 800;
  const panelX = 560;
  const panelY = 500;

  display.drawRect(panelX, panelY, panelW, 280, {
    fill: COLORS.loreBg,
    stroke: COLORS.loreBorder,
    lineWidth: 2,
  });

  // Lore header
  display.drawText('TRANSMISSION RECOVERED', 960, panelY + 20, {
    font: '14px monospace',
    fill: COLORS.loreHeader,
    align: 'center',
    baseline: 'top',
  });

  // Lore body (wrapped manually)
  const loreLines = [
    'You submitted the final payment at 0300 station time.',
    'The Nexus Logistics automated system acknowledged receipt.',
    'No congratulations. No confirmation of your freedom.',
    'Just silence, and then the next billing cycle initializing',
    'in the background. They were already preparing your next debt.',
  ];

  for (let i = 0; i < loreLines.length; i++) {
    display.drawText(loreLines[i], 960, panelY + 60 + i * 22, {
      font: '16px monospace',
      fill: COLORS.loreText,
      align: 'center',
      baseline: 'top',
    });
  }

  // Handicap unlock message (only on first clearance)
  let extraY = panelY + 220;
  if (meta.debtClearedCount === 1) {
    display.drawText('★ HANDICAP UNLOCKED: Corporate Contract', 960, extraY, {
      font: 'bold 16px monospace',
      fill: COLORS.handicap,
      align: 'center',
      baseline: 'top',
    });
    display.drawText('Start any run with double debt. Earn double extraction bonuses.', 960, extraY + 24, {
      font: '14px monospace',
      fill: COLORS.subtitle,
      align: 'center',
      baseline: 'top',
    });
  }

  // Continue button
  const btnW = 240;
  const btnH = 56;
  const btnX = 960 - btnW / 2;
  const btnY = 820;

  const hover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;

  display.drawRect(btnX, btnY, btnW, btnH, {
    fill: hover ? COLORS.buttonHover : COLORS.button,
    stroke: COLORS.subtitle,
    lineWidth: 2,
  });

  display.drawText('[Return to Hub]', 960, btnY + btnH / 2, {
    font: 'bold 20px monospace',
    fill: '#ffffff',
    align: 'center',
    baseline: 'middle',
  });

  // Click handling
  let action: DebtClearedAction | null = null;

  if (input.isMousePressed(0) && hover) {
    pressedContinue = true;
  }

  if (input.isMouseReleased(0)) {
    if (hover && pressedContinue) {
      action = { type: 'CONTINUE' };
    }
    pressedContinue = false;
  }

  return { action };
}
