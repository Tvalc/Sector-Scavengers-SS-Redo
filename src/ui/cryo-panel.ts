// Cryo Management panel — wake/send crew, upkeep pressure summary.

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import { CrewMemberId, CREW_ROSTER } from '../content/crew';
import { WAKE_COST_POWER_CELLS, WAKE_DEBT_COST } from '../content/cryo';
import { AssignmentSlotId, ASSIGNMENT_SLOT_ORDER } from '../content/crew-assignments';

export type CryoPanelAction =
  | { type: 'WAKE_CREW'; crewId: CrewMemberId }
  | { type: 'SEND_TO_CRYO'; crewId: CrewMemberId }
  | { type: 'CLOSE_CRYO' }
  | { type: 'ASSIGN_CREW'; crewId: CrewMemberId; slot: AssignmentSlotId };

// ── Panel geometry ────────────────────────────────────────────────────────────
const PX  = 510;
const PY  = 215;
const PW  = 900;
const PH  = 650;
const PAD = 30;

// Sections
const ACTIVE_LABEL_Y = 300;
const ACTIVE_START_Y = 322;
const ACTIVE_ROW_H   = 68; // increased from 42 to fit assignment row

// Cryo section position is computed dynamically from active crew count
const CRYO_ROW_H = 46;

// Slot picker geometry
const SLOT_BTN_W  = 90;
const SLOT_BTN_H  = 24;
const SLOT_BTN_GAP = 4;
const SLOT_ROW_Y_OFFSET = 36; // offset from rowY for the assignment row

// Short labels for slot buttons
const SLOT_LABELS: Record<AssignmentSlotId, string> = {
  idle:       'IDLE',
  repairs:    'REPAIRS',
  scav_prep:  'SCAV',
  medbay:     'MEDBAY',
  market_ops: 'MARKET',
};

// Buttons
const SEND_W   = 140;
const SEND_H   = 30;
const WAKE_W   = 80;
const WAKE_H   = 30;
const CLOSE_W  = 100;
const CLOSE_H  = 36;

// ── Wake confirmation state ───────────────────────────────────────────────────
// Clicking [Wake] once sets pendingWakeId. A second click on the same button
// (still hovered) fires WAKE_CREW. Mouse moving off the button resets it.
let pendingWakeId: CrewMemberId | null = null;

// Standard press-tracking for other buttons
let pressedBtnId: string | null = null;

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

function stdBtn(
  id: string,
  mx: number,
  my: number,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const input = MakkoEngine.input;
  const over = isOver(mx, my, x, y, w, h);
  if (input.isMousePressed(0) && over) pressedBtnId = id;
  if (input.isMouseReleased(0)) {
    const hit = pressedBtnId === id && over;
    if (pressedBtnId === id) pressedBtnId = null;
    return hit;
  }
  return false;
}

