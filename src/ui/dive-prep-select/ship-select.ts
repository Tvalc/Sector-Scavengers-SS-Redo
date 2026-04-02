// Ship Selection Panel — Full-screen menu for choosing expedition ship
// Uses single-man-scav_flying animation for the starter ship visual

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../types/state';
import { SHIP_DEFS, getShipById } from '../../content/ships';
import { CREW_ROSTER } from '../../content/crew';
import {
  ACCENT, SUCCESS, GOLD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  BG, BG_PANEL, BORDER_DEFAULT, ERROR
} from '../panel-layout';
import { isOver } from '../panel-layout';

export type ShipSelectAction =
  | { type: 'SELECT_SHIP_FOR_DIVE'; shipId: string }
  | { type: 'CLOSE_SHIP_SELECT' };

// Layout constants
const SCREEN_W = 1920;
const SCREEN_H = 1080;
const PANEL_X = 100;
const PANEL_Y = 100;
const PANEL_W = 1720;
const PANEL_H = 880;
const SHIP_CARD_W = 380;
const SHIP_CARD_H = 640;
const CARD_GAP = 40;

// Animation sprite reference
let scavSprite: ReturnType<typeof MakkoEngine.sprite> | null = null;

export function renderShipSelectPanel(
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  dt: number
): ShipSelectAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let action: ShipSelectAction | null = null;

  // Full screen dark overlay
  display.drawRect(0, 0, SCREEN_W, SCREEN_H, { fill: '#0a0e14', alpha: 0.95 });

  // Title
  display.drawText('SELECT SHIP FOR EXPEDITION', SCREEN_W / 2, 60, {
    font: 'bold 48px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'middle',
  });

  // Close button
  const closeX = 1750;
  const closeY = 35;
  const closeW = 120;
  const closeH = 50;
  const closeHover = isOver(mx, my, closeX, closeY, closeW, closeH);
  display.drawRoundRect(closeX, closeY, closeW, closeH, 8, {
    fill: closeHover ? '#2d3748' : '#1a202c',
    stroke: closeHover ? ACCENT : TEXT_MUTED,
    lineWidth: 2,
  });
  display.drawText('✕ CLOSE', closeX + closeW / 2, closeY + closeH / 2, {
    font: 'bold 20px monospace',
    fill: closeHover ? ACCENT : TEXT_SECONDARY,
    align: 'center',
    baseline: 'middle',
  });
  if (closeHover && input.isMouseReleased(0)) {
    return { type: 'CLOSE_SHIP_SELECT' };
  }

  // Get available ships (claimed with captain OR starter ship)
  const claimedShips = meta.ships.filter(s => s.status === 'claimed');
  const availableShips = claimedShips.filter(s =>
    s.id === 'single_man_scav' || s.captainedBy !== null
  );

  if (availableShips.length === 0) {
    display.drawText('No ships available. Claim and captain a ship first.', SCREEN_W / 2, SCREEN_H / 2, {
      font: 'bold 28px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    return action;
  }

  // Initialize sprite if needed
  if (!scavSprite) {
    scavSprite = MakkoEngine.sprite('single-man-scav_singlemanscavcore');
    if (scavSprite) {
      scavSprite.play('single-man-scav_flying_default', true);
    }
  }
  if (scavSprite) {
    scavSprite.update(dt * 1000); // Convert seconds to milliseconds
  }

  // Calculate centered layout
  const totalWidth = availableShips.length * SHIP_CARD_W + (availableShips.length - 1) * CARD_GAP;
  const startX = (SCREEN_W - totalWidth) / 2;
  const cardY = 200;

  // Render ship cards
  for (let i = 0; i < availableShips.length; i++) {
    const shipRecord = availableShips[i];
    const shipDef = getShipById(shipRecord.id)!;
    const isSelected = divePrep.selectedShipId === shipRecord.id;
    const isStarter = shipRecord.id === 'single_man_scav';
    const cardX = startX + i * (SHIP_CARD_W + CARD_GAP);

    // Card background
    display.drawRoundRect(cardX, cardY, SHIP_CARD_W, SHIP_CARD_H, 12, {
      fill: isSelected ? '#0f2a1a' : BG_PANEL,
      stroke: isSelected ? SUCCESS : BORDER_DEFAULT,
      lineWidth: isSelected ? 4 : 2,
    });

    // Ship visual area
    const visualY = cardY + 20;
    const visualH = 280;
    display.drawRect(cardX + 20, visualY, SHIP_CARD_W - 40, visualH, {
      fill: '#0a0f14',
      stroke: isStarter ? TEXT_SECONDARY : BORDER_DEFAULT,
      lineWidth: 1,
    });

    // Render sprite for starter ship, icon for others
    if (isStarter && scavSprite) {
      scavSprite.draw(display, cardX + SHIP_CARD_W / 2, visualY + visualH / 2, { scale: 0.6 });
    } else {
      const icon = isStarter ? '✈' : '◆';
      const iconColor = isStarter ? TEXT_SECONDARY : SUCCESS;
      display.drawText(icon, cardX + SHIP_CARD_W / 2, visualY + visualH / 2, {
        font: 'bold 120px monospace',
        fill: iconColor,
        align: 'center',
        baseline: 'middle',
      });
    }

    // Ship name
    const nameY = visualY + visualH + 30;
    display.drawText(shipDef.name.toUpperCase(), cardX + SHIP_CARD_W / 2, nameY, {
      font: 'bold 28px monospace',
      fill: isSelected ? SUCCESS : TEXT_PRIMARY,
      align: 'center',
      baseline: 'top',
    });

    // Description
    display.drawText(shipDef.description, cardX + SHIP_CARD_W / 2, nameY + 40, {
      font: '18px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'top',
    });

    // Captain or solo indicator
    const captainY = nameY + 90;
    if (shipRecord.captainedBy) {
      const captain = CREW_ROSTER[shipRecord.captainedBy];
      display.drawText(`Captain: ${captain.name}`, cardX + SHIP_CARD_W / 2, captainY, {
        font: '20px monospace',
        fill: GOLD,
        align: 'center',
        baseline: 'top',
      });
      // Captain bonus
      display.drawText(shipDef.captainBonusDesc, cardX + SHIP_CARD_W / 2, captainY + 30, {
        font: '14px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'top',
      });
    } else {
      display.drawText('SOLO CRAFT', cardX + SHIP_CARD_W / 2, captainY, {
        font: 'bold 20px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'top',
      });
      // Nominal bonus
      display.drawText('Bonus: +₡1000 scavenge', cardX + SHIP_CARD_W / 2, captainY + 30, {
        font: '14px monospace',
        fill: SUCCESS,
        align: 'center',
        baseline: 'top',
      });
      // Debuff warning
      display.drawText('Debuff: No crew bonuses', cardX + SHIP_CARD_W / 2, captainY + 55, {
        font: '14px monospace',
        fill: ERROR,
        align: 'center',
        baseline: 'top',
      });
    }

    // Select button
    const btnW = 200;
    const btnH = 50;
    const btnX = cardX + (SHIP_CARD_W - btnW) / 2;
    const btnY = cardY + SHIP_CARD_H - 80;
    const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

    display.drawRoundRect(btnX, btnY, btnW, btnH, 8, {
      fill: isSelected ? '#1a3a2a' : btnHover ? '#1e293b' : '#0f172a',
      stroke: isSelected ? SUCCESS : btnHover ? ACCENT : BORDER_DEFAULT,
      lineWidth: 3,
    });
    display.drawText(isSelected ? 'SELECTED ✓' : 'SELECT', btnX + btnW / 2, btnY + btnH / 2, {
      font: 'bold 20px monospace',
      fill: isSelected ? SUCCESS : TEXT_PRIMARY,
      align: 'center',
      baseline: 'middle',
    });

    if (btnHover && input.isMouseReleased(0)) {
      action = { type: 'SELECT_SHIP_FOR_DIVE', shipId: shipRecord.id };
    }
  }

  // Instructions at bottom
  display.drawText('Starter ship allows immediate expeditions. Larger ships require crew.', SCREEN_W / 2, SCREEN_H - 60, {
    font: '20px monospace',
    fill: TEXT_MUTED,
    align: 'center',
    baseline: 'middle',
  });

  if (input.isKeyPressed('Escape')) {
    return { type: 'CLOSE_SHIP_SELECT' };
  }

  return action;
}

export function resetShipSelect(): void {
  scavSprite = null;
}
