import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import { OPENING_PATH_CONFIG } from '../content/opening-paths';
import { DOCTRINE_ORDER, DOCTRINE_UNLOCK_THRESHOLD, DoctrineId } from '../content/doctrine';
import { getCurrentTier, getNextTier } from '../content/death-lessons';
import { renderShipPanel, ShipPanelAction } from './ship-panel';
import { getItemById } from '../content/hardware';
import { SALVAGE_DEFS } from '../content/salvage';
import { MODULE_DEFS } from '../content/modules';
import { CREW_ROSTER, CrewMemberId } from '../content/crew';
import { ASSIGNMENT_SLOT_DEFS, AssignmentSlotId } from '../content/crew-assignments';
import { computeCrewAssignmentEffects } from '../app/crew-assignment-effects';
import { EMERGENCY_RECHARGE_COST } from '../config/constants';

export type HubAction = 'START_DIVE' | 'RECHARGE_ENERGY' | 'RECHARGE_ENERGY_EMERGENCY' | 'OPEN_VOID_COMMUNION' | 'OPEN_SALVAGE_MARKET' | 'OPEN_HARDWARE' | 'OPEN_CRYO' | 'OPEN_MODULES' | ShipPanelAction;

// Panel geometry
const PW = 600;
const PH = 500;
const PX = 660 - PW / 2;
const PY = 290 - PH / 2;
const PAD = 30;

const BTN_W = 260;
const BTN_H = 52;
const BTN_Y = PY + PH - PAD - BTN_H;

function btnX(index: number): number {
  return index === 0 ? PX + PAD : PX + PW - PAD - BTN_W;
}

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

