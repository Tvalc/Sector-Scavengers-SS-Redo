// Hardware Loadout panel — hero-style full screen layout with pagination by item slot.

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import {
  ItemSlot,
  getItemById,
  ITEM_RARITY_COLORS,
  HardwareItem,
} from '../content/hardware';
import { feedbackLayer } from './feedback-layer';
import {
  SCREEN_W,
  LEFT_ZONE,
  RIGHT_ZONE,
  NAV_Y,
  ACCENT,
  GOLD,
  SUCCESS,
  ERROR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  BG,
  BG_PANEL,
  BORDER_DEFAULT,
  LOCK_COLOR,
  isOver,
  wrapText,
  renderNavigation,
  renderTopBar,
  renderLeftPanelBg,
  renderRightPanelBg,
  renderHeroFrame,
  renderStatusBadge,
} from './panel-layout';
import { setBounds } from './tutorial-bounds';

export type HardwarePanelAction =
  | { type: 'EQUIP_ITEM'; slot: ItemSlot; itemId: string }
  | { type: 'UNEQUIP_ITEM'; slot: ItemSlot }
  | { type: 'CLOSE_HARDWARE' };

// ── Constants ───────────────────────────────────────────────────────────────
const SLOTS: ItemSlot[] = ['hull', 'scanner', 'utility'];
const SLOT_LABELS: Record<ItemSlot, string> = {
  hull: 'HULL',
  scanner: 'SCANNER',
  utility: 'UTILITY',
};
const SLOT_ICONS: Record<ItemSlot, string> = {
  hull: '◈',
  scanner: '◎',
  utility: '⚡',
};

// ── State ────────────────────────────────────────────────────────────────────
let currentSlotPage = 0;

/** Reset the hardware page when opening the panel. */
export function resetHardwarePage(): void {
  currentSlotPage = 0;
}

// ── Helper Functions ─────────────────────────────────────────────────────────

function getEquippedItemForSlot(meta: MetaState, slot: ItemSlot): HardwareItem | null {
  const equippedId = meta.equippedItems[slot];
  return equippedId ? getItemById(equippedId) ?? null : null;
}

function getInventoryForSlot(meta: MetaState, slot: ItemSlot): HardwareItem[] {
  return meta.itemInventory
    .map(id => getItemById(id))
    .filter((item): item is HardwareItem => item !== undefined && item.slot === slot);
}

/** Format an item's effect as a short readable string. */
function effectSummary(item: HardwareItem): string {
  const e = item.effect;
  switch (e.type) {
    case 'breach_chance_down':    return `Danger −${Math.round(e.reduction * 100)}%`;
    case 'extract_bonus_flat':    return `Extract +₡${e.amount}`;
    case 'starting_energy_bonus': return 'Station power upgrade';
    case 'scavenge_bonus_flat':   return `Scavenge +₡${e.amount}`;
    case 'hull_max_bonus':        return `Hull max +${e.amount}`;
    case 'shield_start_bonus':    return `Shields +${e.amount}`;
    case 'bot_damage_reduction':  return 'Bot damage reduced';
    case 'hull_high_danger_reduction': return `Danger −${Math.round(e.reduction * 100)}% when hull > ${e.threshold}`;
    case 'shield_gain_bonus':     return `Shield gains +${e.amount}`;
    case 'upgrade_no_hull_cost':  return 'Upgrades cost no hull';
    case 'bot_credit_bonus_per_bot': return `+₡${e.amount} per bot when extracting`;
    case 'hull_on_shield_block': return `+${e.amount} hull when blocking`;
    case 'shield_gain_and_danger_reduction': return `Shields +${e.shieldBonus}, Danger reduced`;
    case 'void_echo_on_extract':  return `+${e.amount} Void Echo on extract`;
    case 'void_echo_on_collapse': return `+${e.amount} Void Echo on collapse`;
    case 'void_echo_start':       return `Start with ${e.amount} Void Echo`;
    case 'hull_regen_per_round':  return `Hull regen +${e.amount} per round`;
    case 'danger_reduction_at_hull': return `Danger −${Math.round(e.reduction * 100)}% when hull < ${e.threshold}`;
    case 'scavenge_danger_reduction': return `Scavenge danger −${Math.round(e.amount * 100)}%`;
    case 'relic_bonus_chance':    return `${Math.round(e.chance * 100)}% bonus relic chance`;
  }
}

// ── Main Render Function ───────────────────────────────────────────────────

