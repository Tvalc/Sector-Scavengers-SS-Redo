// Vertical tutorial panel rendered on the RIGHT side of the screen.
// This leaves the entire center and bottom free for game content.

import { MakkoEngine } from '@makko/engine';
import type { DialoguePlayer } from '../dialogue/dialogue-player';
import type { TutorialInteraction } from '../tutorial/tutorial-context';
import { getTutorialDialogueEntriesForStep } from '../content/tutorial-dialogue';
import type { MetaState } from '../types/state';
import { getBounds } from './tutorial-bounds';

// Import panel bound getters (fallback for panel-specific highlights)
import {
  getSalvageInventoryBounds,
} from './salvage-market-panel';
import {
  getVoidEchoCountBounds,
  getVoidBranchColumnsBounds,
  getFirstAvailableTierBounds,
} from './void-communion-panel';
import {
  getEquippedSectionBounds,
  getInventorySectionBounds,
  getEquipBtnBounds,
} from './hardware-panel';
import {
  getCryoWakeBtnBounds,
  getCryoPoolSectionBounds,
} from './cryo-panel';
import {
  getModulesGridBounds,
  getUpgradeBtnBounds,
} from './modules-panel';

// ── Types ─────────────────────────────────────────────────────────────────────
export type TutorialHighlight =
  | 'start-dive-btn'
  | 'recharge-btn'
  | 'scrap-btn'
  | 'salvage-btn'
  | 'tab-overview'
  | 'tab-crew'
  | 'tab-secondary'
  | 'bill-countdown'
  | 'hull-display'
  | 'rounds-display'
  | 'card-scavenge'
  | 'card-repair'
  | 'card-extract'
  | 'route-map'
  | 'route-toggle-btn'
  | 'left-column'
  | 'overview'
  | 'crew-modules'
  | 'secondary'
  | 'salvage'
  // Panel tutorial highlights (steps 6-10)
  | 'salvage-inventory'
  | 'salvage-sell-btn'
  | 'salvage-pay-debt'
  | 'salvage-debt-display'
  | 'void-echo-count'
  | 'void-branches'
  | 'void-first-tier'
  | 'void-effect'
  | 'void-shop'
  | 'hw-equipped'
  | 'hw-inventory'
  | 'hw-equip-btn'
  | 'cryo-wake-btn'
  | 'cryo-pool'
  | 'modules-grid'
  | 'modules-upgrade-btn'
  | 'ship-grid'
  | 'ship-progress'
  | 'ship-focus-btn'
  // Sub-panel navigation highlights (secondary tab buttons)
  | 'void-communion-nav'
  | 'hardware-nav'
  | 'cryo-nav'
  | 'modules-nav'
  // Left panel elements (always visible on hub)
  | 'debt-display'
  | 'tactics-loadout'
  // Crew-modules tab content highlights
  | 'crew-roster'
  | 'modules-section'
  // Secondary tab content highlights
  | 'secondary-nav-buttons'
  | 'ships-section'
  // Extraction manifest highlight
  | 'extract-manifest'
  | null;

export type TutorialOverlayResult = { interactionRequested: TutorialInteraction | null };

// ── Layout (normal mode) ────────────────────────────────────────────────────
const PANEL_X = 1610;
const PANEL_Y = 50;
const PANEL_W = 290;
const PANEL_H = 860;

// ── Layout (compact mode for panel screens) ─────────────────────────────────
const COMPACT_X = 1650;
const COMPACT_W = 250;
const COMPACT_H = 800;

// VALU speaker badge at top of panel
const BADGE_W = 180;
const BADGE_H = 70;

// Buttons
const BTN_W = 200;
const BTN_H = 80;
// Progress indicator offset from bottom
const PROGRESS_Y_OFFSET = 30;

// VALU speaker badge colors
const SPEAKER_BG = '#0891b2';
const SPEAKER_BORDER = '#22d3ee';
const SPEAKER_TEXT = '#f0fdfa';

// Highlight config
const ARROW_FILL = '#22d3ee';
const PULSE_SPEED = 0.003;
const PULSE_MIN = 0.4;
const PULSE_MAX = 1.0;

// ── Panel highlight bounds getters (fallback for panel-specific highlights) ──
function getPanelHighlightBounds(highlight: TutorialHighlight, meta?: MetaState): { x: number; y: number; w: number; h: number } | null {
  switch (highlight) {
    case 'salvage-inventory': return getSalvageInventoryBounds();
    case 'void-echo-count': return getVoidEchoCountBounds();
    case 'void-branches': return getVoidBranchColumnsBounds();
    case 'void-first-tier': return meta ? (getFirstAvailableTierBounds(meta) ?? null) : null;
    case 'void-effect': return getVoidBranchColumnsBounds();

    case 'hw-equipped': return getEquippedSectionBounds();
    case 'hw-inventory': return getInventorySectionBounds();
    case 'hw-equip-btn': return getEquipBtnBounds(0);
    case 'cryo-pool': return getCryoPoolSectionBounds();
    case 'cryo-wake-btn': return getCryoWakeBtnBounds(0);
    case 'modules-grid': return getModulesGridBounds();
    case 'modules-upgrade-btn': return getUpgradeBtnBounds('salvage_bay');
    default: return null;
  }
}

