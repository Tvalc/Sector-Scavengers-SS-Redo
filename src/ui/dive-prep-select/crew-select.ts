// Crew Selection Panel — Full-screen menu for choosing expedition crew

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../types/state';
import type { CrewMemberId } from '../../content/crew';
import { CREW_ROSTER, getCrewDoctrineAffinity } from '../../content/crew';
import { SHIP_DEFS } from '../../content/ships';
import {
  ACCENT, SUCCESS, GOLD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  BG, BG_PANEL, BORDER_DEFAULT
} from '../panel-layout';

// Doctrine colors for crew affinity badges
const DOCTRINE_COLORS: Record<string, string> = {
  corporate: '#f6ad55',
  cooperative: '#68d391',
  smuggler: '#9f7aea',
};
import { isOver } from '../panel-layout';

export type CrewSelectAction =
  | { type: 'SELECT_CREW_FOR_DIVE'; crewId: CrewMemberId }
  | { type: 'CLEAR_CREW_SELECTION' }
  | { type: 'CLOSE_CREW_SELECT' };

// Layout constants
const SCREEN_W = 1920;
const SCREEN_H = 1080;
const CREW_CARD_W = 340;
const CREW_CARD_H = 520;
const CARD_GAP = 30;

export function renderCrewSelectPanel(
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  _dt: number
): CrewSelectAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let action: CrewSelectAction | null = null;

  // Full screen dark overlay
  display.drawRect(0, 0, SCREEN_W, SCREEN_H, { fill: '#0a0e14', alpha: 0.95 });

  // Title
  display.drawText('SELECT CREW FOR EXPEDITION', SCREEN_W / 2, 60, {
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
    return { type: 'CLOSE_CREW_SELECT' };
  }

  // Get available crew
  const availableCrew: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];

  // Check if selected ship requires crew
  const selectedShipId = divePrep.selectedShipId;
  const selectedShip = selectedShipId ? meta.ships.find(s => s.id === selectedShipId) : null;
  const shipRequiresCrew = selectedShipId !== null && selectedShipId !== 'single_man_scav';

  // Show current ship info
  const shipY = 120;
  if (selectedShip) {
    const shipDef = SHIP_DEFS.find(s => s.id === selectedShipId);
    display.drawText(`Expedition Ship: ${shipDef?.name ?? selectedShipId}`, SCREEN_W / 2, shipY, {
      font: '24px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'middle',
    });
    if (shipRequiresCrew) {
      display.drawText('(Requires crew member)', SCREEN_W / 2, shipY + 30, {
        font: '18px monospace',
        fill: ACCENT,
        align: 'center',
        baseline: 'middle',
      });
    } else {
      display.drawText('(Solo craft — crew optional)', SCREEN_W / 2, shipY + 30, {
        font: '18px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  if (availableCrew.length === 0) {
    display.drawText('No crew available. Wake crew from cryo in the hub.', SCREEN_W / 2, SCREEN_H / 2, {
      font: 'bold 28px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    return action;
  }

  // Calculate centered layout
  const totalWidth = availableCrew.length * CREW_CARD_W + (availableCrew.length - 1) * CARD_GAP;
  const startX = (SCREEN_W - totalWidth) / 2;
  const cardY = 200;

  // Render crew cards
  for (let i = 0; i < availableCrew.length; i++) {
    const crewId = availableCrew[i];
    const crew = CREW_ROSTER[crewId];
    const isSelected = divePrep.selectedCrewId === crewId;
    const cardX = startX + i * (CREW_CARD_W + CARD_GAP);

    // Card background
    display.drawRoundRect(cardX, cardY, CREW_CARD_W, CREW_CARD_H, 12, {
      fill: isSelected ? '#0f1a2a' : BG_PANEL,
      stroke: isSelected ? ACCENT : BORDER_DEFAULT,
      lineWidth: isSelected ? 4 : 2,
    });

    // Crew avatar circle
    const avatarY = cardY + 60;
    display.drawCircle(cardX + CREW_CARD_W / 2, avatarY, 80, {
      fill: '#1a202c',
      stroke: isSelected ? ACCENT : BORDER_DEFAULT,
      lineWidth: 3,
    });

    const initial = crew.name.charAt(0).toUpperCase();
    display.drawText(initial, cardX + CREW_CARD_W / 2, avatarY, {
      font: 'bold 100px monospace',
      fill: ACCENT,
      align: 'center',
      baseline: 'middle',
    });

    // Crew name
    const nameY = avatarY + 110;
    display.drawText(crew.name.toUpperCase(), cardX + CREW_CARD_W / 2, nameY, {
      font: 'bold 26px monospace',
      fill: isSelected ? ACCENT : TEXT_PRIMARY,
      align: 'center',
      baseline: 'top',
    });

    // Role
    display.drawText(crew.role, cardX + CREW_CARD_W / 2, nameY + 35, {
      font: '18px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'top',
    });

    // Level and runs
    const level = meta.crewLevels[crewId] ?? 1;
    const runs = meta.crewRunsParticipated[crewId] ?? 0;
    display.drawText(`Level ${level} · ${runs} runs`, cardX + CREW_CARD_W / 2, nameY + 65, {
      font: '16px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });

    // Doctrine affinity badge
    const affinity = getCrewDoctrineAffinity(crewId);
    if (affinity) {
      const badgeY = nameY + 100;
      const badgeW = 140;
      const badgeH = 32;
      const badgeX = cardX + (CREW_CARD_W - badgeW) / 2;

      display.drawRoundRect(badgeX, badgeY, badgeW, badgeH, 6, {
        fill: '#1a202c',
        stroke: DOCTRINE_COLORS[affinity],
        lineWidth: 2,
      });
      display.drawText(affinity.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH / 2, {
        font: 'bold 16px monospace',
        fill: DOCTRINE_COLORS[affinity],
        align: 'center',
        baseline: 'middle',
      });
    }

    // Passive description
    const passiveY = nameY + 150;
    const passiveText = level >= 3 ? crew.level3PassiveDesc :
                        level >= 2 ? crew.level2PassiveDesc :
                        crew.passiveDesc;
    display.drawText(passiveText, cardX + CREW_CARD_W / 2, passiveY, {
      font: '14px monospace',
      fill: SUCCESS,
      align: 'center',
      baseline: 'top',
    });

    // Select button
    const btnW = 180;
    const btnH = 45;
    const btnX = cardX + (CREW_CARD_W - btnW) / 2;
    const btnY = cardY + CREW_CARD_H - 70;
    const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

    display.drawRoundRect(btnX, btnY, btnW, btnH, 8, {
      fill: isSelected ? '#1a3a4a' : btnHover ? '#1e293b' : '#0f172a',
      stroke: isSelected ? ACCENT : btnHover ? ACCENT : BORDER_DEFAULT,
      lineWidth: 3,
    });
    display.drawText(isSelected ? 'SELECTED ✓' : 'SELECT', btnX + btnW / 2, btnY + btnH / 2, {
      font: 'bold 18px monospace',
      fill: isSelected ? ACCENT : TEXT_PRIMARY,
      align: 'center',
      baseline: 'middle',
    });

    if (btnHover && input.isMouseReleased(0)) {
      action = { type: 'SELECT_CREW_FOR_DIVE', crewId };
    }
  }

  // Clear selection button (if crew selected and ship doesn't require it)
  if (divePrep.selectedCrewId && !shipRequiresCrew) {
    const clearBtnW = 200;
    const clearBtnH = 40;
    const clearBtnX = SCREEN_W / 2 - clearBtnW / 2;
    const clearBtnY = SCREEN_H - 100;
    const clearHover = isOver(mx, my, clearBtnX, clearBtnY, clearBtnW, clearBtnH);

    display.drawRoundRect(clearBtnX, clearBtnY, clearBtnW, clearBtnH, 6, {
      fill: clearHover ? '#2d3748' : '#1a202c',
      stroke: TEXT_MUTED,
      lineWidth: 2,
    });
    display.drawText('Clear Selection', clearBtnX + clearBtnW / 2, clearBtnY + clearBtnH / 2, {
      font: 'bold 16px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'middle',
    });

    if (clearHover && input.isMouseReleased(0)) {
      action = { type: 'CLEAR_CREW_SELECTION' };
    }
  }

  if (input.isKeyPressed('Escape')) {
    return { type: 'CLOSE_CREW_SELECT' };
  }

  return action;
}
