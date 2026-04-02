import { MakkoEngine } from '@makko/engine';
import { Signal, SignalChoice } from '../content/signals';
import { RunState } from '../types/state';

export interface SignalAction {
  type: 'CHOOSE';
  choiceIndex: number;
}

// 90% of 1920x1080 screen
const SCREEN_W = 1920;
const SCREEN_H = 1080;
const PANEL_W = Math.floor(SCREEN_W * 0.9);
const PANEL_H = Math.floor(SCREEN_H * 0.9);
const PANEL_X = (SCREEN_W - PANEL_W) / 2;
const PANEL_Y = (SCREEN_H - PANEL_H) / 2;

const COLORS = {
  panelBg: '#0a0d14',
  panelBorder: '#9f7aea',
  header: '#9f7aea',
  title: '#ffffff',
  text: '#a0aec0',
  choiceBg: '#1a202c',
  choiceBgHover: '#2d3748',
  choiceBorder: '#4a5568',
  choiceBorderHover: '#9f7aea',
  disabled: '#4a5568',
  effectText: '#718096',
};

// Font sizes - minimum 18px
const FONTS = {
  header: 'bold 20px monospace',
  title: 'bold 36px monospace',
  text: '18px monospace',
  choiceLabel: 'bold 20px monospace',
  choiceEffect: '16px monospace',
};

let pressedChoiceIndex: number | null = null;

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Layout calculations based on panel size
function getLayout() {
  const contentX = PANEL_X + 60;
  const contentW = PANEL_W - 120;
  const headerY = PANEL_Y + 50;
  const titleY = headerY + 60;
  const textY = titleY + 70;
  const choicesStartY = textY + 160;
  return { contentX, contentW, headerY, titleY, textY, choicesStartY };
}

const formatNum = (n: number) => n.toLocaleString('en-US');

function formatEffectDescription(choice: SignalChoice): string {
  const parts: string[] = [];
  for (const effect of choice.effects) {
    switch (effect.type) {
      case 'credits':
        parts.push(effect.amount > 0 ? `+₡${formatNum(effect.amount)}` : `-₡${formatNum(Math.abs(effect.amount))}`);
        break;
      case 'hull':
        parts.push(effect.amount > 0 ? `Hull +${formatNum(effect.amount)}` : `Hull ${formatNum(effect.amount)}`);
        break;
      case 'debt':
        parts.push(effect.amount < 0 ? `Debt -₡${formatNum(Math.abs(effect.amount))}` : `Debt +₡${formatNum(effect.amount)}`);
        break;
      case 'void_echo':
        parts.push(`Void +${formatNum(effect.amount)}`);
        break;
      case 'add_card_to_deck':
        parts.push(`Add card`);
        break;
      case 'hardware_find':
        parts.push(`Hardware found`);
        break;
      case 'doctrine':
        parts.push(`${effect.alignment} +${formatNum(effect.points)}`);
        break;
      case 'lore_fragment':
        parts.push(`Lore fragment`);
        break;
    }
  }
  return parts.join(' | ');
}

function isChoiceDisabled(choice: SignalChoice, run: RunState): boolean {
  if (choice.requiresHull !== undefined && run.hull < choice.requiresHull) return true;
  if (choice.requiresCredits !== undefined && run.runCredits < choice.requiresCredits) return true;
  return false;
}

function getDisabledReason(choice: SignalChoice, run: RunState): string {
  if (choice.requiresHull !== undefined && run.hull < choice.requiresHull) {
    return `Requires ${choice.requiresHull} hull`;
  }
  if (choice.requiresCredits !== undefined && run.runCredits < choice.requiresCredits) {
    return `Requires ₡${choice.requiresCredits}`;
  }
  return '';
}

export function renderSignal(
  signal: Signal,
  run: RunState,
  mx: number,
  my: number,
  now: number,
): { action: SignalAction | null } {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  const layout = getLayout();
  
  // Full screen dim
  display.drawRect(0, 0, SCREEN_W, SCREEN_H, { fill: '#0d1117', alpha: 0.85 });

  // Panel background
  display.drawRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, {
    fill: COLORS.panelBg,
    stroke: COLORS.panelBorder,
    lineWidth: 3,
  });

  // Header
  display.drawText('◈ INCOMING SIGNAL', PANEL_X + PANEL_W / 2, layout.headerY, {
    font: FONTS.header,
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });

  // Title
  display.drawText(signal.title, PANEL_X + PANEL_W / 2, layout.titleY, {
    font: FONTS.title,
    fill: COLORS.title,
    align: 'center',
    baseline: 'top',
  });

  // Transmission text (wrapped) - scale chars based on panel width
  const maxChars = Math.floor(layout.contentW / 14);
  const lines = wrapText(signal.transmission, maxChars);
  const lineHeight = 28;
  for (let i = 0; i < lines.length; i++) {
    display.drawText(lines[i], layout.contentX, layout.textY + i * lineHeight, {
      font: FONTS.text,
      fill: COLORS.text,
      align: 'left',
      baseline: 'top',
    });
  }

  // Choices - calculate size based on remaining space
  const availableHeight = PANEL_H - (layout.textY - PANEL_Y) - 200;
  const choiceGap = 20;
  const choiceHeight = Math.min(90, Math.floor((availableHeight - (signal.choices.length - 1) * choiceGap) / signal.choices.length));
  const choiceWidth = layout.contentW;
  const choiceX = layout.contentX;
  let action: SignalAction | null = null;

  for (let i = 0; i < signal.choices.length; i++) {
    const choice = signal.choices[i];
    const y = layout.choicesStartY + i * (choiceHeight + choiceGap);
    const disabled = isChoiceDisabled(choice, run);
    const hovered = !disabled && mx >= choiceX && mx <= choiceX + choiceWidth &&
                    my >= y && my <= y + choiceHeight;

    // Choice background
    const bgColor = disabled ? COLORS.choiceBg : (hovered ? COLORS.choiceBgHover : COLORS.choiceBg);
    const borderColor = disabled ? COLORS.disabled : (hovered ? COLORS.choiceBorderHover : COLORS.choiceBorder);

    display.drawRoundRect(choiceX, y, choiceWidth, choiceHeight, 8, {
      fill: bgColor,
      stroke: borderColor,
      lineWidth: hovered ? 3 : 2,
      alpha: disabled ? 0.4 : 1,
    });

    // Choice label - centered vertically in upper portion
    display.drawText(choice.label, choiceX + 30, y + 20, {
      font: FONTS.choiceLabel,
      fill: disabled ? COLORS.disabled : COLORS.title,
      align: 'left',
      baseline: 'top',
    });

    // Effect preview - positioned lower
    const effectText = disabled ? getDisabledReason(choice, run) : formatEffectDescription(choice);
    display.drawText(effectText, choiceX + 30, y + choiceHeight - 28, {
      font: FONTS.choiceEffect,
      fill: COLORS.effectText,
      align: 'left',
      baseline: 'top',
    });

    // Click handling
    if (!disabled) {
      if (input.isMousePressed(0) && hovered) {
        pressedChoiceIndex = i;
      }
      if (input.isMouseReleased(0) && hovered && pressedChoiceIndex === i) {
        action = { type: 'CHOOSE', choiceIndex: i };
        pressedChoiceIndex = null;
      }
    }
  }

  if (input.isMouseReleased(0)) {
    pressedChoiceIndex = null;
  }

  return { action };
}
