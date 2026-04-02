// Dive Preparation UI — Refactored Module
// Organized by: types, constants, state, layout, pagination, sections, expanded views

export type { DivePrepAction } from './types';

export {
  CONTENT_X, CONTENT_Y, CONTENT_W, CONTENT_H,
  SECTION_W, SECTION_H, SECTION_GAP_X, SECTION_GAP_Y,
  CREW_X, CREW_Y, SHIP_X, SHIP_Y, HARDWARE_X, HARDWARE_Y, HAND_X, HAND_Y,
  DOCTRINE_COLORS, SLOTS, SLOT_ICONS, SLOT_LABELS,
  EXPANDED_TOTAL_PAGES, EXPANDED_PAGE_TITLES,
} from './constants';

export {
  resetDivePrepPagination,
  resetDivePrepExpandedPage,
} from './state';

export { renderSectionBackground } from './layout';
export { renderPaginationControls } from './pagination';
export { formatHardwareEffect, getDivePrepSectionBounds } from './utils';

export {
  renderCrewSection,
  renderShipSection,
  renderHardwareSection,
  renderHandSection,
} from './sections';

export {
  renderDivePrepExpanded,
  renderExpandedCrew,
  renderExpandedShip,
  renderExpandedHardware,
  renderExpandedHand,
} from './expanded';

// ── Main Orchestrator ───────────────────────────────────────────────────────

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../types/state';
import { DivePrepAction } from './types';
import { renderCrewSection, renderShipSection, renderHardwareSection, renderHandSection } from './sections';

export function renderDivePrepSection(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  now: number,
): DivePrepAction | null {
  const input = MakkoEngine.input;
  let action: DivePrepAction | null = null;

  const crewAction = renderCrewSection(display, input, meta, divePrep, mx, my, now);
  if (crewAction) action = crewAction;

  const shipAction = renderShipSection(display, input, meta, divePrep, mx, my, now);
  if (shipAction) action = shipAction;

  const hwAction = renderHardwareSection(display, input, meta, divePrep, mx, my, now);
  if (hwAction) action = hwAction;

  const handAction = renderHandSection(display, input, meta, divePrep, mx, my, now);
  if (handAction) action = handAction;

  return action;
}
