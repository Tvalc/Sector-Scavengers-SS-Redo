import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../../types/state';
import { MODULE_DEFS } from '../../../content/modules';
import { SHIP_DEFS } from '../../../content/ships';
import { CREW_ROSTER } from '../../../content/crew';
import { renderResearchPanel } from '../research-panel';
import { ROUTE_H, ROUTE_Y } from '../constants';

/** Plain framed background for non-overview tabs (replaces the holographic display) */
export function renderCenterPanel(
  display: typeof MakkoEngine.display,
  x: number,
  width: number,
): void {
  display.drawRect(x, ROUTE_Y, width, ROUTE_H, {
    fill: '#0a0e14',
    stroke: '#2d3748',
    lineWidth: 1,
  });
}

/** Render station schematic visualization for overview tab */
export function renderStationSchematic(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  mx: number,
  my: number,
  now: number,
  routeX: number,
  width: number,
): void {
  // Frame with station schematic styling
  display.drawRect(routeX, ROUTE_Y, width, ROUTE_H, {
    fill: '#0a0e14',
    stroke: '#22d3ee',
    lineWidth: 2,
    alpha: 0.8,
  });

  // Pulsing outer glow
  const pulse = Math.sin((now % 2000) / 2000 * Math.PI * 2) * 0.5 + 0.5;
  display.drawRect(routeX - 2, ROUTE_Y - 2, width + 4, ROUTE_H + 4, {
    stroke: '#22d3ee',
    lineWidth: 1,
    alpha: 0.1 + pulse * 0.1,
  });

  // Section header - 24px font for consistency
  display.drawText('STATION SCHEMATIC', routeX + 20, ROUTE_Y + 20, {
    font: 'bold 36px monospace',
    fill: '#63b3ed',
    align: 'left',
    baseline: 'top',
  });

  renderModuleGrid(display, meta, routeX, width, now);
  renderFleetSection(display, meta, routeX, width, now);
  renderResearchSection(display, meta, routeX, width);
}

function renderModuleGrid(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  routeX: number,
  width: number,
  now: number,
): void {
  const roomW = (width - 60) / 3;
  const roomH = 100;
  const gapX = 15;
  const gapY = 15;
  const startX = routeX + 30;
  const startY = ROUTE_Y + 60;

  for (let i = 0; i < MODULE_DEFS.length; i++) {
    const mod = MODULE_DEFS[i];
    const level = meta.moduleLevels[mod.id] ?? 0;
    const isBuilt = level > 0;
    const col = i % 3;
    const row = Math.floor(i / 3);
    const rx = startX + col * (roomW + gapX);
    const ry = startY + row * (roomH + gapY);

    if (isBuilt) {
      // Pulsing glow for built modules
      const roomPulse = Math.sin((now % 3000 + i * 500) / 3000 * Math.PI * 2) * 0.3 + 0.7;
      display.drawRect(rx, ry, roomW, roomH, {
        fill: '#1a2d4a',
        stroke: '#22d3ee',
        lineWidth: 2,
        alpha: roomPulse,
      });
      display.drawRect(rx + 3, ry + 3, roomW - 6, roomH - 6, { fill: '#0d1a2e' });
    } else {
      // Unbuilt - dim outline
      display.drawRect(rx, ry, roomW, roomH, {
        fill: '#0a0f14',
        stroke: '#2d3748',
        lineWidth: 1,
        alpha: 0.5,
      });
    }

    // Module name
    const nameColor = isBuilt ? '#22d3ee' : '#4a5568';
    display.drawText(mod.name.toUpperCase(), rx + roomW / 2, ry + 25, {
      font: 'bold 26px monospace',
      fill: nameColor,
      align: 'center',
      baseline: 'middle',
    });

    // Status line
    if (isBuilt) {
      const desc = mod.upgrades[level - 1]?.description ?? '';
      const truncatedDesc = desc.substring(0, 20) + (desc.length > 20 ? '...' : '');
      display.drawText(`Lv${level}: ${truncatedDesc}`, rx + roomW / 2, ry + 55, {
        font: '24px monospace',
        fill: '#a0aec0',
        align: 'center',
        baseline: 'middle',
      });
    } else {
      display.drawText('— OFFLINE —', rx + roomW / 2, ry + 55, {
        font: '24px monospace',
        fill: '#4a5568',
        align: 'center',
        baseline: 'middle',
      });
    }
  }
}

function renderFleetSection(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  routeX: number,
  width: number,
  now: number,
): void {
  const roomH = 100;
  const gapY = 15;
  const startY = ROUTE_Y + 60;
  const fleetY = startY + 3 * (roomH + gapY) + 20;
  const claimedShips = meta.ships.filter((s) => s.status === 'claimed');

  if (claimedShips.length === 0) return;

  display.drawLine(routeX + 30, fleetY, routeX + width - 30, fleetY, {
    stroke: '#2d3748',
    lineWidth: 1,
  });

  display.drawText('STATION FLEET', routeX + 30, fleetY + 15, {
    font: 'bold 28px monospace',
    fill: '#63b3ed',
    align: 'left',
    baseline: 'top',
  });

  let shipX = routeX + 30;
  for (const ship of claimedShips) {
    const shipDef = SHIP_DEFS.find((s) => s.id === ship.id);
    if (!shipDef) continue;

    const captainName = ship.captainedBy ? CREW_ROSTER[ship.captainedBy]?.name : null;
    const shipLabel = captainName ? `${shipDef.name} (${captainName})` : shipDef.name;

    // Ship badge
    display.drawRect(shipX, fleetY + 40, 200, 40, {
      fill: '#1a2d2a',
      stroke: '#48bb78',
      lineWidth: 2,
    });
    display.drawText(shipLabel, shipX + 100, fleetY + 60, {
      font: '24px monospace',
      fill: '#68d391',
      align: 'center',
      baseline: 'middle',
    });

    shipX += 220;
  }
}

function renderResearchSection(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  routeX: number,
  width: number,
): void {
  const roomH = 100;
  const gapY = 15;
  const startY = ROUTE_Y + 60;
  const claimedShips = meta.ships.filter((s) => s.status === 'claimed');
  const fleetY = startY + 3 * (roomH + gapY) + 20;
  const researchY = claimedShips.length > 0 ? fleetY + 100 : fleetY + 20;

  display.drawLine(routeX + 30, researchY - 10, routeX + width - 30, researchY - 10, {
    stroke: '#2d3748',
    lineWidth: 1,
  });
  renderResearchPanel(display, meta, routeX + 30, researchY, width - 60);
}
