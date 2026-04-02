// Crew Panel — full-screen paged RPG status view with animated sprite.

import { MakkoEngine } from '@makko/engine';
import type { ICharacter } from '@makko/engine';
import type { MetaState } from '../types/state';
import { CrewMemberId, CREW_ROSTER, CREW_ORDER, getCrewUnlockDescription } from '../content/crew';
import { AssignmentSlotId, ASSIGNMENT_SLOT_DEFS, ASSIGNMENT_SLOT_ORDER } from '../content/crew-assignments';

// Assignment debt reduction values (must match expedition-starting-debt.ts)
const ASSIGNMENT_DEBT_REDUCTION: Partial<Record<AssignmentSlotId, number>> = {
  market_ops: 100_000,
  research: 50_000,
};
import { WAKE_COST_POWER_CELLS } from '../content/cryo';
import { SHIP_DEFS } from '../content/ships';
import { EXPEDITION_DEBT_PER_CREW } from '../config/constants';
import { formatDebt } from '../dive/expedition-starting-debt';
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
} from './panel-layout';
import { setBounds } from './tutorial-bounds';

// ── Colors ─────────────────────────────────────────────────────────────────
const COLOR_IN_CRYO = '#4a9eda';
const COLOR_ACTIVE = '#68d391';

// ── State ─────────────────────────────────────────────────────────────────────
let currentCrewPage = 0;
let pendingWakeId: CrewMemberId | null = null;
let crewSprite: ICharacter | null = null;

/** Reset the crew page when opening the panel. */
export function resetCrewPage(): void {
  currentCrewPage = 0;
  pendingWakeId = null;
}

// ── Action Types ───────────────────────────────────────────────────────────
export type CrewPanelAction =
  | { type: 'WAKE_CREW'; crewId: CrewMemberId }
  | { type: 'SEND_TO_CRYO'; crewId: CrewMemberId }
  | { type: 'CLOSE_CREW' }
  | { type: 'ASSIGN_CREW'; crewId: CrewMemberId; slot: AssignmentSlotId };

// ── Helper Functions ───────────────────────────────────────────────────────



function getCrewStatus(id: CrewMemberId, meta: MetaState): 'active' | 'cryo' | 'locked' {
  if (meta.leadId === id || meta.companionIds.includes(id)) return 'active';
  if (meta.cryoPool.includes(id)) return 'cryo';
  return 'locked';
}

function getAssignmentForCrew(id: CrewMemberId, meta: MetaState): AssignmentSlotId {
  return meta.crewAssignments[id] ?? 'idle';
}

function getCaptainShips(id: CrewMemberId, meta: MetaState): string[] {
  return meta.ships
    .filter(s => s.captainedBy === id)
    .map(s => s.id);
}

function getAssignmentDebtBonus(slotId: AssignmentSlotId): number {
  return ASSIGNMENT_DEBT_REDUCTION[slotId] ?? 0;
}

function getRunsToNextLevel(runs: number): number {
  if (runs < 3) return 3 - runs;
  if (runs < 8) return 8 - runs;
  return 0;
}

// ── Main Render Function ────────────────────────────────────────────────────

export function renderCrewPanel(
  meta: MetaState,
  mx: number,
  my: number,
  dt: number,
): CrewPanelAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: CrewPanelAction | null = null;

  // Full screen clear
  display.clear(BG);

  // Ensure page is in valid range
  const totalCrew = CREW_ORDER.length;
  currentCrewPage = Math.max(0, Math.min(currentCrewPage, totalCrew - 1));

  const crewId = CREW_ORDER[currentCrewPage];
  const crew = CREW_ROSTER[crewId];
  const status = getCrewStatus(crewId, meta);
  const isLocked = status === 'locked';
  const isLead = meta.leadId === crewId;

  // Get crew progression data
  const runsParticipated = meta.crewRunsParticipated[crewId] ?? 0;
  const level = meta.crewLevels[crewId] ?? 1;

  // Lazy-load sprite
  if (!crewSprite) {
    crewSprite = MakkoEngine.sprite('space_scav_1_scavcore');
    if (crewSprite) {
      crewSprite.play('space_scav_1_idle_visor_hud_default', true);
    }
  }

  // Update sprite animation
  if (crewSprite) {
    crewSprite.update(dt);
  }

  // ── Top Bar ─────────────────────────────────────────────────────────────────
  const topAction = renderTopBar(
    display, input, mx, my,
    'CREW STATUS',
    currentCrewPage,
    totalCrew,
    { pageLabel: 'Crew' }
  );
  if (topAction === 'CLOSE') {
    action = { type: 'CLOSE_CREW' };
  }

  // ── Left Zone: Sprite & Identity ──────────────────────────────────────────
  renderLeftZone(display, crewSprite, crew, level, status);

  // ── Right Zone: Stats & Controls ────────────────────────────────────────────
  const rightAction = renderRightZone(display, input, mx, my, meta, crewId, crew, status, isLead, level, runsParticipated);
  if (rightAction) action = rightAction;

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navAction = renderNavigation(display, input, mx, my, currentCrewPage, totalCrew);
  if (navAction !== null) {
    currentCrewPage = navAction;
    pendingWakeId = null; // Clear pending on page change
  }

  // ── Keyboard Input ───────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    action = { type: 'CLOSE_CREW' };
  }

  return action;
}