// ── Press tracking ────────────────────────────────────────────────────────────
let pressedNext = false;
let isCompactMode = false;

function isOverNext(mx: number, my: number, panelX: number, panelY: number, panelW: number, panelH: number): boolean {
  const btnY = panelY + panelH - 100;
  const btnNextX = panelX + (panelW - BTN_W) / 2;
  return mx >= btnNextX && mx <= btnNextX + BTN_W && my >= btnY && my <= btnY + BTN_H;
}

function isOverPanel(mx: number, my: number, panelX: number, panelY: number, panelW: number, panelH: number): boolean {
  return mx >= panelX && mx <= panelX + panelW && my >= panelY && my <= panelY + panelH;
}

let pulsePhase = 0;

function updatePulsePhase(deltaTime: number): void {
  pulsePhase += deltaTime * PULSE_SPEED;
  if (pulsePhase > 1) pulsePhase -= 1;
}

function getPulseAlpha(): number {
  const sine = Math.sin(pulsePhase * Math.PI * 2);
  return PULSE_MIN + (sine + 1) / 2 * (PULSE_MAX - PULSE_MIN);
}

function drawHighlightBorder(
  display: typeof MakkoEngine.display,
  bounds: { x: number; y: number; w: number; h: number },
): void {
  const alpha = getPulseAlpha();
  const p = 8;
  display.drawRect(bounds.x - p, bounds.y - p, bounds.w + p * 2, bounds.h + p * 2, {
    stroke: ARROW_FILL,
    lineWidth: 3,
    alpha,
  });
}

/**
 * Draw highlight border around the target element.
 * Uses the bounds registry (populated by renderers) first,
 * falls back to panel-specific getters, then route-map hardcoded constant.
 */
function drawHighlightArrow(display: typeof MakkoEngine.display, highlight: TutorialHighlight, meta?: MetaState): void {
  if (highlight === null) return;

  // 1. Try the dynamic bounds registry first
  const registryBounds = getBounds(highlight);
  if (registryBounds) {
    drawHighlightBorder(display, registryBounds);
    return;
  }

  // 2. Try panel-specific highlight getters (fallback for edge cases)
  const panelBounds = getPanelHighlightBounds(highlight, meta);
  if (panelBounds) {
    drawHighlightBorder(display, panelBounds);
    return;
  }

  // 3. Special case: route-map — stable center panel frame
  if (highlight === 'route-map') {
    drawHighlightBorder(display, { x: 280, y: 50, w: 1410, h: 755 });
    return;
  }

  // No match: no-op
}

/**
 * Look up the expected interaction for a specific tutorial step and entry index.
 */
export function getExpectedInteractionForEntry(step: number, entryIndex: number): TutorialInteraction | null {
  const entries = getTutorialDialogueEntriesForStep(step);
  if (entryIndex < 0 || entryIndex >= entries.length) return null;
  return entries[entryIndex].expectedInteraction ?? null;
}

/**
 * Render the vertical tutorial panel on the RIGHT side of the screen.
 */
