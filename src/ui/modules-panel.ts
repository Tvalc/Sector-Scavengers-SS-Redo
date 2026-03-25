// Station Modules panel — 3×2 grid of upgradeable modules with cost/effect display.

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import { ModuleId, MODULE_DEFS, ModuleDef } from '../content/modules';
import { SalvageTier, SALVAGE_DEFS } from '../content/salvage';

export type ModulesPanelAction =
  | { type: 'UPGRADE_MODULE'; moduleId: ModuleId }
  | { type: 'CLOSE_MODULES' };

// ── Panel geometry ─────────────────────────────────────────────────────────────
const PX  = 260;
const PY  = 150;
const PW  = 1400;
const PH  = 780;
const PAD = 32;

const HEADER_H  = 90;   // space for title + sub-line
const GRID_TOP  = PY + HEADER_H;
const GRID_COLS = 3;
const GRID_ROWS = 2;
const CELL_W    = Math.floor((PW - PAD * 2) / GRID_COLS);  // ≈ 445
const CELL_H    = Math.floor((PH - HEADER_H - PAD) / GRID_ROWS); // ≈ 329

const CELL_PAD  = 14;
const UPGRADE_W = 120;
const UPGRADE_H = 34;
const CLOSE_W   = 100;
const CLOSE_H   = 36;
const CLOSE_X   = PX + PW - PAD - CLOSE_W;
const CLOSE_Y   = PY + PH - PAD - CLOSE_H;

// Module order matches MODULE_DEFS index
const MODULE_ORDER: ModuleId[] = [
  'salvage_bay', 'cryo_ward', 'workshop',
  'power_core',  'command_deck', 'market_node',
];

// Module-level press tracking
let pressedId: string | null = null;

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

