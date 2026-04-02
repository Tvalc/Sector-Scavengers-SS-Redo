// Expanded Hardware View Renderer

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../../types/state';
import { getItemById, ITEM_RARITY_COLORS, type ItemSlot } from '../../../../content/hardware';
import { SLOTS, SLOT_ICONS, SLOT_LABELS } from '../constants';
import { DivePrepAction } from '../types';
import { formatHardwareEffect } from '../utils';
import {
  ACCENT, ERROR, TEXT_SECONDARY, TEXT_MUTED, BORDER_DEFAULT
} from '../../../panel-layout';
import { isOver } from '../../../panel-layout';

export function renderExpandedHardware(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  y: number,
  h: number,
  setAction: (a: DivePrepAction) => void,
): void {
  const colW = 500;
  const colGap = 40;
  const startX = 960 - (colW * 3 + colGap * 2) / 2;

  for (let i = 0; i < SLOTS.length; i++) {
    const slot = SLOTS[i];
    const colX = startX + i * (colW + colGap);
    const equippedId = divePrep.equippedForDive[slot] ?? meta.equippedItems[slot];
    const equippedItem = equippedId ? getItemById(equippedId) : null;

    // Column header
    display.drawText(`${SLOT_ICONS[slot]} ${SLOT_LABELS[slot]}`, colX + colW / 2, y + 40, {
      font: 'bold 28px monospace',
      fill: ACCENT,
      align: 'center',
      baseline: 'top',
    });

    // Equipped item (highlighted)
    let itemY = y + 90;
    if (equippedItem) {
      display.drawRoundRect(colX + 20, itemY, colW - 40, 100, 8, {
        fill: '#1a3a2a',
        stroke: ITEM_RARITY_COLORS[equippedItem.rarity],
        lineWidth: 3,
      });
      display.drawText(equippedItem.name.toUpperCase(), colX + colW / 2, itemY + 20, {
        font: 'bold 22px monospace',
        fill: ITEM_RARITY_COLORS[equippedItem.rarity],
        align: 'center',
        baseline: 'top',
      });
      display.drawText(formatHardwareEffect(equippedItem), colX + colW / 2, itemY + 55, {
        font: '16px monospace',
        fill: TEXT_SECONDARY,
        align: 'center',
        baseline: 'top',
      });
      itemY += 120;
    } else {
      display.drawRoundRect(colX + 20, itemY, colW - 40, 80, 8, {
        fill: '#1a202c',
        stroke: BORDER_DEFAULT,
        lineWidth: 2,
      });
      display.drawText('(EMPTY)', colX + colW / 2, itemY + 45, {
        font: 'bold 22px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'middle',
      });
      itemY += 100;
    }

    // Unequip button
    if (equippedItem) {
      const unequipW = 120;
      const unequipH = 36;
      const unequipX = colX + (colW - unequipW) / 2;
      const unequipHover = isOver(mx, my, unequipX, itemY, unequipW, unequipH);

      display.drawRoundRect(unequipX, itemY, unequipW, unequipH, 6, {
        fill: unequipHover ? '#2a1515' : '#1a202c',
        stroke: ERROR,
        lineWidth: 2,
      });
      display.drawText('Unequip', unequipX + unequipW / 2, itemY + unequipH / 2, {
        font: 'bold 16px monospace',
        fill: ERROR,
        align: 'center',
        baseline: 'middle',
      });

      if (unequipHover && input.isMouseReleased(0)) {
        setAction({ type: 'EQUIP_HARDWARE', slot, itemId: null });
      }
      itemY += 50;
    }

    // Inventory items for this slot
    const slotItems = meta.itemInventory
      .map((id) => getItemById(id))
      .filter((item) => item?.slot === slot && item.id !== equippedId);

    for (const item of slotItems) {
      if (!item) continue;
      if (itemY > y + h - 100) break;

      const hover = isOver(mx, my, colX + 20, itemY, colW - 40, 70);
      display.drawRoundRect(colX + 20, itemY, colW - 40, 70, 6, {
        fill: hover ? '#1e293b' : '#0f172a',
        stroke: hover ? ACCENT : BORDER_DEFAULT,
        lineWidth: 2,
      });

      display.drawText(item.name, colX + 40, itemY + 15, {
        font: 'bold 18px monospace',
        fill: ITEM_RARITY_COLORS[item.rarity],
        align: 'left',
        baseline: 'top',
      });

      const effectText = formatHardwareEffect(item);
      display.drawText(effectText, colX + 40, itemY + 42, {
        font: '14px monospace',
        fill: TEXT_SECONDARY,
        align: 'left',
        baseline: 'top',
      });

      if (hover && input.isMouseReleased(0)) {
        setAction({ type: 'EQUIP_HARDWARE', slot, itemId: item.id });
      }

      itemY += 80;
    }
  }
}
