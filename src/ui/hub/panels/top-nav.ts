import { MakkoEngine } from '@makko/engine';
import { HubTab } from '../types';
import { isOver } from '../helpers';
import { setBounds } from '../../tutorial-bounds';
import { isInteractionAllowed } from '../tutorial';
import { TABS_START_X, TAB_W, TABS_Y, TAB_GAP } from '../constants';
import type { TutorialInteraction } from '../../../tutorial/tutorial-context';

interface TabConfig {
  id: HubTab;
  label: string;
  tutorialId: 'crew' | 'overview' | 'secondary';
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', tutorialId: 'overview' },
  { id: 'crew-modules', label: 'Crew and Modules', tutorialId: 'crew' },
  { id: 'secondary', label: 'Systems', tutorialId: 'secondary' },
];

/** Render top navigation tabs */
export function renderTopNav(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  activeTab: HubTab,
  mx: number,
  my: number,
  lockedInteraction?: TutorialInteraction,
  now: number = Date.now(),
  tutorialActive: boolean = false,
): HubTab | null {
  let clickedTab: HubTab | null = null;

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const tx = TABS_START_X + i * TAB_GAP;

    const result = renderTab(display, input, tab, activeTab, mx, my, tx, lockedInteraction, now);
    if (result.clicked) clickedTab = result.clicked;

    // Register bounds for tutorial highlighting
    const textMetrics = display.measureText(tab.label, { font: 'bold 28px monospace' });
    const textWidth = textMetrics.width;
    setBounds(`tab-${tab.tutorialId}`, {
      x: tx + TAB_W / 2 - textWidth / 2 - 10,
      y: TABS_Y - 5,
      w: textWidth + 20,
      h: 60,
    });
  }

  return clickedTab;
}

interface TabRenderResult {
  clicked: HubTab | null;
}

function renderTab(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  tab: TabConfig,
  activeTab: HubTab,
  mx: number,
  my: number,
  tx: number,
  lockedInteraction: TutorialInteraction | undefined,
  now: number,
): TabRenderResult {
  const isActive = activeTab === tab.id;
  const isLocked = lockedInteraction && !isInteractionAllowed({ type: 'hub-tab', id: tab.tutorialId }, lockedInteraction);
  const isTarget = lockedInteraction?.type === 'hub-tab' && lockedInteraction.id === tab.tutorialId;
  const hovered = !isLocked && isOver(mx, my, tx, TABS_Y, TAB_W, 40);

  renderTabLabel(display, tab.label, tx, isActive, isLocked, isTarget, hovered, now);
  renderTabUnderline(display, tx, isActive);

  let clicked: HubTab | null = null;
  if (hovered && input.isMouseReleased(0)) clicked = tab.id;

  return { clicked };
}

function renderTabLabel(
  display: typeof MakkoEngine.display,
  label: string,
  tx: number,
  isActive: boolean,
  isLocked: boolean,
  isTarget: boolean,
  isHovered: boolean,
  now: number,
): void {
  if (isLocked) {
    display.drawText(label, tx + TAB_W / 2, TABS_Y + 25, {
      font: 'bold 28px monospace', fill: '#4a5568', align: 'center', baseline: 'middle',
    });
  } else if (isTarget) {
    const pulse = Math.sin((now % 1000) / 1000 * Math.PI * 2) * 0.5 + 0.5;
    display.drawText(label, tx + TAB_W / 2, TABS_Y + 25, {
      font: 'bold 28px monospace',
      fill: pulse > 0.5 ? '#22d3ee' : '#63b3ed',
      align: 'center', baseline: 'middle',
    });
  } else {
    display.drawText(label, tx + TAB_W / 2, TABS_Y + 25, {
      font: isActive ? 'bold 28px monospace' : 'bold 28px monospace',
      fill: isActive ? '#22d3ee' : isHovered ? '#a0aec0' : '#718096',
      align: 'center', baseline: 'middle',
    });
  }
}

function renderTabUnderline(
  display: typeof MakkoEngine.display,
  tx: number,
  isActive: boolean,
): void {
  if (isActive) {
    display.drawLine(tx + 20, TABS_Y + 45, tx + TAB_W - 20, TABS_Y + 45, {
      stroke: '#22d3ee', lineWidth: 4,
    });
  }
}
