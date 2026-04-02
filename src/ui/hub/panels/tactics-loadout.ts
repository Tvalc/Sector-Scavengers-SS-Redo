import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../../types/state';
import { ALL_CARDS } from '../../../content/cards';
import { LEFT_PANEL_X, LEFT_PANEL_W, CARD_W, CARD_H, CARD_GAP, CARDS_Y } from '../constants';
import { renderCard } from '../../dive-renderer/cards';
import { setBounds } from '../../tutorial-bounds';

let cardCollectionOpen = false;
let refreshSeed = 0;

export function isCardCollectionOpen(): boolean {
  return cardCollectionOpen;
}

export function toggleCardCollection(): void {
  cardCollectionOpen = !cardCollectionOpen;
}

export function closeCardCollection(): void {
  cardCollectionOpen = false;
}

/** Get 3 random unlocked cards for display */
function getDisplayCards(meta: MetaState, seed: number): string[] {
  const unlocked = meta.unlockedCards.length > 0 
    ? meta.unlockedCards 
    : ['scavenge', 'repair', 'extract'];
  
  // Shuffle based on seed
  const shuffled = [...unlocked];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (Math.floor(Math.random() * (i + 1)) + seed) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

/** Render tactics loadout with 3 cards and refresh button */
export function renderTacticsLoadout(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  tutorialActive: boolean = false,
  mx: number = 0,
  my: number = 0,
): 'OPEN_CARD_COLLECTION' | null {
  const startX = tutorialActive ? LEFT_PANEL_X + LEFT_PANEL_W + 60 : LEFT_PANEL_X + LEFT_PANEL_W + 80;
  const displayCards = getDisplayCards(meta, refreshSeed);

  // Render 3 cards
  for (let i = 0; i < displayCards.length; i++) {
    const cx = startX + i * (CARD_W + CARD_GAP);
    const isHovered = mx >= cx && mx <= cx + CARD_W && my >= CARDS_Y && my <= CARDS_Y + CARD_H;

    const card = ALL_CARDS.find(c => c.id === displayCards[i]);
    if (card) {
      renderCard(display, card, cx, CARDS_Y, isHovered, false, false, Date.now(), false, undefined, CARD_W, CARD_H);
    }
  }

  // Set bounds for tutorial highlighting
  if (displayCards.length > 0) {
    const lastCardX = startX + (displayCards.length - 1) * (CARD_W + CARD_GAP);
    setBounds('tactics-loadout', {
      x: startX,
      y: CARDS_Y,
      w: lastCardX + CARD_W - startX,
      h: CARD_H,
    });
  }

  // Refresh button
  const refreshBtnX = startX + 3 * (CARD_W + CARD_GAP) + 20;
  const refreshBtnY = CARDS_Y + CARD_H / 2 - 20;
  const refreshHover = mx >= refreshBtnX && mx <= refreshBtnX + 100 &&
                       my >= refreshBtnY && my <= refreshBtnY + 40;

  renderRefreshButton(display, refreshBtnX, refreshBtnY, refreshHover);

  if (refreshHover && MakkoEngine.input.isMouseReleased(0)) {
    refreshSeed = Date.now();
  }

  // View All button
  const viewAllBtnX = refreshBtnX;
  const viewAllBtnY = refreshBtnY + 50;
  const viewAllHover = mx >= viewAllBtnX && mx <= viewAllBtnX + 100 &&
                       my >= viewAllBtnY && my <= viewAllBtnY + 40;

  renderViewAllButton(display, viewAllBtnX, viewAllBtnY, viewAllHover);

  if (viewAllHover && MakkoEngine.input.isMouseReleased(0)) {
    return 'OPEN_CARD_COLLECTION';
  }

  return null;
}

function renderRefreshButton(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  isHovered: boolean,
): void {
  display.drawRoundRect(x, y, 100, 40, 6, {
    fill: isHovered ? '#1e3a5f' : '#0e3a5f',
    stroke: '#63b3ed',
    lineWidth: 2,
  });
  display.drawText('↻ REFRESH', x + 50, y + 20, {
    font: 'bold 16px monospace',
    fill: '#ffffff',
    align: 'center',
    baseline: 'middle',
  });
}

function renderViewAllButton(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  isHovered: boolean,
): void {
  display.drawRoundRect(x, y, 100, 40, 6, {
    fill: isHovered ? '#2d3748' : '#1a202c',
    stroke: '#4a5568',
    lineWidth: 2,
  });
  display.drawText('VIEW ALL', x + 50, y + 20, {
    font: 'bold 16px monospace',
    fill: isHovered ? '#ffffff' : '#a0aec0',
    align: 'center',
    baseline: 'middle',
  });
}