// ── Sub-Render Functions ─────────────────────────────────────────────────────



function renderLeftZone(
  display: typeof MakkoEngine.display,
  crewSprite: ICharacter | null,
  crew: typeof CREW_ROSTER[CrewMemberId],
  level: number,
  status: 'active' | 'cryo' | 'locked',
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

  // Sprite frame with glow
  const frameX = zoneX + 30;
  const frameY = zoneY + 30;
  const frameW = 500;
  const frameH = 700;

  display.drawRect(frameX, frameY, frameW, frameH, {
    fill: BG,
    stroke: ACCENT,
    lineWidth: 2,
  });

  // Render sprite centered in frame (anchor bottom-center)
  if (crewSprite) {
    const spriteX = frameX + frameW / 2;
    const spriteY = frameY + frameH - 20;
    crewSprite.draw(display, spriteX, spriteY, { scale: 2.2 });
  }

  // Crew name below sprite
  const nameY = frameY + frameH + 40;
  display.drawText(crew.name.toUpperCase(), zoneX + zoneW / 2, nameY, {
    font: 'bold 56px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'top',
  });

  // Role below name
  const roleY = nameY + 60;
  display.drawText(crew.role.toUpperCase(), zoneX + zoneW / 2, roleY, {
    font: '36px monospace',
    fill: TEXT_SECONDARY,
    align: 'center',
    baseline: 'top',
  });

  // Locked badge if locked
  if (status === 'locked') {
    const lockY = roleY + 50;
    const badgeW = 160;
    const badgeH = 40;
    const badgeX = zoneX + (zoneW - badgeW) / 2;

    display.drawRoundRect(badgeX, lockY, badgeW, badgeH, 6, {
      fill: '#3a1a1a',
      stroke: ERROR,
      lineWidth: 2,
    });
    display.drawText('LOCKED', badgeX + badgeW / 2, lockY + badgeH / 2, {
      font: 'bold 28px monospace',
      fill: ERROR,
      align: 'center',
      baseline: 'middle',
    });

    // Unlock condition text
    const unlockDesc = getCrewUnlockDescription(crew.id);
    display.drawText(unlockDesc, zoneX + zoneW / 2, lockY + badgeH + 20, {
      font: '24px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });
  }
}

function renderRightZone(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  meta: MetaState,
  crewId: CrewMemberId,
  crew: typeof CREW_ROSTER[CrewMemberId],
  status: 'active' | 'cryo' | 'locked',
  isLead: boolean,
  level: number,
  runsParticipated: number,
): CrewPanelAction | null {
  const zoneX = RIGHT_ZONE.x;
  const zoneY = RIGHT_ZONE.y;
  const zoneW = RIGHT_ZONE.w;
  const zoneH = RIGHT_ZONE.h;

  let action: CrewPanelAction | null = null;

  // Background panel
  display.drawRect(zoneX, zoneY, zoneW, zoneH, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  let y = zoneY + 30;

  // ── Status Row ─────────────────────────────────────────────────────────────
  const statusLabel = status === 'active' ? 'ACTIVE' : status === 'cryo' ? 'IN CRYO' : 'LOCKED';
  const statusColor = status === 'active' ? COLOR_ACTIVE : status === 'cryo' ? COLOR_IN_CRYO : TEXT_MUTED;

  // Status pill
  const pillW = 120;
  const pillH = 36;
  display.drawRoundRect(zoneX + 40, y, pillW, pillH, 4, {
    fill: '#1a202c',
    stroke: statusColor,
    lineWidth: 2,
  });
  display.drawText(statusLabel, zoneX + 40 + pillW / 2, y + pillH / 2, {
    font: 'bold 26px monospace',
    fill: statusColor,
    align: 'center',
    baseline: 'middle',
  });

  // Upkeep cost if active
  if (status === 'active') {
    display.drawText(`₡${meta.upkeepPerAwakeCrew}/cycle upkeep`, zoneX + 40 + pillW + 20, y + pillH / 2, {
      font: 'bold 24px monospace',
      fill: ERROR,
      align: 'left',
      baseline: 'middle',
    });
  }
  y += 70;

  // Expedition debt cost indicator
  display.drawText(`+${formatDebt(EXPEDITION_DEBT_PER_CREW)} starting expedition debt`, zoneX + 40, y, {
    font: '20px monospace',
    fill: '#f59e0b',
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  // ── Level Section ─────────────────────────────────────────────────────────
  display.drawText('LEVEL', zoneX + 40, y, {
    font: 'bold 28px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  // Large level number
  display.drawText(`${level}`, zoneX + 40, y, {
    font: 'bold 72px monospace',
    fill: ACCENT,
    align: 'left',
    baseline: 'top',
  });

  // Runs participated
  display.drawText(`${runsParticipated} runs participated`, zoneX + 140, y + 20, {
    font: '26px monospace',
    fill: TEXT_SECONDARY,
    align: 'left',
    baseline: 'top',
  });

  // Progress hint
  const runsToNext = getRunsToNextLevel(runsParticipated);
  const progressText = level >= 3 ? 'MAX LEVEL' : `${runsToNext} more runs to next level`;
  display.drawText(progressText, zoneX + 140, y + 50, {
    font: '24px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 100;

  // Level pips
  const pipW = 48;
  const pipH = 16;
  const pipGap = 12;
  let pipX = zoneX + 40;
  for (let i = 0; i < 3; i++) {
    const filled = i < level;
    display.drawRoundRect(pipX, y, pipW, pipH, 4, {
      fill: filled ? ACCENT : '#1a202c',
      stroke: filled ? ACCENT : BORDER_DEFAULT,
      lineWidth: 2,
    });
    pipX += pipW + pipGap;
  }
  y += 50;

  // ── Passive Abilities Section ────────────────────────────────────────────
  display.drawText('PASSIVES', zoneX + 40, y, {
    font: 'bold 28px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  // L1 passive (always shown, full brightness)
  display.drawText(`[Lv1] ${crew.passiveDesc}`, zoneX + 60, y, {
    font: '24px monospace',
    fill: SUCCESS,
    align: 'left',
    baseline: 'top',
  });
  y += 32;

  // L2 passive
  const l2Color = level >= 2 ? SUCCESS : LOCK_COLOR;
  display.drawText(`[Lv2] ${crew.level2PassiveDesc}`, zoneX + 60, y, {
    font: '24px monospace',
    fill: l2Color,
    align: 'left',
    baseline: 'top',
  });
  y += 32;

  // L3 passive
  const l3Color = level >= 3 ? SUCCESS : LOCK_COLOR;
  display.drawText(`[Lv3] ${crew.level3PassiveDesc}`, zoneX + 60, y, {
    font: '24px monospace',
    fill: l3Color,
    align: 'left',
    baseline: 'top',
  });
  y += 50;

  // ── Assignment Section (only if active) ────────────────────────────────────
  if (status === 'active') {
    display.drawText('ASSIGNMENT', zoneX + 40, y, {
      font: 'bold 28px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    y += 45;

    const currentAssignment = getAssignmentForCrew(crewId, meta);
    const slotW = 120;
    const slotH = 45;
    const slotGap = 10;
    let slotX = zoneX + 40;

    for (const slotId of ASSIGNMENT_SLOT_ORDER) {
      const slotDef = ASSIGNMENT_SLOT_DEFS[slotId];
      const isActive = currentAssignment === slotId;

      display.drawRoundRect(slotX, y, slotW, slotH, 4, {
        fill: isActive ? '#1a3a4a' : '#0f172a',
        stroke: isActive ? ACCENT : BORDER_DEFAULT,
        lineWidth: isActive ? 2 : 1,
      });
      
      // Slot label
      display.drawText(slotDef.label.toUpperCase(), slotX + slotW / 2, y + 12, {
        font: 'bold 22px monospace',
        fill: isActive ? ACCENT : TEXT_SECONDARY,
        align: 'center',
        baseline: 'top',
      });
      
      // Debt bonus indicator
      const debtBonus = getAssignmentDebtBonus(slotId);
      if (debtBonus > 0) {
        display.drawText(`−${formatDebt(debtBonus)}`, slotX + slotW / 2, y + 28, {
          font: '12px monospace',
          fill: SUCCESS,
          align: 'center',
          baseline: 'top',
        });
      }

      // Click handling for assignment
      const slotHover = isOver(mx, my, slotX, y, slotW, slotH);
      if (slotHover && input.isMouseReleased(0)) {
        action = { type: 'ASSIGN_CREW', crewId, slot: slotId };
      }

      slotX += slotW + slotGap;
    }
    y += 80;
  }

  // ── Cryo Controls ──────────────────────────────────────────────────────────
  if (status === 'cryo') {
    // Wake button with two-click confirm
    const btnW = 240;
    const btnH = 52;
    const btnX = zoneX + 40;
    const btnY = y;

    const canAfford = meta.powerCells >= WAKE_COST_POWER_CELLS;
    const isPending = pendingWakeId === crewId;

    if (canAfford) {
      const btnColor = isPending ? '#1e4a3a' : '#0f3a2a';
      const strokeColor = isPending ? SUCCESS : ACCENT;
      const textColor = isPending ? SUCCESS : ACCENT;

      display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
        fill: btnColor,
        stroke: strokeColor,
        lineWidth: 2,
      });
      display.drawText(
        isPending ? 'CONFIRM WAKE?' : `[Wake] (${WAKE_COST_POWER_CELLS} cells)`,
        btnX + btnW / 2,
        btnY + btnH / 2,
        {
          font: 'bold 24px monospace',
          fill: textColor,
          align: 'center',
          baseline: 'middle',
        }
      );

      const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);
      if (btnHover && input.isMouseReleased(0)) {
        if (isPending) {
          action = { type: 'WAKE_CREW', crewId };
          pendingWakeId = null;
        } else {
          pendingWakeId = crewId;
        }
      }

      // Set bounds for tutorial
      setBounds('crew-wake-btn', { x: btnX, y: btnY, w: btnW, h: btnH });
    } else {
      // Disabled wake button
      display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
        fill: '#1a202c',
        stroke: TEXT_MUTED,
        lineWidth: 2,
      });
      display.drawText('NEED POWER CELLS', btnX + btnW / 2, btnY + btnH / 2, {
        font: 'bold 24px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'middle',
      });
    }

    // Power cells display
    display.drawText(`Power Cells: ${meta.powerCells}`, btnX + btnW + 20, btnY + btnH / 2, {
      font: '24px monospace',
      fill: GOLD,
      align: 'left',
      baseline: 'middle',
    });
    y += 80;

  } else if (status === 'active') {
    // Send to Cryo or Lead badge
    const btnW = 200;
    const btnH = 52;
    const btnX = zoneX + 40;
    const btnY = y;

    if (isLead) {
      // Lead badge (disabled)
      display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
        fill: '#1a202c',
        stroke: TEXT_MUTED,
        lineWidth: 2,
      });
      display.drawText('LEAD — Cannot Cryo', btnX + btnW / 2, btnY + btnH / 2, {
        font: 'bold 24px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'middle',
      });
    } else {
      // Send to Cryo button
      const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);
      display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
        fill: btnHover ? '#3a1a1a' : '#2a1515',
        stroke: ERROR,
        lineWidth: 2,
      });
      display.drawText('Send to Cryo', btnX + btnW / 2, btnY + btnH / 2, {
        font: 'bold 24px monospace',
        fill: ERROR,
        align: 'center',
        baseline: 'middle',
      });

      if (btnHover && input.isMouseReleased(0)) {
        action = { type: 'SEND_TO_CRYO', crewId };
      }
    }
    y += 80;
  }

  // ── Ship Assignment Section ────────────────────────────────────────────────
  y = Math.max(y, zoneY + zoneH - 140); // Push to bottom if space allows, keep within 900px

  display.drawText('SHIPS', zoneX + 40, y, {
    font: 'bold 28px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 35;

  const captainShipIds = getCaptainShips(crewId, meta);
  if (captainShipIds.length > 0) {
    for (const shipId of captainShipIds) {
      const ship = SHIP_DEFS.find(s => s.id === shipId);
      const shipName = ship?.name ?? shipId;

      display.drawText(`Captain of: ${shipName}`, zoneX + 60, y, {
        font: '26px monospace',
        fill: GOLD,
        align: 'left',
        baseline: 'top',
      });

      // Unassign link
      const unassignX = zoneX + 60 + display.measureText(`Captain of: ${shipName}`, { font: '20px monospace' }).width + 20;
      display.drawText('[Unassign]', unassignX, y, {
        font: 'bold 24px monospace',
        fill: ERROR,
        align: 'left',
        baseline: 'top',
      });

      y += 30;
    }
  } else {
    display.drawText('Not assigned to any ship.', zoneX + 60, y, {
      font: '26px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
  }

  return action;
}


