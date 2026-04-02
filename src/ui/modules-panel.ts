// Station Modules panel — full-screen paged layout with single-panel progression.

import { MakkoEngine } from '@makko/engine';
import type { MetaState } from '../types/state';
import { ModuleId, MODULE_DEFS, ModuleDef, ModuleUpgrade, ModuleEffect } from '../content/modules';
import { SalvageTier, SALVAGE_DEFS } from '../content/salvage';
import { feedbackLayer } from './feedback-layer';
import {
  LEFT_ZONE,
  RIGHT_ZONE,
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
  renderProgressionStepper,
  renderSinglePanelContentArea,
  SinglePanelProgressionConfig,
  ProgressionTier,
} from './panel-layout';
import { setBounds } from './tutorial-bounds';

export type PanelContext = 'meta' | 'dive';

export type ModulesPanelAction =
  | { type: 'UPGRADE_MODULE'; moduleId: ModuleId }
  | { type: 'CLOSE_MODULES' };

// Page state
let currentModulePage = 0;

/** Reset the module page to 0 when opening the panel. */
export function resetModulesPage(): void {
  currentModulePage = 0;
}

/** Check if the player can afford a specific module upgrade. */
function canAfford(meta: MetaState, moduleId: ModuleId): boolean {
  const currentLevel = meta.moduleLevels[moduleId] ?? 0;
  if (currentLevel >= 3) return false;

  const def = MODULE_DEFS.find((m) => m.id === moduleId);
  if (!def) return false;

  const upgrade = def.upgrades.find((u) => u.level === currentLevel + 1);
  if (!upgrade) return false;

  if (meta.credits < upgrade.creditCost) return false;

  for (const [tier, required] of Object.entries(upgrade.salvageCost) as Array<[SalvageTier, number]>) {
    const held = meta.hubInventory.find((e) => e.tier === tier);
    if (!held || held.quantity < (required ?? 0)) return false;
  }

  return true;
}

/** Format module effect as a readable string. */
function formatEffect(effect: ModuleEffect): string {
  switch (effect.type) {
    case 'audit_detection_reduction': return `Audit detection −${effect.pct}%`;
    case 'wake_discount':           return `Wake cost −${effect.cells} power cell${effect.cells !== 1 ? 's' : ''}`;
    case 'repair_speed':            return `Repair speed +${effect.bonus} per run`;
    case 'energy_cap_bonus':        return 'Station power upgrade';
    case 'danger_chance_reduction': return `Danger chance −${Math.round(effect.amount * 100)}%`;
    case 'market_discount':         return 'Market connections upgrade';
    case 'debt_reduction':          return `−₡${effect.amount.toLocaleString()} starting debt`;
  }
}

/** Get all active effects for a module at its current level. */
function getActiveEffects(mod: ModuleDef, currentLevel: number): string[] {
  const effects: string[] = [];
  for (const upgrade of mod.upgrades) {
    if (upgrade.level <= currentLevel) {
      effects.push(formatEffect(upgrade.effect));
    }
  }
  return effects;
}

/**
 * Renders salvage cost display.
 */
function renderSalvageCost(
  display: typeof MakkoEngine.display,
  salvageCost: Partial<Record<SalvageTier, number>>,
  meta: MetaState,
  x: number,
  y: number
): number {
  let cy = y;
  const entries = Object.entries(salvageCost) as Array<[SalvageTier, number]>;

  if (entries.length === 0) {
    display.drawText('No salvage required', x, cy, {
      font: '22px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'middle',
    });
    return cy + 32;
  }

  entries.forEach(([tier, required]) => {
    const held = meta.hubInventory.find((e) => e.tier === tier);
    const qty = held ? held.quantity : 0;
    const tierColor = qty >= required ? SALVAGE_DEFS[tier].color : ERROR;

    display.drawText(`${SALVAGE_DEFS[tier].label}: ${qty}/${required}`, x, cy, {
      font: 'bold 26px monospace',
      fill: tierColor,
      align: 'left',
      baseline: 'middle',
    });
    cy += 36;
  });

  return cy;
}

// ── Main Render Function ────────────────────────────────────────────────────

