import { LEFT_PANEL_X, LEFT_PANEL_W, PADDING, SCREEN_W, ROUTE_Y, TABS_Y, TAB_W } from './constants';

// Legacy exports for compatibility with existing tab files
export { ROUTE_Y as RP_Y };
export const TAB_H = 40;
export const RP_CONTENT_X = LEFT_PANEL_X + LEFT_PANEL_W + 60;

/** Compute route panel X position based on left panel width */
export function getRouteX(): number {
  return LEFT_PANEL_X + LEFT_PANEL_W + 40;
}

/** Compute route panel width based on remaining screen space */
export function getRouteW(tutorialActive: boolean = false): number {
  const rightMargin = tutorialActive ? 100 : PADDING;
  return SCREEN_W - getRouteX() - rightMargin;
}