export function renderHub(meta: MetaState, mx: number, my: number): HubAction | null {
  const display = MakkoEngine.display;

  // Panel
  display.drawRect(PX, PY, PW, PH, { fill: '#0d1117', stroke: '#2d3748', lineWidth: 1 });

  // Header
  display.drawText('HUB', PX + PAD, PY + PAD, {
    font: 'bold 36px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  // Stats
  const leadLabel = meta.leadId ?? 'none';
  const compLabel = meta.companionIds.length > 0 ? meta.companionIds.join(', ') : 'none';
  // Effective billing amount = base + upkeep surcharge for extra crew
  const activeCrewCount = (meta.leadId !== null ? 1 : 0) + meta.companionIds.length;
  const upkeepSurcharge = Math.max(0, activeCrewCount - 1) * meta.upkeepPerAwakeCrew;
  const effectiveBilling = meta.billingAmount + upkeepSurcharge;

  // Salvage summary
  const salvageParts = meta.hubInventory
    .filter((e) => e.quantity > 0)
    .map((e) => `${e.quantity} ${SALVAGE_DEFS[e.tier].label.toLowerCase()}`);
  const salvageSummary = salvageParts.length > 0 ? salvageParts.join(', ') : 'none';

  // Hardware summary
  const hwSlots = (['hull', 'scanner', 'utility'] as const).map((slot) => {
    const id = meta.equippedItems[slot];
    const name = id !== null ? (getItemById(id)?.name ?? id) : '(none)';
    return `${slot[0].toUpperCase() + slot.slice(1)}: ${name}`;
  });
  const hwSummary = hwSlots.join(' | ');

  // Module count
  const builtModules = MODULE_DEFS.filter((d) => (meta.moduleLevels[d.id] ?? 0) > 0).length;

  const rows: Array<[string, string]> = [
    ['Opening: ', meta.openingPathChosen || 'not chosen'],
    ['Lead:    ', leadLabel],
    ['Crew:    ', compLabel],
    ['Energy:  ', `${meta.energy} / 5`],
    ['Credits: ', `\u20a1${meta.credits}`],
    ['VoidEcho:', `${meta.voidEcho}`],
    ['Debt:    ', `\u20a1${meta.debt}`],
    ['Next bill:', `${meta.billingRunsUntilNext} run${meta.billingRunsUntilNext !== 1 ? 's' : ''} (\u20a1${meta.billingAmount})`],
    ['Bill (eff):', `\u20a1${effectiveBilling}${upkeepSurcharge > 0 ? ` (+\u20a1${upkeepSurcharge} upkeep)` : ''}`],
    ['Power Cells:', `${meta.powerCells}`],
    ['Modules:', `${builtModules} / 6 modules built`],
    ['Salvage:', salvageSummary],
    ['Unlocked:', meta.unlockedCards.join(', ')],
  ];

  const rowStartY = PY + PAD + 52;
  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    const ry = rowStartY + i * 30;
    display.drawText(label, PX + PAD, ry, {
      font: '20px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });
    display.drawText(value, PX + PAD + 160, ry, {
      font: '20px monospace', fill: '#ffffff', align: 'left', baseline: 'top',
    });
  }

  // Hardware summary (extra-wide — rendered as its own line below the rows)
  const hwY = rowStartY + rows.length * 30;
  display.drawText('Hardware:', PX + PAD, hwY, {
    font: '16px monospace', fill: '#718096', align: 'left', baseline: 'top',
  });
  display.drawText(hwSummary, PX + PAD + 110, hwY, {
    font: '16px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
  });

  // Crew assignments summary block
  const assignAwakeIds: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];
  const activeAssignments = assignAwakeIds.filter(
    (id) => meta.crewAssignments[id] && meta.crewAssignments[id] !== 'idle',
  );

  const assignHeaderY = hwY + 20;
  display.drawText('Assignments:', PX + PAD, assignHeaderY, {
    font: '16px monospace', fill: '#718096', align: 'left', baseline: 'top',
  });

  let assignBlockH = 18; // header line height
  if (activeAssignments.length === 0) {
    display.drawText('none', PX + PAD + 110, assignHeaderY, {
      font: '16px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });
  } else {
    for (let ai = 0; ai < activeAssignments.length; ai++) {
      const crewId = activeAssignments[ai];
      const slot = meta.crewAssignments[crewId] as AssignmentSlotId;
      const crewName = CREW_ROSTER[crewId].name;
      const slotLabel = ASSIGNMENT_SLOT_DEFS[slot].label;
      const lineY = assignHeaderY + assignBlockH;
      display.drawText(`${crewName}:`, PX + PAD + 4, lineY, {
        font: '15px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
      });
      display.drawText(slotLabel, PX + PAD + 100, lineY, {
        font: '15px monospace', fill: '#68d391', align: 'left', baseline: 'top',
      });
      assignBlockH += 18;
    }

    // Bonus summary line
    const fx = computeCrewAssignmentEffects(meta.crewAssignments, assignAwakeIds);
    const bonusParts: string[] = [];
    if (fx.scavengeBonusFlat !== 0) bonusParts.push(`+${fx.scavengeBonusFlat} scav`);
    if (fx.hullStartBonus !== 0)    bonusParts.push(`+${fx.hullStartBonus} hull`);
    if (fx.saleBonusPct !== 0)      bonusParts.push(`+${fx.saleBonusPct}% sales`);
    if (fx.repairBonus !== 0)       bonusParts.push(`+${fx.repairBonus} repair`);
    if (bonusParts.length > 0) {
      display.drawText(`Bonuses: ${bonusParts.join('  ')}`, PX + PAD + 4, assignHeaderY + assignBlockH, {
        font: '14px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
      });
      assignBlockH += 18;
    }
  }

  // Last billing result
  const extraLineH = 22 + assignBlockH; // hardware summary line + assignments block
  if (meta.lastBillingResult !== null) {
    const br = meta.lastBillingResult;
    const billingY = rowStartY + rows.length * 30 + extraLineH + 2;
    if (br.paid) {
      display.drawText(
        `Last bill: PAID \u20a1${br.amount}`,
        PX + PAD,
        billingY,
        { font: '14px monospace', fill: '#68d391', align: 'left', baseline: 'top' },
      );
    } else {
      display.drawText(
        `Last bill: MISSED +\u20a1${br.penaltyAdded} debt`,
        PX + PAD,
        billingY,
        { font: '14px monospace', fill: '#fc8181', align: 'left', baseline: 'top' },
      );
    }
  }

  // Path profile reminder (sidegrade hint + extraction bonus)
  let extraRowsH = 0;
  if (meta.openingPathChosen !== false) {
    const pathCfg = OPENING_PATH_CONFIG[meta.openingPathChosen];
    const sideY = rowStartY + rows.length * 30 + extraLineH + 6;
    display.drawText(pathCfg.sidegrade, PX + PAD, sideY, {
      font: '15px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });
    extraRowsH += 22;
    if (meta.extractionBonus > 0) {
      display.drawText(`Extract bonus: +\u20a1${meta.extractionBonus}`, PX + PAD, sideY + 20, {
        font: '15px monospace', fill: '#68d391', align: 'left', baseline: 'top',
      });
      extraRowsH += 22;
    }
  }

  // Doctrine section
  const docStartY = rowStartY + rows.length * 30 + extraLineH + extraRowsH + 14;

  if (meta.doctrineLocked !== null) {
    display.drawText(
      `DOCTRINE: ${meta.doctrineLocked.toUpperCase()} LOCKED`,
      PX + PAD,
      docStartY,
      { font: 'bold 16px monospace', fill: '#f6e05e', align: 'left', baseline: 'top' },
    );
  } else {
    display.drawText('Doctrine:', PX + PAD, docStartY, {
      font: '15px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });
  }

  const BAR_W = 80;
  const BAR_H = 8;
  const SEG_W = BAR_W / DOCTRINE_UNLOCK_THRESHOLD;

  const doctrineColors: Record<DoctrineId, string> = {
    corporate:   '#63b3ed',
    cooperative: '#68d391',
    smuggler:    '#fc8181',
  };

  for (let di = 0; di < DOCTRINE_ORDER.length; di++) {
    const doctrine = DOCTRINE_ORDER[di] as DoctrineId;
    const pts = meta.doctrinePoints[doctrine] ?? 0;
    const rowY = docStartY + 20 + di * 20;
    const col = doctrineColors[doctrine];
    const isLocked = meta.doctrineLocked === doctrine;
    const label = doctrine.replace('_', ' ');

    display.drawText(
      `${label}:`,
      PX + PAD,
      rowY,
      { font: '14px monospace', fill: isLocked ? '#f6e05e' : '#718096', align: 'left', baseline: 'top' },
    );

    // Progress bar background
    const barX = PX + PAD + 120;
    display.drawRect(barX, rowY + 1, BAR_W, BAR_H, { fill: '#1a202c', stroke: '#2d3748', lineWidth: 1 });

    // Filled segments
    const filled = Math.min(pts, DOCTRINE_UNLOCK_THRESHOLD);
    if (filled > 0) {
      display.drawRect(barX + 1, rowY + 2, (filled / DOCTRINE_UNLOCK_THRESHOLD) * (BAR_W - 2), BAR_H - 2, {
        fill: isLocked ? '#f6e05e' : col,
      });
    }

    // Point count
    display.drawText(
      `${pts}/${DOCTRINE_UNLOCK_THRESHOLD}`,
      barX + BAR_W + 8,
      rowY,
      { font: '13px monospace', fill: '#a0aec0', align: 'left', baseline: 'top' },
    );
  }

  // Death lessons section
  const docEndY = docStartY + 20 + DOCTRINE_ORDER.length * 20;
  const dlStartY = docEndY + 14;

  display.drawText('Death Lessons:', PX + PAD, dlStartY, {
    font: '15px monospace', fill: '#718096', align: 'left', baseline: 'top',
  });

  const currentDeathTier = getCurrentTier(meta.totalCollapses);
  const nextDeathTier = getNextTier(meta.totalCollapses);

  const dlTierLabel = currentDeathTier !== null
    ? `${currentDeathTier.label} (Tier ${currentDeathTier.tier})`
    : 'No tier yet';
  display.drawText(dlTierLabel, PX + PAD + 4, dlStartY + 18, {
    font: '14px monospace',
    fill: currentDeathTier !== null ? '#f6ad55' : '#4a5568',
    align: 'left',
    baseline: 'top',
  });

  display.drawText(`${meta.totalCollapses} collapse${meta.totalCollapses !== 1 ? 's' : ''}`, PX + PAD + 4, dlStartY + 34, {
    font: '13px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
  });

  const dlNextLabel = nextDeathTier !== null
    ? `Next: ${nextDeathTier.label} at ${nextDeathTier.collapsesRequired} collapses`
    : 'Max tier reached';
  display.drawText(dlNextLabel, PX + PAD + 4, dlStartY + 50, {
    font: '13px monospace',
    fill: nextDeathTier !== null ? '#718096' : '#f6e05e',
    align: 'left',
    baseline: 'top',
  });

  // Buttons
  const canDive = meta.energy >= 1;
  const canRecharge = meta.credits >= 200 && meta.energy < 5;

  let clicked: HubAction | null = null;

  const buttons: Array<{ label: string; enabled: boolean; action: HubAction; idx: number }> = [
    { label: 'Start Dive (1 energy)', enabled: canDive, action: 'START_DIVE', idx: 0 },
    { label: 'Recharge (+1, \u20a1200)', enabled: canRecharge, action: 'RECHARGE_ENERGY', idx: 1 },
  ];

  // Emergency Recharge button — shown when energy=0 and credits>=100
  const canEmergency = meta.energy === 0 && meta.credits >= EMERGENCY_RECHARGE_COST;
  if (canEmergency) {
    const emergBtnX = PX + PAD;
    const emergBtnY = BTN_Y + BTN_H + 8;
    const emergBtnW = PW - PAD * 2;
    const emergHover = isOver(mx, my, emergBtnX, emergBtnY, emergBtnW, BTN_H);
    display.drawRect(emergBtnX, emergBtnY, emergBtnW, BTN_H, {
      fill: emergHover ? '#7b341e' : '#2d1f0e',
      stroke: '#c05621',
      lineWidth: 1,
    });
    display.drawText(
      `Emergency Recharge (\u20a1${EMERGENCY_RECHARGE_COST})`,
      emergBtnX + emergBtnW / 2,
      emergBtnY + BTN_H / 2,
      { font: '18px monospace', fill: '#fbd38d', align: 'center', baseline: 'middle' },
    );
    if (emergHover && MakkoEngine.input.isMouseReleased(0)) {
      return 'RECHARGE_ENERGY_EMERGENCY';
    }
  }

  // Void Communion nav button (below main buttons)
  const navBtnW = PW - PAD * 2;
  const navBtnH = 44;
  const navBtnX = PX + PAD;
  const vcBtnY = BTN_Y + BTN_H + 14;
  const vcHover = isOver(mx, my, navBtnX, vcBtnY, navBtnW, navBtnH);
  display.drawRect(navBtnX, vcBtnY, navBtnW, navBtnH, {
    fill: vcHover ? '#2d1f4e' : '#1a1030',
    stroke: vcHover ? '#9f7aea' : '#4a3f6b',
    lineWidth: 1,
  });
  display.drawText('\u2726 Void Communion', navBtnX + navBtnW / 2, vcBtnY + navBtnH / 2, {
    font: '18px monospace',
    fill: vcHover ? '#d6bcfa' : '#9f7aea',
    align: 'center',
    baseline: 'middle',
  });
  if (vcHover && MakkoEngine.input.isMouseReleased(0)) {
    return 'OPEN_VOID_COMMUNION';
  }

  // Salvage Market nav button (below Void Communion)
  const smBtnY = vcBtnY + navBtnH + 8;
  const smHover = isOver(mx, my, navBtnX, smBtnY, navBtnW, navBtnH);
  const hasInventory = meta.hubInventory.length > 0;
  display.drawRect(navBtnX, smBtnY, navBtnW, navBtnH, {
    fill: smHover ? '#276749' : '#1a2a1a',
    stroke: smHover ? '#68d391' : '#276749',
    lineWidth: 1,
  });
  display.drawText(
    hasInventory
      ? `\u2691 Salvage Market  (${meta.hubInventory.reduce((s, e) => s + e.quantity, 0)} items)`
      : '\u2691 Salvage Market',
    navBtnX + navBtnW / 2,
    smBtnY + navBtnH / 2,
    {
      font: '18px monospace',
      fill: smHover ? '#c6f6d5' : '#68d391',
      align: 'center',
      baseline: 'middle',
    },
  );
  if (smHover && MakkoEngine.input.isMouseReleased(0)) {
    return 'OPEN_SALVAGE_MARKET';
  }

  // Hardware nav button (below Salvage Market)
  const hwBtnY = smBtnY + navBtnH + 8;
  const hwHover = isOver(mx, my, navBtnX, hwBtnY, navBtnW, navBtnH);
  const hasHardware = meta.itemInventory.length > 0 ||
    Object.values(meta.equippedItems).some((v) => v !== null);
  display.drawRect(navBtnX, hwBtnY, navBtnW, navBtnH, {
    fill: hwHover ? '#3d2000' : '#1a1000',
    stroke: hwHover ? '#ed8936' : '#7b4a1e',
    lineWidth: 1,
  });
  display.drawText(
    hasHardware ? '\u2699 Hardware  (equipped)' : '\u2699 Hardware',
    navBtnX + navBtnW / 2,
    hwBtnY + navBtnH / 2,
    {
      font: '18px monospace',
      fill: hwHover ? '#fbd38d' : '#ed8936',
      align: 'center',
      baseline: 'middle',
    },
  );
  if (hwHover && MakkoEngine.input.isMouseReleased(0)) {
    return 'OPEN_HARDWARE';
  }

  // Cryo Management nav button (below Hardware)
  const cryoBtnY = hwBtnY + navBtnH + 8;
  const cryoHover = isOver(mx, my, navBtnX, cryoBtnY, navBtnW, navBtnH);
  const hasCryo = meta.cryoPool.length > 0;
  display.drawRect(navBtnX, cryoBtnY, navBtnW, navBtnH, {
    fill: cryoHover ? '#1a3a5a' : '#0a1a2e',
    stroke: cryoHover ? '#4a9eda' : '#2b4a6e',
    lineWidth: 1,
  });
  display.drawText(
    hasCryo
      ? `\u2744 Cryo Mgmt  (${meta.cryoPool.length} in cryo)`
      : '\u2744 Cryo Mgmt',
    navBtnX + navBtnW / 2,
    cryoBtnY + navBtnH / 2,
    {
      font: '18px monospace',
      fill: cryoHover ? '#90cdf4' : '#4a9eda',
      align: 'center',
      baseline: 'middle',
    },
  );
  if (cryoHover && MakkoEngine.input.isMouseReleased(0)) {
    return 'OPEN_CRYO';
  }

  // Station Modules nav button (below Cryo) — primary progression, visually distinct
  const modBtnY = cryoBtnY + navBtnH + 8;
  const modHover = isOver(mx, my, navBtnX, modBtnY, navBtnW, navBtnH);
  const anyModuleBuilt = Object.values(meta.moduleLevels).some((v) => v > 0);
  display.drawRect(navBtnX, modBtnY, navBtnW, navBtnH, {
    fill: modHover ? '#1a2040' : '#0d1430',
    stroke: modHover ? '#63b3ed' : '#2b4a8e',
    lineWidth: modHover ? 2 : 1,
  });
  display.drawText(
    anyModuleBuilt ? '\u2605 Station Modules  (active)' : '\u2605 Station Modules',
    navBtnX + navBtnW / 2,
    modBtnY + navBtnH / 2,
    {
      font: modHover ? 'bold 18px monospace' : '18px monospace',
      fill: modHover ? '#90cdf4' : '#63b3ed',
      align: 'center',
      baseline: 'middle',
    },
  );
  if (modHover && MakkoEngine.input.isMouseReleased(0)) {
    return 'OPEN_MODULES';
  }

  // Ship panel — rendered inline as a side panel
  const shipAction = renderShipPanel(meta, mx, my);
  if (shipAction !== null) return shipAction;

  for (const btn of buttons) {
    const bx = btnX(btn.idx);
    const hover = btn.enabled && isOver(mx, my, bx, BTN_Y, BTN_W, BTN_H);
    const fill = !btn.enabled ? '#1a202c' : hover ? '#2b6cb0' : '#1e3a5f';
    const stroke = !btn.enabled ? '#4a5568' : hover ? '#63b3ed' : '#2b6cb0';
    const textColor = btn.enabled ? '#ffffff' : '#4a5568';

    display.drawRect(bx, BTN_Y, BTN_W, BTN_H, { fill, stroke, lineWidth: 1 });
    display.drawText(btn.label, bx + BTN_W / 2, BTN_Y + BTN_H / 2, {
      font: '18px monospace', fill: textColor, align: 'center', baseline: 'middle',
    });

    if (hover && MakkoEngine.input.isMouseReleased(0)) {
      clicked = btn.action;
    }
  }

  // ── Right-side info panel ────────────────────────────────────────────────
  const RP_X = 1010;

  // [ HUB ] mode label
  display.drawText('[ HUB ]', RP_X, 80, {
    font: 'bold 36px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  // Energy bar: filled ■ + empty □ squares
  const energyMax = 5;
  const filledSquares = '\u25a0'.repeat(meta.energy);
  const emptySquares  = '\u25a1'.repeat(Math.max(0, energyMax - meta.energy));
  display.drawText('Energy: ', RP_X, 130, {
    font: '24px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
  });
  const energyLabelW = display.measureText('Energy: ', { font: '24px monospace' }).width;
  if (filledSquares.length > 0) {
    display.drawText(filledSquares, RP_X + energyLabelW, 130, {
      font: '24px monospace', fill: '#68d391', align: 'left', baseline: 'top',
    });
  }
  if (emptySquares.length > 0) {
    const filledW = filledSquares.length > 0
      ? display.measureText(filledSquares, { font: '24px monospace' }).width
      : 0;
    display.drawText(emptySquares, RP_X + energyLabelW + filledW, 130, {
      font: '24px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });
  }

  // Credits
  display.drawText(`Credits: \u20a1${meta.credits}`, RP_X, 165, {
    font: '22px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
  });

  // Debt
  display.drawText(`Debt:    \u20a1${meta.debt}`, RP_X, 195, {
    font: '22px monospace', fill: meta.debt > 0 ? '#fc8181' : '#68d391', align: 'left', baseline: 'top',
  });

  // Horizontal divider
  display.drawLine(RP_X, 230, 1870, 230, { stroke: '#2d3748', lineWidth: 1 });

  // Contextual hint at y=245
  let hintText: string;
  let hintColor: string;
  if (meta.energy >= 1) {
    hintText = `\u25b6 START YOUR DIVE  (energy: ${meta.energy}/5)`;
    hintColor = '#68d391';
  } else if (meta.credits >= 200) {
    hintText = `\u25b6 RECHARGE ENERGY  (\u20a1200)`;
    hintColor = '#f6e05e';
  } else if (meta.credits >= EMERGENCY_RECHARGE_COST) {
    hintText = `\u25b6 EMERGENCY RECHARGE  (\u20a1${EMERGENCY_RECHARGE_COST})`;
    hintColor = '#f6ad55';
  } else {
    hintText = '\u26a0 SELL SALVAGE or wait for credits';
    hintColor = '#fc8181';
  }
  display.drawText(hintText, RP_X, 245, {
    font: 'bold 26px monospace', fill: hintColor, align: 'left', baseline: 'top',
  });

  // Available actions header
  display.drawText('AVAILABLE ACTIONS:', RP_X, 295, {
    font: '16px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
  });

  // Action rows
  const totalInventory = meta.hubInventory.reduce((s, e) => s + e.quantity, 0);
  const actionRows: Array<{ text: string; fill: string }> = [
    {
      text: `  \u25b6 Start Dive (1 energy)`,
      fill: canDive ? '#68d391' : '#4a5568',
    },
    {
      text: totalInventory > 0
        ? `  \u25b6 Salvage Market  (${totalInventory} items)`
        : '  \u25b6 Salvage Market',
      fill: '#a0aec0',
    },
    {
      text: builtModules > 0
        ? `  \u25b6 Station Modules  (${builtModules}/6 built)`
        : '  \u25b6 Station Modules',
      fill: '#63b3ed',
    },
  ];

  for (let ai = 0; ai < actionRows.length; ai++) {
    display.drawText(actionRows[ai].text, RP_X, 315 + ai * 25, {
      font: '20px monospace', fill: actionRows[ai].fill, align: 'left', baseline: 'top',
    });
  }

  return clicked;
}
