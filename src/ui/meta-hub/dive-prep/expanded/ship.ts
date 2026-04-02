// Expanded Ship View Renderer

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../../types/state';
import { CREW_ROSTER } from '../../../../content/crew';
import { SHIP_DEFS } from '../../../../content/ships';
import { DivePrepAction } from '../types';
import {
  SUCCESS, GOLD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BORDER_DEFAULT, ACCENT
} from '../../../panel-layout';
import { isOver } from '../../../panel-layout';

export function renderExpandedShip(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  y: number,
  h: number,
  setAction: (a: DivePrepAction) => void,
): void {
  const claimedShips = meta.ships.filter((s) => s.status === 'claimed');
  const shipsWithCaptains = claimedShips.filter((s) => s.captainedBy !== null);

  if (shipsWithCaptains.length === 0) {
    display.drawText('No ships with captains available', 960, y + h / 2, {
      font: 'bold 32px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    return;
  }

  const rowH = 120;
  const rowGap = 20;
  const startY = y + 60;

  for (let i = 0; i < shipsWithCaptains.length; i++) {
    const ship = shipsWithCaptains[i];
    const shipDef = SHIP_DEFS.find((s) => s.id === ship.id)!;
    const captain = CREW_ROSTER[ship.captainedBy!];
    const isSelected = divePrep.selectedShipId === ship.id;
    const rowY = startY + i * (rowH + rowGap);

    // Row background
    const hover = isOver(mx, my, 360, rowY, 1200, rowH);
    display.drawRoundRect(360, rowY, 1200, rowH, 10, {
      fill: isSelected ? '#1a3a2a' : hover ? '#1e293b' : '#0f172a',
      stroke: isSelected ? SUCCESS : hover ? ACCENT : BORDER_DEFAULT,
      lineWidth: isSelected ? 3 : 2,
    });

    // Ship icon
    display.drawRect(400, rowY + 20, 80, 80, {
      fill: '#1a202c',
      stroke: SUCCESS,
      lineWidth: 2,
    });
    display.drawText('◆', 440, rowY + rowH / 2, {
      font: 'bold 50px monospace',
      fill: SUCCESS,
      align: 'center',
      baseline: 'middle',
    });

    // Ship name
    display.drawText(shipDef.name.toUpperCase(), 520, rowY + 25, {
      font: 'bold 28px monospace',
      fill: isSelected ? SUCCESS : TEXT_PRIMARY,
      align: 'left',
      baseline: 'top',
    });

    // Captain
    display.drawText(`Captain: ${captain.name}`, 520, rowY + 65, {
      font: '22px monospace',
      fill: GOLD,
      align: 'left',
      baseline: 'top',
    });

    // Status
    display.drawText(`Status: ${ship.status} · Bonus: Active`, 520, rowY + 95, {
      font: '18px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });

    // Select indicator
    if (isSelected) {
      display.drawText('✓ SELECTED', 1480, rowY + rowH / 2, {
        font: 'bold 24px monospace',
        fill: SUCCESS,
        align: 'center',
        baseline: 'middle',
      });
    }

    if (hover && input.isMouseReleased(0)) {
      setAction({ type: 'SELECT_SHIP', shipId: ship.id });
    }
  }
}
