import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import { OPENING_PATH_CONFIG } from '../content/opening-paths';
import { MODULE_DEFS } from '../content/modules';
import { CREW_ROSTER, CrewMemberId } from '../content/crew';
import { ASSIGNMENT_SLOT_DEFS, AssignmentSlotId } from '../content/crew-assignments';
import { computeCrewAssignmentEffects } from '../app/crew-assignment-effects';
import { renderShipPanel, ShipPanelAction } from './ship-panel';
import { getHubAvailableActions } from '../app/hub-actions';
import { computeModuleEffects } from '../app/module-effects';
import { RECHARGE_COST, EMERGENCY_RECHARGE_COST, MAX_ENERGY } from '../config/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HubTab = 'overview' | 'crew-modules' | 'secondary';

export type HubAction =
  | 'START_DIVE'
  | 'RECHARGE_ENERGY'
  | 'RECHARGE_ENERGY_EMERGENCY'
  | 'SCRAP_JOB'
  | 'OPEN_VOID_COMMUNION'
  | 'OPEN_SALVAGE_MARKET'
  | 'OPEN_HARDWARE'
  | 'OPEN_CRYO'
  | 'OPEN_MODULES'
  | ShipPanelAction;

// ── Layout ────────────────────────────────────────────────────────────────────

// Left panel
const LP_X = 60;
const LP_Y = 60;
const LP_W = 560;
const LP_H = 960;

// Right panel
const RP_X = 660;
const RP_Y = 60;
const RP_W = 1200;
const RP_H = 960;

// Tab bar (top of right panel)
const TAB_H = 56;
const TAB_COUNT = 3;
const TAB_W = RP_W / TAB_COUNT;

// Left column action buttons
const BTN_W = 500;
const BTN_H = 56;
const BTN_X = LP_X + (LP_W - BTN_W) / 2;
const BTN_GAP = 12;
const BTN_START_Y = 395;

// Salvage market shortcut
const SM_H = 44;
const SM_Y = 720;

// Right panel content x-bounds
const RP_CONTENT_X = RP_X + 40;
const RP_CONTENT_W = RP_W - 80;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

