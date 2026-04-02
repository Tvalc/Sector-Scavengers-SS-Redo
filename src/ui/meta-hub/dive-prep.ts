// Dive Preparation UI — Re-export stub (refactored to dive-prep/ folder)
// All implementation moved to src/ui/meta-hub/dive-prep/

export {
  DivePrepAction,
  renderDivePrepSection,
  renderDivePrepExpanded,
  resetDivePrepPagination,
  resetDivePrepExpandedPage,
  getDivePrepSectionBounds,
  formatHardwareEffect,
  renderPaginationControls,
  renderSectionBackground,
  DOCTRINE_COLORS,
  SLOTS,
  SLOT_ICONS,
  SLOT_LABELS,
  EXPANDED_TOTAL_PAGES,
  EXPANDED_PAGE_TITLES,
} from './dive-prep/index';

export {
  renderCrewSection,
  renderShipSection,
  renderHardwareSection,
  renderHandSection,
} from './dive-prep/sections';

export {
  renderExpandedCrew,
  renderExpandedShip,
  renderExpandedHardware,
  renderExpandedHand,
} from './dive-prep/expanded';

export {
  CONTENT_X, CONTENT_Y, CONTENT_W, CONTENT_H,
  SECTION_W, SECTION_H, SECTION_GAP_X, SECTION_GAP_Y,
  CREW_X, CREW_Y, SHIP_X, SHIP_Y, HARDWARE_X, HARDWARE_Y, HAND_X, HAND_Y,
} from './dive-prep/constants';

export {
  resetDivePrepPagination as resetPagination,
  resetDivePrepExpandedPage as resetExpandedPage,
} from './dive-prep/state';
