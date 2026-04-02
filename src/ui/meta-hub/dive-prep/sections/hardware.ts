// Hardware Section Renderer

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../../types/state';
import { getItemById, ITEM_RARITY_COLORS, type ItemSlot } from '../../../../content/hardware';
import { renderSectionBackground } from '../layout';
import { renderPaginationControls } from '../pagination';
import { HARDWARE_X, HARDWARE_Y, SECTION_W, SECTION_H, SLOTS, SLOT_ICONS, SLOT_LABELS } from '../constants';
import { hardwarePage, setHardwarePage } from '../state';
import { DivePrepAction } from '../types';
import { formatHardwareEffect } from '../utils';
import {
  ACCENT, SUCCESS, TEXT_SECONDARY, TEXT_MUTED, BORDER_DEFAULT
} from '../../../panel-layout';
import { isOver } from '../../../panel-layout';

interface SlotItem {
  slot: ItemSlot;
  itemId: string | null;
  item: ReturnType<typeof getItemById>;
}

export function renderHardwareSection(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  _now: number,
): DivePrepAction | null {
  let action: DivePrepAction | null = null;

  renderSectionBackground(display, HARDWARE_X, HARDWARE_Y, 'HARDWARE');

  // Build list of slot-item combinations
  const slotItems: SlotItem[] = [];
  for (const slot of SLOTS) {
    const equippedId = divePrep.equippedForDive[slot] ?? meta.equippedItems[slot];
    slotItems.push({
      slot,
      itemId: equippedId ?? null,
      item: equippedId ? getItemById(equippedId) : null,
    });

    const inventoryItems = meta.itemInventory
      .map((id) => getItemById(id))
      .filter((item) => item?.slot === slot);
    for (const item of inventoryItems) {
      if (item && item.id !== equippedId) {
        slotItems.push({ slot, itemId: item.id, item });
      }
    }
  }

  if (slotItems.length === 0) {
    display.drawText('No hardware available.', HARDWARE_X + SECTION_W / 2, HARDWARE_Y + SECTION_H / 2, {
      font: 'bold 24px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    return action;
  }

  // Ensure hardwarePage is valid
  const validPage = Math.max(0, Math.min(hardwarePage, slotItems.length - 1));
  if (validPage !== hardwarePage) setHardwarePage(validPage);

  const { slot, itemId, item } = slotItems[hardwarePage];
  const isEquipped = divePrep.equippedForDive[slot] === itemId && itemId !== null;

  // Slot icon
  const iconY = HARDWARE_Y + 80;
  display.drawCircle(HARDWARE_X + SECTION_W / 2, iconY, 60, {
    fill: '#1a202c',
    stroke: item ? ITEM_RARITY_COLORS[item.rarity] : BORDER_DEFAULT,
    lineWidth: isEquipped ? 4 : 2,
  });

  display.drawText(SLOT_ICONS[slot], HARDWARE_X + SECTION_W / 2, iconY, {
    font: 'bold 60px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'middle',
  });

  // Slot label
  display.drawText(SLOT_LABELS[slot], HARDWARE_X + SECTION_W / 2, iconY + 80, {
    font: 'bold 22px monospace',
    fill: TEXT_SECONDARY,
    align: 'center',
    baseline: 'top',
  });

  // Item name (or empty)
  const nameY = iconY + 115;
  if (item) {
    display.drawText(item.name.toUpperCase(), HARDWARE_X + SECTION_W / 2, nameY, {
      font: 'bold 24px monospace',
      fill: ITEM_RARITY_COLORS[item.rarity],
      align: 'center',
      baseline: 'top',
    });

    const effectText = formatHardwareEffect(item);
    display.drawText(effectText, HARDWARE_X + SECTION_W / 2, nameY + 32, {
      font: '16px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'top',
    });
  } else {
    display.drawText('(EMPTY)', HARDWARE_X + SECTION_W / 2, nameY, {
      font: 'bold 24px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });
  }

  // Pagination controls
  renderPaginationControls(
    display, input, mx, my,
    HARDWARE_X + SECTION_W / 2 - 75,
    HARDWARE_Y + SECTION_H - 90,
    150,
    hardwarePage,
    slotItems.length,
    setHardwarePage
  );

  // Equip/Unequip button
  const btnW = 140;
  const btnH = 40;
  const btnX = HARDWARE_X + (SECTION_W - btnW) / 2;
  const btnY = HARDWARE_Y + SECTION_H - 40;
  const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

  const btnLabel = isEquipped ? 'EQUIPPED ✓' : item ? 'EQUIP' : 'UNEQUIP';
  display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
    fill: isEquipped ? '#1a3a2a' : btnHover ? '#1e293b' : '#0f172a',
    stroke: isEquipped ? SUCCESS : btnHover ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText(btnLabel, btnX + btnW / 2, btnY + btnH / 2, {
    font: 'bold 16px monospace',
    fill: isEquipped ? SUCCESS : TEXT_SECONDARY,
    align: 'center',
    baseline: 'middle',
  });

  if (btnHover && input.isMouseReleased(0)) {
    action = { type: 'EQUIP_HARDWARE', slot, itemId: isEquipped ? null : itemId };
  }

  return action;
}
