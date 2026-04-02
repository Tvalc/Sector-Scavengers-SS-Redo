import { MakkoEngine } from '@makko/engine';
import { RunState, MetaState } from '../../types/state';
import { ItemSlot } from '../../content/hardware';
import { SALVAGE_DEFS } from '../../content/salvage';
import { getItemById, ITEM_RARITY_COLORS } from '../../content/hardware';
import { CORE_CARDS } from '../../content/cards';
import {
  getCrewById, CrewMemberId,
  type CrewMember,
} from '../../content/crew';

// ── Layout ──────────────────────────────────────────────────────────────────
// 90% screen overlay for better visibility
const SCREEN_W = 1920;
const SCREEN_H = 1080;
const OVERLAY_W = Math.floor(SCREEN_W * 0.9);
const OVERLAY_H = Math.floor(SCREEN_H * 0.9);
const OVERLAY_X = (SCREEN_W - OVERLAY_W) / 2;
const OVERLAY_Y = (SCREEN_H - OVERLAY_H) / 2;

const PAD = 40;
const LINE_H = 28;
const SECTION_GAP = 24;
const COL_W = (OVERLAY_W - PAD * 3) / 2;

// Font sizes - minimum 18px
const FONTS = {
  title: 'bold 32px monospace',
  sectionHeader: 'bold 20px monospace',
  body: '18px monospace',
  small: '16px monospace',
  closeHint: '18px monospace',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCardName(cardId: string): string {
  const card = CORE_CARDS.find(c => c.id === cardId);
  return card?.name || cardId;
}

/** Count cards grouped by name. */
function groupCards(cards: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const id of cards) {
    const name = getCardName(id);
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  return map;
}

/** Get passive description for crew at their current level. */
function getCrewPassiveDesc(crew: CrewMember, level: number): string {
  if (level >= 3) return crew.level3PassiveDesc;
  if (level >= 2) return crew.level2PassiveDesc;
  return crew.passiveDesc;
}

/** Render a section header with an underline. */
function renderSectionHeader(
  display: typeof MakkoEngine.display,
  text: string,
  x: number,
  y: number,
): number {
  display.drawText(text, x, y, {
    font: FONTS.sectionHeader,
    fill: '#e2e8f0',
    align: 'left',
    baseline: 'top',
  });
  display.drawLine(x, y + 28, x + COL_W - PAD, y + 28, {
    stroke: '#2d3748',
    lineWidth: 2,
  });
  return y + 40;
}

// ── Main Renderer ───────────────────────────────────────────────────────────

/**
 * Render the status overlay showing deck composition, hardware, and crew.
 * 90% screen centered dark panel for better visibility.
 */
export function renderStatusOverlay(
  display: typeof MakkoEngine.display,
  run: RunState,
  meta: MetaState,
): void {
  // Dim background
  display.drawRect(0, 0, SCREEN_W, SCREEN_H, {
    fill: '#0d1117',
    alpha: 0.85,
  });

  // Panel background - 90% of screen
  display.drawRect(OVERLAY_X, OVERLAY_Y, OVERLAY_W, OVERLAY_H, {
    fill: '#0d1117',
    stroke: '#4a5568',
    lineWidth: 3,
    alpha: 0.95,
  });

  // Title
  display.drawText('STATUS', OVERLAY_X + OVERLAY_W / 2, OVERLAY_Y + 40, {
    font: FONTS.title,
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'top',
  });

  // Two-column layout
  const leftX = OVERLAY_X + PAD;
  const rightX = leftX + COL_W + PAD;
  let leftY = OVERLAY_Y + 100;
  let rightY = OVERLAY_Y + 100;

  // ═══ LEFT COLUMN: DECK COMPOSITION ═══════════════════════════════════════
  leftY = renderDeckSection(display, run, leftX, leftY);

  // ═══ RIGHT COLUMN: HARDWARE ══════════════════════════════════════════════
  rightY = renderHardwareSection(display, run, meta, rightX, rightY);

  // NOTE: Hull status is intentionally hidden from status overlay
  // Players must use diagnostic cards to learn their hull integrity
  // This creates tension and uncertainty during dives

  // ═══ RIGHT COLUMN: SALVAGE (below hardware) ═══════════════════════════════
  rightY += SECTION_GAP;
  rightY = renderSalvageSection(display, run, rightX, rightY);

  // ═══ RIGHT COLUMN: CREW (below salvage) ═══════════════════════════════════
  rightY += SECTION_GAP;
  renderCrewSection(display, meta, rightX, rightY);

  // Close hint
  display.drawText('Click outside or press ESC to close', OVERLAY_X + OVERLAY_W / 2, OVERLAY_Y + OVERLAY_H - 30, {
    font: FONTS.closeHint,
    fill: '#718096',
    align: 'center',
    baseline: 'bottom',
  });
}

// ── Deck Section ────────────────────────────────────────────────────────────

function renderDeckSection(
  display: typeof MakkoEngine.display,
  run: RunState,
  x: number,
  y: number,
): number {
  const allCards = [...run.deck, ...run.hand, ...run.discardPile];
  y = renderSectionHeader(display, `DECK  (${allCards.length} cards)`, x, y);

  // Summary line
  display.drawText(
    `${run.hand.length} in hand · ${run.deck.length} in draw · ${run.discardPile.length} discarded`,
    x, y, {
      font: FONTS.small,
      fill: '#718096',
      align: 'left',
      baseline: 'top',
    },
  );
  y += LINE_H;

  // Grouped card list
  const grouped = groupCards(allCards);
  // Sort alphabetically
  const sorted = [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const maxLines = 14;
  const visible = sorted.slice(0, maxLines);
  for (const [name, count] of visible) {
    const countStr = count > 1 ? ` ×${count}` : '';
    display.drawText(`• ${name}${countStr}`, x, y, {
      font: FONTS.body,
      fill: '#a0aec0',
      align: 'left',
      baseline: 'top',
    });
    y += LINE_H;
  }

  if (sorted.length > maxLines) {
    display.drawText(`... and ${sorted.length - maxLines} more`, x, y, {
      font: FONTS.small,
      fill: '#718096',
      align: 'left',
      baseline: 'top',
    });
    y += LINE_H;
  }

  return y;
}

// ── Hardware Section ────────────────────────────────────────────────────────

function renderHardwareSection(
  display: typeof MakkoEngine.display,
  run: RunState,
  meta: MetaState,
  x: number,
  y: number,
): number {
  y = renderSectionHeader(display, 'HARDWARE', x, y);

  const slots: ItemSlot[] = ['hull', 'scanner', 'utility'];
  const slotLabels: Record<ItemSlot, string> = {
    hull: 'Hull',
    scanner: 'Scanner',
    utility: 'Utility',
  };

  for (const slot of slots) {
    // Equipped item
    const equippedId = meta.equippedItems[slot];
    // Found item this run
    const foundId = run.foundHardware[slot];

    if (equippedId) {
      const item = getItemById(equippedId);
      if (item) {
        const color = ITEM_RARITY_COLORS[item.rarity];
        display.drawText(`${slotLabels[slot]}: ${item.name}`, x, y, {
          font: FONTS.body,
          fill: color,
          align: 'left',
          baseline: 'top',
        });
        y += LINE_H;
        display.drawText(item.description, x + 20, y, {
          font: FONTS.small,
          fill: '#a0aec0',
          align: 'left',
          baseline: 'top',
        });
        y += LINE_H;
      }
    } else {
      display.drawText(`${slotLabels[slot]}: Empty`, x, y, {
        font: FONTS.body,
        fill: '#4a5568',
        align: 'left',
        baseline: 'top',
      });
      y += LINE_H;
    }

    // Found item (additional, stacked)
    if (foundId) {
      const foundItem = getItemById(foundId);
      if (foundItem && foundItem.id !== equippedId) {
        const color = ITEM_RARITY_COLORS[foundItem.rarity];
        display.drawText(`  + ${foundItem.name} (found)`, x, y, {
          font: FONTS.body,
          fill: color,
          align: 'left',
          baseline: 'top',
        });
        y += LINE_H;
        display.drawText(`  ${foundItem.description}`, x + 20, y, {
          font: FONTS.small,
          fill: '#a0aec0',
          align: 'left',
          baseline: 'top',
        });
        y += LINE_H;
      }
    }
  }

  return y;
}

// ── Salvage Section ─────────────────────────────────────────────────────

function renderSalvageSection(
  display: typeof MakkoEngine.display,
  run: RunState,
  x: number,
  y: number,
): number {
  const totalValue = run.salvage.reduce((sum, s) => sum + (s.quantity * s.valueEach), 0);
  y = renderSectionHeader(display, `SALVAGE  (₡${totalValue.toLocaleString()} value)`, x, y);

  if (run.salvage.length === 0) {
    display.drawText('No salvage collected', x, y, {
      font: FONTS.body,
      fill: '#4a5568',
      align: 'left',
      baseline: 'top',
    });
    return y + LINE_H;
  }

  // Sort by value (highest first)
  const sorted = [...run.salvage].sort((a, b) =>
    (b.quantity * b.valueEach) - (a.quantity * a.valueEach)
  );

  for (const entry of sorted) {
    const def = SALVAGE_DEFS[entry.tier];
    const value = entry.quantity * entry.valueEach;
    const line = `• ${entry.quantity} ${def.label} — ₡${value.toLocaleString()}`;

    display.drawText(line, x, y, {
      font: FONTS.body,
      fill: def.color,
      align: 'left',
      baseline: 'top',
    });
    y += LINE_H;
  }

  return y;
}

// ── Crew Section ────────────────────────────────────────────────────────────

function renderCrewSection(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  x: number,
  y: number,
): number {
  const activeCrew: CrewMemberId[] = [];
  if (meta.leadId) activeCrew.push(meta.leadId);
  for (const id of meta.companionIds) activeCrew.push(id);

  y = renderSectionHeader(display, `CREW  (${activeCrew.length} active)`, x, y);

  if (activeCrew.length === 0) {
    display.drawText('No crew assigned', x, y, {
      font: FONTS.body,
      fill: '#4a5568',
      align: 'left',
      baseline: 'top',
    });
    return y + LINE_H;
  }

  for (const id of activeCrew) {
    const crew = getCrewById(id);
    const level = meta.crewLevels[id] ?? 1;
    const isLead = id === meta.leadId;

    // Name and role
    const leadTag = isLead ? ' ★ Lead' : '';
    display.drawText(`${crew.name} — ${crew.role}${leadTag}  [Lv${level}]`, x, y, {
      font: FONTS.body,
      fill: '#e2e8f0',
      align: 'left',
      baseline: 'top',
    });
    y += LINE_H;

    // Passive description at current level
    const desc = getCrewPassiveDesc(crew, level);
    display.drawText(desc, x + 20, y, {
      font: FONTS.small,
      fill: '#a0aec0',
      align: 'left',
      baseline: 'top',
    });
    y += LINE_H;
  }

  return y;
}