export function renderHardwarePanel(
  meta: MetaState,
  mx: number,
  my: number,
  _dt: number,
): HardwarePanelAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: HardwarePanelAction | null = null;

  // Full screen clear
  display.clear(BG);

  // Ensure page is in valid range
  const totalSlots = SLOTS.length;
  currentSlotPage = Math.max(0, Math.min(currentSlotPage, totalSlots - 1));

  const currentSlot = SLOTS[currentSlotPage];
  const equippedItem = getEquippedItemForSlot(meta, currentSlot);
  const slotInventory = getInventoryForSlot(meta, currentSlot);

  // ── Top Bar ─────────────────────────────────────────────────────────────────
  const topAction = renderTopBar(
    display, input, mx, my,
    'HARDWARE',
    currentSlotPage,
    totalSlots,
    { pageLabel: 'Slot' }
  );
  if (topAction === 'CLOSE') {
    action = { type: 'CLOSE_HARDWARE' };
  }

  // ── Left Zone: Slot Identity & Equipped Item ───────────────────────────────
  const leftAction = renderLeftZone(display, input, mx, my, currentSlot, equippedItem, slotInventory);
  if (leftAction) action = leftAction;

  // ── Right Zone: Inventory List ─────────────────────────────────────────────
  const rightAction = renderRightZone(display, input, mx, my, currentSlot, equippedItem, slotInventory);
  if (rightAction) action = rightAction;

  // ── Navigation ────────────────────────────────────────────────────────────
  const navAction = renderNavigation(display, input, mx, my, currentSlotPage, totalSlots);
  if (navAction !== null) {
    currentSlotPage = navAction;
  }

  // ── Keyboard Input ────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    action = { type: 'CLOSE_HARDWARE' };
  }

  return action;
}

// ── Left Zone Renderer ───────────────────────────────────────────────────────

function renderLeftZone(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  slot: ItemSlot,
  equippedItem: HardwareItem | null,
  _inventory: HardwareItem[],
): HardwarePanelAction | null {
  let action: HardwarePanelAction | null = null;
  renderLeftPanelBg(display);

  let y = LEFT_ZONE.y + 40;

  // Large slot icon
  display.drawText(SLOT_ICONS[slot], LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
    font: 'bold 120px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'top',
  });
  y += 140;

  // Slot label
  display.drawText(SLOT_LABELS[slot], LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
    font: 'bold 56px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'top',
  });
  y += 90;

  // Hero frame for equipped item visualization
  const frameX = LEFT_ZONE.x + 30;
  const frameY = y;
  const frameW = LEFT_ZONE.w - 60;
  const frameH = 320;
  renderHeroFrame(display, frameX, frameY, frameW, frameH);
  y += 340;

  if (equippedItem) {
    // Equipped item name
    display.drawText(equippedItem.name.toUpperCase(), LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
      font: 'bold 40px monospace',
      fill: ITEM_RARITY_COLORS[equippedItem.rarity],
      align: 'center',
      baseline: 'top',
    });
    y += 60;

    // Description (wrapped)
    const descLines = wrapText(equippedItem.description, LEFT_ZONE.w - 80, '30px monospace');
    for (const line of descLines) {
      display.drawText(line, LEFT_ZONE.x + 40, y, {
        font: '30px monospace',
        fill: TEXT_SECONDARY,
        align: 'left',
        baseline: 'top',
      });
      y += 44;
    }
    y += 24;

    // Effect summary
    display.drawText(effectSummary(equippedItem), LEFT_ZONE.x + 40, y, {
      font: 'bold 28px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'top',
    });
    y += 60;

    // Unequip button
    const btnW = 200;
    const btnH = 50;
    const btnX = LEFT_ZONE.x + (LEFT_ZONE.w - btnW) / 2;
    const btnY = y;
    const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

    display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
      fill: btnHover ? '#3a1a1a' : '#2a1515',
      stroke: ERROR,
      lineWidth: 2,
    });
    display.drawText('Unequip', btnX + btnW / 2, btnY + btnH / 2, {
      font: 'bold 26px monospace',
      fill: ERROR,
      align: 'center',
      baseline: 'middle',
    });

    if (btnHover && input.isMouseReleased(0)) {
      action = { type: 'UNEQUIP_ITEM', slot };
    }
  } else {
    // Empty slot
    display.drawText('(EMPTY)', LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
      font: 'bold 40px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });
    y += 60;

    display.drawText('No hardware equipped in this slot.', LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
      font: '28px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'top',
    });
    y += 48;

    display.drawText('Select an item from inventory.', LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
      font: '26px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });
  }

  // Set bounds for tutorial
  setBounds('hw-equipped', { x: LEFT_ZONE.x, y: LEFT_ZONE.y, w: LEFT_ZONE.w, h: LEFT_ZONE.h });

  return action;
}

// ── Right Zone Renderer ─────────────────────────────────────────────────────

