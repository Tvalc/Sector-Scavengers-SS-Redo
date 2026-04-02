import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../types/state';
import { HubTab, HubAction } from './types';
import type { TutorialInteraction } from '../../tutorial/tutorial-context';

import { PADDING, LEFT_PANEL_X, LEFT_PANEL_W } from './constants';
import { getRouteX, getRouteW } from './layout';
import { isInteractionAllowed } from './tutorial';
import { renderCenterPanel, renderStationSchematic } from './panels/center-panel';
import { renderLeftPanel } from './panels/left-panel';
import { renderTacticsLoadout, isCardCollectionOpen, toggleCardCollection, closeCardCollection } from './panels/tactics-loadout';
import { renderTopNav } from './panels/top-nav';
import { renderCrewModulesTab } from './crew-modules-tab';
import { renderSecondaryTab } from './secondary-tab';

export { HubTab, HubAction } from './types';
export { isInteractionAllowed } from './tutorial';
export { isCardCollectionOpen, toggleCardCollection, closeCardCollection } from './panels/tactics-loadout';

/**
 * Render the hub.
 *
 * Overview tab  → holographic route map is the hero (original design).
 * Crew/Ships tabs → center area replaced with that tab's content.
 * Left panel and bottom tactics loadout are always visible.
 */
export function renderHub(
  meta: MetaState,
  activeTab: HubTab,
  mx: number,
  my: number,
  showContractBanner: boolean = false,
  lockedInteraction?: TutorialInteraction,
  now: number = Date.now(),
  tutorialActive: boolean = false,
): { action: HubAction | null; tabClicked: HubTab | null } {
  const display = MakkoEngine.display;

  // ── Background ────────────────────────────────────────────────────────────
  renderBackground(display);

  // ── Center: tab content switches here ────────────────────────────────────
  let tabAction: HubAction | null = null;
  const routeX = getRouteX();
  const routeW = getRouteW(tutorialActive);

  if (activeTab === 'overview') {
    renderStationSchematic(display, meta, mx, my, now, routeX, routeW);
  } else if (activeTab === 'crew-modules') {
    renderCenterPanel(display, routeX, routeW);
    tabAction = renderCrewModulesTab(meta, mx, my, routeX, routeW);
  } else if (activeTab === 'secondary') {
    renderCenterPanel(display, routeX, routeW);
    tabAction = renderSecondaryTab(meta, mx, my, routeX, routeW);
  }

  // ── Left panel (status + actions) ────────────────────────────────────────
  const leftAction = renderLeftPanel(display, MakkoEngine.input, meta, mx, my, lockedInteraction, now);

  // ── Bottom tactics loadout ───────────────────────────────────────────────
  const collectionAction = renderTacticsLoadout(display, meta, tutorialActive, mx, my);

  // ── Top nav tabs ──────────────────────────────────────────────────────────
  const tabClicked = renderTopNav(display, MakkoEngine.input, activeTab, mx, my, lockedInteraction, now, tutorialActive);

  const action = leftAction ?? tabAction ?? collectionAction;
  return { action, tabClicked };
}

function renderBackground(display: typeof MakkoEngine.display): void {
  display.clear('#0d1117');

  for (let x = 0; x < 1920; x += 100) {
    display.drawLine(x, 0, x, 1080, { stroke: '#1a202c', lineWidth: 1 });
  }
  for (let y = 0; y < 1080; y += 100) {
    display.drawLine(0, y, 1920, y, { stroke: '#1a202c', lineWidth: 1 });
  }
}