function drawButton(
  label: string,
  x: number, y: number, w: number, h: number,
  enabled: boolean,
  hover: boolean,
  fillActive: string,
  fillHover: string,
  strokeActive: string,
  strokeHover: string,
  fontSize = 20,
): void {
  const display = MakkoEngine.display;
  const fill   = !enabled ? '#1a202c' : hover ? fillHover  : fillActive;
  const stroke = !enabled ? '#4a5568' : hover ? strokeHover : strokeActive;
  const color  = enabled ? '#ffffff' : '#4a5568';
  display.drawRect(x, y, w, h, { fill, stroke, lineWidth: 1 });
  display.drawText(label, x + w / 2, y + h / 2, {
    font: `${fontSize}px monospace`, fill: color, align: 'center', baseline: 'middle',
  });
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<HubTab, string> = {
  'overview':      'Overview',
  'crew-modules':  'Crew & Modules',
  'secondary':     'Ships • Void • Hardware',
};

const TAB_ORDER: HubTab[] = ['overview', 'crew-modules', 'secondary'];

function renderTabBar(
  activeTab: HubTab,
  mx: number,
  my: number,
): HubTab | null {
  const display = MakkoEngine.display;
  let clicked: HubTab | null = null;

  for (let i = 0; i < TAB_ORDER.length; i++) {
    const tab = TAB_ORDER[i];
    const tx = RP_X + i * TAB_W;
    const ty = RP_Y;
    const isActive = tab === activeTab;
    const hover = isOver(mx, my, tx, ty, TAB_W, TAB_H);

    display.drawRect(tx, ty, TAB_W, TAB_H, {
      fill:      isActive ? '#1e2433' : hover ? '#161c28' : '#0d1117',
      stroke:    isActive ? '#63b3ed' : '#2d3748',
      lineWidth: isActive ? 2 : 1,
    });
    display.drawText(TAB_LABELS[tab], tx + TAB_W / 2, ty + TAB_H / 2, {
      font:     isActive ? 'bold 18px monospace' : '18px monospace',
      fill:     isActive ? '#ffffff' : hover ? '#a0aec0' : '#718096',
      align:    'center',
      baseline: 'middle',
    });

    if (hover && MakkoEngine.input.isMouseReleased(0)) {
      clicked = tab;
    }
  }

  return clicked;
}

// ── Left column ───────────────────────────────────────────────────────────────

function renderLeftColumn(
  meta: MetaState,
  mx: number,
  my: number,
): HubAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  // Panel background
  display.drawRect(LP_X, LP_Y, LP_W, LP_H, { fill: '#0d1117', stroke: '#2d3748', lineWidth: 1 });

  // Header
  display.drawText('[ HUB ]', LP_X + LP_W / 2, LP_Y + 30, {
    font: 'bold 36px monospace', fill: '#63b3ed', align: 'center', baseline: 'top',
  });

  // ── Five core stats ──────────────────────────────────────────────────────
  const modFx = computeModuleEffects(meta.moduleLevels);
  const effectiveCap = MAX_ENERGY + modFx.energyCapBonus;
  const effectiveRechargeCost = Math.floor(RECHARGE_COST * (1 - modFx.marketDiscountPct / 100));
  const activeCrewCount = (meta.leadId !== null ? 1 : 0) + meta.companionIds.length;
  const upkeepSurcharge = Math.max(0, activeCrewCount - 1) * meta.upkeepPerAwakeCrew;
  const effectiveBilling = meta.billingAmount + upkeepSurcharge;

  const statStartY = 150;
  const statLH = 42;
  const statFont = '22px monospace';
  const statX = LP_X + 30;

  // Energy row with filled/empty squares
  const filled = '\u25a0'.repeat(meta.energy);
  const empty  = '\u25a1'.repeat(Math.max(0, effectiveCap - meta.energy));
  display.drawText('Energy:  ', statX, statStartY, { font: statFont, fill: '#a0aec0', align: 'left', baseline: 'top' });
  const energyLabelW = display.measureText('Energy:  ', { font: statFont }).width;
  if (filled.length > 0) {
    display.drawText(filled, statX + energyLabelW, statStartY, { font: statFont, fill: '#68d391', align: 'left', baseline: 'top' });
  }
  if (empty.length > 0) {
    const filledW = filled.length > 0 ? display.measureText(filled, { font: statFont }).width : 0;
    display.drawText(empty, statX + energyLabelW + filledW, statStartY, { font: statFont, fill: '#4a5568', align: 'left', baseline: 'top' });
  }

  // Credits
  display.drawText(`Credits: \u20a1${meta.credits}`, statX, statStartY + statLH, {
    font: statFont, fill: '#e2e8f0', align: 'left', baseline: 'top',
  });

  // Debt
  display.drawText(`Debt:    \u20a1${meta.debt}`, statX, statStartY + statLH * 2, {
    font: statFont, fill: meta.debt > 0 ? '#fc8181' : '#68d391', align: 'left', baseline: 'top',
  });

  // VoidEcho
  display.drawText(`VoidEcho: ${meta.voidEcho}`, statX, statStartY + statLH * 3, {
    font: statFont, fill: '#9f7aea', align: 'left', baseline: 'top',
  });

  // Bill countdown
  display.drawText(`Bill in: ${meta.billingRunsUntilNext} run(s)  \u20a1${effectiveBilling}`, statX, statStartY + statLH * 4, {
    font: statFont, fill: '#a0aec0', align: 'left', baseline: 'top',
  });

  // Horizontal divider
  display.drawLine(LP_X + 20, 375, LP_X + LP_W - 20, 375, { stroke: '#2d3748', lineWidth: 1 });

  // ── Three primary action buttons ─────────────────────────────────────────
  const actions = getHubAvailableActions(meta);
  let clicked: HubAction | null = null;

  // Button 0: Start Dive
  const diveHover = actions.canDive && isOver(mx, my, BTN_X, BTN_START_Y, BTN_W, BTN_H);
  drawButton(
    '\u25b6 Start Dive  (1 energy)',
    BTN_X, BTN_START_Y, BTN_W, BTN_H,
    actions.canDive, diveHover,
    '#1e3a5f', '#2b6cb0', '#2b6cb0', '#63b3ed',
  );
  if (!actions.canDive) {
    display.drawText(actions.diveReason, LP_X + LP_W / 2, BTN_START_Y + BTN_H + 4, {
      font: '14px monospace', fill: '#4a5568', align: 'center', baseline: 'top',
    });
  }
  if (diveHover && input.isMouseReleased(0)) clicked = 'START_DIVE';

  // Button 1: Get Energy
  const btn1Y = BTN_START_Y + BTN_H + BTN_GAP + 18; // +18 for possible reason text
  let energyLabel: string;
  let energyAction: HubAction;
  let energyEnabled: boolean;
  let energyReason: string;
  if (actions.canRecharge) {
    energyLabel = `\u26a1 Recharge  (\u20a1${effectiveRechargeCost})`;
    energyAction = 'RECHARGE_ENERGY';
    energyEnabled = true;
    energyReason = '';
  } else if (actions.canEmergency) {
    energyLabel = `\u26a1 Emergency  (\u20a1${EMERGENCY_RECHARGE_COST})`;
    energyAction = 'RECHARGE_ENERGY_EMERGENCY';
    energyEnabled = true;
    energyReason = '';
  } else {
    energyLabel = '\u26a1 Get Energy';
    energyAction = 'RECHARGE_ENERGY';
    energyEnabled = false;
    energyReason = actions.canRecharge ? '' : actions.rechargeReason;
  }
  const energyHover = energyEnabled && isOver(mx, my, BTN_X, btn1Y, BTN_W, BTN_H);
  drawButton(
    energyLabel,
    BTN_X, btn1Y, BTN_W, BTN_H,
    energyEnabled, energyHover,
    '#1e3a5f', '#2b6cb0', '#2b6cb0', '#63b3ed',
  );
  if (!energyEnabled && energyReason) {
    display.drawText(energyReason, LP_X + LP_W / 2, btn1Y + BTN_H + 4, {
      font: '14px monospace', fill: '#4a5568', align: 'center', baseline: 'top',
    });
  }
  if (energyHover && input.isMouseReleased(0)) clicked = energyAction;

  // Button 2: Scrap Job
  const btn2Y = btn1Y + BTN_H + BTN_GAP + 18;
  const scrapHover = actions.canScrapJob && isOver(mx, my, BTN_X, btn2Y, BTN_W, BTN_H);
  drawButton(
    '\u2295 Scrap Job  (free)',
    BTN_X, btn2Y, BTN_W, BTN_H,
    actions.canScrapJob, scrapHover,
    '#1a2a0a', '#2d4a15', '#48bb78', '#68d391',
  );
  if (!actions.canScrapJob) {
    display.drawText('On cooldown \u2013 resets after next run', LP_X + LP_W / 2, btn2Y + BTN_H + 4, {
      font: '14px monospace', fill: '#4a5568', align: 'center', baseline: 'top',
    });
  }
  if (scrapHover && input.isMouseReleased(0)) clicked = 'SCRAP_JOB';

  // ── Salvage Market shortcut ───────────────────────────────────────────────
  const totalItems = meta.hubInventory.reduce((s, e) => s + e.quantity, 0);
  const smLabel = totalItems > 0
    ? `\u229b Salvage Market  (${totalItems} items)`
    : '\u229b Salvage Market';
  const smHover = isOver(mx, my, BTN_X, SM_Y, BTN_W, SM_H);
  display.drawRect(BTN_X, SM_Y, BTN_W, SM_H, {
    fill:   smHover ? '#276749' : '#1a2a1a',
    stroke: smHover ? '#68d391' : '#276749',
    lineWidth: 1,
  });
  display.drawText(smLabel, BTN_X + BTN_W / 2, SM_Y + SM_H / 2, {
    font: '20px monospace', fill: smHover ? '#c6f6d5' : '#68d391', align: 'center', baseline: 'middle',
  });
  if (smHover && input.isMouseReleased(0)) clicked = 'OPEN_SALVAGE_MARKET';

  // ── Next best hint ────────────────────────────────────────────────────────
  display.drawText(actions.nextBestHint, LP_X + LP_W / 2, 790, {
    font: 'bold 24px monospace',
    fill: actions.nextBestColor,
    align: 'center',
    baseline: 'top',
  });

  return clicked;
}

