import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../types/state';
import { HubAction } from './types';
import { RP_Y, TAB_H } from './layout';
import { isOver } from './helpers';
import { CREW_ROSTER, CrewMemberId } from '../../content/crew';
import { ASSIGNMENT_SLOT_DEFS, AssignmentSlotId } from '../../content/crew-assignments';
import { computeCrewAssignmentEffects } from '../../app/crew-assignment-effects';
import { MODULE_DEFS } from '../../content/modules';
import { setBounds } from '../tutorial-bounds';
import { CREW_CARD_UNLOCKS } from '../../progression/crew-card-unlocks';
import { ALL_CARDS } from '../../content/cards';

// Route constants from hub/index.ts - center panel coordinates
const ROUTE_X = 280;

// Module pagination state
let modulePageIndex = 0;

export function renderCrewModulesTab(
  meta: MetaState,
  mx: number,
  my: number,
  bannerOffset: number = 0,
  routeW: number = 1300,
): HubAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let clicked: HubAction | null = null;

  const cY = RP_Y + TAB_H + 20 + bannerOffset;

  // Compute crew content height so modules section starts after cryo button
  const crewContentH = computeCrewContentHeight(meta);
  const modulesY = cY + 26 + crewContentH + 16 + 44 + 20;

  // Content bounds - use full panel width with no padding
  const contentX = ROUTE_X;
  const contentW = routeW;

  // Register bounds for tutorial highlights - cover full sections including buttons
  const cryoBtnY = cY + 26 + crewContentH + 16;
  // crew-roster covers from CREW header through all content to just before the cryo button gap
  setBounds('crew-roster', { x: contentX, y: cY, w: contentW, h: cryoBtnY - cY - 10 });
  setBounds('cryo-nav', { x: contentX, y: cryoBtnY, w: 340, h: 44 });
  // modules-section covers full area from header through card and nav and button
  setBounds('modules-section', { x: contentX, y: modulesY - 10, w: contentW, h: 580 });
  setBounds('modules-nav', { x: contentX, y: modulesY + 220, w: 380, h: 44 });

  clicked = renderCrewSection(display, input, meta, mx, my, cY, contentX, contentW) ?? clicked;
  clicked = renderModulesSection(display, input, meta, mx, my, modulesY, contentX, contentW) ?? clicked;

  return clicked;
}

