// Expanded Dive Prep View Renderer

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState, ShipNodeType } from '../../../../types/state';
import { ACCENT, TEXT_SECONDARY, TEXT_MUTED, BORDER_DEFAULT, SUCCESS, WARNING, ERROR } from '../../../panel-layout';
import { isOver } from '../../../panel-layout';
import { EXPANDED_PAGE_TITLES, EXPANDED_TOTAL_PAGES } from '../constants';
import { getExpandedPage, setExpandedPage, decrementExpandedPage, incrementExpandedPage } from '../state';
import { DivePrepAction } from '../types';
import { renderExpandedCrew } from './crew';
import { renderExpandedShip } from './ship';
import { renderExpandedHardware } from './hardware';
import { renderExpandedHand } from './hand';

export function renderDivePrepExpanded(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  now: number,
): { action: DivePrepAction | null; close: boolean } {
  const input = MakkoEngine.input;
  let action: DivePrepAction | null = null;
  let close = false;

  // Full screen dark background
  display.drawRect(0, 0, 1920, 1080, { fill: '#0a0e14', alpha: 0.95 });

  const currentPage = getExpandedPage();

  // Top bar
  display.drawText(EXPANDED_PAGE_TITLES[currentPage], 960, 60, {
    font: 'bold 48px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'middle',
  });

  display.drawText(`Step ${currentPage + 1} of ${EXPANDED_TOTAL_PAGES}`, 40, 60, {
    font: '28px monospace',
    fill: TEXT_SECONDARY,
    align: 'left',
    baseline: 'middle',
  });

  // Path expedition note
  display.drawText('HULL AND SHIELDS CARRY BETWEEN SHIPS. ENERGY RESETS EACH SHIP.', 960, 1020, {
    font: '14px monospace',
    fill: TEXT_MUTED,
    align: 'center',
    baseline: 'middle',
  });

  // Debt summary panel at top right
  renderDebtSummary(display, meta, divePrep, 1400, 100);

  // Close button
  const closeX = 1800;
  const closeY = 35;
  const closeW = 100;
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
    close = true;
  }

  // Navigation
  const navY = 1000;
  const btnW = 80;
  const btnH = 50;
  const leftX = 880;
  const rightX = 1040;

  // Left arrow
  const leftHover = isOver(mx, my, leftX, navY, btnW, btnH);
  display.drawRoundRect(leftX, navY, btnW, btnH, 6, {
    fill: leftHover ? '#1e293b' : '#0f172a',
    stroke: currentPage > 0 ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText('◀', leftX + btnW / 2, navY + btnH / 2, {
    font: 'bold 28px monospace',
    fill: currentPage > 0 ? ACCENT : TEXT_MUTED,
    align: 'center',
    baseline: 'middle',
  });

  if (leftHover && input.isMouseReleased(0) && currentPage > 0) {
    decrementExpandedPage();
  }

  // Right arrow
  const rightHover = isOver(mx, my, rightX, navY, btnW, btnH);
  display.drawRoundRect(rightX, navY, btnW, btnH, 6, {
    fill: rightHover ? '#1e293b' : '#0f172a',
    stroke: currentPage < EXPANDED_TOTAL_PAGES - 1 ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText('▶', rightX + btnW / 2, navY + btnH / 2, {
    font: 'bold 22px monospace',
    fill: currentPage < EXPANDED_TOTAL_PAGES - 1 ? ACCENT : TEXT_MUTED,
    align: 'center',
    baseline: 'middle',
  });

  if (rightHover && input.isMouseReleased(0) && currentPage < EXPANDED_TOTAL_PAGES - 1) {
    incrementExpandedPage();
  }

  // Content area
  const contentY = 120;
  const contentH = 840;

  const setAction = (a: DivePrepAction) => { action = a; };

  switch (currentPage) {
    case 0:
      renderExpandedCrew(display, input, meta, divePrep, mx, my, contentY, contentH, setAction);
      break;
    case 1:
      renderExpandedShip(display, input, meta, divePrep, mx, my, contentY, contentH, setAction);
      break;
    case 2:
      renderExpandedHardware(display, input, meta, divePrep, mx, my, contentY, contentH, setAction);
      break;
    case 3:
      renderExpandedHand(display, input, meta, divePrep, mx, my, now, contentY, contentH, setAction);
      break;
  }

  return { action, close };
}

// ===== Debt Summary Panel =====

import { getDebtModifiers, formatDebt } from '../../../../dive/expedition-starting-debt';
import { EXPEDITION_DEBT_BASE, EXPEDITION_DEBT_PER_CREW, SHIP_DEBT_MULTIPLIER } from '../../../../config/constants';

function renderDebtSummary(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  divePrep: DivePrepState,
  x: number,
  y: number,
): void {
  // Determine ship type multiplier based on selection (default to standard)
  const shipType: ShipNodeType = 'standard'; // In a full implementation, this would come from divePrep
  
  // Calculate debt modifiers
  const modifiers = getDebtModifiers(meta, shipType);

  const panelW = 480;
  const panelH = 340;

  // Panel background
  display.drawRoundRect(x, y, panelW, panelH, 12, {
    fill: '#0f172a',
    stroke: ACCENT,
    lineWidth: 2,
  });

  // Header
  display.drawText('ESTIMATED STARTING DEBT', x + panelW / 2, y + 20, {
    font: 'bold 18px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'top',
  });

  let rowY = y + 55;
  const lineH = 26;
  const labelX = x + 20;
  const valueX = x + panelW - 20;

  // Base
  display.drawText('Base debt', labelX, rowY, {
    font: '14px monospace',
    fill: TEXT_SECONDARY,
    align: 'left',
    baseline: 'top',
  });
  display.drawText(formatDebt(modifiers.base), valueX, rowY, {
    font: 'bold 14px monospace',
    fill: '#ffffff',
    align: 'right',
    baseline: 'top',
  });
  rowY += lineH;

  // Crew
  if (modifiers.crewCount > 0) {
    display.drawText(`+ Crew (${modifiers.crewCount} × ${formatDebt(EXPEDITION_DEBT_PER_CREW)})`, labelX, rowY, {
      font: '14px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });
    display.drawText(`+${formatDebt(modifiers.crewCost)}`, valueX, rowY, {
      font: 'bold 14px monospace',
      fill: WARNING,
      align: 'right',
      baseline: 'top',
    });
    rowY += lineH;
  }

  // Ship multiplier
  if (modifiers.shipMultiplier !== 1.0) {
    const multiplierText = `× Ship type (${modifiers.shipMultiplier}x)`;
    display.drawText(multiplierText, labelX, rowY, {
      font: '14px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });
    const multiplierColor = modifiers.shipMultiplier > 1.0 ? WARNING : SUCCESS;
    display.drawText(`×${modifiers.shipMultiplier}`, valueX, rowY, {
      font: 'bold 14px monospace',
      fill: multiplierColor,
      align: 'right',
      baseline: 'top',
    });
    rowY += lineH;
  }

  // Subtotal before reductions
  display.drawText('Subtotal', labelX, rowY, {
    font: 'bold 14px monospace',
    fill: TEXT_SECONDARY,
    align: 'left',
    baseline: 'top',
  });
  display.drawText(formatDebt(modifiers.subtotalAfterShipMultiplier), valueX, rowY, {
    font: 'bold 14px monospace',
    fill: '#ffffff',
    align: 'right',
    baseline: 'top',
  });
  rowY += lineH + 8;

  // Research reduction
  if (modifiers.researchReductionAmount > 0) {
    display.drawText(`− Research (${Math.round(modifiers.researchReductionPct * 100)}%)`, labelX, rowY, {
      font: '14px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'top',
    });
    display.drawText(`−${formatDebt(modifiers.researchReductionAmount)}`, valueX, rowY, {
      font: 'bold 14px monospace',
      fill: SUCCESS,
      align: 'right',
      baseline: 'top',
    });
    rowY += lineH;
  }

  // Module reduction
  if (modifiers.moduleReductionAmount > 0) {
    display.drawText('− Modules', labelX, rowY, {
      font: '14px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'top',
    });
    display.drawText(`−${formatDebt(modifiers.moduleReductionAmount)}`, valueX, rowY, {
      font: 'bold 14px monospace',
      fill: SUCCESS,
      align: 'right',
      baseline: 'top',
    });
    rowY += lineH;
  }

  // Assignment reduction
  if (modifiers.assignmentReductionAmount > 0) {
    display.drawText('− Crew assignments', labelX, rowY, {
      font: '14px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'top',
    });
    display.drawText(`−${formatDebt(modifiers.assignmentReductionAmount)}`, valueX, rowY, {
      font: 'bold 14px monospace',
      fill: SUCCESS,
      align: 'right',
      baseline: 'top',
    });
    rowY += lineH;
  }

  // Divider
  rowY += 4;
  display.drawLine(x + 20, rowY, x + panelW - 20, rowY, {
    stroke: BORDER_DEFAULT,
    lineWidth: 1,
  });
  rowY += 12;

  // Final debt
  const finalColor = modifiers.minimumEnforced ? WARNING : '#ffffff';
  display.drawText('ESTIMATED STARTING DEBT', labelX, rowY, {
    font: 'bold 16px monospace',
    fill: ACCENT,
    align: 'left',
    baseline: 'top',
  });
  display.drawText(formatDebt(modifiers.finalDebt), valueX, rowY, {
    font: 'bold 24px monospace',
    fill: finalColor,
    align: 'right',
    baseline: 'top',
  });
  rowY += 30;

  // Minimum warning
  if (modifiers.minimumEnforced) {
    display.drawText('(Minimum debt: ₡500k)', x + panelW / 2, rowY, {
      font: '12px monospace',
      fill: WARNING,
      align: 'center',
      baseline: 'top',
    });
  }

  // Debt ceiling info
  rowY += 20;
  const ceilingPercent = modifiers.finalDebt / 10000000;
  const ceilingColor = ceilingPercent > 0.7 ? ERROR : ceilingPercent > 0.5 ? WARNING : SUCCESS;
  display.drawText(`Distance to ceiling: ${formatDebt(10000000 - modifiers.finalDebt)}`, x + panelW / 2, rowY, {
    font: '12px monospace',
    fill: ceilingColor,
    align: 'center',
    baseline: 'top',
  });
}

export { renderExpandedCrew } from './crew';
export { renderExpandedShip } from './ship';
export { renderExpandedHardware } from './hardware';
export { renderExpandedHand } from './hand';
