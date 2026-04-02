import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../../types/state';
import { ALL_CARDS } from '../../../content/cards';
import { validateExpeditionReadiness } from '../expedition-validation';
import {
  MetaHubAction,
  LocalDivePrepState,
  ExpeditionErrorState,
  ViewportRect,
} from '../core/types';
import {
  VIEWPORT,
  NAMEPLATE,
  START_BTN,
  START_BTN_SECONDARY,
  RECYCLE_ICON,
  NAV,
  NAV_BTN_W,
  NAV_BTN_H,
  NAV_START_X,
  COLOR,
} from '../core/constants';
import {
  getLocalDivePrep,
  setExpeditionError,
  clearExpeditionError,
  rerollStartingCards,
} from '../core/state';
import { isOver } from '../core/utils';
import { renderElectricitySpark } from './effects';
import { setBounds } from '../../tutorial-bounds';

export function renderNameplate(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  now: number,
  nameplate: ViewportRect,
  viewport: ViewportRect,
  label: string,
  actionType: MetaHubAction,
): MetaHubAction | null {
  const overNameplate = isOver(mx, my, nameplate.x, nameplate.y, nameplate.w, nameplate.h);
  const overViewport = isOver(mx, my, viewport.x, viewport.y, viewport.w, viewport.h);
  const hover = overNameplate || overViewport;

  if (hover) {
    renderElectricitySpark(display, nameplate.x, nameplate.y, nameplate.w, nameplate.h, now, 0.9);
  }

  const centerY = nameplate.y + nameplate.h / 2;
  display.drawText(label, nameplate.x + nameplate.w / 2, centerY, {
    font: 'bold 20px monospace',
    fill: '#000000',
    align: 'center',
    baseline: 'middle',
  });

  if (hover && input.isMouseReleased(0)) {
    return actionType;
  }

  return null;
}

export function renderViewportHover(
  display: typeof MakkoEngine.display,
  mx: number,
  my: number,
  now: number,
  viewport: ViewportRect,
): void {
  const hovered = isOver(mx, my, viewport.x, viewport.y, viewport.w, viewport.h);
  if (hovered) {
    renderElectricitySpark(display, viewport.x, viewport.y, viewport.w, viewport.h, now, 1.5);
  }
}

export function renderNavStrip(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  now: number,
  activeBackground: 'nlc' | 'wlc' = 'nlc',
): MetaHubAction | null {
  // When NLC/LCNP background is active, hide entire left column (no labels, no sparks, no clicks)
  // The artwork has these elements built-in
  if (activeBackground === 'nlc') {
    return null;
  }

  // WLC background: render labels, hover effects, and handle clicks
  display.drawText('Upgrades', NAV_START_X + NAV_BTN_W / 2, 190, {
    font: 'bold 28px monospace',
    fill: '#000000',
    align: 'center',
    baseline: 'middle',
  });

  const buttons = [
    { label: 'VIEW ALL CARDS', action: 'OPEN_CARD_COLLECTION' as const, y: NAV.cardCollection },
    { label: 'RESEARCH', action: 'OPEN_RESEARCH' as const, y: NAV.research },
    { label: 'STATION MODULES', action: 'OPEN_MODULES' as const, y: NAV.stationModules },
    { label: 'CREW', action: 'OPEN_CREW' as const, y: NAV.crew },
    { label: 'SHIPS', action: 'OPEN_SHIPS' as const, y: NAV.ships },
    { label: 'VOID SHOP', action: 'OPEN_VOID_SHOP' as const, y: NAV.voidShop },
    { label: 'VOID COMMUNION', action: 'OPEN_VOID_COMMUNION' as const, y: NAV.voidCommunion },
  ];

  for (const btn of buttons) {
    const hover = isOver(mx, my, NAV_START_X, btn.y, NAV_BTN_W, NAV_BTN_H);

    if (hover) {
      renderElectricitySpark(display, NAV_START_X, btn.y, NAV_BTN_W, NAV_BTN_H, now, 0.8);
    }

    const textY = btn.y + NAV_BTN_H / 2;
    const fontSize = 23;

    display.drawText(btn.label, NAV_START_X + NAV_BTN_W / 2, textY, {
      font: `bold ${fontSize}px monospace`,
      fill: '#000000',
      align: 'center',
      baseline: 'middle',
    });

    if (hover && input.isMouseReleased(0)) {
      return btn.action;
    }
  }

  return null;
}

export function handleRecycleClick(
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  now: number,
  display: typeof MakkoEngine.display,
): void {
  if (!isOver(mx, my, RECYCLE_ICON.x, RECYCLE_ICON.y, RECYCLE_ICON.w, RECYCLE_ICON.h)) {
    return;
  }

  renderElectricitySpark(display, RECYCLE_ICON.x, RECYCLE_ICON.y, RECYCLE_ICON.w, RECYCLE_ICON.h, now, 1.0);

  if (input.isMouseReleased(0)) {
    const starterCards = ALL_CARDS.filter(c => c.rarity === 'starter');
    const shuffled = [...starterCards].sort(() => Math.random() - 0.5);
    rerollStartingCards(shuffled.slice(0, 3).map(c => c.id));
  }
}

export function renderStartButton(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  now: number,
  meta: MetaState,
  expeditionError: ExpeditionErrorState | null,
): MetaHubAction | null {
  const { x, y, w, h } = START_BTN;
  const hover = isOver(mx, my, x, y, w, h);
  const hoverSecondary = isOver(mx, my, START_BTN_SECONDARY.x, START_BTN_SECONDARY.y, START_BTN_SECONDARY.w, START_BTN_SECONDARY.h);
  const hasError = expeditionError?.show ?? false;

  if (hasError) {
    const errorPulse = Math.sin((now % 800) / 800 * Math.PI * 2) * 0.4 + 0.6;
    display.drawRoundRect(x, y, w, h, 12, {
      fill: COLOR.error,
      alpha: 0.15 * errorPulse,
    });
  }

  if (hover) {
    renderElectricitySpark(display, x, y, w, h, now, hasError ? 2.0 : 1.2);
  }

  if (hoverSecondary) {
    // Secondary electric frame above Start Expedition - only on hover
    const { x: sx, y: sy, w: sw, h: sh } = START_BTN_SECONDARY;
    renderElectricitySpark(display, sx, sy, sw, sh, now, hasError ? 2.0 : 1.2);
  }

  // Text removed - background artwork has labels built-in
  // Electric frame and clickability remain functional

  setBounds('start-dive-btn', { x: START_BTN.x, y: START_BTN.y, w: START_BTN.w, h: START_BTN.h });

  // Check secondary frame click first (it's above the main button)
  if (hoverSecondary && input.isMouseReleased(0)) {
    return 'TOGGLE_COMMAND_DECK_BACKGROUND';
  }

  if (hover && input.isMouseReleased(0)) {
    const localDivePrep = getLocalDivePrep();
    if (!localDivePrep) return null;

    const validation = validateExpeditionReadiness(meta, {
      selectedCrewId: localDivePrep.selectedCrewId,
      selectedShipId: localDivePrep.selectedShipId,
      equippedForDive: localDivePrep.equippedForDive,
      selectedCards: localDivePrep.selectedCards,
    });

    if (!validation.valid) {
      setExpeditionError({ show: true, missing: validation.missing });
      return null;
    }

    clearExpeditionError();
    return { type: 'START_DIVE', divePrep: localDivePrep };
  }

  return null;
}
