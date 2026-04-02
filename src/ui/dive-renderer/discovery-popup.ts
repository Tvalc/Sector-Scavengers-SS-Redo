// Discovery popup — narrative overlay for salvage found during runs.
// Replaces mechanical "+2 Components" with atmospheric treasure discovery.

import { MakkoEngine } from '@makko/engine';
import { SalvageTier, SALVAGE_DEFS } from '../../content/salvage';
import { DiscoveryContext, formatDiscoveryNarrative } from '../../content/salvage-discovery';

// ═══════════════════════════════════════════════════════════════════════════════
// POPUP STATE
// ═══════════════════════════════════════════════════════════════════════════════

interface ActivePopup {
  tier: SalvageTier;
  quantity: number;
  context: DiscoveryContext;
  narrative: string;
  startTime: number;
  dismissed: boolean;
}

let activePopup: ActivePopup | null = null;

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const POPUP_DURATION = 3500; // 3.5 seconds auto-dismiss
const POPUP_WIDTH = 700;
const POPUP_HEIGHT = 400;
const GLOW_PULSE_SPEED = 0.002;

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Show a discovery popup when salvage is found during a run.
 *
 * @param tier — The salvage tier discovered
 * @param quantity — How many units were found
 * @param context — The context of discovery (combat/exploration/breach/cache)
 */
export function showDiscoveryPopup(
  tier: SalvageTier,
  quantity: number,
  context: DiscoveryContext,
): void {
  const narrative = formatDiscoveryNarrative(tier, quantity, context);

  activePopup = {
    tier,
    quantity,
    context,
    narrative,
    startTime: performance.now(),
    dismissed: false,
  };
}

/**
 * Check if a discovery popup is currently visible.
 */
export function isDiscoveryPopupVisible(): boolean {
  if (!activePopup || activePopup.dismissed) return false;
  const elapsed = performance.now() - activePopup.startTime;
  return elapsed < POPUP_DURATION;
}

/**
 * Manually dismiss the active popup (on click or key press).
 */
export function dismissDiscoveryPopup(): void {
  if (activePopup) {
    activePopup.dismissed = true;
  }
}

/**
 * Get the currently active popup state (for external inspection).
 */
