// Cryo Management panel — hero-style full screen layout paginated by crew member.

import { MakkoEngine } from '@makko/engine';
import type { ICharacter } from '@makko/engine';
import { MetaState } from '../types/state';
import { CrewMemberId, CREW_ROSTER, CREW_ORDER, getCrewUnlockDescription } from '../content/crew';
import { WAKE_ECHO_COST } from '../config/constants';
import { AssignmentSlotId, ASSIGNMENT_SLOT_DEFS, ASSIGNMENT_SLOT_ORDER } from '../content/crew-assignments';
import { SHIP_DEFS } from '../content/ships';
import { feedbackLayer } from './feedback-layer';
import {
  SCREEN_W,
  LEFT_ZONE,
  RIGHT_ZONE,
  NAV_Y,
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
  renderLeftPanelBg,
  renderRightPanelBg,
  renderHeroFrame,
  renderStatusBadge,
  renderLevelPips,
} from './panel-layout';
import { setBounds } from './tutorial-bounds';

export type CryoPanelAction =
  | { type: 'WAKE_CREW'; crewId: CrewMemberId }
  | { type: 'SEND_TO_CRYO'; crewId: CrewMemberId }
  | { type: 'CLOSE_CRYO' }
  | { type: 'ASSIGN_CREW'; crewId: CrewMemberId; slot: AssignmentSlotId };

// ── Constants ───────────────────────────────────────────────────────────────
const COLOR_ACTIVE = '#68d391';
const COLOR_IN_CRYO = '#4a9eda';

// ── State ────────────────────────────────────────────────────────────────────
let currentCryoPage = 0;
let pendingWakeId: CrewMemberId | null = null;
let crewSprite: ICharacter | null = null;

/** Reset the cryo page when opening the panel. */
export function resetCryoPage(): void {
  currentCryoPage = 0;
  pendingWakeId = null;
}

// ── Helper Functions ─────────────────────────────────────────────────────────

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

function getRunsToNextLevel(runs: number): number {
  if (runs < 3) return 3 - runs;
  if (runs < 8) return 8 - runs;
  return 0;
}

// ── Main Render Function ───────────────────────────────────────────────────

export function renderCryoPanel(
  meta: MetaState,
  mx: number,
  my: number,
  dt: number,
): CryoPanelAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: CryoPanelAction | null = null;

  // Full screen clear
  display.clear(BG);

  // Ensure page is in valid range
  const totalCrew = CREW_ORDER.length;
  currentCryoPage = Math.max(0, Math.min(currentCryoPage, totalCrew - 1));

  const crewId = CREW_ORDER[currentCryoPage];
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
    'CRYO MANAGEMENT',
    currentCryoPage,
    totalCrew,
    { pageLabel: 'Crew' }
  );
  if (topAction === 'CLOSE') {
    action = { type: 'CLOSE_CRYO' };
  }

  // ── Left Zone: Crew Identity ───────────────────────────────────────────────
  renderLeftZone(display, crewSprite, crewId, crew, level, status);

  // ── Right Zone: Stats & Controls ─────────────────────────────────────────
  const rightAction = renderRightZone(display, input, mx, my, meta, crewId, crew, status, isLead, level, runsParticipated);
  if (rightAction) action = rightAction;

  // ── Navigation ────────────────────────────────────────────────────────────
  const navAction = renderNavigation(display, input, mx, my, currentCryoPage, totalCrew);
  if (navAction !== null) {
    currentCryoPage = navAction;
    pendingWakeId = null; // Clear pending on page change
  }

  // ── Keyboard Input ─────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    action = { type: 'CLOSE_CRYO' };
  }

  return action;
}

// ── Left Zone Renderer ───────────────────────────────────────────────────────

function renderLeftZone(
  display: typeof MakkoEngine.display,
  crewSprite: ICharacter | null,
  crewId: CrewMemberId,
  crew: typeof CREW_ROSTER[CrewMemberId],
  level: number,
  status: 'active' | 'cryo' | 'locked',
): void {
  renderLeftPanelBg(display);

  let y = LEFT_ZONE.y + 40;

  // Sprite frame with glow
  const frameX = LEFT_ZONE.x + 30;
  const frameY = y;
  const frameW = LEFT_ZONE.w - 60;
  const frameH = 500;
  renderHeroFrame(display, frameX, frameY, frameW, frameH);

  // Render sprite centered in frame (anchor bottom-center)
  if (crewSprite && status !== 'locked') {
    const spriteX = frameX + frameW / 2;
    const spriteY = frameY + frameH - 20;
    crewSprite.draw(display, spriteX, spriteY, { scale: 2.2 });
  }

  y += frameH + 50;

  // Crew name
  display.drawText(crew.name.toUpperCase(), LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
    font: 'bold 56px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'top',
  });
  y += 70;

  // Role
  display.drawText(crew.role.toUpperCase(), LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
    font: '36px monospace',
    fill: TEXT_SECONDARY,
    align: 'center',
    baseline: 'top',
  });
  y += 60;

  // Status badge
  const statusLabel = status === 'active' ? 'ACTIVE' : status === 'cryo' ? 'IN CRYO' : 'LOCKED';
  const statusColor = status === 'active' ? COLOR_ACTIVE : status === 'cryo' ? COLOR_IN_CRYO : LOCK_COLOR;
  renderStatusBadge(display, LEFT_ZONE.x + (LEFT_ZONE.w - 140) / 2, y, 140, 40, statusLabel, statusColor);
  y += 60;

  // Locked badge and unlock condition
  if (status === 'locked') {
    const unlockDesc = getCrewUnlockDescription(crewId);
    const unlockLines = wrapText(unlockDesc, LEFT_ZONE.w - 80, '26px monospace');
    for (const line of unlockLines) {
      display.drawText(line, LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
        font: '26px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'top',
      });
      y += 36;
    }
  }

  // Set bounds for tutorial
  setBounds('cryo-pool', { x: LEFT_ZONE.x, y: LEFT_ZONE.y, w: LEFT_ZONE.w, h: LEFT_ZONE.h });
}

