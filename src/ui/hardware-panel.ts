// Hardware Loadout panel — equip/unequip items, compare with currently slotted gear.

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import {
  ItemSlot,
  getItemById,
  ITEM_RARITY_COLORS,
  HardwareItem,
} from '../content/hardware';

export type HardwarePanelAction =
  | { type: 'EQUIP_ITEM'; slot: ItemSlot; itemId: string }
  | { type: 'UNEQUIP_ITEM'; slot: ItemSlot }
  | { type: 'CLOSE_HARDWARE' };

// ── Panel geometry ─────────────────────────────────────────────────────────
const PX = 460;
const PY = 190;
const PW = 1000;
const PH = 700;
const PAD = 30;

// Equipped section
const EQ_START_Y = 260;
const EQ_ROW_H   = 54;

// Inventory section
const INV_LABEL_Y = 440;
const INV_START_Y = 468;
const INV_ROW_H   = 48;
const INV_MAX_VIS = 8;

// Buttons
const UNEQUIP_W = 100;
const UNEQUIP_H = 32;
const EQUIP_W   = 80;
const EQUIP_H   = 30;
const CLOSE_W   = 100;
const CLOSE_H   = 36;
const CLOSE_X   = PX + PW - PAD - CLOSE_W;
const CLOSE_Y   = PY + PH - PAD - CLOSE_H;

const SLOTS: ItemSlot[] = ['hull', 'scanner', 'utility'];
const SLOT_LABELS: Record<ItemSlot, string> = {
  hull:    'Hull:',
  scanner: 'Scanner:',
  utility: 'Utility:',
};

// Module-level press tracking
let pressedId: string | null = null;

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

function btn(
  id: string,
  mx: number,
  my: number,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const input = MakkoEngine.input;
  const over = isOver(mx, my, x, y, w, h);
  if (input.isMousePressed(0) && over) pressedId = id;
  if (input.isMouseReleased(0)) {
    const hit = pressedId === id && over;
    if (pressedId === id) pressedId = null;
    return hit;
  }
  return false;
}

/** Format an item's effect as a short readable string. */
function effectSummary(item: HardwareItem): string {
  const e = item.effect;
  switch (e.type) {
    case 'breach_chance_down':    return `Danger −${Math.round(e.reduction * 100)}%`;
    case 'extract_bonus_flat':    return `Extract +\u20a1${e.amount}`;
    case 'starting_energy_bonus': return e.amount > 0 ? `Energy +${e.amount}` : 'No passive';
    case 'scavenge_bonus_flat':   return `Scavenge +\u20a1${e.amount}`;
    case 'hull_max_bonus':        return `Hull max +${e.amount}`;
    case 'shield_start_bonus':    return `Shields +${e.amount}`;
  }
}

