// Ship Section Renderer

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../../types/state';
import { CREW_ROSTER } from '../../../../content/crew';
import { SHIP_DEFS } from '../../../../content/ships';
import { renderSectionBackground } from '../layout';
import { renderPaginationControls } from '../pagination';
import { SHIP_X, SHIP_Y, SECTION_W, SECTION_H } from '../constants';
import { shipPage, setShipPage } from '../state';
import { DivePrepAction } from '../types';
import {
  ACCENT, SUCCESS, GOLD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BORDER_DEFAULT
} from '../../../panel-layout';
import { isOver } from '../../../panel-layout';

export function renderShipSection(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  _now: number,
): DivePrepAction | null {
  let action: DivePrepAction | null = null;

  renderSectionBackground(display, SHIP_X, SHIP_Y, 'SHIP');

  const claimedShips = meta.ships.filter((s) => s.status === 'claimed');
  // Include starter ship (single_man_scav) without captain, others require captains
  const availableShips = claimedShips.filter((s) => 
    s.id === 'single_man_scav' || s.captainedBy !== null
  );

  if (claimedShips.length === 0) {
    display.drawText('No ships claimed. Repair ships first.', SHIP_X + SECTION_W / 2, SHIP_Y + SECTION_H / 2, {
      font: 'bold 24px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    return action;
  }

  if (availableShips.length === 0) {
    display.drawText('No ships available. Assign captains to claimed ships.', SHIP_X + SECTION_W / 2, SHIP_Y + SECTION_H / 2, {
      font: 'bold 22px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    return action;
  }

  // Ensure shipPage is valid
  const validPage = Math.max(0, Math.min(shipPage, availableShips.length - 1));
  if (validPage !== shipPage) setShipPage(validPage);

  const ship = availableShips[shipPage];
  const shipDef = SHIP_DEFS.find((s) => s.id === ship.id)!;
  const captain = ship.captainedBy ? CREW_ROSTER[ship.captainedBy] : null;
  const isSelected = divePrep.selectedShipId === ship.id;

  // Ship icon (different icon for starter ship vs regular ships)
  const iconY = SHIP_Y + 80;
  display.drawRect(SHIP_X + SECTION_W / 2 - 70, iconY - 50, 140, 100, {
    fill: '#1a202c',
    stroke: isSelected ? SUCCESS : BORDER_DEFAULT,
    lineWidth: isSelected ? 4 : 2,
  });

  // Different icon for starter ship
  const shipIcon = ship.id === 'single_man_scav' ? '✈' : '◆';
  const iconColor = ship.id === 'single_man_scav' ? TEXT_SECONDARY : SUCCESS;
  display.drawText(shipIcon, SHIP_X + SECTION_W / 2, iconY, {
    font: 'bold 70px monospace',
    fill: iconColor,
    align: 'center',
    baseline: 'middle',
  });

  // Ship name
  const nameY = iconY + 80;
  display.drawText(shipDef.name.toUpperCase(), SHIP_X + SECTION_W / 2, nameY, {
    font: 'bold 28px monospace',
    fill: isSelected ? SUCCESS : TEXT_PRIMARY,
    align: 'center',
    baseline: 'top',
  });

  // Captain info or solo indicator
  if (captain) {
    display.drawText(`Captain: ${captain.name}`, SHIP_X + SECTION_W / 2, nameY + 38, {
      font: '20px monospace',
      fill: GOLD,
      align: 'center',
      baseline: 'top',
    });
    display.drawText('Bonus: Captain active', SHIP_X + SECTION_W / 2, nameY + 70, {
      font: '16px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });
  } else {
    // Starter ship - no captain, show solo debuff warning
    display.drawText('Solo craft — no crew bonuses', SHIP_X + SECTION_W / 2, nameY + 38, {
      font: '18px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });
    display.drawText('Bonus: +₡1000 scavenge (nominal)', SHIP_X + SECTION_W / 2, nameY + 65, {
      font: '14px monospace',
      fill: SUCCESS,
      align: 'center',
      baseline: 'top',
    });
  }

  // Pagination controls
  renderPaginationControls(
    display, input, mx, my,
    SHIP_X + SECTION_W / 2 - 75,
    SHIP_Y + SECTION_H - 90,
    150,
    shipPage,
    availableShips.length,
    setShipPage
  );

  // Select button
  const btnW = 140;
  const btnH = 40;
  const btnX = SHIP_X + (SECTION_W - btnW) / 2;
  const btnY = SHIP_Y + SECTION_H - 40;
  const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

  display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
    fill: isSelected ? '#1a3a2a' : btnHover ? '#1e293b' : '#0f172a',
    stroke: isSelected ? SUCCESS : btnHover ? SUCCESS : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText(isSelected ? 'SELECTED ✓' : 'SELECT', btnX + btnW / 2, btnY + btnH / 2, {
    font: 'bold 16px monospace',
    fill: isSelected ? SUCCESS : TEXT_PRIMARY,
    align: 'center',
    baseline: 'middle',
  });

  if (btnHover && input.isMouseReleased(0)) {
    action = { type: 'SELECT_SHIP', shipId: ship.id };
  }

  return action;
}