export function renderModulesPanel(
  meta: MetaState,
  mx: number,
  my: number,
  _animator?: unknown,
  _context: PanelContext = 'meta',
): ModulesPanelAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: ModulesPanelAction | null = null;

  // Full screen clear
  display.clear(BG);

  // Ensure page is in valid range
  const totalModules = MODULE_DEFS.length;
  currentModulePage = Math.max(0, Math.min(currentModulePage, totalModules - 1));

  const mod = MODULE_DEFS[currentModulePage];
  const currentLevel = meta.moduleLevels[mod.id] ?? 0;
  const isMaxed = currentLevel >= 3;
  const nextUpgrade = !isMaxed
    ? mod.upgrades.find((u) => u.level === currentLevel + 1)
    : null;
  const affordable = nextUpgrade ? canAfford(meta, mod.id) : false;

  // ── Top Bar ────────────────────────────────────────────────────────────────
  const topAction = renderTopBar(
    display, input, mx, my,
    'STATION MODULES',
    currentModulePage,
    totalModules,
    { pageLabel: 'Module' }
  );
  if (topAction === 'CLOSE') {
    action = { type: 'CLOSE_MODULES' };
  }

  // ── Left Zone: Module Identity ────────────────────────────────────────────
  renderLeftZone(display, mod, currentLevel, isMaxed);

  // ── Right Zone: Single Panel Progression ───────────────────────────────────
  const rightAction = renderRightZone(display, input, mx, my, meta, mod, currentLevel, nextUpgrade, affordable);
  if (rightAction) {
    action = rightAction;
    feedbackLayer.spawn('UPGRADED', 800 + 520, 800, ACCENT);
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const navAction = renderNavigation(display, input, mx, my, currentModulePage, totalModules);
  if (navAction !== null) {
    currentModulePage = navAction;
  }

  // ── Input Handling ────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    action = { type: 'CLOSE_MODULES' };
  }

  return action;
}

// ── Sub-Render Functions ───────────────────────────────────────────────────

function renderLeftZone(
  display: typeof MakkoEngine.display,
  mod: ModuleDef,
  currentLevel: number,
  isMaxed: boolean,
): void {
  const zoneX = LEFT_ZONE.x;
  const zoneY = LEFT_ZONE.y;
  const zoneW = LEFT_ZONE.w;
  const zoneH = LEFT_ZONE.h;

  // Background panel
  display.drawRect(zoneX, zoneY, zoneW, zoneH, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  // Hero frame for module icon
  const frameX = zoneX + 30;
  const frameY = zoneY + 50;
  const frameW = zoneW - 60;
  const frameH = 400;

  display.drawRect(frameX, frameY, frameW, frameH, {
    fill: '#0a0f1a',
    stroke: ACCENT,
    lineWidth: 2,
  });

  // Draw hexagon icon
  const centerX = frameX + frameW / 2;
  const centerY = frameY + frameH / 2;
  const hexSize = 80;

  const hexPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    hexPoints.push({
      x: centerX + hexSize * Math.cos(angle),
      y: centerY + hexSize * Math.sin(angle),
    });
  }
  display.drawPolygon(hexPoints, {
    fill: '#1a3a4a',
    stroke: ACCENT,
    lineWidth: 3,
  });

  const initial = mod.name.charAt(0).toUpperCase();
  display.drawText(initial, centerX, centerY, {
    font: 'bold 64px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'middle',
  });

  // Module name
  const nameY = frameY + frameH + 60;
  display.drawText(mod.name.toUpperCase(), zoneX + zoneW / 2, nameY, {
    font: 'bold 64px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'top',
  });

  // Status badge
  const badgeY = nameY + 60;
  const badgeW = 160;
  const badgeH = 44;
  const badgeX = zoneX + (zoneW - badgeW) / 2;

  if (isMaxed) {
    display.drawRoundRect(badgeX, badgeY, badgeW, badgeH, 8, {
      fill: '#1a3a4a',
      stroke: ACCENT,
      lineWidth: 2,
    });
    display.drawText('✓ MAXED', badgeX + badgeW / 2, badgeY + badgeH / 2, {
      font: 'bold 36px monospace',
      fill: ACCENT,
      align: 'center',
      baseline: 'middle',
    });
  } else {
    display.drawRoundRect(badgeX, badgeY, badgeW, badgeH, 8, {
      fill: '#1a202c',
      stroke: BORDER_DEFAULT,
      lineWidth: 2,
    });
    display.drawText(`LEVEL ${currentLevel}/3`, badgeX + badgeW / 2, badgeY + badgeH / 2, {
      font: 'bold 36px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'middle',
    });
  }
}

