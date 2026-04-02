// Ships Panel — full-screen paged view with animated sprites and captain management.

import { MakkoEngine } from '@makko/engine';
import type { ICharacter } from '@makko/engine';
import type { MetaState } from '../types/state';
import { ShipDef, SHIP_DEFS } from '../content/ships';
import { CrewMemberId, CREW_ROSTER } from '../content/crew';
import {
  LEFT_ZONE,
  RIGHT_ZONE,
  ACCENT,
  GOLD,
  SUCCESS,
  ERROR,
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

// ── Colors ─────────────────────────────────────────────────────────────────
const COLOR_ACCENT_SHIP = '#63b3ed';
const COLOR_WARNING = '#f6e05e';

// Doctrine colors
const DOCTRINE_COLORS: Record<string, string> = {
  corporate: '#f6ad55',
  cooperative: '#68d391',
  smuggler: '#9f7aea',
};

// ── Sprite Mapping ───────────────────────────────────────────────────────────
const SHIP_SPRITE_MAP: Record<string, { character: string; animation: string }> = {
  wraith: {
    character: 'derelict_military_fighter_rare_militaryfighterrare',
    animation: 'derelict_military_fighter_rare_idle_default',
  },
  bulwark: {
    character: 'derelict_shipping_freighter_rare_rarefrieghtercore',
    animation: 'derelict_shipping_freighter_rare_idle_default',
  },
  vagrant: {
    character: 'derelictuncommon2_derelict_uncommon_core2',
    animation: 'derelictuncommon2_idle_default',
  },
  echo_runner: {
    character: 'derelict_military_fighter_epic_militaryfighterepic',
    animation: 'derelict_military_fighter_epic_idle_default',
  },
  single_man_scav: {
    character: 'single-man-scav_singlemanscavcore',
    animation: 'single-man-scav_flying_default',
  },
};

// ── State ─────────────────────────────────────────────────────────────────────
let currentShipPage = 0;
let shipSprites: Partial<Record<string, ICharacter>> = {};

/** Reset the ships page when opening the panel. */
export function resetShipsPage(): void {
  currentShipPage = 0;
}

// ── Action Types ───────────────────────────────────────────────────────────
export type ShipsPanelAction =
  | { type: 'SET_ACTIVE_REPAIR'; shipId: string | null }
  | { type: 'ASSIGN_CAPTAIN'; shipId: string; crewId: CrewMemberId }
  | { type: 'UNASSIGN_CAPTAIN'; shipId: string }
  | { type: 'CLOSE_SHIPS' };

// ── Helper Functions ───────────────────────────────────────────────────────



function getShipRecord(shipId: string, meta: MetaState) {
  return meta.ships.find(s => s.id === shipId);
}

function getAvailableCrew(meta: MetaState): CrewMemberId[] {
  const activeCrew: CrewMemberId[] = [];
  if (meta.leadId) activeCrew.push(meta.leadId);
  activeCrew.push(...meta.companionIds);

  // Filter to those not already captaining another ship
  const captainingShips = new Set(meta.ships.filter(s => s.captainedBy).map(s => s.captainedBy));
  return activeCrew.filter(id => !captainingShips.has(id));
}



// ── Main Render Function ────────────────────────────────────────────────────

export function renderShipsPanel(
  meta: MetaState,
  mx: number,
  my: number,
  dt: number,
): ShipsPanelAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: ShipsPanelAction | null = null;

  // Full screen clear
  display.clear(BG);

  // Ensure page is in valid range
  const totalShips = SHIP_DEFS.length;
  currentShipPage = Math.max(0, Math.min(currentShipPage, totalShips - 1));

  const shipDef = SHIP_DEFS[currentShipPage];
  const shipRec = getShipRecord(shipDef.id, meta);
  const status = shipRec?.status ?? 'derelict';
  const progress = shipRec?.repairProgress ?? 0;
  const isActiveRepair = meta.activeRepairShipId === shipDef.id;

  // Animation speed modifier - lower values = slower animation (0.5 = half speed)
const SHIP_ANIMATION_SPEED = 0.4;

// Lazy-load sprite for current ship
  const spriteMap = SHIP_SPRITE_MAP[shipDef.id];
  if (spriteMap && !shipSprites[shipDef.id]) {
    const sprite = MakkoEngine.sprite(spriteMap.character);
    if (sprite) {
      sprite.play(spriteMap.animation, true, 0, { speed: SHIP_ANIMATION_SPEED });
      shipSprites[shipDef.id] = sprite;
    }
  }

  // Update current ship's sprite animation (apply speed modifier)
  const currentSprite = shipSprites[shipDef.id];
  if (currentSprite) {
    currentSprite.update(dt * 1000 * SHIP_ANIMATION_SPEED);
  }

  // ── Top Bar ─────────────────────────────────────────────────────────────────
  const topAction = renderTopBar(
    display, input, mx, my,
    'SHIP MANAGEMENT',
    currentShipPage,
    totalShips,
    { pageLabel: 'Ship' }
  );
  if (topAction === 'CLOSE') {
    action = { type: 'CLOSE_SHIPS' };
  }

  // ── Left Zone: Ship Sprite & Identity ─────────────────────────────────────
  renderLeftZone(display, currentSprite, shipDef);

  // ── Right Zone: Status & Controls ─────────────────────────────────────────
  const rightAction = renderRightZone(display, input, mx, my, meta, shipDef, shipRec, status, progress, isActiveRepair);
  if (rightAction) action = rightAction;

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navAction = renderNavigation(display, input, mx, my, currentShipPage, totalShips);
  if (navAction !== null) {
    currentShipPage = navAction;
  }

  // ── Keyboard Input ───────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    action = { type: 'CLOSE_SHIPS' };
  }

  return action;
}