// ── Right Zone Renderer ───────────────────────────────────────────────────────

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
): CryoPanelAction | null {
  renderRightPanelBg(display);

  let action: CryoPanelAction | null = null;
  let y = RIGHT_ZONE.y + 30;

  // ── Status Row ─────────────────────────────────────────────────────────────
  const statusLabel = status === 'active' ? 'ACTIVE' : status === 'cryo' ? 'IN CRYO' : 'LOCKED';
  const statusColor = status === 'active' ? COLOR_ACTIVE : status === 'cryo' ? COLOR_IN_CRYO : TEXT_MUTED;

  // Status pill
  renderStatusBadge(display, RIGHT_ZONE.x + 40, y, 140, 44, statusLabel, statusColor);

  // Upkeep cost if active
  if (status === 'active') {
    display.drawText(`₡${meta.upkeepPerAwakeCrew}/cycle upkeep`, RIGHT_ZONE.x + 200, y + 22, {
      font: 'bold 26px monospace',
      fill: ERROR,
      align: 'left',
      baseline: 'middle',
    });
  }
  y += 80;

  // ── Level Section ──────────────────────────────────────────────────────────
  display.drawText('LEVEL', RIGHT_ZONE.x + 40, y, {
    font: 'bold 30px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 48;

  // Large level number
  display.drawText(`${level}`, RIGHT_ZONE.x + 40, y, {
    font: 'bold 72px monospace',
    fill: ACCENT,
    align: 'left',
    baseline: 'top',
  });

  // Runs participated
  display.drawText(`${runsParticipated} runs participated`, RIGHT_ZONE.x + 160, y + 24, {
    font: '28px monospace',
    fill: TEXT_SECONDARY,
    align: 'left',
    baseline: 'top',
  });

  // Progress hint
  const runsToNext = getRunsToNextLevel(runsParticipated);
  const progressText = level >= 3 ? 'MAX LEVEL' : `${runsToNext} more runs to next level`;
  display.drawText(progressText, RIGHT_ZONE.x + 160, y + 60, {
    font: '26px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 120;

  // Level pips
  renderLevelPips(display, RIGHT_ZONE.x + 40, y, level, 3);
  y += 60;

  // ── Passive Abilities Section ─────────────────────────────────────────────
  display.drawText('PASSIVES', RIGHT_ZONE.x + 40, y, {
    font: 'bold 30px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 48;

  // L1 passive (always shown, full brightness)
  display.drawText(`[Lv1] ${crew.passiveDesc}`, RIGHT_ZONE.x + 60, y, {
    font: '26px monospace',
    fill: SUCCESS,
    align: 'left',
    baseline: 'top',
  });
  y += 42;

  // L2 passive
  const l2Color = level >= 2 ? SUCCESS : LOCK_COLOR;
  display.drawText(`[Lv2] ${crew.level2PassiveDesc}`, RIGHT_ZONE.x + 60, y, {
    font: '26px monospace',
    fill: l2Color,
    align: 'left',
    baseline: 'top',
  });
  y += 42;

  // L3 passive
  const l3Color = level >= 3 ? SUCCESS : LOCK_COLOR;
  display.drawText(`[Lv3] ${crew.level3PassiveDesc}`, RIGHT_ZONE.x + 60, y, {
    font: '26px monospace',
    fill: l3Color,
    align: 'left',
    baseline: 'top',
  });
  y += 60;

  // ── Assignment Section (only if active) ────────────────────────────────────
  if (status === 'active') {
    display.drawText('ASSIGNMENT', RIGHT_ZONE.x + 40, y, {
      font: 'bold 30px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    y += 55;

    const currentAssignment = getAssignmentForCrew(crewId, meta);
    const slotW = 140;
    const slotH = 48;
    const slotGap = 12;
    let slotX = RIGHT_ZONE.x + 40;

    for (const slotId of ASSIGNMENT_SLOT_ORDER) {
      const slotDef = ASSIGNMENT_SLOT_DEFS[slotId];
      const isActive = currentAssignment === slotId;

      display.drawRoundRect(slotX, y, slotW, slotH, 4, {
        fill: isActive ? '#1a3a4a' : '#0f172a',
        stroke: isActive ? ACCENT : BORDER_DEFAULT,
        lineWidth: isActive ? 2 : 1,
      });
      display.drawText(slotDef.label.toUpperCase(), slotX + slotW / 2, y + slotH / 2, {
        font: 'bold 26px monospace',
        fill: isActive ? ACCENT : TEXT_SECONDARY,
        align: 'center',
        baseline: 'middle',
      });

      // Click handling for assignment
      const slotHover = isOver(mx, my, slotX, y, slotW, slotH);
      if (slotHover && input.isMouseReleased(0)) {
        action = { type: 'ASSIGN_CREW', crewId, slot: slotId };
      }

      slotX += slotW + slotGap;
    }
    y += 80;
  }

  // ── Cryo Controls ─────────────────────────────────────────────────────────
  if (status === 'cryo') {
    // Wake button with two-click confirm
    const btnW = 240;
    const btnH = 52;
    const btnX = RIGHT_ZONE.x + 40;
    const btnY = y;

    const canAfford = meta.voidEcho >= WAKE_ECHO_COST;
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
        isPending ? 'CONFIRM WAKE?' : `[Wake] (${WAKE_ECHO_COST} ⬡)`,
        btnX + btnW / 2,
        btnY + btnH / 2,
        {
          font: 'bold 26px monospace',
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
          feedbackLayer.spawn('THAWED', btnX + btnW / 2, btnY - 20, ACCENT);
        } else {
          pendingWakeId = crewId;
        }
      }

      // Set bounds for tutorial
      setBounds('cryo-wake-btn', { x: btnX, y: btnY, w: btnW, h: btnH });
    } else {
      // Disabled wake button
      display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
        fill: '#1a202c',
        stroke: TEXT_MUTED,
        lineWidth: 2,
      });
      display.drawText('NEED ECHO TO WAKE', btnX + btnW / 2, btnY + btnH / 2, {
        font: 'bold 26px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'middle',
      });
    }

    // Echo display
    display.drawText(`Echo: ${meta.voidEcho}`, btnX + btnW + 20, btnY + btnH / 2, {
      font: '26px monospace',
      fill: '#9f7aea',
      align: 'left',
      baseline: 'middle',
    });
    y += 90;

  } else if (status === 'active') {
    // Send to Cryo or Lead badge
    const btnW = 200;
    const btnH = 52;
    const btnX = RIGHT_ZONE.x + 40;
    const btnY = y;

    if (isLead) {
      // Lead badge (disabled)
      display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
        fill: '#1a202c',
        stroke: TEXT_MUTED,
        lineWidth: 2,
      });
      display.drawText('LEAD — Cannot Cryo', btnX + btnW / 2, btnY + btnH / 2, {
        font: 'bold 26px monospace',
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
        font: 'bold 26px monospace',
        fill: ERROR,
        align: 'center',
        baseline: 'middle',
      });

      if (btnHover && input.isMouseReleased(0)) {
        action = { type: 'SEND_TO_CRYO', crewId };
        feedbackLayer.spawn('FROZEN', btnX + btnW / 2, btnY - 20, COLOR_IN_CRYO);
      }
    }
    y += 90;
  }

  // ── Ship Assignment Section ────────────────────────────────────────────────
  y = Math.max(y, RIGHT_ZONE.y + RIGHT_ZONE.h - 160);

  display.drawText('SHIPS', RIGHT_ZONE.x + 40, y, {
    font: 'bold 30px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 45;

  const captainShipIds = getCaptainShips(crewId, meta);
  if (captainShipIds.length > 0) {
    for (const shipId of captainShipIds) {
      const ship = SHIP_DEFS.find(s => s.id === shipId);
      const shipName = ship?.name ?? shipId;

      display.drawText(`Captain of: ${shipName}`, RIGHT_ZONE.x + 60, y, {
        font: '28px monospace',
        fill: GOLD,
        align: 'left',
        baseline: 'top',
      });
      y += 38;
    }
  } else {
    display.drawText('Not assigned to any ship.', RIGHT_ZONE.x + 60, y, {
      font: '28px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
  }

  return action;
}

// ── Tutorial Highlight Bounds Getters ─────────────────────────────────────────

export function getCryoWakeBtnBounds(_index: number): { x: number; y: number; w: number; h: number } {
  // Return bounds for the wake button on current page
  const btnW = 240;
  const btnH = 52;
  const btnX = RIGHT_ZONE.x + 40;
  // Approximate Y position (after status, level, passives, assignment)
  const btnY = RIGHT_ZONE.y + 30 + 70 + 100 + 50 + 60 + 60 + 45;

  return { x: btnX, y: btnY, w: btnW, h: btnH };
}

export function getCryoPoolSectionBounds(): { x: number; y: number; w: number; h: number } {
  return { x: LEFT_ZONE.x, y: LEFT_ZONE.y, w: LEFT_ZONE.w, h: LEFT_ZONE.h };
}