function pressBtn(
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

/** Check whether the player can afford the next upgrade for this module. */
function canAffordUpgrade(
  def: ModuleDef,
  currentLevel: number,
  credits: number,
  inventory: MetaState['hubInventory'],
): boolean {
  const next = def.upgrades.find((u) => u.level === currentLevel + 1);
  if (!next) return false;
  if (credits < next.creditCost) return false;
  for (const [tier, required] of Object.entries(next.salvageCost) as Array<[SalvageTier, number]>) {
    const held = inventory.find((e) => e.tier === tier);
    if (!held || held.quantity < (required ?? 0)) return false;
  }
  return true;
}

export function renderModulesPanel(
  meta: MetaState,
  mx: number,
  my: number,
): ModulesPanelAction | null {
  const display = MakkoEngine.display;
  let action: ModulesPanelAction | null = null;

  // ── Panel background ──────────────────────────────────────────────────────
  display.drawRect(PX, PY, PW, PH, { fill: '#0a0f1a', stroke: '#2d4a6e', lineWidth: 2 });

  // ── Header ────────────────────────────────────────────────────────────────
  display.drawText('STATION MODULES', PX + PW / 2, PY + PAD, {
    font: 'bold 30px monospace', fill: '#63b3ed', align: 'center', baseline: 'top',
  });
  display.drawText(`Credits: \u20a1${meta.credits}`, PX + PW / 2, PY + PAD + 38, {
    font: '18px monospace', fill: '#a0aec0', align: 'center', baseline: 'top',
  });

  // ── Module grid ───────────────────────────────────────────────────────────
  for (let i = 0; i < MODULE_ORDER.length; i++) {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);

    const cx = PX + PAD + col * CELL_W;
    const cy = GRID_TOP + row * CELL_H;
    const cw = CELL_W - 6;   // small gap between cells
    const ch = CELL_H - 6;

    const moduleId = MODULE_ORDER[i];
    const def = MODULE_DEFS.find((d) => d.id === moduleId);
    if (!def) continue;

    const level = meta.moduleLevels[moduleId] ?? 0;
    const isMaxed = level >= def.upgrades.length;
    const affordable = !isMaxed && canAffordUpgrade(def, level, meta.credits, meta.hubInventory);
    const nextUpgrade = def.upgrades.find((u) => u.level === level + 1);
    const currentUpgrade = level > 0 ? def.upgrades[level - 1] : null;

    // Card background
    display.drawRect(cx, cy, cw, ch, {
      fill: level > 0 ? '#0d1520' : '#080e18',
      stroke: '#2d4a6e',
      lineWidth: 1,
    });

    // ── Module name ──────────────────────────────────────────────────────────
    display.drawText(def.name, cx + CELL_PAD, cy + CELL_PAD, {
      font: 'bold 20px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
    });

    // ── Level indicator (top-right) ──────────────────────────────────────────
    display.drawText(`Lv ${level} / 3`, cx + cw - CELL_PAD, cy + CELL_PAD, {
      font: '16px monospace',
      fill: level > 0 ? '#f6ad55' : '#4a5568',
      align: 'right',
      baseline: 'top',
    });

    let textY = cy + CELL_PAD + 28;

    // ── Current effect description ───────────────────────────────────────────
    if (currentUpgrade !== null) {
      display.drawText(currentUpgrade.description, cx + CELL_PAD, textY, {
        font: '14px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
      });
      textY += 22;
    }

    // ── Module base description ──────────────────────────────────────────────
    display.drawText(def.description, cx + CELL_PAD, textY, {
      font: '13px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });

    // ── Upgrade section (bottom of card) ────────────────────────────────────
    const upgradeSectionY = cy + ch - UPGRADE_H - CELL_PAD - 30;

    if (isMaxed) {
      display.drawText('MAX LEVEL', cx + CELL_PAD, upgradeSectionY + 8, {
        font: 'bold 16px monospace', fill: '#f6e05e', align: 'left', baseline: 'top',
      });
    } else if (nextUpgrade !== null) {
      // Cost line: credits
      display.drawText(`\u20a1${nextUpgrade.creditCost}`, cx + CELL_PAD, upgradeSectionY, {
        font: '15px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
      });

      // Salvage cost items inline
      let salvageX = cx + CELL_PAD + 80;
      const salvageEntries = Object.entries(nextUpgrade.salvageCost) as Array<[SalvageTier, number]>;
      for (const [tier, qty] of salvageEntries) {
        if (!qty) continue;
        const def2 = SALVAGE_DEFS[tier];
        const heldEntry = meta.hubInventory.find((e) => e.tier === tier);
        const heldQty = heldEntry?.quantity ?? 0;
        const enough = heldQty >= qty;
        display.drawText(
          `${qty}\u00d7${def2.label}`,
          salvageX,
          upgradeSectionY,
          {
            font: '14px monospace',
            fill: enough ? def2.color : '#4a5568',
            align: 'left',
            baseline: 'top',
          },
        );
        salvageX += qty > 9 ? 120 : 110;
      }

      // [Upgrade] button
      const ubx = cx + cw - CELL_PAD - UPGRADE_W;
      const uby = cy + ch - CELL_PAD - UPGRADE_H;
      const uOver = isOver(mx, my, ubx, uby, UPGRADE_W, UPGRADE_H);
      display.drawRect(ubx, uby, UPGRADE_W, UPGRADE_H, {
        fill: !affordable ? '#1a1a1a' : uOver ? '#276749' : '#1a3a2a',
        stroke: !affordable ? '#2d3748' : '#276749',
        lineWidth: 1,
      });
      display.drawText('[Upgrade]', ubx + UPGRADE_W / 2, uby + UPGRADE_H / 2, {
        font: '15px monospace',
        fill: !affordable ? '#4a5568' : '#ffffff',
        align: 'center',
        baseline: 'middle',
      });
      if (affordable && pressBtn(`upg_${moduleId}`, mx, my, ubx, uby, UPGRADE_W, UPGRADE_H)) {
        action = { type: 'UPGRADE_MODULE', moduleId };
      }
    }
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
  if (pressBtn('close_modules', mx, my, CLOSE_X, CLOSE_Y, CLOSE_W, CLOSE_H)) {
    action = { type: 'CLOSE_MODULES' };
  }

  return action;
}
