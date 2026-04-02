// Hardware Selection Panel — Full-screen menu for equipping dive hardware

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../types/state';
import { ItemSlot, getItemById, ITEM_RARITY_COLORS, HardwareItem } from '../../content/hardware';
import {
  ACCENT, SUCCESS, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  BG, BG_PANEL, BORDER_DEFAULT
} from '../panel-layout';
import { isOver } from '../panel-layout';

export type HardwareSelectAction =
  | { type: 'EQUIP_HARDWARE_FOR_DIVE'; slot: ItemSlot; itemId: string | null }
  | { type: 'CLOSE_HARDWARE_SELECT' };

// Layout constants
const SCREEN_W = 1920;
const SCREEN_H = 1080;
const SLOT_TAB_W = 200;
const SLOT_TAB_H = 50;
const SLOT_TAB_GAP = 20;
const ITEM_ROW_H = 100;
const ITEM_ROW_GAP = 15;
const LEFT_PANEL_W = 400;
const CONTENT_X = 450;

const SLOTS: ItemSlot[] = ['hull', 'scanner', 'utility'];
const SLOT_LABELS: Record<ItemSlot, string> = {
  hull: 'HULL',
  scanner: 'SCANNER',
  utility: 'UTILITY',
};

// Local state for slot tabs
let selectedSlot: ItemSlot = 'hull';