function renderRightZone(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  currentSlot: ItemSlot,
  equippedItem: HardwareItem | null,
  inventory: HardwareItem[],
): HardwarePanelAction | null {
  renderRightPanelBg(display);

  let action: HardwarePanelAction | null = null;

  let y = RIGHT_ZONE.y + 30;

  // Section header
  display.drawText('INVENTORY', RIGHT_ZONE.x + 40, y, {
    font: 'bold 36px monospace',
    fill: ACCENT,
    align: 'left',
    baseline: 'top',
  });
  y += 60;

  // Filter for current slot
  const slotItems = inventory;

  if (slotItems.length === 0) {
    // Empty state
    display.drawText('No compatible items in inventory.', RIGHT_ZONE.x + RIGHT_ZONE.w / 2, y + 100, {
      font: '32px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });

    setBounds('hw-inventory', { x: RIGHT_ZONE.x, y: RIGHT_ZONE.y + 80, w: RIGHT_ZONE.w, h: 200 });
    return action;
  }

  // Inventory list
  const rowH = 120;
  const rowGap = 12;
  const maxVisible = 6;
  const visibleItems = slotItems.slice(0, maxVisible);

  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i];
    const rowY = y + i * (rowH + rowGap);

    // Row background
    const rowHover = isOver(mx, my, RIGHT_ZONE.x + 40, rowY, RIGHT_ZONE.w - 80, rowH);
    display.drawRoundRect(RIGHT_ZONE.x + 40, rowY, RIGHT_ZONE.w - 80, rowH, 6, {
      fill: rowHover ? '#1e293b' : '#0f172a',
      stroke: rowHover ? ACCENT : BORDER_DEFAULT,
      lineWidth: 2,
    });

    let cy = rowY + 15;

    // Item name
    display.drawText(item.name.toUpperCase(), RIGHT_ZONE.x + 60, cy, {
      font: 'bold 30px monospace',
      fill: ITEM_RARITY_COLORS[item.rarity],
      align: 'left',
      baseline: 'top',
    });

    // Compare indicator
    if (equippedItem) {
      const compareX = RIGHT_ZONE.x + 60 + display.measureText(item.name.toUpperCase(), { font: 'bold 30px monospace' }).width + 20;
      display.drawText('[vs ' + equippedItem.name + ']', compareX, cy + 3, {
        font: '26px monospace',
        fill: TEXT_MUTED,
        align: 'left',
        baseline: 'top',
      });
    }
    cy += 38;

    // Description
    const descLines = wrapText(item.description, RIGHT_ZONE.w - 320, '26px monospace');
    const visibleLines = descLines.slice(0, 2);
    for (const line of visibleLines) {
      display.drawText(line, RIGHT_ZONE.x + 60, cy, {
        font: '26px monospace',
        fill: TEXT_SECONDARY,
        align: 'left',
        baseline: 'top',
      });
      cy += 34;
    }

    // Effect summary on same row as description
    cy = rowY + rowH - 34;
    display.drawText(effectSummary(item), RIGHT_ZONE.x + 60, cy, {
      font: 'bold 26px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'top',
    });

    // Equip button
    const btnW = 160;
    const btnH = 52;
    const btnX = RIGHT_ZONE.x + RIGHT_ZONE.w - 40 - btnW;
    const btnY = rowY + (rowH - btnH) / 2;
    const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

    display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
      fill: btnHover ? '#1e4a3a' : '#0f3a2a',
      stroke: SUCCESS,
      lineWidth: 2,
    });
    display.drawText('Equip', btnX + btnW / 2, btnY + btnH / 2, {
      font: 'bold 26px monospace',
      fill: SUCCESS,
      align: 'center',
      baseline: 'middle',
    });

    if (btnHover && input.isMouseReleased(0)) {
      action = { type: 'EQUIP_ITEM', slot: currentSlot, itemId: item.id };
      feedbackLayer.spawn('EQUIPPED', btnX + btnW / 2, btnY - 20, SUCCESS);
    }

    // Set bounds for tutorial
    setBounds('hw-equip-btn', { x: btnX, y: btnY, w: btnW, h: btnH });
  }

  // Show count if more items exist
  if (slotItems.length > maxVisible) {
    const remaining = slotItems.length - maxVisible;
    y = y + visibleItems.length * (rowH + rowGap) + 20;
    display.drawText(`+${remaining} more item${remaining > 1 ? 's' : ''}...`, RIGHT_ZONE.x + RIGHT_ZONE.w / 2, y, {
      font: '26px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });
  }

  setBounds('hw-inventory', { x: RIGHT_ZONE.x, y: RIGHT_ZONE.y + 80, w: RIGHT_ZONE.w, h: slotItems.length * (rowH + rowGap) });

  return action;
}

// ── Tutorial Highlight Bounds Getters ───────────────────────────────────────

export function getEquippedSectionBounds(): { x: number; y: number; w: number; h: number } {
  return { x: LEFT_ZONE.x, y: LEFT_ZONE.y, w: LEFT_ZONE.w, h: LEFT_ZONE.h };
}

export function getInventorySectionBounds(): { x: number; y: number; w: number; h: number } {
  return { x: RIGHT_ZONE.x, y: RIGHT_ZONE.y + 80, w: RIGHT_ZONE.w, h: RIGHT_ZONE.h - 160 };
}

export function getEquipBtnBounds(index: number): { x: number; y: number; w: number; h: number } {
  const rowH = 120;
  const rowGap = 12;
  const startY = RIGHT_ZONE.y + 80;
  const rowY = startY + index * (rowH + rowGap);
  const btnW = 160;
  const btnH = 52;
  const btnX = RIGHT_ZONE.x + RIGHT_ZONE.w - 40 - btnW;
  const btnY = rowY + (rowH - btnH) / 2;
  return { x: btnX, y: btnY, w: btnW, h: btnH };
}
