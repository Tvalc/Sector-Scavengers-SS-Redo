// Dive Preparation Layout Constants

import type { DoctrineId } from '../../../content/doctrine';
import type { ItemSlot } from '../../../content/hardware';

// ── Layout Constants ─────────────────────────────────────────────────────────
// These align with meta-hub layout
export const CONTENT_X = 360;
export const CONTENT_Y = 110;
export const CONTENT_W = 1530;
export const CONTENT_H = 940;

// Four-section grid layout (2x2)
export const SECTION_W = 740;
export const SECTION_H = 440;
export const SECTION_GAP_X = 50;
export const SECTION_GAP_Y = 60;

export const CREW_X = CONTENT_X;
export const CREW_Y = CONTENT_Y;
export const SHIP_X = CONTENT_X + SECTION_W + SECTION_GAP_X;
export const SHIP_Y = CONTENT_Y;
export const HARDWARE_X = CONTENT_X;
export const HARDWARE_Y = CONTENT_Y + SECTION_H + SECTION_GAP_Y;
export const HAND_X = CONTENT_X + SECTION_W + SECTION_GAP_X;
export const HAND_Y = CONTENT_Y + SECTION_H + SECTION_GAP_Y;

// ── Colors ──────────────────────────────────────────────────────────────────
export const DOCTRINE_COLORS: Record<DoctrineId, string> = {
  corporate: '#f6ad55',
  cooperative: '#68d391',
  smuggler: '#9f7aea',
};

// ── Slot Configuration ───────────────────────────────────────────────────────
export const SLOTS: ItemSlot[] = ['hull', 'scanner', 'utility'];

export const SLOT_ICONS: Record<ItemSlot, string> = {
  hull: '◈',
  scanner: '◎',
  utility: '⚡',
};

export const SLOT_LABELS: Record<ItemSlot, string> = {
  hull: 'HULL',
  scanner: 'SCANNER',
  utility: 'UTILITY',
};

// ── Expanded View ───────────────────────────────────────────────────────────
export const EXPANDED_TOTAL_PAGES = 4;
export const EXPANDED_PAGE_TITLES = ['CREW SELECTION', 'SHIP SELECTION', 'HARDWARE LOADOUT', 'STARTING HAND'];