export function renderHardwareSelectPanel(
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  _dt: number
): HardwareSelectAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let action: HardwareSelectAction | null = null;

  // Full screen dark overlay
  display.drawRect(0, 0, SCREEN_W, SCREEN_H, { fill: '#0a0e14', alpha: 0.95 });

  // Title
  display.drawText('EQUIP HARDWARE FOR EXPEDITION', SCREEN_W / 2, 60, {
    font: 'bold 48px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'middle',
  });

  // Close button
  const closeX = 1750;
  const closeY = 35;
  const closeW = 120;
  const closeH = 50;
  const closeHover = isOver(mx, my, closeX, closeY, closeW, closeH);
  display.drawRoundRect(closeX, closeY, closeW, closeH, 8, {
    fill: closeHover ? '#2d3748' : '#1a202c',
    stroke: closeHover ? ACCENT : TEXT_MUTED,
    lineWidth: 2,
  });
  display.drawText('✕ CLOSE', closeX + closeW / 2, closeY + closeH / 2, {
    font: 'bold 20px monospace',
    fill: closeHover ? ACCENT : TEXT_SECONDARY,
    align: 'center',
    baseline: 'middle',
  });
  if (closeHover && input.isMouseReleased(0)) {
    return { type: 'CLOSE_HARDWARE_SELECT' };
  }

  // Slot tabs
  const tabsY = 130;
  const tabsTotalWidth = SLOTS.length * SLOT_TAB_W + (SLOTS.length - 1) * SLOT_TAB_GAP;
  const tabsStartX = (SCREEN_W - tabsTotalWidth) / 2;

  for (let i = 0; i < SLOTS.length; i++) {
    const slot = SLOTS[i];
    const tabX = tabsStartX + i * (SLOT_TAB_W + SLOT_TAB_GAP);
    const isActive = selectedSlot === slot;
    const tabHover = isOver(mx, my, tabX, tabsY, SLOT_TAB_W, SLOT_TAB_H);

    display.drawRoundRect(tabX, tabsY, SLOT_TAB_W, SLOT_TAB_H, 6, {
      fill: isActive ? '#1a3a4a' : tabHover ? '#1e293b' : '#0f172a',
      stroke: isActive ? ACCENT : tabHover ? ACCENT : BORDER_DEFAULT,
      lineWidth: 3,
    });
    display.drawText(SLOT_LABELS[slot], tabX + SLOT_TAB_W / 2, tabsY + SLOT_TAB_H / 2, {
      font: 'bold 20px monospace',
      fill: isActive ? ACCENT : TEXT_PRIMARY,
      align: 'center',
      baseline: 'middle',
    });

    if (tabHover && input.isMouseReleased(0)) {
      selectedSlot = slot;
    }
  }

  // Left panel: Currently equipped
  const leftPanelX = 50;
  const leftPanelY = 200;
  const leftPanelH = 700;

  display.drawRoundRect(leftPanelX, leftPanelY, LEFT_PANEL_W, leftPanelH, 12, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  display.drawText('CURRENTLY EQUIPPED', leftPanelX + LEFT_PANEL_W / 2, leftPanelY + 30, {
    font: 'bold 20px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'top',
  });

  const equippedId = divePrep.equippedForDive[selectedSlot];
  const equippedItem = equippedId ? getItemById(equippedId) : null;

  if (equippedItem) {
    // Equipped item display
    const itemY = leftPanelY + 100;
    display.drawRoundRect(leftPanelX + 20, itemY, LEFT_PANEL_W - 40, 150, 8, {
      fill: '#1a202c',
      stroke: ITEM_RARITY_COLORS[equippedItem.rarity],
      lineWidth: 3,
    });

    display.drawText(equippedItem.name.toUpperCase(), leftPanelX + LEFT_PANEL_W / 2, itemY + 20, {
      font: 'bold 18px monospace',
      fill: ITEM_RARITY_COLORS[equippedItem.rarity],
      align: 'center',
      baseline: 'top',
    });

    display.drawText(equippedItem.description, leftPanelX + LEFT_PANEL_W / 2, itemY + 60, {
      font: '14px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'top',
    });

    // Unequip button
    const unequipW = 140;
    const unequipH = 40;
    const unequipX = leftPanelX + (LEFT_PANEL_W - unequipW) / 2;
    const unequipY = leftPanelY + leftPanelH - 100;
    const unequipHover = isOver(mx, my, unequipX, unequipY, unequipW, unequipH);

    display.drawRoundRect(unequipX, unequipY, unequipW, unequipH, 6, {
      fill: unequipHover ? '#3a1a1a' : '#2a1515',
      stroke: '#ef4444',
      lineWidth: 2,
    });
    display.drawText('UNEQUIP', unequipX + unequipW / 2, unequipY + unequipH / 2, {
      font: 'bold 16px monospace',
      fill: '#ef4444',
      align: 'center',
      baseline: 'middle',
    });

    if (unequipHover && input.isMouseReleased(0)) {
      action = { type: 'EQUIP_HARDWARE_FOR_DIVE', slot: selectedSlot, itemId: null };
    }
  } else {
    display.drawText('(EMPTY)', leftPanelX + LEFT_PANEL_W / 2, leftPanelY + 200, {
      font: 'bold 24px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    display.drawText('No item equipped in this slot.', leftPanelX + LEFT_PANEL_W / 2, leftPanelY + 250, {
      font: '16px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'middle',
    });
  }

  // Right panel: Available items
  const rightPanelX = CONTENT_X;
  const rightPanelY = 200;
  const rightPanelW = SCREEN_W - CONTENT_X - 50;
  const rightPanelH = 700;

  display.drawRoundRect(rightPanelX, rightPanelY, rightPanelW, rightPanelH, 12, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  display.drawText('AVAILABLE ITEMS', rightPanelX + rightPanelW / 2, rightPanelY + 30, {
    font: 'bold 20px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'top',
  });

  // Get items for selected slot from inventory
  const slotItems: HardwareItem[] = meta.itemInventory
    .map(id => getItemById(id))
    .filter((item): item is HardwareItem => item !== undefined && item.slot === selectedSlot);

  if (slotItems.length === 0) {
    display.drawText('No compatible items in inventory.', rightPanelX + rightPanelW / 2, rightPanelY + rightPanelH / 2, {
      font: 'bold 20px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
  } else {
    // Item list
    const listY = rightPanelY + 80;
    const maxVisible = 6;
    const visibleItems = slotItems.slice(0, maxVisible);

    for (let i = 0; i < visibleItems.length; i++) {
      const item = visibleItems[i];
      const rowY = listY + i * (ITEM_ROW_H + ITEM_ROW_GAP);
      const isEquipped = equippedId === item.id;

      // Row background
      const rowHover = isOver(mx, my, rightPanelX + 20, rowY, rightPanelW - 40, ITEM_ROW_H);
      display.drawRoundRect(rightPanelX + 20, rowY, rightPanelW - 40, ITEM_ROW_H, 8, {
        fill: isEquipped ? '#0f2a1a' : rowHover ? '#1e293b' : '#0f172a',
        stroke: isEquipped ? SUCCESS : rowHover ? ACCENT : BORDER_DEFAULT,
        lineWidth: isEquipped ? 3 : 2,
      });

      // Item name
      display.drawText(item.name.toUpperCase(), rightPanelX + 50, rowY + 15, {
        font: 'bold 18px monospace',
        fill: ITEM_RARITY_COLORS[item.rarity],
        align: 'left',
        baseline: 'top',
      });

      // Description
      display.drawText(item.description, rightPanelX + 50, rowY + 45, {
        font: '14px monospace',
        fill: TEXT_SECONDARY,
        align: 'left',
        baseline: 'top',
      });

      // Equipped indicator or Equip button
      if (isEquipped) {
        display.drawText('✓ EQUIPPED', rightPanelX + rightPanelW - 150, rowY + ITEM_ROW_H / 2, {
          font: 'bold 16px monospace',
          fill: SUCCESS,
          align: 'left',
          baseline: 'middle',
        });
      } else {
        const btnW = 100;
        const btnH = 36;
        const btnX = rightPanelX + rightPanelW - 140;
        const btnY = rowY + (ITEM_ROW_H - btnH) / 2;
        const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

        display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
          fill: btnHover ? '#1e4a3a' : '#0f3a2a',
          stroke: SUCCESS,
          lineWidth: 2,
        });
        display.drawText('EQUIP', btnX + btnW / 2, btnY + btnH / 2, {
          font: 'bold 14px monospace',
          fill: SUCCESS,
          align: 'center',
          baseline: 'middle',
        });

        if (btnHover && input.isMouseReleased(0)) {
          action = { type: 'EQUIP_HARDWARE_FOR_DIVE', slot: selectedSlot, itemId: item.id };
        }
      }
    }

    // Show more indicator
    if (slotItems.length > maxVisible) {
      const remaining = slotItems.length - maxVisible;
      display.drawText(`+${remaining} more item${remaining > 1 ? 's' : ''}...`, rightPanelX + rightPanelW / 2, listY + maxVisible * (ITEM_ROW_H + ITEM_ROW_GAP) + 10, {
        font: '16px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'top',
      });
    }
  }

  // Instructions
  display.drawText('Hardware equipped here applies only to this expedition. Hub equipment is separate.', SCREEN_W / 2, SCREEN_H - 40, {
    font: '16px monospace',
    fill: TEXT_MUTED,
    align: 'center',
    baseline: 'middle',
  });

  if (input.isKeyPressed('Escape')) {
    return { type: 'CLOSE_HARDWARE_SELECT' };
  }

  return action;
}

export function resetHardwareSelect(): void {
  selectedSlot = 'hull';
}