export function renderHardwarePanel(
  meta: MetaState,
  mx: number,
  my: number,
): HardwarePanelAction | null {
  const display = MakkoEngine.display;

  // Clear stale pressedId on any release (safety net)
  if (MakkoEngine.input.isMouseReleased(0) && pressedId !== null) {
    // per-button tracking handles cleanup; this is intentionally left to btn()
  }

  let action: HardwarePanelAction | null = null;

  // ── Panel background ──────────────────────────────────────────────────────
  display.drawRect(PX, PY, PW, PH, { fill: '#0d1117', stroke: '#2d3748', lineWidth: 2 });

  // ── Header ────────────────────────────────────────────────────────────────
  display.drawText('HARDWARE LOADOUT', PX + PW / 2, PY + PAD + 4, {
    font: 'bold 28px monospace', fill: '#e2e8f0', align: 'center', baseline: 'top',
  });

  // ── Equipped slots section ────────────────────────────────────────────────
  display.drawText('EQUIPPED', PX + PAD, EQ_START_Y - 22, {
    font: '14px monospace', fill: '#718096', align: 'left', baseline: 'top',
  });
  display.drawLine(PX + PAD, EQ_START_Y - 6, PX + PW - PAD, EQ_START_Y - 6, {
    stroke: '#2d3748', lineWidth: 1,
  });

  for (let si = 0; si < SLOTS.length; si++) {
    const slot = SLOTS[si];
    const rowY = EQ_START_Y + si * EQ_ROW_H;
    const equippedId = meta.equippedItems[slot];
    const item = equippedId !== null ? getItemById(equippedId) : null;

    // Slot label
    display.drawText(SLOT_LABELS[slot], PX + PAD, rowY + 10, {
      font: '18px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });

    if (item !== null && item !== undefined) {
      // Item name in rarity color
      display.drawText(item.name, PX + PAD + 120, rowY + 10, {
        font: 'bold 18px monospace',
        fill: ITEM_RARITY_COLORS[item.rarity],
        align: 'left',
        baseline: 'top',
      });
      // Effect description
      display.drawText(item.description, PX + PAD + 320, rowY + 10, {
        font: '16px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
      });
      // [Unequip] button
      const ubx = PX + PW - PAD - UNEQUIP_W;
      const uby = rowY + 8;
      const uHover = isOver(mx, my, ubx, uby, UNEQUIP_W, UNEQUIP_H);
      display.drawRect(ubx, uby, UNEQUIP_W, UNEQUIP_H, {
        fill: uHover ? '#742020' : '#2d1010',
        stroke: '#fc8181',
        lineWidth: 1,
      });
      display.drawText('[Unequip]', ubx + UNEQUIP_W / 2, uby + UNEQUIP_H / 2, {
        font: '14px monospace', fill: '#ffffff', align: 'center', baseline: 'middle',
      });
      if (btn(`unequip_${slot}`, mx, my, ubx, uby, UNEQUIP_W, UNEQUIP_H)) {
        action = { type: 'UNEQUIP_ITEM', slot };
      }
    } else {
      display.drawText('(empty)', PX + PAD + 120, rowY + 10, {
        font: '18px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
      });
    }
  }

  // ── Inventory section ─────────────────────────────────────────────────────
  display.drawText('INVENTORY', PX + PAD, INV_LABEL_Y, {
    font: '14px monospace', fill: '#718096', align: 'left', baseline: 'top',
  });
  display.drawLine(PX + PAD, INV_LABEL_Y + 16, PX + PW - PAD, INV_LABEL_Y + 16, {
    stroke: '#2d3748', lineWidth: 1,
  });

  if (meta.itemInventory.length === 0) {
    display.drawText('No items in storage.', PX + PW / 2, INV_START_Y + 20, {
      font: '18px monospace', fill: '#4a5568', align: 'center', baseline: 'top',
    });
  }

  const visibleItems = meta.itemInventory.slice(0, INV_MAX_VIS);
  let hoveredInvItem: { item: HardwareItem; rowY: number } | null = null;

  for (let ii = 0; ii < visibleItems.length; ii++) {
    const itemId = visibleItems[ii];
    const item = getItemById(itemId);
    if (!item) continue;

    const rowY = INV_START_Y + ii * INV_ROW_H;
    const rowHovered = isOver(mx, my, PX + PAD, rowY, PW - PAD * 2, INV_ROW_H - 4);

    // Row background on hover
    if (rowHovered) {
      display.drawRect(PX + PAD, rowY, PW - PAD * 2, INV_ROW_H - 4, {
        fill: '#1a1f2e', stroke: '#2d3748', lineWidth: 1,
      });
      hoveredInvItem = { item, rowY };
    }

    // Item name in rarity color
    display.drawText(item.name, PX + PAD + 8, rowY + 8, {
      font: 'bold 17px monospace',
      fill: ITEM_RARITY_COLORS[item.rarity],
      align: 'left',
      baseline: 'top',
    });

    // Slot tag
    display.drawText(`[${item.slot}]`, PX + PAD + 230, rowY + 8, {
      font: '15px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });

    // Description
    display.drawText(item.description, PX + PAD + 310, rowY + 8, {
      font: '15px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });

    // [Equip] button
    const ebx = PX + PW - PAD - EQUIP_W;
    const eby = rowY + 8;
    const eHover = isOver(mx, my, ebx, eby, EQUIP_W, EQUIP_H);
    display.drawRect(ebx, eby, EQUIP_W, EQUIP_H, {
      fill: eHover ? '#276749' : '#1a3a2a',
      stroke: '#276749',
      lineWidth: 1,
    });
    display.drawText('[Equip]', ebx + EQUIP_W / 2, eby + EQUIP_H / 2, {
      font: '14px monospace', fill: '#ffffff', align: 'center', baseline: 'middle',
    });
    if (btn(`equip_${itemId}_${ii}`, mx, my, ebx, eby, EQUIP_W, EQUIP_H)) {
      action = { type: 'EQUIP_ITEM', slot: item.slot, itemId: item.id };
    }
  }

  // Overflow hint
  if (meta.itemInventory.length > INV_MAX_VIS) {
    const overflowY = INV_START_Y + INV_MAX_VIS * INV_ROW_H;
    display.drawText(
      `+${meta.itemInventory.length - INV_MAX_VIS} more item(s) not shown`,
      PX + PAD,
      overflowY,
      { font: '14px monospace', fill: '#4a5568', align: 'left', baseline: 'top' },
    );
  }

  // ── Compare tooltip (shown when hovering an inventory row) ─────────────────
  if (hoveredInvItem !== null) {
    const { item: hItem, rowY: hRowY } = hoveredInvItem;
    const tooltipY = hRowY + INV_ROW_H;
    const currentId = meta.equippedItems[hItem.slot];
    const currentItem = currentId !== null ? getItemById(currentId) : null;

    const currentLine = currentItem !== null
      ? `Equipped: ${currentItem.name} — ${effectSummary(currentItem)}`
      : `Equipped: (empty)`;
    const newLine = `  New: ${hItem.name} — ${effectSummary(hItem)}`;

    display.drawRect(PX + PAD, tooltipY, PW - PAD * 2 - EQUIP_W - 8, 36, {
      fill: '#0a0d14', stroke: '#4a5568', lineWidth: 1,
    });
    display.drawText(currentLine, PX + PAD + 8, tooltipY + 4, {
      font: '14px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
    });
    display.drawText(newLine, PX + PAD + 8, tooltipY + 20, {
      font: '14px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
    });
  }

  // ── Close button ──────────────────────────────────────────────────────────
  const closeHover = isOver(mx, my, CLOSE_X, CLOSE_Y, CLOSE_W, CLOSE_H);
  display.drawRect(CLOSE_X, CLOSE_Y, CLOSE_W, CLOSE_H, {
    fill: closeHover ? '#2d3748' : '#1a202c',
    stroke: '#4a5568',
    lineWidth: 1,
  });
  display.drawText('[Close]', CLOSE_X + CLOSE_W / 2, CLOSE_Y + CLOSE_H / 2, {
    font: '18px monospace', fill: '#a0aec0', align: 'center', baseline: 'middle',
  });
  if (btn('close_hw', mx, my, CLOSE_X, CLOSE_Y, CLOSE_W, CLOSE_H)) {
    action = { type: 'CLOSE_HARDWARE' };
  }

  return action;
}
