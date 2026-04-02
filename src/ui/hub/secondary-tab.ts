import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../types/state';
import { HubAction } from './types';
import { RP_CONTENT_X, RP_Y, TAB_H } from './layout';
import { isOver } from './helpers';
import { renderShipPanelAt } from '../ship-panel';
import { setBounds } from '../tutorial-bounds';

export function renderSecondaryTab(
  meta: MetaState,
  mx: number,
  my: number,
  routeX: number = 280,
  routeW: number = 1300,
  bannerOffset: number = 0,
): HubAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let clicked: HubAction | null = null;

  const cY = RP_Y + TAB_H + 20 + bannerOffset;
  const contentX = routeX + 30;
  const navW = 520;
  const navH = 52;
  const navGap = 12;

  // Section header - 24px font for consistency
  display.drawText('SHIP SYSTEMS', contentX, cY, {
    font: 'bold 24px monospace', fill: '#63b3ed', align: 'left', baseline: 'top',
  });

  // ── Void Communion button ─────────────────────────────────────────────────
  const vcY = cY + 50;
  const vcHover = isOver(mx, my, contentX, vcY, navW, navH);
  display.drawRoundRect(contentX, vcY, navW, navH, 6, {
    fill: vcHover ? '#2d1f4e' : '#1a1030',
    stroke: vcHover ? '#9f7aea' : '#4a3f6b',
    lineWidth: 2,
  });
  display.drawText('✦ Void Communion', contentX + navW / 2, vcY + navH / 2, {
    font: 'bold 20px monospace', fill: vcHover ? '#d6bcfa' : '#9f7aea', align: 'center', baseline: 'middle',
  });
  if (vcHover && input.isMouseReleased(0)) clicked = 'OPEN_VOID_COMMUNION';
  setBounds('void-communion-nav', { x: contentX, y: vcY, w: navW, h: navH });

  // ── Hardware button ───────────────────────────────────────────────────────
  const hwY = vcY + navH + navGap;
  const hwHover = isOver(mx, my, contentX, hwY, navW, navH);
  const hasEquipped = Object.values(meta.equippedItems).some((v) => v !== null);
  const hwLabel = hasEquipped ? '⚙ Hardware  (equipped)' : '⚙ Hardware';
  display.drawRoundRect(contentX, hwY, navW, navH, 6, {
    fill: hwHover ? '#3d2000' : '#1a1000',
    stroke: hwHover ? '#ed8936' : '#7b4a1e',
    lineWidth: 2,
  });
  display.drawText(hwLabel, contentX + navW / 2, hwY + navH / 2, {
    font: 'bold 20px monospace', fill: hwHover ? '#fbd38d' : '#ed8936', align: 'center', baseline: 'middle',
  });
  if (hwHover && input.isMouseReleased(0)) clicked = 'OPEN_HARDWARE';
  setBounds('hardware-nav', { x: contentX, y: hwY, w: navW, h: navH });

  // ── Ship panel ────────────────────────────────────────────────────────────
  const shipHeadY = hwY + navH + navGap + 10;
  setBounds('secondary-nav-buttons', { x: contentX, y: cY + 50, w: navW, h: hwY + navH - (cY + 50) });

  // Full ship panel action area (rendered at the computed position)
  const shipAction = renderShipPanelAt(meta, mx, my, contentX, shipHeadY);
  if (shipAction !== null) clicked = shipAction;
  // Ship panel actual dimensions: PW=800, PH=480 with padding
  setBounds('ships-section', { x: contentX, y: shipHeadY, w: Math.min(800, routeW - 60), h: 480 });

  return clicked;
}