export function getActiveDiscoveryPopup(): ActivePopup | null {
  return activePopup;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render the discovery popup if active.
 * Should be called after all other dive UI rendering for proper overlay.
 *
 * @returns true if popup was rendered (and should block other interactions)
 */
export function renderDiscoveryPopup(mx: number, my: number): boolean {
  if (!activePopup || activePopup.dismissed) return false;

  const now = performance.now();
  const elapsed = now - activePopup.startTime;

  // Auto-dismiss after duration
  if (elapsed >= POPUP_DURATION) {
    activePopup = null;
    return false;
  }

  const display = MakkoEngine.display;
  const { width: screenW, height: screenH } = display;

  // Centered popup position
  const px = (screenW - POPUP_WIDTH) / 2;
  const py = (screenH - POPUP_HEIGHT) / 2;

  // Calculate fade in/out
  const fadeIn = Math.min(1, elapsed / 300);
  const fadeOut = elapsed > POPUP_DURATION - 400
    ? Math.max(0, (POPUP_DURATION - elapsed) / 400)
    : 1;
  const alpha = fadeIn * fadeOut;

  // Glow pulse effect
  const pulse = 0.7 + 0.3 * Math.sin(now * GLOW_PULSE_SPEED);
  const def = SALVAGE_DEFS[activePopup.tier];

  // ══ BACKDROP DIM ═════════════════════════════════════════════════════════
  display.drawRect(0, 0, screenW, screenH, {
    fill: `rgba(0, 0, 0, ${0.6 * alpha})`,
  });

  // ══ POPUP PANEL ═══════════════════════════════════════════════════════════
  // Outer glow
  const glowColor = def.color;
  display.drawRoundRect(px - 4, py - 4, POPUP_WIDTH + 8, POPUP_HEIGHT + 8, 16, {
    fill: `rgba(${hexToRgb(glowColor)}, ${0.3 * alpha * pulse})`,
  });

  // Main panel background
  display.drawRoundRect(px, py, POPUP_WIDTH, POPUP_HEIGHT, 12, {
    fill: `rgba(8, 14, 26, ${0.95 * alpha})`,
    stroke: glowColor,
    lineWidth: 2,
  });

  // ══ TIER ICON ════════════════════════════════════════════════════════════
  const iconY = py + 30;
  const iconSize = 80;
  const iconX = px + POPUP_WIDTH / 2;

  // Icon glow
  display.drawCircle(iconX, iconY + iconSize / 2, iconSize / 2 + 8, {
    fill: `rgba(${hexToRgb(glowColor)}, ${0.4 * alpha * pulse})`,
  });

  // Icon background
  display.drawCircle(iconX, iconY + iconSize / 2, iconSize / 2, {
    fill: `rgba(${hexToRgb(glowColor)}, ${0.2 * alpha})`,
    stroke: glowColor,
    lineWidth: 2,
  });

  // Icon symbol (simple geometric representation per tier)
  const iconSymbol = getTierIconSymbol(activePopup.tier);
  display.drawText(iconSymbol, iconX, iconY + iconSize / 2, {
    font: `bold ${Math.floor(48 * alpha)}px monospace`,
    fill: glowColor,
    align: 'center',
    baseline: 'middle',
  });

  // ══ QUANTITY ═════════════════════════════════════════════════════════════
  const qtyY = iconY + iconSize + 20;
  const qtyText = `+${activePopup.quantity} ${def.label.toUpperCase()}`;
  display.drawText(qtyText, px + POPUP_WIDTH / 2, qtyY, {
    font: `bold ${Math.floor(36 * alpha)}px monospace`,
    fill: glowColor,
    align: 'center',
    baseline: 'top',
  });

  // ══ NARRATIVE TEXT ═══════════════════════════════════════════════════════
  const textY = qtyY + 50;
  const textX = px + 40;
  const textW = POPUP_WIDTH - 80;

  // Split narrative into lines
  const lines = wrapText(activePopup.narrative, textW, 24);
  let lineY = textY;
  for (const line of lines) {
    display.drawText(line, textX, lineY, {
      font: `${Math.floor(22 * alpha)}px monospace`,
      fill: `rgba(232, 237, 245, ${alpha})`,
      align: 'left',
      baseline: 'top',
    });
    lineY += 28;
  }

  // ══ DISMISS HINT ═════════════════════════════════════════════════════════
  const hintY = py + POPUP_HEIGHT - 35;
  const hintText = 'Click or press SPACE to dismiss';
  const hintAlpha = (0.5 + 0.5 * pulse) * alpha;
  display.drawText(hintText, px + POPUP_WIDTH / 2, hintY, {
    font: `${Math.floor(18 * hintAlpha)}px monospace`,
    fill: `rgba(136, 153, 176, ${hintAlpha})`,
    align: 'center',
    baseline: 'top',
  });

  // ══ INTERACTION CHECK ════════════════════════════════════════════════════
  const input = MakkoEngine.input;

  // Check for click on popup
  const overPopup = mx >= px && mx <= px + POPUP_WIDTH && my >= py && my <= py + POPUP_HEIGHT;
  if (input.isMousePressed(0) || input.isKeyPressed('Space')) {
    dismissDiscoveryPopup();
    return false;
  }

  return true; // Popup is active, blocks other interactions
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getTierIconSymbol(tier: SalvageTier): string {
  switch (tier) {
    case 'scrap': return '◈'; // rough diamond for raw material
    case 'components': return '⚙'; // gear for working parts
    case 'relic': return '◉'; // circled dot for mysterious artifact
    case 'medtech': return '+'; // plus for medical
    default: return '◆';
  }
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const display = MakkoEngine.display;
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = display.measureText(testLine, { font: `${fontSize}px monospace` });

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Trigger a discovery popup from card effects.
 * Use this helper in card effect handlers to show narrative salvage discovery.
 *
 * Example:
 *   import { triggerSalvageDiscovery } from '../ui/dive-renderer/discovery-popup';
 *   triggerSalvageDiscovery('components', 2, 'exploration');
 */
export function triggerSalvageDiscovery(
  tier: SalvageTier,
  quantity: number,
  context: DiscoveryContext,
): void {
  showDiscoveryPopup(tier, quantity, context);
}
