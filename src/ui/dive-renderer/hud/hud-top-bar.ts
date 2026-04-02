import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../../types/state';
import { setBounds } from '../../tutorial-bounds';
import { ROOM_X, ROOM_W, ROOM_Y } from '../constants';
import {
  isLogOverlayVisible,
  toggleLogOverlay,
  isStatusOverlayVisible,
  toggleStatusOverlay,
} from '../state';

// Track button press state
let logBtnPressed = false;
let statusBtnPressed = false;

/** Render the main HUD elements (zone+round, hull, credits, shield, log/status buttons) */
export function renderTopBarHud(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  run: RunState,
  hudRightX: number,
  hudAlpha: number,
): boolean {
  const topY = 10;
  let logClicked = false;

  // Top-center: Zone name combined with round info
  const zoneNames: Record<string, string> = {
    'salvage': 'SALVAGE',
    'signal': 'SIGNAL',
    'cache': 'CACHE',
    'audit': 'AUDIT',
    'boss': 'BOSS',
  };
  const currentNodeType = run.nodeMap[run.round - 1] || 'salvage';
  const zoneName = zoneNames[currentNodeType] || 'SALVAGE';
  const zoneAndRound = `${zoneName} — Round ${run.round}/${run.maxRounds}`;
  
  display.drawText(zoneAndRound, ROOM_X + ROOM_W / 2, topY + 5, {
    font: 'bold 16px monospace',
    fill: '#22d3ee',
    align: 'center',
    baseline: 'top',
    alpha: hudAlpha,
  });
  setBounds('rounds-display', { x: ROOM_X + ROOM_W / 2 - 150, y: topY, w: 300, h: 30 });

  // Status button - to the left of log button
  const statusBtnX = hudRightX - 365;
  const statusBtnY = topY;
  const statusBtnW = 70;
  const statusBtnH = 30;

  const mx = input.mouseX;
  const my = input.mouseY;
  const statusBtnHover = mx >= statusBtnX && mx <= statusBtnX + statusBtnW && my >= statusBtnY && my <= statusBtnY + statusBtnH;

  display.drawRoundRect(statusBtnX, statusBtnY, statusBtnW, statusBtnH, 4, {
    fill: isStatusOverlayVisible() ? '#2d3748' : (statusBtnHover ? '#2d3748' : '#1a202c'),
    stroke: statusBtnHover ? '#90cdf4' : '#4a5568',
    lineWidth: statusBtnHover ? 2 : 1,
    alpha: hudAlpha,
  });
  display.drawText('STATUS', statusBtnX + statusBtnW / 2, statusBtnY + statusBtnH / 2, {
    font: '11px monospace',
    fill: statusBtnHover ? '#ffffff' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
    alpha: hudAlpha,
  });

  // Log button - to the left of Hull
  const logBtnX = hudRightX - 280;
  const logBtnY = topY;
  const logBtnW = 60;
  const logBtnH = 30;
  const logBtnHover = mx >= logBtnX && mx <= logBtnX + logBtnW && my >= logBtnY && my <= logBtnY + logBtnH;
  
  // Draw log button
  display.drawRoundRect(logBtnX, logBtnY, logBtnW, logBtnH, 4, {
    fill: logBtnHover ? '#2d3748' : '#1a202c',
    stroke: '#4a5568',
    lineWidth: 1,
    alpha: hudAlpha,
  });
  display.drawText('LOG', logBtnX + logBtnW / 2, logBtnY + logBtnH / 2, {
    font: '12px monospace',
    fill: logBtnHover ? '#ffffff' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
    alpha: hudAlpha,
  });

  // Handle button clicks (both status and log)
  if (input.isMousePressed(0)) {
    if (logBtnHover) logBtnPressed = true;
    if (statusBtnHover) statusBtnPressed = true;
  }
  if (input.isMouseReleased(0)) {
    if (logBtnPressed && logBtnHover) {
      toggleLogOverlay();
      logClicked = true;
    }
    if (statusBtnPressed && statusBtnHover) {
      toggleStatusOverlay();
    }
    logBtnPressed = false;
    statusBtnPressed = false;
  }

  // Hull status - HIDDEN: players must use diagnostic cards to know hull
  // Only show warning indicators at critical thresholds
  let hullIndicator = '';
  let hullIndicatorColor = '#68d391';

  // Only reveal rough status bands, never exact numbers
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

  display.drawText(`Hull: ${hullIndicator}`, hudRightX - 180, topY, {
    font: 'bold 16px monospace',
    fill: hullIndicatorColor,
    align: 'left',
    baseline: 'top',
    alpha: hudAlpha,
  });
  setBounds('hull-display', { x: hudRightX - 180, y: topY, w: 150, h: 30 });

  // Shield charges
  if (run.shieldCharges > 0) {
    display.drawText(`Shield: ${run.shieldCharges}`, hudRightX - 180, topY + 28, {
      font: '14px monospace',
      fill: '#90cdf4',
      align: 'left',
      baseline: 'top',
      alpha: hudAlpha,
    });
  }

  // Salvage inventory - show rough quantities only (not exact values)
  const scrapCount = run.salvage.find(s => s.tier === 'scrap')?.quantity ?? 0;
  const compCount = run.salvage.find(s => s.tier === 'components')?.quantity ?? 0;
  const relicCount = run.salvage.find(s => s.tier === 'relic')?.quantity ?? 0;

  // Convert to rough indicators instead of exact counts
  const scrapIndicator = scrapCount === 0 ? '' : scrapCount <= 3 ? '•' : scrapCount <= 8 ? '••' : '•••';
  const compIndicator = compCount === 0 ? '' : compCount <= 2 ? '◆' : compCount <= 5 ? '◆◆' : '◆◆◆';
  const relicIndicator = relicCount === 0 ? '' : '★';

  const indicators: string[] = [];
  if (scrapIndicator) indicators.push(`Scrap ${scrapIndicator}`);
  if (compIndicator) indicators.push(`Comp ${compIndicator}`);
  if (relicIndicator) indicators.push(`Relic ${relicIndicator}`);

  if (indicators.length > 0) {
    display.drawText(indicators.join(' | '), hudRightX - 180, topY + 48, {
      font: '12px monospace',
      fill: '#a0aec0',
      align: 'left',
      baseline: 'top',
      alpha: hudAlpha,
    });
  }

  return logClicked;
}