function renderRightZone(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  meta: MetaState,
  mod: ModuleDef,
  currentLevel: number,
  nextUpgrade: ModuleUpgrade | undefined,
  affordable: boolean,
): ModulesPanelAction | null {
  let action: ModulesPanelAction | null = null;

  // Background panel
  display.drawRect(RIGHT_ZONE.x, RIGHT_ZONE.y, RIGHT_ZONE.w, RIGHT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  let y = RIGHT_ZONE.y + 25;

  // ── Description Section ───────────────────────────────────────────────────
  display.drawText('DESCRIPTION', RIGHT_ZONE.x + 40, y, {
    font: 'bold 32px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 38;

  const descLines = wrapText(mod.description, RIGHT_ZONE.w - 80, '28px monospace');
  for (const line of descLines.slice(0, 2)) {
    display.drawText(line, RIGHT_ZONE.x + 60, y, {
      font: '28px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });
    y += 38;
  }
  y += 20;

  // ── Active Effects ────────────────────────────────────────────────────────
  display.drawText('ACTIVE EFFECTS', RIGHT_ZONE.x + 40, y, {
    font: 'bold 32px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 38;

  const activeEffects = getActiveEffects(mod, currentLevel);
  if (activeEffects.length > 0) {
    display.drawText(activeEffects.join(', '), RIGHT_ZONE.x + 60, y, {
      font: '28px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'top',
    });
  } else {
    display.drawText('No active effects', RIGHT_ZONE.x + 60, y, {
      font: '28px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
  }
  y += 56;

  // ── Progression Stepper ───────────────────────────────────────────────────
  const stepperConfig: SinglePanelProgressionConfig = {
    currentTierIndex: currentLevel,
    accentColor: ACCENT,
    tiers: mod.upgrades.map(u => ({
      tierNumber: u.level,
      label: `Lvl ${u.level}`,
      isComplete: u.level <= currentLevel,
      isCurrent: u.level === currentLevel + 1 && currentLevel < 3,
    })),
  };

  renderProgressionStepper(display, RIGHT_ZONE.x + 80, y, RIGHT_ZONE.w - 160, stepperConfig);
  y += 110;

  // ── Single Panel Content Area ─────────────────────────────────────────────
  const contentY = y;
  const contentH = RIGHT_ZONE.y + RIGHT_ZONE.h - contentY - 80;

  const renderCurrentContent = (d: typeof MakkoEngine.display, x: number, y: number, w: number, h: number) => {
    if (isMaxed(currentLevel)) {
      d.drawText('✓ MODULE FULLY UPGRADED', x + w / 2, y + h / 2, {
        font: 'bold 36px monospace',
        fill: SUCCESS,
        align: 'center',
        baseline: 'middle',
      });
      return;
    }

    if (!nextUpgrade) return;

    let cy = y;

    // Effect description (prominent)
    d.drawText('NEXT UPGRADE', x, cy, {
      font: 'bold 24px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    cy += 42;

    d.drawText(nextUpgrade.description, x + w / 2, cy, {
      font: 'bold 32px monospace',
      fill: TEXT_PRIMARY,
      align: 'center',
      baseline: 'top',
    });
    cy += 60;

    // Formatted effect
    d.drawText(formatEffect(nextUpgrade.effect), x + w / 2, cy, {
      font: 'bold 28px monospace',
      fill: SUCCESS,
      align: 'center',
      baseline: 'top',
    });
    cy += 70;

    // Cost section
    d.drawText('UPGRADE COST', x, cy, {
      font: 'bold 24px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    cy += 42;

    // Credit cost
    const creditColor = meta.credits >= nextUpgrade.creditCost ? GOLD : ERROR;
    d.drawText(`₡${nextUpgrade.creditCost.toLocaleString()}`, x + w / 2, cy, {
      font: 'bold 36px monospace',
      fill: creditColor,
      align: 'center',
      baseline: 'top',
    });
    cy += 50;

    // Salvage costs
    cy = renderSalvageCost(d, nextUpgrade.salvageCost, meta, x + w / 2, cy);
    cy += 30;

    // Upgrade button (centered at bottom of content area)
    const btnW = 220;
    const btnH = 52;
    const btnX = x + (w - btnW) / 2;
    const btnY = y + h - btnH - 20;
    const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

    if (affordable) {
      d.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
        fill: btnHover ? '#1e4a3a' : '#0f3a2a',
        stroke: SUCCESS,
        lineWidth: 2,
      });
      d.drawText('UPGRADE', btnX + btnW / 2, btnY + btnH / 2, {
        font: 'bold 32px monospace',
        fill: SUCCESS,
        align: 'center',
        baseline: 'middle',
      });

      if (btnHover && input.isMouseReleased(0)) {
        action = { type: 'UPGRADE_MODULE', moduleId: mod.id };
      }

      setBounds('modules-upgrade-btn', { x: btnX, y: btnY, w: btnW, h: btnH });
    } else {
      d.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
        fill: '#1a202c',
        stroke: BORDER_DEFAULT,
        lineWidth: 2,
      });
      d.drawText('UPGRADE', btnX + btnW / 2, btnY + btnH / 2, {
        font: 'bold 28px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'middle',
      });
    }
  };

  const renderPreviousSummary = (d: typeof MakkoEngine.display, x: number, y: number, w: number, tier: ProgressionTier) => {
    const upgrade = mod.upgrades[tier.tierNumber - 1];
    if (!upgrade) return;

    d.drawText(formatEffect(upgrade.effect), x, y, {
      font: 'bold 22px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'middle',
    });
  };

  const renderNextPreview = (d: typeof MakkoEngine.display, x: number, y: number, w: number, tier: ProgressionTier) => {
    const upgrade = mod.upgrades[tier.tierNumber - 1];
    if (!upgrade) return;

    d.drawText(`Credits: ₡${upgrade.creditCost.toLocaleString()}`, x, y, {
      font: '20px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'middle',
    });
    d.drawText(formatEffect(upgrade.effect), x, y + 32, {
      font: '20px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'middle',
    });
  };

  renderSinglePanelContentArea(
    display,
    RIGHT_ZONE.x + 40,
    contentY,
    RIGHT_ZONE.w - 80,
    contentH,
    stepperConfig,
    renderCurrentContent,
    renderPreviousSummary,
    renderNextPreview
  );

  // ── Credits Display at Bottom ───────────────────────────────────────────────
  const creditsY = RIGHT_ZONE.y + RIGHT_ZONE.h - 50;
  display.drawText(`Available Credits: ₡${meta.credits.toLocaleString()}`, RIGHT_ZONE.x + RIGHT_ZONE.w - 40, creditsY, {
    font: 'bold 36px monospace',
    fill: GOLD,
    align: 'right',
    baseline: 'middle',
  });

  return action;
}

function isMaxed(currentLevel: number): boolean {
  return currentLevel >= 3;
}

// ── Tutorial Highlight Bounds Getters ─────────────────────────────────────────

export function getModulesGridBounds(): { x: number; y: number; w: number; h: number } {
  return { x: RIGHT_ZONE.x, y: RIGHT_ZONE.y + 200, w: RIGHT_ZONE.w, h: 600 };
}

export function getUpgradeBtnBounds(moduleId: ModuleId): { x: number; y: number; w: number; h: number } {
  const index = MODULE_DEFS.findIndex((m) => m.id === moduleId);
  if (index < 0 || index !== currentModulePage) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }

  const contentH = RIGHT_ZONE.h - 350;
  const btnW = 220;
  const btnH = 52;

  return {
    x: RIGHT_ZONE.x + (RIGHT_ZONE.w - btnW) / 2,
    y: RIGHT_ZONE.y + 250 + contentH - btnH - 20,
    w: btnW,
    h: btnH,
  };
}
