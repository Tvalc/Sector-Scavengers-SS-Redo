import { MakkoEngine } from '@makko/engine';
import { RunState } from '../types/state';
import { getItemById, ITEM_RARITY_COLORS } from '../content/hardware';

export interface CacheAction {
  type: 'TAKE' | 'LEAVE';
}

// 90% of 1920x1080 screen
const SCREEN_W = 1920;
const SCREEN_H = 1080;
const PANEL_W = Math.floor(SCREEN_W * 0.9);
const PANEL_H = Math.floor(SCREEN_H * 0.9);
const PANEL_X = (SCREEN_W - PANEL_W) / 2;
const PANEL_Y = (SCREEN_H - PANEL_H) / 2;

const COLORS = {
  panelBg: '#0d1117',
  panelBorder: '#f6e05e',
  header: '#f6e05e',
  title: '#ffffff',
  text: '#a0aec0',
  choiceBg: '#1a202c',
  choiceBgHover: '#2d3748',
  choiceBorder: '#4a5568',
  choiceBorderHover: '#f6e05e',
};

// Font sizes - minimum 18px
const FONTS = {
  header: 'bold 28px monospace',
  itemName: 'bold 36px monospace',
  slotLabel: '20px monospace',
  description: '22px monospace',
  button: 'bold 22px monospace',
};

let pressedChoice: 'take' | 'leave' | null = null;

export function renderCacheNode(
  run: RunState,
  mx: number,
  my: number,
  now: number,
): { action: CacheAction | null } {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  // Full screen dim
  display.drawRect(0, 0, SCREEN_W, SCREEN_H, { fill: '#0d1117', alpha: 0.85 });

  // Panel background - 90% of screen
  display.drawRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, {
    fill: COLORS.panelBg,
    stroke: COLORS.panelBorder,
    lineWidth: 3,
  });

  // Header
  display.drawText('◆ DERELICT CACHE', PANEL_X + PANEL_W / 2, PANEL_Y + 60, {
    font: FONTS.header,
    fill: COLORS.header,
    align: 'center',
    baseline: 'top',
  });

  // Get the found item
  const itemId = run.cacheNodeItem;
  const item = itemId ? getItemById(itemId) : null;

  const contentY = PANEL_Y + 140;

  if (item) {
    // Item name with rarity color
    const rarityColor = ITEM_RARITY_COLORS[item.rarity];
    display.drawText(item.name, PANEL_X + PANEL_W / 2, contentY, {
      font: FONTS.itemName,
      fill: rarityColor,
      align: 'center',
      baseline: 'top',
    });

    // Slot label
    display.drawText(`[${item.slot.toUpperCase()} SLOT]`, PANEL_X + PANEL_W / 2, contentY + 60, {
      font: FONTS.slotLabel,
      fill: '#718096',
      align: 'center',
      baseline: 'top',
    });

    // Item description - wrapped for longer text
    const maxChars = Math.floor(PANEL_W / 16);
    const words = item.description.split(' ');
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

    for (let i = 0; i < lines.length; i++) {
      display.drawText(lines[i], PANEL_X + PANEL_W / 2, contentY + 110 + i * 34, {
        font: FONTS.description,
        fill: COLORS.text,
        align: 'center',
        baseline: 'top',
      });
    }
  } else {
    display.drawText('Hardware recovered.', PANEL_X + PANEL_W / 2, contentY + 50, {
      font: FONTS.description,
      fill: COLORS.text,
      align: 'center',
      baseline: 'top',
    });
  }

  let action: CacheAction | null = null;

  // Button layout - side by side, centered
  const btnWidth = 280;
  const btnHeight = 64;
  const btnY = PANEL_Y + PANEL_H - 180;
  const gap = 60;
  const totalWidth = btnWidth * 2 + gap;
  const startX = PANEL_X + (PANEL_W - totalWidth) / 2;

  // Take button
  const takeX = startX;
  const takeHovered = mx >= takeX && mx <= takeX + btnWidth &&
                      my >= btnY && my <= btnY + btnHeight;

  display.drawRoundRect(takeX, btnY, btnWidth, btnHeight, 10, {
    fill: takeHovered ? COLORS.choiceBgHover : COLORS.choiceBg,
    stroke: takeHovered ? COLORS.choiceBorderHover : COLORS.choiceBorder,
    lineWidth: takeHovered ? 3 : 2,
  });

  display.drawText('[Take it]', takeX + btnWidth / 2, btnY + btnHeight / 2 + 6, {
    font: FONTS.button,
    fill: '#ffffff',
    align: 'center',
    baseline: 'middle',
  });

  // Leave button
  const leaveX = startX + btnWidth + gap;
  const leaveHovered = mx >= leaveX && mx <= leaveX + btnWidth &&
                       my >= btnY && my <= btnY + btnHeight;

  display.drawRoundRect(leaveX, btnY, btnWidth, btnHeight, 10, {
    fill: leaveHovered ? COLORS.choiceBgHover : COLORS.choiceBg,
    stroke: leaveHovered ? COLORS.choiceBorderHover : COLORS.choiceBorder,
    lineWidth: leaveHovered ? 3 : 2,
  });

  display.drawText('[Leave it]', leaveX + btnWidth / 2, btnY + btnHeight / 2 + 6, {
    font: FONTS.button,
    fill: '#a0aec0',
    align: 'center',
    baseline: 'middle',
  });

  // Click handling
  if (input.isMousePressed(0)) {
    if (takeHovered) pressedChoice = 'take';
    if (leaveHovered) pressedChoice = 'leave';
  }

  if (input.isMouseReleased(0)) {
    if (takeHovered && pressedChoice === 'take') {
      action = { type: 'TAKE' };
    }
    if (leaveHovered && pressedChoice === 'leave') {
      action = { type: 'LEAVE' };
    }
    pressedChoice = null;
  }

  return { action };
}