// ── Sub-Render Functions ─────────────────────────────────────────────────────



function renderLeftZone(
  display: typeof MakkoEngine.display,
  shipSprite: ICharacter | undefined,
  shipDef: ShipDef,
): void {
  const zoneX = LEFT_ZONE.x;
  const zoneY = LEFT_ZONE.y;
  const zoneW = LEFT_ZONE.w + 60; // Slightly wider for ships
  const zoneH = LEFT_ZONE.h;

  // Background panel
  display.drawRoundRect(zoneX, zoneY, zoneW, zoneH, 8, {
    fill: '#0a0f1a',
    stroke: COLOR_ACCENT_SHIP,
    lineWidth: 2,
  });

  // Sprite display area (centered in upper portion)
  const spriteY = zoneY + 100 + 100; // Moved down by 100px total for better visual balance
  const spriteH = 500;

  if (shipSprite) {
    const spriteX = zoneX + zoneW / 2;
    const spriteCenterY = spriteY + spriteH / 2;
    shipSprite.draw(display, spriteX, spriteCenterY, { scale: 0.7 });
  } else {
    // Placeholder when sprite not loaded
    display.drawText('Loading...', zoneX + zoneW / 2, spriteY + spriteH / 2, {
      font: '32px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
  }

  // Ship name at bottom of zone
  const nameY = zoneY + zoneH - 80;
  display.drawText(shipDef.name.toUpperCase(), zoneX + zoneW / 2, nameY, {
    font: 'bold 64px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'top',
  });

  // Doctrine affinity badge
  const doctrineY = nameY + 60;
  const doctrineColor = DOCTRINE_COLORS[shipDef.doctrineAffinity] ?? TEXT_MUTED;
  const badgeW = 200;
  const badgeH = 40;
  const badgeX = zoneX + (zoneW - badgeW) / 2;

  display.drawRoundRect(badgeX, doctrineY, badgeW, badgeH, 6, {
    fill: '#1a202c',
    stroke: doctrineColor,
    lineWidth: 2,
  });
  display.drawText(shipDef.doctrineAffinity.toUpperCase(), badgeX + badgeW / 2, doctrineY + badgeH / 2, {
    font: 'bold 28px monospace',
    fill: doctrineColor,
    align: 'center',
    baseline: 'middle',
  });
}

function renderRightZone(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  meta: MetaState,
  shipDef: ShipDef,
  shipRec: ReturnType<typeof getShipRecord>,
  status: string,
  progress: number,
  isActiveRepair: boolean,
): ShipsPanelAction | null {
  const zoneX = RIGHT_ZONE.x + 140; // Offset for wider left zone
  const zoneY = RIGHT_ZONE.y;
  const zoneW = RIGHT_ZONE.w - 140;
  const zoneH = RIGHT_ZONE.h;

  let action: ShipsPanelAction | null = null;

  // Background panel
  display.drawRect(zoneX, zoneY, zoneW, zoneH, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  let y = zoneY + 30;

  // ── Status Section ─────────────────────────────────────────────────────────
  const statusLabel = status === 'claimed' ? 'CLAIMED' : status === 'repairing' ? 'REPAIRING' : 'DERELICT';
  const statusColor = status === 'claimed' ? SUCCESS : status === 'repairing' ? COLOR_WARNING : LOCK_COLOR;

  // Large status badge
  const statusW = 280;
  const statusH = 56;
  display.drawRoundRect(zoneX + 40, y, statusW, statusH, 8, {
    fill: '#1a202c',
    stroke: statusColor,
    lineWidth: 3,
  });
  display.drawText(statusLabel, zoneX + 40 + statusW / 2, y + statusH / 2, {
    font: 'bold 44px monospace',
    fill: statusColor,
    align: 'center',
    baseline: 'middle',
  });

  // Active repair badge
  if (status === 'repairing' && isActiveRepair) {
    const activeW = 180;
    const activeH = 40;
    const activeX = zoneX + 40 + statusW + 20;
    display.drawRoundRect(activeX, y + 8, activeW, activeH, 6, {
      fill: '#1a3a5a',
      stroke: COLOR_ACCENT_SHIP,
      lineWidth: 2,
    });
    display.drawText('ACTIVE REPAIR', activeX + activeW / 2, y + 8 + activeH / 2, {
      font: 'bold 24px monospace',
      fill: COLOR_ACCENT_SHIP,
      align: 'center',
      baseline: 'middle',
    });
  }
  y += 90;

  // ── Repair Section ─────────────────────────────────────────────────────────
  if (status !== 'claimed') {
    display.drawText('REPAIR PROGRESS', zoneX + 40, y, {
      font: 'bold 30px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    y += 40;

    // Progress bar
    const barW = 600;
    const barH = 20;
    const progressPct = Math.min(1, progress / shipDef.repairCost);

    display.drawRoundRect(zoneX + 40, y, barW, barH, 4, {
      fill: '#1a202c',
      stroke: '#2d3748',
      lineWidth: 2,
    });
    if (progressPct > 0) {
      display.drawRoundRect(zoneX + 40, y, barW * progressPct, barH, 4, {
        fill: status === 'repairing' ? COLOR_WARNING : LOCK_COLOR,
      });
    }

    // Progress label
    display.drawText(`${progress} / ${shipDef.repairCost}`, zoneX + 40 + barW + 20, y + barH / 2, {
      font: '28px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'middle',
    });
    y += 50;

    // Focus/Deselect button
    const btnW = 220;
    const btnH = 52;
    const btnX = zoneX + 40;
    const btnLabel = isActiveRepair ? 'Deselect' : 'Focus Repair';
    const btnHover = isOver(mx, my, btnX, y, btnW, btnH);

    display.drawRoundRect(btnX, y, btnW, btnH, 6, {
      fill: btnHover ? '#1e3a5a' : '#0f2a4a',
      stroke: COLOR_ACCENT_SHIP,
      lineWidth: 2,
    });
    display.drawText(btnLabel, btnX + btnW / 2, y + btnH / 2, {
      font: 'bold 26px monospace',
      fill: COLOR_ACCENT_SHIP,
      align: 'center',
      baseline: 'middle',
    });

    if (btnHover && input.isMouseReleased(0)) {
      action = { type: 'SET_ACTIVE_REPAIR', shipId: isActiveRepair ? null : shipDef.id };
    }
    y += 80;
  } else {
    y += 20; // Small offset if no repair section
  }

  // ── Captain Section ───────────────────────────────────────────────────────
  display.drawText('CAPTAIN', zoneX + 40, y, {
    font: 'bold 30px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 45;

  const captainId = shipRec?.captainedBy ?? null;

  if (status !== 'claimed') {
    // Ship must be repaired first
    display.drawText('Ship must be repaired before captaining.', zoneX + 60, y, {
      font: '28px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    y += 50;
  } else if (!captainId) {
    // No captain assigned - show available crew
    display.drawText('No captain assigned.', zoneX + 60, y, {
      font: '28px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    y += 40;

    // Available crew buttons
    const availableCrew = getAvailableCrew(meta);
    if (availableCrew.length > 0) {
      const btnW = 140;
      const btnH = 54;
      const btnGap = 12;
      let btnX = zoneX + 60;
      let rowCount = 0;

      for (const crewId of availableCrew) {
        const crew = CREW_ROSTER[crewId];
        const btnHover = isOver(mx, my, btnX, y, btnW, btnH);

        display.drawRoundRect(btnX, y, btnW, btnH, 4, {
          fill: btnHover ? '#1e3a4a' : '#0f172a',
          stroke: btnHover ? COLOR_ACCENT_SHIP : BORDER_DEFAULT,
          lineWidth: 2,
        });
        display.drawText(crew.name, btnX + btnW / 2, y + btnH / 2 - 8, {
          font: 'bold 26px monospace',
          fill: btnHover ? COLOR_ACCENT_SHIP : TEXT_SECONDARY,
          align: 'center',
          baseline: 'middle',
        });
        display.drawText(crew.role, btnX + btnW / 2, y + btnH / 2 + 14, {
          font: '26px monospace',
          fill: TEXT_MUTED,
          align: 'center',
          baseline: 'middle',
        });

        if (btnHover && input.isMouseReleased(0)) {
          action = { type: 'ASSIGN_CAPTAIN', shipId: shipDef.id, crewId };
        }

        btnX += btnW + btnGap;
        rowCount++;
        // 4 buttons fit: 140×4 + 12×3 = 596px < available width
        if (rowCount >= 4) {
          btnX = zoneX + 60;
          y += btnH + 16;
          rowCount = 0;
        }
      }
      if (rowCount > 0) y += btnH + 20;
    } else {
      display.drawText('No available crew (all busy or in cryo).', zoneX + 60, y, {
        font: '26px monospace',
        fill: TEXT_MUTED,
        align: 'left',
        baseline: 'top',
      });
      y += 40;
    }
  } else {
    // Has captain - show captain card
    const captain = CREW_ROSTER[captainId];
    const cardW = 600;
    const cardH = 120;
    const cardX = zoneX + 60;

    display.drawRoundRect(cardX, y, cardW, cardH, 8, {
      fill: '#1a1a0a',
      stroke: GOLD,
      lineWidth: 3,
    });

    // Captain name
    display.drawText(`Captain: ${captain.name}`, cardX + 30, y + 30, {
      font: 'bold 40px monospace',
      fill: GOLD,
      align: 'left',
      baseline: 'top',
    });

    // Role
    display.drawText(captain.role, cardX + 30, y + 65, {
      font: '28px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });

    // Unassign button
    const btnW = 160;
    const btnH = 44;
    const btnX = cardX + cardW - btnW - 20;
    const btnY = y + (cardH - btnH) / 2;
    const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

    display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
      fill: btnHover ? '#3a1a1a' : '#2a1515',
      stroke: ERROR,
      lineWidth: 2,
    });
    display.drawText('Unassign', btnX + btnW / 2, btnY + btnH / 2, {
      font: 'bold 26px monospace',
      fill: ERROR,
      align: 'center',
      baseline: 'middle',
    });

    if (btnHover && input.isMouseReleased(0)) {
      action = { type: 'UNASSIGN_CAPTAIN', shipId: shipDef.id };
    }

    y += cardH + 20;
  }

  // ── Captain Bonus Section ───────────────────────────────────────────────────
  if (status === 'claimed') {
    y += 20;
    display.drawText('CAPTAIN BONUS', zoneX + 40, y, {
      font: 'bold 30px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    y += 40;

    const bonusLines = wrapText(shipDef.captainBonusDesc, 800, '32px monospace');
    for (const line of bonusLines) {
      display.drawText(line, zoneX + 60, y, {
        font: '32px monospace',
        fill: SUCCESS,
        align: 'left',
        baseline: 'top',
      });
      y += 40;
    }

    // Secondary bonus if exists
    if (shipDef.captainBonusSecondary) {
      y += 10;
      let secondaryText: string;
      if ('amount' in shipDef.captainBonusSecondary) {
        secondaryText = `Secondary: +${shipDef.captainBonusSecondary.amount} ${shipDef.captainBonusSecondary.type}`;
      } else if ('factor' in shipDef.captainBonusSecondary) {
        secondaryText = `Secondary: ${Math.round((1 - shipDef.captainBonusSecondary.factor) * 100)}% ${shipDef.captainBonusSecondary.type}`;
      } else {
        secondaryText = 'Secondary bonus active';
      }
      const secondaryLines = wrapText(secondaryText, 800, '28px monospace');
      for (const line of secondaryLines) {
        display.drawText(line, zoneX + 60, y, {
          font: '28px monospace',
          fill: TEXT_SECONDARY,
          align: 'left',
          baseline: 'top',
        });
        y += 36;
      }
    }
    y += 20;
  }

  // ── Ship Stats Section ───────────────────────────────────────────────────────
  y += 20;
  display.drawText('SPECS', zoneX + 40, y, {
    font: 'bold 30px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  // Repair cost
  display.drawText(`Repair Cost: ${shipDef.repairCost} salvage`, zoneX + 60, y, {
    font: '28px monospace',
    fill: TEXT_SECONDARY,
    align: 'left',
    baseline: 'top',
  });
  y += 32;

  // Doctrine
  const doctrineColor = DOCTRINE_COLORS[shipDef.doctrineAffinity] ?? TEXT_MUTED;
  display.drawText(`Doctrine: ${shipDef.doctrineAffinity.toUpperCase()}`, zoneX + 60, y, {
    font: '28px monospace',
    fill: doctrineColor,
    align: 'left',
    baseline: 'top',
  });
  y += 32;

  // Description
  const descLines = wrapText(shipDef.description, 800, '28px monospace');
  for (const line of descLines) {
    display.drawText(line, zoneX + 60, y, {
      font: '28px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });
    y += 36;
  }

  return action;
}


