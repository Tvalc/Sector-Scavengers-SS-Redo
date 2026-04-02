import { MakkoEngine } from '@makko/engine';
import { MetaState, ShipRecord } from '../types/state';
import { SHIP_DEFS, ShipStatus, getShipById } from '../content/ships';
import { CREW_ROSTER, CrewMemberId } from '../content/crew';

export type ShipPanelAction =
  | { type: 'SET_ACTIVE_REPAIR'; shipId: string | null }
  | { type: 'ASSIGN_CAPTAIN'; shipId: string; crewId: CrewMemberId }
  | { type: 'UNASSIGN_CAPTAIN'; shipId: string };

// ── Layout ────────────────────────────────────────────────────────────────────
const PW = 900;
const PH = 620;
const PX = 1020;
const PY = 230;
const PAD = 24;
const ROW_H = 115;
const BTN_W = 140;
const BTN_H = 46;

const STATUS_COLOR: Record<ShipStatus, string> = {
  derelict:  '#4a5568',
  repairing: '#f6e05e',
  claimed:   '#68d391',
};

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

export function renderShipPanelAt(
  meta: MetaState,
  mx: number,
  my: number,
  x: number,
  y: number,
): ShipPanelAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let action: ShipPanelAction | null = null;

  // Panel background
  display.drawRect(x, y, PW, PH, { fill: '#0a0f1a', stroke: '#2d3748', lineWidth: 1 });

  // Header
  display.drawText('SHIPS', x + PAD, y + PAD, {
    font: 'bold 26px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  // Active repair label
  const activeLabel = meta.activeRepairShipId !== null
    ? `Repairing: ${meta.activeRepairShipId}`
    : 'No active repair';
  display.drawText(activeLabel, x + PW - PAD, y + PAD, {
    font: '14px monospace', fill: '#a0aec0', align: 'right', baseline: 'top',
  });

  const contentY = y + PAD + 36;

  for (let i = 0; i < SHIP_DEFS.length; i++) {
    const def = SHIP_DEFS[i];
    const rec: ShipRecord = meta.ships.find((s) => s.id === def.id) ?? {
      id: def.id, status: 'derelict', repairProgress: 0, captainedBy: null,
    };
    const rowY = contentY + i * ROW_H;
    const isActive = meta.activeRepairShipId === def.id;

    // Row background
    const rowFill = isActive ? '#111d2e' : '#0d1117';
    const rowStroke = isActive ? '#3182ce' : '#1e2d3d';
    display.drawRect(x + PAD, rowY, PW - PAD * 2, ROW_H - 6, {
      fill: rowFill, stroke: rowStroke, lineWidth: isActive ? 2 : 1,
    });

    // Ship name
    display.drawText(def.name, x + PAD + 10, rowY + 10, {
      font: 'bold 18px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
    });

    // Description
    display.drawText(def.description, x + PAD + 10, rowY + 38, {
      font: '18px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });

    // Status badge
    const statusColor = STATUS_COLOR[rec.status];
    display.drawText(rec.status.toUpperCase(), x + PAD + 10, rowY + 62, {
      font: 'bold 18px monospace', fill: statusColor, align: 'left', baseline: 'top',
    });

    // [ACTIVE] badge
    if (isActive) {
      display.drawText('[ACTIVE]', x + PAD + 130, rowY + 62, {
        font: 'bold 18px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
      });
    }

    // Progress bar
    const barX = x + PAD + 200;
    const barW = 160;
    const barH = 10;
    const barY = rowY + 68;
    const progress = Math.min(rec.repairProgress / def.repairCost, 1);

    display.drawRect(barX, barY, barW, barH, { fill: '#1a202c', stroke: '#2d3748', lineWidth: 1 });
    if (progress > 0) {
      display.drawRect(barX + 1, barY + 1, (barW - 2) * progress, barH - 2, {
        fill: statusColor,
      });
    }
    display.drawText(
      `${rec.repairProgress}/${def.repairCost}`,
      barX + barW + 10,
      barY,
      { font: '18px monospace', fill: '#a0aec0', align: 'left', baseline: 'top' },
    );

    // Focus repair / deselect button (only for non-claimed ships)
    if (rec.status !== 'claimed') {
      const btnLabel = isActive ? 'Deselect' : 'Focus';
      const btnX = x + PW - PAD - BTN_W - 10;
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
        font: '18px monospace',
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
      // Claimed ship - show captain info or assign button
      const captainId = rec.captainedBy;
      if (captainId) {
        const captain = CREW_ROSTER[captainId];
        display.drawText(`Captain: ${captain.name}`, x + PW - PAD - BTN_W - 10 + BTN_W / 2, rowY + (ROW_H - 6) / 2 - 14, {
          font: '18px monospace', fill: '#f6ad55', align: 'center', baseline: 'middle',
        });
        // Unassign button
        const unassignY = rowY + (ROW_H - 6) / 2 + 16;
        const unassignHover = isOver(mx, my, x + PW - PAD - BTN_W - 10, unassignY - 12, BTN_W, 26);
        display.drawText('[Unassign]', x + PW - PAD - BTN_W - 10 + BTN_W / 2, unassignY, {
          font: '18px monospace', fill: unassignHover ? '#fc8181' : '#a0aec0', align: 'center', baseline: 'middle',
        });
        if (unassignHover && input.isMouseReleased(0)) {
          action = { type: 'UNASSIGN_CAPTAIN', shipId: def.id };
        }
      } else {
        // Assign captain button
        const availableCrew = getAvailableCrew(meta);
        if (availableCrew.length > 0) {
          const btnX = x + PW - PAD - BTN_W - 10;
          const btnY = rowY + (ROW_H - 6) / 2 - BTN_H / 2;
          const hover = isOver(mx, my, btnX, btnY, BTN_W, BTN_H);
          const btnFill = hover ? '#2c4a2e' : '#1a3a1a';
          const btnStroke = hover ? '#68d391' : '#276749';
          display.drawRect(btnX, btnY, BTN_W, BTN_H, { fill: btnFill, stroke: btnStroke, lineWidth: 1 });
          display.drawText('Assign Captain', btnX + BTN_W / 2, btnY + BTN_H / 2, {
            font: '18px monospace', fill: '#68d391', align: 'center', baseline: 'middle',
          });
          if (hover && input.isMouseReleased(0)) {
            // For simplicity, assign the first available crew member
            action = { type: 'ASSIGN_CAPTAIN', shipId: def.id, crewId: availableCrew[0] };
          }
        } else {
          display.drawText('No crew available', x + PW - PAD - BTN_W - 10 + BTN_W / 2, rowY + (ROW_H - 6) / 2, {
            font: '18px monospace', fill: '#718096', align: 'center', baseline: 'middle',
          });
        }
      }
    }
  }

  return action;
}

/** Get available crew members who are awake and not already captaining a ship. */
function getAvailableCrew(meta: MetaState): CrewMemberId[] {
  const awakeIds: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];
  const captainingShips = new Set(
    meta.ships.filter((s) => s.captainedBy !== null).map((s) => s.captainedBy),
  );
  return awakeIds.filter((id) => !captainingShips.has(id));
}

export function renderShipPanel(
  meta: MetaState,
  mx: number,
  my: number,
): ShipPanelAction | null {
  return renderShipPanelAt(meta, mx, my, PX, PY);
}