export function renderCryoPanel(
  meta: MetaState,
  mx: number,
  my: number,
): CryoPanelAction | null {
  const display = MakkoEngine.display;
  const input   = MakkoEngine.input;
  let action: CryoPanelAction | null = null;

  // ── Panel background ────────────────────────────────────────────────────────
  display.drawRect(PX, PY, PW, PH, { fill: '#080e1a', stroke: '#2b4a6e', lineWidth: 2 });

  // ── Header ──────────────────────────────────────────────────────────────────
  display.drawText('CRYO MANAGEMENT', PX + PW / 2, PY + PAD + 4, {
    font: 'bold 28px monospace', fill: '#63b3ed', align: 'center', baseline: 'top',
  });

  // Sub-line
  display.drawText(
    `Power Cells: ${meta.powerCells}  |  Wake cost: ${WAKE_COST_POWER_CELLS} cells + \u20a1${WAKE_DEBT_COST} debt`,
    PX + PW / 2,
    PY + PAD + 40,
    { font: '18px monospace', fill: '#718096', align: 'center', baseline: 'top' },
  );

  // ── Active Crew section ──────────────────────────────────────────────────────
  display.drawText('AWAKE CREW', PX + PAD, ACTIVE_LABEL_Y, {
    font: '14px monospace', fill: '#68d391', align: 'left', baseline: 'top',
  });
  display.drawLine(PX + PAD, ACTIVE_LABEL_Y + 16, PX + PW - PAD, ACTIVE_LABEL_Y + 16, {
    stroke: '#1a3a2a', lineWidth: 1,
  });

  // Build active list: lead first, then companions
  const activeList: Array<{ id: CrewMemberId; isLead: boolean }> = [];
  if (meta.leadId !== null) activeList.push({ id: meta.leadId, isLead: true });
  for (const id of meta.companionIds) activeList.push({ id, isLead: false });

  if (activeList.length === 0) {
    display.drawText('No crew awake.', PX + PAD + 8, ACTIVE_START_Y + 8, {
      font: '18px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });
  }

  for (let i = 0; i < activeList.length; i++) {
    const { id, isLead } = activeList[i];
    const crew  = CREW_ROSTER[id];
    const rowY  = ACTIVE_START_Y + i * ACTIVE_ROW_H;
    const currentSlot: AssignmentSlotId = meta.crewAssignments[id] ?? 'idle';

    // Name + lead tag
    display.drawText(crew.name, PX + PAD + 8, rowY + 8, {
      font: 'bold 18px monospace', fill: '#e2e8f0', align: 'left', baseline: 'top',
    });
    if (isLead) {
      display.drawText('[LEAD]', PX + PAD + 100, rowY + 8, {
        font: '16px monospace', fill: '#f6e05e', align: 'left', baseline: 'top',
      });
    }

    // Role + passive description
    display.drawText(`${crew.role} — ${crew.passiveDesc}`, PX + PAD + 220, rowY + 8, {
      font: '16px monospace', fill: '#718096', align: 'left', baseline: 'top',
    });

    // [Send to Cryo] button — only for companions, not lead
    if (!isLead) {
      const sbx = PX + PW - PAD - SEND_W;
      const sby = rowY + 6;
      const sHover = isOver(mx, my, sbx, sby, SEND_W, SEND_H);
      display.drawRect(sbx, sby, SEND_W, SEND_H, {
        fill: sHover ? '#1a3a5a' : '#0a1a2e',
        stroke: '#4a9eda',
        lineWidth: 1,
      });
      display.drawText('[Send to Cryo]', sbx + SEND_W / 2, sby + SEND_H / 2, {
        font: '14px monospace', fill: '#90cdf4', align: 'center', baseline: 'middle',
      });
      if (stdBtn(`send_${id}`, mx, my, sbx, sby, SEND_W, SEND_H)) {
        action = { type: 'SEND_TO_CRYO', crewId: id };
      }
    }

    // ── Assignment slot picker row ───────────────────────────────────────────
    const slotRowY = rowY + SLOT_ROW_Y_OFFSET;
    const slotStartX = PX + PAD + 8;

    for (let s = 0; s < ASSIGNMENT_SLOT_ORDER.length; s++) {
      const slot = ASSIGNMENT_SLOT_ORDER[s];
      const btnX = slotStartX + s * (SLOT_BTN_W + SLOT_BTN_GAP);
      const btnY = slotRowY;
      const isActive = currentSlot === slot;
      const over = isOver(mx, my, btnX, btnY, SLOT_BTN_W, SLOT_BTN_H);

      let fill: string;
      let stroke: string;
      let textColor: string;

      if (isActive) {
        fill = '#276749';
        stroke = '#9ae6b4';
        textColor = '#9ae6b4';
      } else if (over) {
        fill = '#2d3748';
        stroke = '#718096';
        textColor = '#a0aec0';
      } else {
        fill = '#1a202c';
        stroke = '#4a5568';
        textColor = '#a0aec0';
      }

      display.drawRect(btnX, btnY, SLOT_BTN_W, SLOT_BTN_H, { fill, stroke, lineWidth: 1 });
      display.drawText(SLOT_LABELS[slot], btnX + SLOT_BTN_W / 2, btnY + SLOT_BTN_H / 2, {
        font: '12px monospace', fill: textColor, align: 'center', baseline: 'middle',
      });

      const btnId = `assign_${id}_${slot}`;
      if (stdBtn(btnId, mx, my, btnX, btnY, SLOT_BTN_W, SLOT_BTN_H)) {
        // Toggle off if already active slot — reassign to idle
        const targetSlot: AssignmentSlotId = isActive && slot !== 'idle' ? 'idle' : slot;
        action = { type: 'ASSIGN_CREW', crewId: id, slot: targetSlot };
      }
    }
  }

  // ── Upkeep pressure line ─────────────────────────────────────────────────────
  const upkeepY = ACTIVE_START_Y + Math.max(1, activeList.length) * ACTIVE_ROW_H + 6;
  const activeCount = activeList.length;
  const pressure = Math.max(0, activeCount - 1) * meta.upkeepPerAwakeCrew;
  if (pressure > 0) {
    display.drawText(
      `Current upkeep pressure: +\u20a1${pressure} per billing cycle`,
      PX + PAD,
      upkeepY,
      { font: '15px monospace', fill: '#fc8181', align: 'left', baseline: 'top' },
    );
  } else {
    display.drawText('No upkeep pressure.', PX + PAD, upkeepY, {
      font: '15px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });
  }

  // ── Cryo Pool section — position dynamically below the active area ───────────
  const cryoLabelY = upkeepY + 26;
  const cryoStartY = cryoLabelY + 22;

  display.drawText('IN CRYO', PX + PAD, cryoLabelY, {
    font: '14px monospace', fill: '#4a9eda', align: 'left', baseline: 'top',
  });
  display.drawLine(PX + PAD, cryoLabelY + 16, PX + PW - PAD, cryoLabelY + 16, {
    stroke: '#1a3a5a', lineWidth: 1,
  });

  if (meta.cryoPool.length === 0) {
    display.drawText('Cryo pod is empty.', PX + PAD + 8, cryoStartY + 8, {
      font: '18px monospace', fill: '#4a5568', align: 'left', baseline: 'top',
    });
  }

  const canWake = meta.powerCells >= WAKE_COST_POWER_CELLS;

  for (let i = 0; i < meta.cryoPool.length; i++) {
    const id    = meta.cryoPool[i];
    const crew  = CREW_ROSTER[id];
    const rowY  = cryoStartY + i * CRYO_ROW_H;

    // Name
    display.drawText(crew.name, PX + PAD + 8, rowY + 6, {
      font: 'bold 17px monospace', fill: '#90cdf4', align: 'left', baseline: 'top',
    });
    // Role + passive
    display.drawText(`${crew.role} — ${crew.passiveDesc}`, PX + PAD + 130, rowY + 6, {
      font: '15px monospace', fill: '#4a7a9e', align: 'left', baseline: 'top',
    });

    // [Wake] button with two-click confirmation
    const wbx   = PX + PW - PAD - WAKE_W;
    const wby   = rowY + 8;
    const wOver = isOver(mx, my, wbx, wby, WAKE_W, WAKE_H);
    const isPending = pendingWakeId === id;

    // Reset pending if mouse moves away
    if (isPending && !wOver) {
      pendingWakeId = null;
    }

    const wFill   = !canWake ? '#1a1a1a'
                  : isPending ? '#276749'
                  : wOver    ? '#276749'
                  : '#1a3a2a';
    const wStroke = !canWake ? '#2d3748' : '#276749';
    const wText   = !canWake ? '#4a5568'
                  : isPending ? '#9ae6b4'
                  : '#ffffff';
    const wLabel  = isPending ? 'Confirm?' : '[Wake]';

    display.drawRect(wbx, wby, WAKE_W, WAKE_H, { fill: wFill, stroke: wStroke, lineWidth: 1 });
    display.drawText(wLabel, wbx + WAKE_W / 2, wby + WAKE_H / 2, {
      font: '14px monospace', fill: wText, align: 'center', baseline: 'middle',
    });

    if (canWake) {
      if (input.isMousePressed(0) && wOver) {
        if (isPending) {
          // Second press on same button → fire action on release (handled below)
        } else {
          // First press → mark as pending
          pendingWakeId = id;
        }
      }
      if (input.isMouseReleased(0) && wOver && isPending) {
        action = { type: 'WAKE_CREW', crewId: id };
        pendingWakeId = null;
      }
    }
  }

  // ── Close button ──────────────────────────────────────────────────────────────
  const closeX = PX + PW - PAD - CLOSE_W;
  const closeY = PY + PH - PAD - CLOSE_H;
  const closeHover = isOver(mx, my, closeX, closeY, CLOSE_W, CLOSE_H);
  display.drawRect(closeX, closeY, CLOSE_W, CLOSE_H, {
    fill: closeHover ? '#2d3748' : '#1a202c',
    stroke: '#4a5568',
    lineWidth: 1,
  });
  display.drawText('[Close]', closeX + CLOSE_W / 2, closeY + CLOSE_H / 2, {
    font: '18px monospace', fill: '#a0aec0', align: 'center', baseline: 'middle',
  });
  if (stdBtn('close_cryo', mx, my, closeX, closeY, CLOSE_W, CLOSE_H)) {
    action = { type: 'CLOSE_CRYO' };
    pendingWakeId = null; // reset on close
  }

  return action;
}
