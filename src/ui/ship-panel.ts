import { MakkoEngine } from '@makko/engine';
import { MetaState, ShipRecord } from '../types/state';
import { SHIP_DEFS, ShipStatus, getShipById } from '../content/ships';

export type ShipPanelAction = { type: 'SET_ACTIVE_REPAIR'; shipId: string | null };

// ── Layout ────────────────────────────────────────────────────────────────────
const PW = 800;
const PH = 480;
const PX = 1080;
const PY = 300;
const PAD = 24;
const ROW_H = 88;
const BTN_W = 120;
const BTN_H = 32;

const STATUS_COLOR: Record<ShipStatus, string> = {
  derelict:  '#4a5568',
  repairing: '#f6e05e',
  claimed:   '#68d391',
};

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

export function renderShipPanel(
  meta: MetaState,
  mx: number,
  my: number,
): ShipPanelAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let action: ShipPanelAction | null = null;

  // Panel background
  display.drawRect(PX, PY, PW, PH, { fill: '#0a0f1a', stroke: '#2d3748', lineWidth: 1 });

  // Header
  display.drawText('SHIPS', PX + PAD, PY + PAD, {
    font: 'bold 26px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  // Active repair label
  const activeLabel = meta.activeRepairShipId !== null
    ? `Repairing: ${meta.activeRepairShipId}`
    : 'No active repair';
  display.drawText(activeLabel, PX + PW - PAD, PY + PAD, {
    font: '14px monospace', fill: '#a0aec0', align: 'right', baseline: 'top',
  });

  const contentY = PY + PAD + 36;

  for (let i = 0; i < SHIP_DEFS.length; i++) {
    const def = SHIP_DEFS[i];
    const rec: ShipRecord = meta.ships.find((s) => s.id === def.id) ?? {
      id: def.id, status: 'derelict', repairProgress: 0,
    };
    const rowY = contentY + i * ROW_H;
    const isActive = meta.activeRepairShipId === def.id;

    // Row background
    const rowFill = isActive ? '#111d2e' : '#0d1117';
    const rowStroke = isActive ? '#3182ce' : '#1e2d3d';
    display.drawRect(PX + PAD, rowY, PW - PAD * 2, ROW_H - 6, {
      fill: rowFill, stroke: rowStroke, lineWidth: isActive ? 2 : 1,
    });

    // Ship name
    display.drawText(def.name, PX + PAD + 10, rowY + 10, {
      font: 'bold 18px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
    });

    // Description
    display.drawText(def.description, PX + PAD + 10, rowY + 32, {
      font: '13px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });

    // Status badge
    const statusColor = STATUS_COLOR[rec.status];
    display.drawText(rec.status.toUpperCase(), PX + PAD + 10, rowY + 52, {
      font: 'bold 12px monospace', fill: statusColor, align: 'left', baseline: 'top',
    });

    // [ACTIVE] badge
    if (isActive) {
      display.drawText('[ACTIVE]', PX + PAD + 110, rowY + 52, {
        font: 'bold 12px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
      });
    }

    // Progress bar
    const barX = PX + PAD + 200;
    const barW = 160;
    const barH = 10;
    const barY = rowY + (ROW_H - 6) / 2 - barH / 2;
    const progress = Math.min(rec.repairProgress / def.repairCost, 1);

    display.drawRect(barX, barY, barW, barH, { fill: '#1a202c', stroke: '#2d3748', lineWidth: 1 });
    if (progress > 0) {
      display.drawRect(barX + 1, barY + 1, (barW - 2) * progress, barH - 2, {
        fill: statusColor,
      });
    }
    display.drawText(
      `${rec.repairProgress}/${def.repairCost}`,
      barX + barW + 8,
      barY,
      { font: '13px monospace', fill: '#a0aec0', align: 'left', baseline: 'top' },
    );

    // Focus repair / deselect button (only for non-claimed ships)
    if (rec.status !== 'claimed') {
      const btnLabel = isActive ? 'Deselect' : 'Focus';
      const btnX = PX + PW - PAD - BTN_W - 10;
      const btnY = rowY + (ROW_H - 6) / 2 - BTN_H / 2;
      const hover = isOver(mx, my, btnX, btnY, BTN_W, BTN_H);
      const btnFill = isActive
        ? (hover ? '#2c4a6e' : '#1a3a5c')
        : (hover ? '#276749' : '#1a3a2a');
      const btnStroke = isActive
        ? (hover ? '#63b3ed' : '#3182ce')
        : (hover ? '#68d391' : '#276749');

      display.drawRect(btnX, btnY, BTN_W, BTN_H, { fill: btnFill, stroke: btnStroke, lineWidth: 1 });
      display.drawText(btnLabel, btnX + BTN_W / 2, btnY + BTN_H / 2, {
        font: '14px monospace',
        fill: isActive ? '#63b3ed' : '#68d391',
        align: 'center',
        baseline: 'middle',
      });

      if (hover && input.isMouseReleased(0)) {
        action = {
          type: 'SET_ACTIVE_REPAIR',
          shipId: isActive ? null : def.id,
        };
      }
    } else {
      // Claimed badge area
      display.drawText('✓ Claimed', PX + PW - PAD - BTN_W - 10 + BTN_W / 2, rowY + (ROW_H - 6) / 2, {
        font: '14px monospace', fill: '#68d391', align: 'center', baseline: 'middle',
      });
    }
  }

  return action;
}