export function renderTutorialOverlay(
  player: DialoguePlayer,
  mx: number,
  my: number,
  step: number,
  highlight?: TutorialHighlight,
  deltaTime: number = 16,
  _isHub: boolean = false,
  meta?: MetaState,
  compact?: boolean,
): TutorialOverlayResult {
  updatePulsePhase(deltaTime);
  isCompactMode = compact ?? false;

  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  // Determine panel layout based on compact mode
  const panelX = isCompactMode ? COMPACT_X : PANEL_X;
  const panelY = PANEL_Y;
  const panelW = isCompactMode ? COMPACT_W : PANEL_W;
  const panelH = isCompactMode ? COMPACT_H : PANEL_H;

  // Calculate derived positions
  const badgeX = panelX + 20;
  const badgeY = panelY + 20;
  const textX = panelX + 20;
  const textY = panelY + 110;
  const textW = panelW - 40;
  const textMaxHeight = isCompactMode ? 510 : 580;
  const btnY = panelY + panelH - 100;
  const btnNextX = panelX + (panelW - BTN_W) / 2;
  const progressY = panelY + panelH - PROGRESS_Y_OFFSET;

  const text = player.getDisplayedText();
  const isOnLastEntry = player.isOnLastEntry;
  const isComplete = player.isComplete;

  const expectedInteraction = getExpectedInteractionForEntry(step, player.currentEntryIndex);
  const waitingForGameInteraction = expectedInteraction !== null &&
    expectedInteraction.type !== 'next-btn';

  // ── Background panel ──────────────────────────────────────────────────────
  display.drawRect(panelX, panelY, panelW, panelH, {
    fill: '#0a0d14',
    stroke: '#22d3ee',
    lineWidth: 2,
    alpha: 0.95,
  });

  // ── Highlight border (drawn behind panel, in game area) ───────────────────
  if (highlight !== undefined) {
    drawHighlightArrow(display, highlight, meta);
  }

  // ── VALU speaker badge ────────────────────────────────────────────────────
  display.drawRoundRect(badgeX, badgeY, BADGE_W, BADGE_H, 6, {
    fill: SPEAKER_BG,
    stroke: SPEAKER_BORDER,
    lineWidth: 2,
  });
  display.drawText('V.A.L.U.', badgeX + BADGE_W / 2, badgeY + BADGE_H / 2, {
    font: 'bold 35px monospace',
    fill: SPEAKER_TEXT,
    align: 'center',
    baseline: 'middle',
  });

  // ── Guidance text (typewriter, word-wrapped) ──────────────────────────────
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const font = isCompactMode ? '28px monospace' : 'bold 32px monospace';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = display.measureText(testLine, { font });
    if (metrics.width > textW && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = isCompactMode ? 42 : 48;
  const maxLines = Math.floor(textMaxHeight / lineHeight);

  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    display.drawText(lines[i], textX, textY + i * lineHeight, {
      font,
      fill: '#f6e05e',
      align: 'left',
      baseline: 'top',
    });
  }

  if (lines.length > maxLines) {
    display.drawText('...', textX + textW / 2, textY + maxLines * lineHeight, {
      font: isCompactMode ? 'bold 40px monospace' : 'bold 45px monospace',
      fill: '#718096',
      align: 'center',
      baseline: 'top',
    });
  }

  // ── Progress pill ─────────────────────────────────────────────────────────
  display.drawText(
    `${player.currentEntryIndex + 1} / ${player.totalEntries}`,
    panelX + panelW / 2, progressY,
    { font: '35px monospace', fill: '#4a5568', align: 'center', baseline: 'middle' },
  );

  // ── Next / Got-it button ──────────────────────────────────────────────────
  const hoverNext = isOverNext(mx, my, panelX, panelY, panelW, panelH);

  let nextLabel: string;
  let nextFill: string;
  let nextStroke: string;
  let nextTextFill: string;
  let isClickable: boolean;

  if (waitingForGameInteraction) {
    nextLabel = '[Wait]';
    nextFill = '#1a202c';
    nextStroke = '#4a5568';
    nextTextFill = '#718096';
    isClickable = false;
  } else if (isOnLastEntry && isComplete) {
    nextLabel = '[Got it]';
    nextFill = hoverNext ? '#1a2040' : '#0d1430';
    nextStroke = hoverNext ? '#63b3ed' : '#2b4a8e';
    nextTextFill = hoverNext ? '#90cdf4' : '#63b3ed';
    isClickable = true;
  } else {
    nextLabel = '[Next]';
    nextFill = hoverNext ? '#1a2040' : '#0d1430';
    nextStroke = hoverNext ? '#63b3ed' : '#2b4a8e';
    nextTextFill = hoverNext ? '#90cdf4' : '#63b3ed';
    isClickable = true;
  }

  display.drawRoundRect(btnNextX, btnY, BTN_W, BTN_H, 6, {
    fill: nextFill, stroke: nextStroke, lineWidth: 1,
  });
  display.drawText(nextLabel, btnNextX + BTN_W / 2, btnY + BTN_H / 2, {
    font: 'bold 35px monospace', fill: nextTextFill, align: 'center', baseline: 'middle',
  });

  // ── Click detection ───────────────────────────────────────────────────────
  if (isClickable && input.isMousePressed(0) && isOverNext(mx, my, panelX, panelY, panelW, panelH)) pressedNext = true;

  let interactionRequested: TutorialInteraction | null = null;

  if (input.isMouseReleased(0)) {
    if (pressedNext && isOverNext(mx, my, panelX, panelY, panelW, panelH) && isClickable) {
      interactionRequested = { type: 'next-btn' };
    }
    pressedNext = false;
  }

  return { interactionRequested };
}

/**
 * Get the current tutorial panel bounds based on compact mode.
 */
export function getTutorialPanelBounds(compact?: boolean): { x: number; y: number; w: number; h: number } {
  const isCompact = compact ?? false;
  return {
    x: isCompact ? COMPACT_X : PANEL_X,
    y: PANEL_Y,
    w: isCompact ? COMPACT_W : PANEL_W,
    h: isCompact ? COMPACT_H : PANEL_H,
  };
}

export function getTutorialPanelX(compact?: boolean): number {
  return compact ? COMPACT_X : PANEL_X;
}

export function isTutorialPanelActive(): boolean { return true; }

/**
 * Check if a point is inside the tutorial panel.
 */
export function isOverTutorialPanel(mx: number, my: number, compact?: boolean): boolean {
  const bounds = getTutorialPanelBounds(compact);
  return mx >= bounds.x && mx <= bounds.x + bounds.w && my >= bounds.y && my <= bounds.y + bounds.h;
}
