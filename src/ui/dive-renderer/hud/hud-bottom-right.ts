import { MakkoEngine } from '@makko/engine';
import { RunState, RunPath } from '../../../types/state';
import {
  isLogOverlayVisible,
  toggleLogOverlay,
  isStatusOverlayVisible,
  toggleStatusOverlay,
} from '../state';
import { DiveAction } from '../types';

// Track button press state
let logBtnPressed = false;
let statusBtnPressed = false;
let freshStartBtnPressed = false;
let surgicalBtnPressed = false;
let desperateBtnPressed = false;

export interface BottomRightHudResult {
  logClicked: boolean;
  statusClicked: boolean;
  action: DiveAction | null;
}

/** Bottom Right HUD - Consolidated deck zones and status panel */
export function renderBottomRightHud(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  run: RunState,
  runPath: RunPath | null,
  alpha: number,
): BottomRightHudResult {
  const BASE_X = 1540;
  const BASE_Y = 740;
  const COL_WIDTH = 160;
  let logClicked = false;
  let statusClicked = false;
  let action: DiveAction | null = null;

  const mx = input.mouseX;
  const my = input.mouseY;

  // ── LEFT COLUMN: Ship Progress & Status ───────────────────────────────────
  let y = BASE_Y;

  // Ship Progress (only on expedition)
  if (runPath) {
    const visitedCount = runPath.nodes.filter(n => n.visited).length;
    const currentShipNum = visitedCount + (runPath.currentNodeId && !runPath.nodes.find(n => n.id === runPath.currentNodeId)?.visited ? 1 : 0);
    
    display.drawText('PROGRESS', BASE_X, y, {
      font: '10px monospace',
      fill: '#94a3b8',
      align: 'left',
      baseline: 'top',
      alpha: alpha * 0.7,
    });
    
    display.drawText(`Ship ${currentShipNum}/6`, BASE_X, y + 14, {
      font: 'bold 18px monospace',
      fill: '#22d3ee',
      align: 'left',
      baseline: 'top',
      alpha,
    });
    y += 50;
  }

  // Hull Status - show exact value if revealed, obfuscated status otherwise
  let hullIndicator = '';
  let hullIndicatorColor = '#68d391';
  
  if (run.exactHullRevealed) {
    // Show exact hull value
    const maxHull = 100 + (run.maxHullBonus || 0);
    hullIndicator = `${run.hull}/${maxHull}`;
    if (run.hull <= 25) hullIndicatorColor = '#ef4444';
    else if (run.hull <= 50) hullIndicatorColor = '#f59e0b';
    else if (run.hull <= 75) hullIndicatorColor = '#f6e05e';
    else hullIndicatorColor = '#68d391';
  } else {
    // Show obfuscated status
    if (run.hull <= 25) {
      hullIndicator = '⚠ CRITICAL';
      hullIndicatorColor = '#ef4444';
    } else if (run.hull <= 50) {
      hullIndicator = '⚠ DAMAGED';
      hullIndicatorColor = '#f59e0b';
    } else if (run.hull <= 75) {
      hullIndicator = 'STRESSED';
      hullIndicatorColor = '#f6e05e';
    } else {
      hullIndicator = 'STABLE';
      hullIndicatorColor = '#68d391';
    }
  }

  display.drawText('HULL', BASE_X, y, {
    font: '10px monospace',
    fill: '#94a3b8',
    align: 'left',
    baseline: 'top',
    alpha: alpha * 0.7,
  });
  
  display.drawText(hullIndicator, BASE_X, y + 14, {
    font: run.exactHullRevealed ? 'bold 16px monospace' : 'bold 14px monospace',
    fill: hullIndicatorColor,
    align: 'left',
    baseline: 'top',
    alpha,
  });
  
  // Show scan hint if hull not revealed
  if (!run.exactHullRevealed) {
    display.drawText('(scan for exact)', BASE_X + 75, y + 16, {
      font: '9px monospace',
      fill: '#64748b',
      align: 'left',
      baseline: 'top',
      alpha: alpha * 0.6,
    });
  }
  
  y += 45;

  // Shield Charges
  if (run.shieldCharges > 0) {
    display.drawText('SHIELD', BASE_X, y, {
      font: '10px monospace',
      fill: '#94a3b8',
      align: 'left',
      baseline: 'top',
      alpha: alpha * 0.7,
    });
    
    display.drawText(`${run.shieldCharges}`, BASE_X, y + 14, {
      font: 'bold 16px monospace',
      fill: '#90cdf4',
      align: 'left',
      baseline: 'top',
      alpha,
    });
    y += 40;
  }

  // Energy Section with Reserve Burn indicator
  const isAtMaxEnergy = run.energy >= run.maxEnergy;
  const reserveBurnReady = isAtMaxEnergy && run.reserveBurnAvailable;
  
  // Reserve Burn indicator (appears above energy when at max)
  if (reserveBurnReady) {
    display.drawText('RESERVE BURN', BASE_X, y, {
      font: 'bold 10px monospace',
      fill: '#22d3ee',
      align: 'left',
      baseline: 'top',
      alpha: alpha * 0.9,
    });
    y += 14;
  } else {
    display.drawText('ENERGY', BASE_X, y, {
      font: '10px monospace',
      fill: '#94a3b8',
      align: 'left',
      baseline: 'top',
      alpha: alpha * 0.7,
    });
  }
  
  // Energy pips with glow effect when filled
  const pipSize = 12;
  const pipGap = 3;
  let x = BASE_X;
  for (let i = 0; i < run.maxEnergy; i++) {
    const isFilled = i < run.energy;
    if (isFilled) {
      // Glowing cyan for filled pips
      const glowIntensity = reserveBurnReady ? 1.0 : 0.7;
      display.drawRoundRect(x, y + 14, pipSize, pipSize, 3, {
        fill: '#22d3ee',
        alpha: alpha * glowIntensity,
      });
      // Add glow effect for reserve burn
      if (reserveBurnReady) {
        display.drawRoundRect(x - 1, y + 13, pipSize + 2, pipSize + 2, 4, {
          stroke: '#22d3ee',
          lineWidth: 1,
          alpha: alpha * 0.3,
        });
      }
    } else {
      display.drawRoundRect(x, y + 14, pipSize, pipSize, 3, {
        fill: '#1e293b',
        stroke: '#334155',
        lineWidth: 1,
        alpha,
      });
    }
    x += pipSize + pipGap;
  }
  
  // Corporate bonus indicator if active
  if (run.energySpentThisRound >= 3 && run.doctrineLocked === 'corporate') {
    display.drawText('⚡+1000₡', x + 5, y + 18, {
      font: 'bold 10px monospace',
      fill: '#22d3ee',
      align: 'left',
      baseline: 'middle',
      alpha: alpha * 0.8,
    });
  }
  
  y += 35;

  // ── RIGHT COLUMN: Buttons ────────────────────────────────────────────────
  const BTN_X = BASE_X + COL_WIDTH + 20;
  const BTN_W = 90;
  const BTN_H = 32;
  let btnY = BASE_Y;

  // Status Button
  const statusHover = mx >= BTN_X && mx <= BTN_X + BTN_W && my >= btnY && my <= btnY + BTN_H;
  display.drawRoundRect(BTN_X, btnY, BTN_W, BTN_H, 4, {
    fill: isStatusOverlayVisible() ? '#2d3748' : (statusHover ? '#2d3748' : '#1a202c'),
    stroke: statusHover ? '#90cdf4' : '#4a5568',
    lineWidth: statusHover ? 2 : 1,
    alpha,
  });
  display.drawText('STATUS', BTN_X + BTN_W / 2, btnY + BTN_H / 2, {
    font: '12px monospace',
    fill: statusHover ? '#ffffff' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
    alpha,
  });
  btnY += BTN_H + 10;

  // Log Button
  const logHover = mx >= BTN_X && mx <= BTN_X + BTN_W && my >= btnY && my <= btnY + BTN_H;
  display.drawRoundRect(BTN_X, btnY, BTN_W, BTN_H, 4, {
    fill: isLogOverlayVisible() ? '#2d3748' : (logHover ? '#2d3748' : '#1a202c'),
    stroke: logHover ? '#90cdf4' : '#4a5568',
    lineWidth: logHover ? 2 : 1,
    alpha,
  });
  display.drawText('LOG', BTN_X + BTN_W / 2, btnY + BTN_H / 2, {
    font: '12px monospace',
    fill: logHover ? '#ffffff' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
    alpha,
  });
  btnY += BTN_H + 10;

  // ── REDRAW BUTTONS (3-modal system) ───────────────────────────────────
  
  // FRESH START: 1⚡, full redraw, once/round
  const canFreshStart = !run.redrawUsedThisRound && run.energy >= 1 && run.hand.length > 0;
  const freshHover = mx >= BTN_X && mx <= BTN_X + BTN_W && my >= btnY && my <= btnY + BTN_H;
  
  display.drawRoundRect(BTN_X, btnY, BTN_W, BTN_H, 4, {
    fill: canFreshStart ? (freshHover ? '#2d3748' : '#1a202c') : '#0f172a',
    stroke: canFreshStart ? (freshHover ? '#22d3ee' : '#4a5568') : '#1e293b',
    lineWidth: freshHover ? 2 : 1,
    alpha: canFreshStart ? alpha : alpha * 0.3,
  });
  display.drawText('FRESH', BTN_X + BTN_W / 2, btnY + BTN_H / 2 - 4, {
    font: '11px monospace',
    fill: canFreshStart ? (freshHover ? '#22d3ee' : '#a0aec0') : '#475569',
    align: 'center',
    baseline: 'middle',
    alpha: canFreshStart ? alpha : alpha * 0.3,
  });
  display.drawText('START', BTN_X + BTN_W / 2, btnY + BTN_H / 2 + 7, {
    font: '11px monospace',
    fill: canFreshStart ? (freshHover ? '#22d3ee' : '#a0aec0') : '#475569',
    align: 'center',
    baseline: 'middle',
    alpha: canFreshStart ? alpha : alpha * 0.3,
  });
  
  // Energy cost badge
  if (canFreshStart) {
    display.drawText('-1⚡', BTN_X + BTN_W - 6, btnY + 4, {
      font: '9px monospace',
      fill: '#22d3ee',
      align: 'right',
      baseline: 'top',
      alpha: alpha * 0.9,
    });
  }
  
  // Hover tooltip
  if (freshHover) {
    display.drawText('New 3-card hand', BTN_X + BTN_W + 10, btnY + BTN_H / 2, {
      font: '11px monospace',
      fill: '#a0aec0',
      align: 'left',
      baseline: 'middle',
      alpha: alpha * 0.8,
    });
  }
  
  btnY += BTN_H + 6;

  // SURGICAL: 1⚡, discard 1 draw 1, unlimited
  const canSurgical = run.energy >= 1 && run.hand.length > 0;
  const surgicalHover = mx >= BTN_X && mx <= BTN_X + BTN_W && my >= btnY && my <= btnY + BTN_H;
  
  display.drawRoundRect(BTN_X, btnY, BTN_W, BTN_H, 4, {
    fill: canSurgical ? (surgicalHover ? '#2d3748' : '#1a202c') : '#0f172a',
    stroke: canSurgical ? (surgicalHover ? '#f59e0b' : '#4a5568') : '#1e293b',
    lineWidth: surgicalHover ? 2 : 1,
    alpha: canSurgical ? alpha : alpha * 0.3,
  });
  display.drawText('SURGICAL', BTN_X + BTN_W / 2, btnY + BTN_H / 2, {
    font: '11px monospace',
    fill: canSurgical ? (surgicalHover ? '#f59e0b' : '#a0aec0') : '#475569',
    align: 'center',
    baseline: 'middle',
    alpha: canSurgical ? alpha : alpha * 0.3,
  });
  
  // Energy cost badge
  if (canSurgical) {
    display.drawText('-1⚡', BTN_X + BTN_W - 6, btnY + 4, {
      font: '9px monospace',
      fill: '#f59e0b',
      align: 'right',
      baseline: 'top',
      alpha: alpha * 0.9,
    });
  }
  
  // Hover tooltip
  if (surgicalHover) {
    display.drawText('Discard 1, Draw 1', BTN_X + BTN_W + 10, btnY + BTN_H / 2, {
      font: '11px monospace',
      fill: '#a0aec0',
      align: 'left',
      baseline: 'middle',
      alpha: alpha * 0.8,
    });
  }
  
  btnY += BTN_H + 6;

  // DESPERATE: -5 HP, full redraw, unlimited (always available)
  const desperateHover = mx >= BTN_X && mx <= BTN_X + BTN_W && my >= btnY && my <= btnY + BTN_H;
  
  display.drawRoundRect(BTN_X, btnY, BTN_W, BTN_H, 4, {
    fill: desperateHover ? '#2d3748' : '#1a202c',
    stroke: desperateHover ? '#ef4444' : '#4a5568',
    lineWidth: desperateHover ? 2 : 1,
    alpha,
  });
  display.drawText('DESPERATE', BTN_X + BTN_W / 2, btnY + BTN_H / 2 - 4, {
    font: '11px monospace',
    fill: desperateHover ? '#ef4444' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
    alpha,
  });
  display.drawText('SCRAMBLE', BTN_X + BTN_W / 2, btnY + BTN_H / 2 + 7, {
    font: '11px monospace',
    fill: desperateHover ? '#ef4444' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
    alpha,
  });
  
  // HP cost badge (always shown in red)
  display.drawText('-5 HP', BTN_X + BTN_W - 6, btnY + 4, {
    font: '9px monospace',
    fill: '#ef4444',
    align: 'right',
    baseline: 'top',
    alpha: alpha * 0.9,
  });
  
  // Hover tooltip
  if (desperateHover) {
    display.drawText('Hull damage for fresh hand', BTN_X + BTN_W + 10, btnY + BTN_H / 2, {
      font: '11px monospace',
      fill: '#a0aec0',
      align: 'left',
      baseline: 'middle',
      alpha: alpha * 0.8,
    });
  }
  
  btnY += BTN_H + 10;

  // ── Hardware Cooldown Indicators ─────────────────────────────────────────
  // Small cooldown display below redraw buttons
  const hwSlots: Array<{ slot: 'hull' | 'scanner' | 'utility'; label: string }> = [
    { slot: 'hull', label: 'HULL' },
    { slot: 'scanner', label: 'SCAN' },
    { slot: 'utility', label: 'UTIL' },
  ];
  
  let hwX = BTN_X;
  for (const hw of hwSlots) {
    const cooldown = run.hardwareCooldowns[hw.slot];
    if (cooldown > 0) {
      // Show cooldown number
      display.drawRoundRect(hwX, btnY, 28, 20, 3, {
        fill: '#1a202c',
        stroke: '#ef4444',
        lineWidth: 1,
        alpha: alpha * 0.8,
      });
      display.drawText(`${cooldown}`, hwX + 14, btnY + 10, {
        font: 'bold 12px monospace',
        fill: '#ef4444',
        align: 'center',
        baseline: 'middle',
        alpha,
      });
    } else {
      // Show ready indicator
      display.drawRoundRect(hwX, btnY, 28, 20, 3, {
        fill: '#1a202c',
        stroke: '#22d3ee',
        lineWidth: 1,
        alpha: alpha * 0.5,
      });
      display.drawText('✓', hwX + 14, btnY + 10, {
        font: '12px monospace',
        fill: '#22d3ee',
        align: 'center',
        baseline: 'middle',
        alpha: alpha * 0.7,
      });
    }
    hwX += 32;
  }

  // Handle clicks
  if (input.isMousePressed(0)) {
    if (logHover) logBtnPressed = true;
    if (statusHover) statusBtnPressed = true;
    if (freshHover && canFreshStart) freshStartBtnPressed = true;
    if (surgicalHover && canSurgical) surgicalBtnPressed = true;
    if (desperateHover) desperateBtnPressed = true;
  }
  
  if (input.isMouseReleased(0)) {
    if (logBtnPressed && logHover) {
      toggleLogOverlay();
      logClicked = true;
    }
    if (statusBtnPressed && statusHover) {
      toggleStatusOverlay();
      statusClicked = true;
    }
    if (freshStartBtnPressed && freshHover && canFreshStart) {
      action = { type: 'FRESH_START_REDRAW' };
    }
    if (surgicalBtnPressed && surgicalHover && canSurgical) {
      // Surgical requires selecting a card to discard - this needs UI support
      // For now, we trigger the action and the game will handle card selection
      action = { type: 'SURGICAL_DISCARD', cardIndex: 0 }; // Default to first card
    }
    if (desperateBtnPressed && desperateHover) {
      action = { type: 'DESPERATE_SCRAMBLE' };
    }
    
    logBtnPressed = false;
    statusBtnPressed = false;
    freshStartBtnPressed = false;
    surgicalBtnPressed = false;
    desperateBtnPressed = false;
  }

  return { logClicked, statusClicked, action };
}