function renderCrewSection(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  mx: number,
  my: number,
  cY: number,
  contentX: number,
  contentW: number,
): HubAction | null {
  // Section header - larger font (24px)
  display.drawText('CREW ROSTER', contentX, cY, {
    font: 'bold 24px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  const awakeIds: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];

  const crewContentH = computeCrewContentHeight(meta);
  const cryoBtnY = cY + 36 + crewContentH + 20; // Increased gaps

  if (awakeIds.length === 0) {
    display.drawText('No crew members are currently awake.', contentX, cY + 40, {
      font: '20px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });
  } else {
    renderCrewMembers(display, meta, awakeIds, cY, contentX, contentW);
    renderAssignmentBonuses(display, meta, awakeIds, cY, contentX, contentW);
  }

  return renderCryoButton(display, input, meta, mx, my, cryoBtnY, contentX);
}

function renderCrewMembers(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  awakeIds: CrewMemberId[],
  cY: number,
  contentX: number,
  contentW: number,
): void {
  // Helper to get active passive description based on crew level
  const getActivePassiveDesc = (id: CrewMemberId): string => {
    const level = meta.crewLevels?.[id] ?? 1;
    const crew = CREW_ROSTER[id];
    if (level >= 3) return crew.level3PassiveDesc;
    if (level >= 2) return crew.level2PassiveDesc;
    return crew.passiveDesc;
  };

  // Helper to format crew name with level
  const formatCrewName = (id: CrewMemberId): string => {
    const level = meta.crewLevels?.[id] ?? 1;
    const crew = CREW_ROSTER[id];
    return `${crew.name} [${crew.role}] Lv${level}`;
  };

  // Helper to get card unlock info for a crew member
  const getCardUnlockInfo = (id: CrewMemberId): { l2Unlocked: boolean; l3Unlocked: boolean; l2Card: string | null; l3Card: string | null } => {
    const level = meta.crewLevels?.[id] ?? 1;
    const unlocks = CREW_CARD_UNLOCKS[id];
    const l2Card = unlocks ? ALL_CARDS.find(c => c.id === unlocks.level2)?.name ?? unlocks.level2 : null;
    const l3Card = unlocks ? ALL_CARDS.find(c => c.id === unlocks.level3)?.name ?? unlocks.level3 : null;
    const l2Unlocked = level >= 2 && unlocks ? meta.unlockedCards.includes(unlocks.level2) : false;
    const l3Unlocked = level >= 3 && unlocks ? meta.unlockedCards.includes(unlocks.level3) : false;
    return { l2Unlocked, l3Unlocked, l2Card, l3Card };
  };

  const SECTION_GAP = 30;
  const MEMBER_GAP = 90; // Increased spacing for 18px fonts
  const LEAD_HEADER_H = 40;

  // Lead section - visually distinct with header
  if (meta.leadId !== null) {
    const leadY = cY + 40;

    // Lead header badge
    display.drawRoundRect(contentX, leadY, 120, 32, 4, {
      fill: '#1e3a5f',
      stroke: '#63b3ed',
      lineWidth: 2,
    });
    display.drawText('SHIP LEAD', contentX + 60, leadY + 16, {
      font: 'bold 16px monospace', fill: '#90cdf4', align: 'center', baseline: 'middle',
    });

    const slot = meta.crewAssignments[meta.leadId];
    const assignLabel = slot ? ASSIGNMENT_SLOT_DEFS[slot as AssignmentSlotId].label : '(idle)';
    const unlocks = getCardUnlockInfo(meta.leadId);

    // Lead name - larger font (20px)
    display.drawText(formatCrewName(meta.leadId), contentX + 140, leadY + 4, {
      font: 'bold 20px monospace', fill: '#f6e05e', align: 'left', baseline: 'top',
    });

    // Assignment label - 18px font
    display.drawText(`→ ${assignLabel}`, contentX + 140, leadY + 32, {
      font: '18px monospace', fill: slot ? '#68d391' : '#718096', align: 'left', baseline: 'top',
    });

    // Passive description - 18px font, indented
    display.drawText(getActivePassiveDesc(meta.leadId), contentX + 160, leadY + 62, {
      font: '18px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
    });

    // Card unlock info with checkmark icons - 18px font
    let unlockY = leadY + 90;
    if (unlocks.l2Card) {
      const l2Icon = unlocks.l2Unlocked ? '✓' : '○';
      const l2Color = unlocks.l2Unlocked ? '#68d391' : '#718096';
      display.drawText(`${l2Icon} Lv2 Unlock: ${unlocks.l2Card}`, contentX + 160, unlockY, {
        font: '18px monospace', fill: l2Color, align: 'left', baseline: 'top',
      });
      unlockY += 28;
    }
    if (unlocks.l3Card && unlocks.l2Unlocked) {
      const l3Icon = unlocks.l3Unlocked ? '✓' : '○';
      const l3Color = unlocks.l3Unlocked ? '#68d391' : '#718096';
      display.drawText(`${l3Icon} Lv3 Unlock: ${unlocks.l3Card}`, contentX + 160, unlockY, {
        font: '18px monospace', fill: l3Color, align: 'left', baseline: 'top',
      });
    }
  }

  // Companions section header
  if (meta.companionIds.length > 0) {
    const compHeaderY = meta.leadId !== null ? cY + 40 + LEAD_HEADER_H + 140 : cY + 40;

    display.drawRoundRect(contentX, compHeaderY, 140, 32, 4, {
      fill: '#1a2d4a',
      stroke: '#4a9eda',
      lineWidth: 2,
    });
    display.drawText(`COMPANIONS (${meta.companionIds.length})`, contentX + 70, compHeaderY + 16, {
      font: 'bold 16px monospace', fill: '#90cdf4', align: 'center', baseline: 'middle',
    });

    // Companions list
    const compStartY = compHeaderY + 50;
    for (let i = 0; i < meta.companionIds.length; i++) {
      const id = meta.companionIds[i];
      const slot = meta.crewAssignments[id];
      const assignLabel = slot ? ASSIGNMENT_SLOT_DEFS[slot as AssignmentSlotId].label : '(idle)';
      const unlocks = getCardUnlockInfo(id);
      const rowY = compStartY + i * MEMBER_GAP;

      // Companion name - 20px font
      display.drawText(formatCrewName(id), contentX + 20, rowY, {
        font: '20px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
      });

      // Assignment label - 18px font, indented
      display.drawText(`→ ${assignLabel}`, contentX + 40, rowY + 28, {
        font: '18px monospace', fill: slot ? '#68d391' : '#718096', align: 'left', baseline: 'top',
      });

      // Passive description - 18px font
      display.drawText(getActivePassiveDesc(id), contentX + 40, rowY + 58, {
        font: '18px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
      });

      // Card unlock info with checkmark icons - 18px font
      let unlockY = rowY + 86;
      if (unlocks.l2Card) {
        const l2Icon = unlocks.l2Unlocked ? '✓' : '○';
        const l2Color = unlocks.l2Unlocked ? '#68d391' : '#718096';
        display.drawText(`${l2Icon} Lv2 Unlock: ${unlocks.l2Card}`, contentX + 40, unlockY, {
          font: '18px monospace', fill: l2Color, align: 'left', baseline: 'top',
        });
        unlockY += 28;
      }
      if (unlocks.l3Card && unlocks.l2Unlocked) {
        const l3Icon = unlocks.l3Unlocked ? '✓' : '○';
        const l3Color = unlocks.l3Unlocked ? '#68d391' : '#718096';
        display.drawText(`${l3Icon} Lv3 Unlock: ${unlocks.l3Card}`, contentX + 40, unlockY, {
          font: '18px monospace', fill: l3Color, align: 'left', baseline: 'top',
        });
      }
    }
  }
}

function renderAssignmentBonuses(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  awakeIds: CrewMemberId[],
  cY: number,
  contentX: number,
  contentW: number,
): void {
  const fx = computeCrewAssignmentEffects(meta.crewAssignments, awakeIds);
  const bonusParts: string[] = [];
  if (fx.scavengeBonusFlat !== 0) bonusParts.push(`+₡${fx.scavengeBonusFlat} scavenging`);
  if (fx.hullStartBonus !== 0) bonusParts.push(`+${fx.hullStartBonus} hull`);
  if (fx.saleBonusPct !== 0) bonusParts.push(`+${fx.saleBonusPct}% sale value`);
  if (fx.repairBonus !== 0) bonusParts.push(`+${fx.repairBonus} repair`);

  if (bonusParts.length > 0) {
    // Calculate position after all crew members
    const leadH = meta.leadId !== null ? 180 : 0;
    const compHeaderH = meta.companionIds.length > 0 ? 50 : 0;
    const compH = meta.companionIds.length * 80;
    const bonusY = cY + 40 + leadH + compHeaderH + compH + 30;

    // Bonus summary box
    display.drawRoundRect(contentX, bonusY, contentW, 40, 6, {
      fill: '#1a2d4a',
      stroke: '#4a9eda',
      lineWidth: 1,
    });
    display.drawText(`Assignment Bonuses: ${bonusParts.join('  |  ')}`, contentX + 20, bonusY + 20, {
      font: '16px monospace', fill: '#a0aec0', align: 'left', baseline: 'middle',
    });
  }
}

function renderCryoButton(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  mx: number,
  my: number,
  btnY: number,
  contentX: number,
): HubAction | null {
  const btnW = 400;
  const btnH = 50;
  const cryoHover = isOver(mx, my, contentX, btnY, btnW, btnH);
  const hasCryo = meta.cryoPool.length > 0;

  display.drawRoundRect(contentX, btnY, btnW, btnH, 6, {
    fill: cryoHover ? '#1a3a5a' : '#0a1a2e',
    stroke: cryoHover ? '#4a9eda' : '#2b4a6e',
    lineWidth: 2,
  });

  display.drawText(
    hasCryo ? `❄ Open Cryo Panel  (${meta.cryoPool.length} frozen)` : '❄ Open Cryo Panel',
    contentX + btnW / 2, btnY + btnH / 2,
    { font: '20px monospace', fill: cryoHover ? '#90cdf4' : '#4a9eda', align: 'center', baseline: 'middle' },
  );

  if (cryoHover && input.isMouseReleased(0)) return 'OPEN_CRYO';
  return null;
}

function renderModulesSection(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  mx: number,
  my: number,
  modSectionY: number,
  contentX: number,
  contentW: number,
): HubAction | null {
  display.drawLine(contentX, modSectionY - 10, contentX + contentW, modSectionY - 10, {
    stroke: '#2d3748', lineWidth: 2,
  });
  display.drawText('STATION MODULES', contentX, modSectionY, {
    font: 'bold 24px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  const action = renderSingleModule(display, input, meta, mx, my, modSectionY + 50, contentX, contentW);
  const buttonAction = renderModulesButton(display, input, meta, mx, my, modSectionY + 50 + 380 + 20 + 50 + 20, contentX);

  return action ?? buttonAction;
}

function renderSingleModule(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  mx: number,
  my: number,
  cardY: number,
  contentX: number,
  contentW: number,
): HubAction | null {
  const def = MODULE_DEFS[modulePageIndex];
  const level = meta.moduleLevels[def.id] ?? 0;
  const maxLevel = def.upgrades.length;
  const isBuilt = level > 0;
  const isMaxed = level >= maxLevel;
  const cardH = 380;

  // Determine accent color based on state
  const accentColor = isMaxed ? '#22d3ee' : isBuilt ? '#4a9eda' : '#4a5568';

  // Card background
  const cardBg = isBuilt ? '#0f1720' : '#0a0e14';
  display.drawRoundRect(contentX, cardY, contentW, cardH, 10, {
    fill: cardBg,
    stroke: accentColor,
    lineWidth: 2,
  });

  // Top accent strip
  display.drawRect(contentX, cardY, contentW, 4, { fill: accentColor });

  // Left column: name, pips, description, current effect
  const leftX = contentX + 40;
  const leftW = contentW / 2 - 60;
  const rightX = contentX + contentW / 2 + 20;
  const rightW = contentW / 2 - 60;

  // Module name
  const nameColor = isMaxed ? '#22d3ee' : isBuilt ? '#e2e8f0' : '#718096';
  display.drawText(def.name.toUpperCase(), leftX, cardY + 30, {
    font: 'bold 36px monospace',
    fill: nameColor,
    align: 'left',
    baseline: 'top',
  });

  // Level pips (28×14px each, 8px gap)
  const pipY = cardY + 82;
  for (let p = 0; p < maxLevel; p++) {
    const pipX = leftX + p * 36;
    const filled = p < level;
    display.drawRect(pipX, pipY, 28, 14, {
      fill: filled ? '#22d3ee' : '#1a202c',
      stroke: '#4a5568',
      lineWidth: 1,
    });
  }

  // Module description
  const descY = pipY + 36;
  wrapText(display, def.description, leftX, descY, leftW, 20, '#a0aec0', 20);

  // Current effect or "not built" indicator
  const effectY = descY + 120;
  if (isBuilt && level > 0 && level <= maxLevel) {
    display.drawText('CURRENT EFFECT:', leftX, effectY, {
      font: 'bold 18px monospace',
      fill: '#718096',
      align: 'left',
      baseline: 'top',
    });
    const currentEffect = def.upgrades[level - 1]?.description ?? '';
    wrapText(display, currentEffect, leftX, effectY + 28, leftW, 22, '#68d391', 22);
  } else {
    display.drawText('NOT CONSTRUCTED', leftX, effectY + 10, {
      font: 'bold 22px monospace',
      fill: '#4a5568',
      align: 'left',
      baseline: 'top',
    });
  }

  // Right column: next upgrade info
  if (!isMaxed && level < maxLevel) {
    const nextUpgrade = def.upgrades[level];

    display.drawText('NEXT UPGRADE', rightX, cardY + 30, {
      font: 'bold 20px monospace',
      fill: '#63b3ed',
      align: 'left',
      baseline: 'top',
    });

    const nextDesc = nextUpgrade?.description ?? '';
    wrapText(display, nextDesc, rightX, cardY + 60, rightW, 22, '#a0aec0', 22);

    // Cost block
    const costY = cardY + 200;
    const creditCost = nextUpgrade?.creditCost ?? 0;
    display.drawText(`₡${creditCost.toLocaleString()}`, rightX, costY, {
      font: 'bold 24px monospace',
      fill: '#f6e05e',
      align: 'left',
      baseline: 'top',
    });

    // Salvage requirements
    let salvageY = costY + 36;
    if (nextUpgrade?.salvageCost && Object.keys(nextUpgrade.salvageCost).length > 0) {
      for (const [type, amount] of Object.entries(nextUpgrade.salvageCost)) {
        if (amount > 0) {
          display.drawText(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${amount}`, rightX, salvageY, {
            font: '20px monospace',
            fill: '#a0aec0',
            align: 'left',
            baseline: 'top',
          });
          salvageY += 28;
        }
      }
    }
  } else if (isMaxed) {
    // Maxed badge centered in right column
    display.drawText('✓ FULLY UPGRADED', rightX + rightW / 2, cardY + cardH / 2, {
      font: 'bold 28px monospace',
      fill: '#22d3ee',
      align: 'center',
      baseline: 'middle',
    });
  }

  // Navigation bar
  const navY = cardY + cardH + 20;
  const arrowW = 80;
  const arrowH = 50;

  // Left arrow
  const canGoPrev = modulePageIndex > 0;
  const leftHover = canGoPrev && isOver(mx, my, contentX, navY, arrowW, arrowH);
  display.drawRoundRect(contentX, navY, arrowW, arrowH, 6, {
    fill: canGoPrev ? (leftHover ? '#2d3748' : '#1a202c') : '#0a0e14',
    stroke: canGoPrev ? '#4a5568' : '#2d3748',
    lineWidth: 2,
  });
  display.drawText('<', contentX + arrowW / 2, navY + arrowH / 2, {
    font: 'bold 24px monospace',
    fill: canGoPrev ? '#e2e8f0' : '#4a5568',
    align: 'center',
    baseline: 'middle',
  });

  // Module name + index centered
  const navText = `${def.name.toUpperCase()}  [ ${modulePageIndex + 1} / ${MODULE_DEFS.length} ]`;
  display.drawText(navText, contentX + contentW / 2, navY + arrowH / 2, {
    font: 'bold 22px monospace',
    fill: '#63b3ed',
    align: 'center',
    baseline: 'middle',
  });

  // Right arrow
  const canGoNext = modulePageIndex < MODULE_DEFS.length - 1;
  const rightHover = canGoNext && isOver(mx, my, contentX + contentW - arrowW, navY, arrowW, arrowH);
  display.drawRoundRect(contentX + contentW - arrowW, navY, arrowW, arrowH, 6, {
    fill: canGoNext ? (rightHover ? '#2d3748' : '#1a202c') : '#0a0e14',
    stroke: canGoNext ? '#4a5568' : '#2d3748',
    lineWidth: 2,
  });
  display.drawText('>', contentX + contentW - arrowW / 2, navY + arrowH / 2, {
    font: 'bold 24px monospace',
    fill: canGoNext ? '#e2e8f0' : '#4a5568',
    align: 'center',
    baseline: 'middle',
  });

  // Handle navigation clicks
  if (canGoPrev && leftHover && input.isMouseReleased(0)) {
    modulePageIndex = Math.max(0, modulePageIndex - 1);
  }
  if (canGoNext && rightHover && input.isMouseReleased(0)) {
    modulePageIndex = Math.min(MODULE_DEFS.length - 1, modulePageIndex + 1);
  }

  return null;
}

/** Helper to wrap text across multiple lines */
function wrapText(
  display: typeof MakkoEngine.display,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  color: string,
  fontSize: number,
): void {
  const words = text.split(' ');
  let line = '';
  let lineY = y;

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = display.measureText(testLine, { font: `${fontSize}px monospace` });
    if (metrics.width > maxWidth && line !== '') {
      display.drawText(line.trim(), x, lineY, {
        font: `${fontSize}px monospace`,
        fill: color,
        align: 'left',
        baseline: 'top',
      });
      line = word + ' ';
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line.trim()) {
    display.drawText(line.trim(), x, lineY, {
      font: `${fontSize}px monospace`,
      fill: color,
      align: 'left',
      baseline: 'top',
    });
  }
}

function renderModulesButton(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  mx: number,
  my: number,
  btnY: number,
  contentX: number,
): HubAction | null {
  const btnW = 420;
  const btnH = 60;
  const modHover = isOver(mx, my, contentX, btnY, btnW, btnH);
  const anyBuilt = Object.values(meta.moduleLevels).some((v) => v > 0);

  display.drawRoundRect(contentX, btnY, btnW, btnH, 6, {
    fill: modHover ? '#1a2040' : '#0d1430',
    stroke: modHover ? '#63b3ed' : '#2b4a8e',
    lineWidth: modHover ? 3 : 2,
  });

  display.drawText(
    anyBuilt ? '★ Open Modules Panel  (active)' : '★ Open Modules Panel',
    contentX + btnW / 2, btnY + btnH / 2,
    { font: modHover ? 'bold 20px monospace' : '20px monospace', fill: modHover ? '#90cdf4' : '#63b3ed', align: 'center', baseline: 'middle' },
  );

  if (modHover && input.isMouseReleased(0)) return 'OPEN_MODULES';
  return null;
}

/** Compute the pixel height of crew content (lead + companions + bonuses + card unlocks).
 *  Must match the layout logic in renderCrewMembers/renderAssignmentBonuses. */
function computeCrewContentHeight(meta: MetaState): number {
  const awakeIds: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];

  if (awakeIds.length === 0) return 40; // "No crew awake." text + spacing

  // Lead section: header (40) + name (28) + assignment (28) + passive (32) + unlocks (56) + gap
  // Unlock rows are now 28px each (was 22px) with 18px font
  const leadH = meta.leadId !== null ? 190 : 0;
  // Companions section: header (50) + (name + assignment + passive + unlocks + gap) each
  // Member gap increased to 90px for 18px fonts (was 80px)
  const compHeaderH = meta.companionIds.length > 0 ? 50 : 0;
  const compH = meta.companionIds.length * 90;
  const bonusH = 70; // Bonus box + spacing
  return leadH + compHeaderH + compH + bonusH;
}
