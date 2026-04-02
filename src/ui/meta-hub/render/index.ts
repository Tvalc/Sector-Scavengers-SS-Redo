import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../../types/state';
import { MetaHubAction } from '../core/types';
import { VIEWPORT, NAMEPLATE, ERROR_PANEL } from '../core/constants';
import {
  getLocalDivePrep,
  getExpeditionError,
  ensureDivePrepInitialized,
  clearExpeditionError,
} from '../core/state';
import { isOver } from '../core/utils';
import { renderCardPreviews } from './cards';
import { renderProgressOverlay, renderExpeditionErrorPanel } from './panels';
import {
  renderNameplate,
  renderViewportHover,
  renderNavStrip,
  handleRecycleClick,
  renderStartButton,
} from './controls';
import { renderElectricitySpark } from './effects';

export function renderMetaHub(
  meta: MetaState,
  mx: number,
  my: number,
  now: number = Date.now(),
  activeBackground: 'nlc' | 'wlc' = 'nlc',
): { action: MetaHubAction | null } {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: MetaHubAction | null = null;
  const localDivePrep = ensureDivePrepInitialized(meta);

  // Nameplates
  action = renderNameplate(display, input, mx, my, now, NAMEPLATE.ship, VIEWPORT.ship, 'Choose Ship', 'DIVE_PREP_SELECT_SHIP') ?? action;
  action = renderNameplate(display, input, mx, my, now, NAMEPLATE.crew, VIEWPORT.crew, 'Pick Crew', 'DIVE_PREP_SELECT_CREW') ?? action;
  action = renderNameplate(display, input, mx, my, now, NAMEPLATE.hardware, VIEWPORT.hardware, 'Equip Hardware', 'DIVE_PREP_EQUIP_HARDWARE') ?? action;

  // Viewport hover effects
  renderViewportHover(display, mx, my, now, VIEWPORT.ship);
  renderViewportHover(display, mx, my, now, VIEWPORT.crew);
  renderViewportHover(display, mx, my, now, VIEWPORT.hardware);

  // Navigation and card previews
  const navAction = renderNavStrip(display, input, mx, my, now, activeBackground);
  if (navAction) action = navAction;

  renderCardPreviews(display, localDivePrep);

  // Recycle icon
  handleRecycleClick(input, mx, my, now, display);

  // Start button
  const expeditionError = getExpeditionError();
  const startAction = renderStartButton(display, input, mx, my, now, meta, expeditionError);
  if (startAction) action = startAction;

  // Error panel
  if (expeditionError?.show) {
    renderExpeditionErrorPanel(display, expeditionError.missing);
    if (isOver(mx, my, ERROR_PANEL.x, ERROR_PANEL.y, ERROR_PANEL.w, ERROR_PANEL.h) && input.isMouseReleased(0)) {
      clearExpeditionError();
    }
  }

  // Clear error on navigation
  if (action && typeof action === 'string' &&
      action !== 'OPEN_VOID_SHOP' &&
      !action.startsWith('DIVE_PREP_')) {
    clearExpeditionError();
  }

  return { action };
}

export { renderCardPreviews } from './cards';
export { renderProgressOverlay, renderExpeditionErrorPanel } from './panels';
export { renderElectricitySpark } from './effects';