// ── Right column: Overview tab ────────────────────────────────────────────────

function renderOverviewTab(meta: MetaState): void {
  const display = MakkoEngine.display;
  const actions = getHubAvailableActions(meta);
  const modFx = computeModuleEffects(meta.moduleLevels);
  const effectiveRechargeCost = Math.floor(RECHARGE_COST * (1 - modFx.marketDiscountPct / 100));

  // Content starts below tab bar
  const cY = RP_Y + TAB_H + 20;

  // "AVAILABLE ACTIONS" header
  display.drawText('AVAILABLE ACTIONS', RP_CONTENT_X, cY, {
    font: '16px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
  });

  const actionRows: Array<{ text: string; color: string }> = [
    {
      text: actions.canDive
        ? `  \u25b6 Start Dive  (energy ${meta.energy}/${MAX_ENERGY + modFx.energyCapBonus})`
        : `  \u25b6 Start Dive  — ${actions.diveReason}`,
      color: actions.canDive ? '#68d391' : '#4a5568',
    },
    {
      text: actions.canRecharge
        ? `  \u26a1 Recharge Energy  (\u20a1${effectiveRechargeCost})`
        : `  \u26a1 Recharge Energy  — ${actions.rechargeReason}`,
      color: actions.canRecharge ? '#f6e05e' : '#4a5568',
    },
    {
      text: actions.canEmergency
        ? `  \u26a1 Emergency Recharge  (\u20a1${EMERGENCY_RECHARGE_COST})`
        : `  \u26a1 Emergency Recharge  — ${actions.emergencyReason}`,
      color: actions.canEmergency ? '#f6ad55' : '#4a5568',
    },
    {
      text: actions.canSellSalvage
        ? `  \u229b Salvage Market  (${meta.hubInventory.reduce((s, e) => s + e.quantity, 0)} items)`
        : `  \u229b Salvage Market  — ${actions.sellReason}`,
      color: actions.canSellSalvage ? '#68d391' : '#4a5568',
    },
    {
      text: actions.canScrapJob
        ? '  \u2295 Scrap Job  (free, gives credits + scrap)'
        : `  \u2295 Scrap Job  — ${actions.scrapJobReason}`,
      color: actions.canScrapJob ? '#f6ad55' : '#4a5568',
    },
  ];

  for (let i = 0; i < actionRows.length; i++) {
    display.drawText(actionRows[i].text, RP_CONTENT_X, cY + 25 + i * 28, {
      font: '20px monospace', fill: actionRows[i].color, align: 'left', baseline: 'top',
    });
  }

  // ── Billing summary ───────────────────────────────────────────────────────
  const billingY = cY + 190;
  display.drawLine(RP_CONTENT_X, billingY - 10, RP_CONTENT_X + RP_CONTENT_W, billingY - 10, {
    stroke: '#2d3748', lineWidth: 1,
  });
  display.drawText('BILLING', RP_CONTENT_X, billingY, {
    font: '16px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
  });

  const activeCrewCount = (meta.leadId !== null ? 1 : 0) + meta.companionIds.length;
  const upkeepSurcharge = Math.max(0, activeCrewCount - 1) * meta.upkeepPerAwakeCrew;
  const effectiveBilling = meta.billingAmount + upkeepSurcharge;

  display.drawText(
    `Next bill: \u20a1${effectiveBilling} in ${meta.billingRunsUntilNext} run(s)`,
    RP_CONTENT_X, billingY + 22,
    { font: '20px monospace', fill: '#a0aec0', align: 'left', baseline: 'top' },
  );
  if (upkeepSurcharge > 0) {
    display.drawText(
      `  Base \u20a1${meta.billingAmount} + \u20a1${upkeepSurcharge} crew upkeep`,
      RP_CONTENT_X, billingY + 46,
      { font: '18px monospace', fill: '#718096', align: 'left', baseline: 'top' },
    );
  }

  if (meta.lastBillingResult !== null) {
    const br = meta.lastBillingResult;
    const billColor = br.paid ? '#68d391' : '#fc8181';
    const billText = br.paid
      ? `Last bill: PAID \u20a1${br.amount}`
      : `Last bill: MISSED  +\u20a1${br.penaltyAdded} debt`;
    display.drawText(billText, RP_CONTENT_X, billingY + 72, {
      font: '20px monospace', fill: billColor, align: 'left', baseline: 'top',
    });
  }

  // ── Opening path reminder ─────────────────────────────────────────────────
  const pathY = cY + 340;
  display.drawLine(RP_CONTENT_X, pathY - 10, RP_CONTENT_X + RP_CONTENT_W, pathY - 10, {
    stroke: '#2d3748', lineWidth: 1,
  });

  if (meta.openingPathChosen !== false) {
    const pathCfg = OPENING_PATH_CONFIG[meta.openingPathChosen];
    display.drawText(`PATH: ${pathCfg.label}`, RP_CONTENT_X, pathY, {
      font: 'bold 20px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
    });
    display.drawText(pathCfg.sidegrade, RP_CONTENT_X, pathY + 26, {
      font: '18px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });
    if (meta.extractionBonus > 0) {
      display.drawText(`Extraction bonus: +\u20a1${meta.extractionBonus} per run`, RP_CONTENT_X, pathY + 50, {
        font: '18px monospace', fill: '#68d391', align: 'left', baseline: 'top',
      });
    }
  } else {
    display.drawText('PATH: not chosen', RP_CONTENT_X, pathY, {
      font: '20px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });
  }
}

// ── Right column: Crew & Modules tab ─────────────────────────────────────────

function renderCrewModulesTab(
  meta: MetaState,
  mx: number,
  my: number,
): HubAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let clicked: HubAction | null = null;

  const cY = RP_Y + TAB_H + 20;

  // ── Crew section ─────────────────────────────────────────────────────────
  display.drawText('CREW', RP_CONTENT_X, cY, {
    font: 'bold 20px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  const awakeIds: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];

  if (awakeIds.length === 0) {
    display.drawText('  No crew awake.', RP_CONTENT_X, cY + 26, {
      font: '18px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });
  } else {
    // Lead
    if (meta.leadId !== null) {
      const lead = CREW_ROSTER[meta.leadId];
      const slot = meta.crewAssignments[meta.leadId];
      const assignLabel = slot ? ASSIGNMENT_SLOT_DEFS[slot as AssignmentSlotId].label : '(idle)';
      display.drawText(`  Lead: ${lead.name} [${lead.role}]`, RP_CONTENT_X, cY + 26, {
        font: '20px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
      });
      display.drawText(`    → ${assignLabel}`, RP_CONTENT_X, cY + 48, {
        font: '18px monospace', fill: slot ? '#68d391' : '#718096', align: 'left', baseline: 'top',
      });
      display.drawText(lead.passiveDesc, RP_CONTENT_X + 20, cY + 68, {
        font: '16px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
      });
    }

    // Companions
    const compStartY = cY + 100;
    for (let i = 0; i < meta.companionIds.length; i++) {
      const id = meta.companionIds[i];
      const member = CREW_ROSTER[id];
      const slot = meta.crewAssignments[id];
      const assignLabel = slot ? ASSIGNMENT_SLOT_DEFS[slot as AssignmentSlotId].label : '(idle)';
      const rowY = compStartY + i * 70;
      display.drawText(`  Crew: ${member.name} [${member.role}]`, RP_CONTENT_X, rowY, {
        font: '20px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
      });
      display.drawText(`    → ${assignLabel}`, RP_CONTENT_X, rowY + 22, {
        font: '18px monospace', fill: slot ? '#68d391' : '#718096', align: 'left', baseline: 'top',
      });
      display.drawText(member.passiveDesc, RP_CONTENT_X + 20, rowY + 42, {
        font: '16px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
      });
    }

    // Assignment bonuses
    const fx = computeCrewAssignmentEffects(meta.crewAssignments, awakeIds);
    const bonusParts: string[] = [];
    if (fx.scavengeBonusFlat !== 0) bonusParts.push(`+${fx.scavengeBonusFlat} scav`);
    if (fx.hullStartBonus !== 0)    bonusParts.push(`+${fx.hullStartBonus} hull`);
    if (fx.saleBonusPct !== 0)      bonusParts.push(`+${fx.saleBonusPct}% sales`);
    if (fx.repairBonus !== 0)       bonusParts.push(`+${fx.repairBonus} repair`);
    if (bonusParts.length > 0) {
      const bonusY = cY + 100 + meta.companionIds.length * 70 + 10;
      display.drawText(`  Active bonuses: ${bonusParts.join('  ')}`, RP_CONTENT_X, bonusY, {
        font: '16px monospace', fill: '#a0aec0', align: 'left', baseline: 'top',
      });
    }
  }

  // Open Cryo Panel button
  const cryoBtnY = cY + 350;
  const cryoBtnW = 340;
  const cryoHover = isOver(mx, my, RP_CONTENT_X, cryoBtnY, cryoBtnW, 44);
  const hasCryo = meta.cryoPool.length > 0;
  display.drawRect(RP_CONTENT_X, cryoBtnY, cryoBtnW, 44, {
    fill:   cryoHover ? '#1a3a5a' : '#0a1a2e',
    stroke: cryoHover ? '#4a9eda' : '#2b4a6e',
    lineWidth: 1,
  });
  display.drawText(
    hasCryo ? `\u2744 Open Cryo Panel  (${meta.cryoPool.length} in cryo)` : '\u2744 Open Cryo Panel',
    RP_CONTENT_X + cryoBtnW / 2, cryoBtnY + 22,
    { font: '18px monospace', fill: cryoHover ? '#90cdf4' : '#4a9eda', align: 'center', baseline: 'middle' },
  );
  if (cryoHover && input.isMouseReleased(0)) clicked = 'OPEN_CRYO';

  // ── Modules section ───────────────────────────────────────────────────────
  const modSectionY = cY + 420;
  display.drawLine(RP_CONTENT_X, modSectionY - 10, RP_CONTENT_X + RP_CONTENT_W, modSectionY - 10, {
    stroke: '#2d3748', lineWidth: 1,
  });
  display.drawText('STATION MODULES', RP_CONTENT_X, modSectionY, {
    font: 'bold 20px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  // 6-module grid: 2 columns × 3 rows
  const MOD_COL_W = RP_CONTENT_W / 2;
  for (let i = 0; i < MODULE_DEFS.length; i++) {
    const def = MODULE_DEFS[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const modX = RP_CONTENT_X + col * MOD_COL_W;
    const modY = modSectionY + 28 + row * 60;
    const level = meta.moduleLevels[def.id] ?? 0;
    const maxLevel = def.upgrades.length;
    const isBuilt = level > 0;
    const levelStr = `Lv${level}/${maxLevel}`;
    const statusColor = isBuilt ? '#68d391' : '#4a5568';
    display.drawText(`  ${def.name}`, modX, modY, {
      font: '18px monospace', fill: isBuilt ? '#e2e8f0' : '#718096', align: 'left', baseline: 'top',
    });
    display.drawText(levelStr, modX + MOD_COL_W - 20, modY, {
      font: '16px monospace', fill: statusColor, align: 'right', baseline: 'top',
    });
    if (isBuilt && level <= maxLevel) {
      const desc = def.upgrades[level - 1]?.description ?? '';
      display.drawText(`  ${desc}`, modX, modY + 20, {
        font: '14px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
      });
    }
  }

  // Open Modules Panel button
  const modBtnY = modSectionY + 220;
  const modBtnW = 380;
  const modHover = isOver(mx, my, RP_CONTENT_X, modBtnY, modBtnW, 44);
  const anyBuilt = Object.values(meta.moduleLevels).some((v) => v > 0);
  display.drawRect(RP_CONTENT_X, modBtnY, modBtnW, 44, {
    fill:      modHover ? '#1a2040' : '#0d1430',
    stroke:    modHover ? '#63b3ed' : '#2b4a8e',
    lineWidth: modHover ? 2 : 1,
  });
  display.drawText(
    anyBuilt ? '\u2605 Open Modules Panel  (active)' : '\u2605 Open Modules Panel',
    RP_CONTENT_X + modBtnW / 2, modBtnY + 22,
    { font: modHover ? 'bold 18px monospace' : '18px monospace', fill: modHover ? '#90cdf4' : '#63b3ed', align: 'center', baseline: 'middle' },
  );
  if (modHover && input.isMouseReleased(0)) clicked = 'OPEN_MODULES';

  return clicked;
}

// ── Right column: Secondary tab ───────────────────────────────────────────────

function renderSecondaryTab(
  meta: MetaState,
  mx: number,
  my: number,
): HubAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let clicked: HubAction | null = null;

  const cY = RP_Y + TAB_H + 20;
  const navW = 520;
  const navH = 52;
  const navGap = 12;

  // ── Void Communion button ─────────────────────────────────────────────────
  const vcY = cY + 50;
  const vcHover = isOver(mx, my, RP_CONTENT_X, vcY, navW, navH);
  display.drawRect(RP_CONTENT_X, vcY, navW, navH, {
    fill:   vcHover ? '#2d1f4e' : '#1a1030',
    stroke: vcHover ? '#9f7aea' : '#4a3f6b',
    lineWidth: 1,
  });
  display.drawText('\u2726 Void Communion', RP_CONTENT_X + navW / 2, vcY + navH / 2, {
    font: '20px monospace', fill: vcHover ? '#d6bcfa' : '#9f7aea', align: 'center', baseline: 'middle',
  });
  if (vcHover && input.isMouseReleased(0)) clicked = 'OPEN_VOID_COMMUNION';

  // ── Hardware button ───────────────────────────────────────────────────────
  const hwY = vcY + navH + navGap;
  const hwHover = isOver(mx, my, RP_CONTENT_X, hwY, navW, navH);
  const hasEquipped = Object.values(meta.equippedItems).some((v) => v !== null);
  const hwLabel = hasEquipped ? '\u2699 Hardware  (equipped)' : '\u2699 Hardware';
  display.drawRect(RP_CONTENT_X, hwY, navW, navH, {
    fill:   hwHover ? '#3d2000' : '#1a1000',
    stroke: hwHover ? '#ed8936' : '#7b4a1e',
    lineWidth: 1,
  });
  display.drawText(hwLabel, RP_CONTENT_X + navW / 2, hwY + navH / 2, {
    font: '20px monospace', fill: hwHover ? '#fbd38d' : '#ed8936', align: 'center', baseline: 'middle',
  });
  if (hwHover && input.isMouseReleased(0)) clicked = 'OPEN_HARDWARE';

  // ── Ship status heading ───────────────────────────────────────────────────
  const shipHeadY = hwY + navH + navGap + 20;
  display.drawText('\u25a3 Ship Status', RP_CONTENT_X, shipHeadY, {
    font: 'bold 20px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });
  display.drawText('(interactive panel available in full view)', RP_CONTENT_X + 260, shipHeadY + 3, {
    font: '14px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
  });

  // Inline ship status list (read-only summary)
  const shipListY = shipHeadY + 30;
  const STATUS_COLOR: Record<string, string> = {
    derelict:  '#4a5568',
    repairing: '#f6e05e',
    claimed:   '#68d391',
  };
  for (let i = 0; i < meta.ships.length; i++) {
    const rec = meta.ships[i];
    const isActive = meta.activeRepairShipId === rec.id;
    const color = STATUS_COLOR[rec.status] ?? '#718096';
    const activeMark = isActive ? '  [REPAIRING]' : '';
    display.drawText(
      `  ${rec.id}  ${rec.status.toUpperCase()}${activeMark}  (${rec.repairProgress} progress)`,
      RP_CONTENT_X, shipListY + i * 28,
      { font: '18px monospace', fill: color, align: 'left', baseline: 'top' },
    );
  }

  // Full ship panel action area (rendered at its native position)
  const shipAction = renderShipPanel(meta, mx, my);
  if (shipAction !== null) clicked = shipAction;

  return clicked;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function renderHub(
  meta: MetaState,
  activeTab: HubTab,
  mx: number,
  my: number,
): { action: HubAction | null; tabClicked: HubTab | null } {
  const display = MakkoEngine.display;

  // Right panel background
  display.drawRect(RP_X, RP_Y, RP_W, RP_H, { fill: '#0d1117', stroke: '#2d3748', lineWidth: 1 });

  // Left column
  const leftAction = renderLeftColumn(meta, mx, my);

  // Tab bar
  const tabClicked = renderTabBar(activeTab, mx, my);

  // Right panel content
  let rightAction: HubAction | null = null;
  if (activeTab === 'overview') {
    renderOverviewTab(meta);
  } else if (activeTab === 'crew-modules') {
    rightAction = renderCrewModulesTab(meta, mx, my);
  } else if (activeTab === 'secondary') {
    rightAction = renderSecondaryTab(meta, mx, my);
  }

  const action = leftAction ?? rightAction;
  return { action, tabClicked };
}
