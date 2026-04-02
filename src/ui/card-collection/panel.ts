// Card Collection Panel - Hero-style layout matching Crew/Modules panels

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../types/state';
import { ALL_CARDS, TacticCard, CardRarity } from '../../content/cards';
import { getCardUnlockInfo } from './unlock-logic';
import { getCardDoctrine } from './doctrine';
import { CardCollectionContext } from './types';
import {
  LEFT_ZONE,
  RIGHT_ZONE,
  ACCENT,
  GOLD,
  SUCCESS,
  ERROR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  BG,
  BG_PANEL,
  BORDER_DEFAULT,
  LOCK_COLOR,
  isOver,
  wrapText,
  renderNavigation,
  renderTopBar,
} from '../panel-layout';
import { renderCard } from '../dive-renderer/cards';
import { CARD_W, CARD_H } from '../dive-renderer/constants';

// ── Doctrine Colors ─────────────────────────────────────────────────────────
const DOCTRINE_COLORS: Record<string, string> = {
  corporate: '#22d3ee',    // cyan
  cooperative: '#68d391',  // green
  smuggler: '#f6ad55',     // gold
  void: '#9f7aea',         // purple
  neutral: '#a0aec0',      // gray
};

const RARITY_COLORS: Record<CardRarity, string> = {
  starter: '#a0aec0',
  common: '#48bb78',
  uncommon: '#63b3ed',
  rare: '#f6e05e',
};

const RARITY_LABELS: Record<CardRarity, string> = {
  starter: 'STARTER',
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
};

// ── State ────────────────────────────────────────────────────────────────────
let currentCardPage = 0;

/** Reset the card collection page when opening the panel. */
export function resetCardCollectionPage(): void {
  currentCardPage = 0;
}

// ── Main Render Function ────────────────────────────────────────────────────

export function renderCardCollectionPanel(
  meta: MetaState,
  mx: number,
  my: number,
  context: CardCollectionContext = 'meta',
): 'CLOSED' | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let result: 'CLOSED' | null = null;

  // Full screen clear
  display.clear(BG);

  // Determine which cards to show based on context
  const cardsToShow = context === 'meta'
    ? ALL_CARDS
    : ALL_CARDS.filter(c => meta.unlockedCards.includes(c.id));

  // Ensure page is in valid range
  const totalCards = cardsToShow.length;
  currentCardPage = Math.max(0, Math.min(currentCardPage, totalCards - 1));

  const currentCard = cardsToShow[currentCardPage];
  const unlockInfo = getCardUnlockInfo(currentCard.id, meta);
  const doctrine = getCardDoctrine(currentCard.id);

  // ── Top Bar ─────────────────────────────────────────────────────────────────
  const topAction = renderTopBar(
    display,
    input,
    mx,
    my,
    context === 'meta' ? 'CARD COLLECTION' : 'TACTICS DECK',
    currentCardPage,
    totalCards,
    { pageLabel: 'Card' }
  );
  if (topAction === 'CLOSE') {
    result = 'CLOSED';
  }

  // ── Left Zone: Large Card Visual ────────────────────────────────────────
  renderLeftZone(display, currentCard, unlockInfo);

  // ── Right Zone: Card Details & Unlock Info ────────────────────────────────
  renderRightZone(display, currentCard, unlockInfo, doctrine);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navAction = renderNavigation(display, input, mx, my, currentCardPage, totalCards);
  if (navAction !== null) {
    currentCardPage = navAction;
  }

  // ── Keyboard Input ─────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    result = 'CLOSED';
  }

  return result;
}

// ── Left Zone Renderer ───────────────────────────────────────────────────────

function renderLeftZone(
  display: typeof MakkoEngine.display,
  card: TacticCard,
  unlockInfo: ReturnType<typeof getCardUnlockInfo>,
): void {
  // Background panel
  display.drawRect(LEFT_ZONE.x, LEFT_ZONE.y, LEFT_ZONE.w, LEFT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  // Render large card (no decorative frame behind it)
  const cardX = LEFT_ZONE.x + 30 + (LEFT_ZONE.w - 60 - CARD_W) / 2;
  const cardY = LEFT_ZONE.y + 50 + (520 - CARD_H) / 2;

  const isLocked = !unlockInfo.unlocked && unlockInfo.hidden;
  renderCard(display, card, cardX, cardY, false, isLocked, false, 0, false, undefined, CARD_W, CARD_H);

  // Card count at bottom
  const countY = cardY + CARD_H + 50;

  display.drawText(
    `${currentCardPage + 1} of ${ALL_CARDS.length}`,
    LEFT_ZONE.x + LEFT_ZONE.w / 2,
    countY,
    {
      font: 'bold 32px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    }
  );
}

// ── Right Zone Renderer ────────────────────────────────────────────────────

function renderRightZone(
  display: typeof MakkoEngine.display,
  card: TacticCard,
  unlockInfo: ReturnType<typeof getCardUnlockInfo>,
  doctrine: string,
): void {
  // Background panel
  display.drawRect(RIGHT_ZONE.x, RIGHT_ZONE.y, RIGHT_ZONE.w, RIGHT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  let y = RIGHT_ZONE.y + 40;

  const doctrineColor = unlockInfo.doctrineAlignment
    ? DOCTRINE_COLORS[unlockInfo.doctrineAlignment]
    : DOCTRINE_COLORS.neutral;

  // ── Card Name ─────────────────────────────────────────────────────────────
  display.drawText(card.name.toUpperCase(), RIGHT_ZONE.x + 40, y, {
    font: 'bold 56px monospace',
    fill: unlockInfo.unlocked ? doctrineColor : LOCK_COLOR,
    align: 'left',
    baseline: 'top',
  });
  y += 70;

  // ── Faction Badge ─────────────────────────────────────────────────────────
  if (doctrine !== 'neutral') {
    const badgeW = 160;
    const badgeH = 36;
    const badgeX = RIGHT_ZONE.x + 40;

    display.drawRoundRect(badgeX, y, badgeW, badgeH, 6, {
      fill: '#0f172a',
      stroke: doctrineColor,
      lineWidth: 2,
    });
    display.drawText(
      doctrine.toUpperCase(),
      badgeX + badgeW / 2,
      y + badgeH / 2,
      {
        font: 'bold 24px monospace',
        fill: doctrineColor,
        align: 'center',
        baseline: 'middle',
      }
    );
  }

  // Rarity badge on right
  const rarityBadgeW = 140;
  const rarityBadgeH = 36;
  const rarityBadgeX = RIGHT_ZONE.x + RIGHT_ZONE.w - rarityBadgeW - 40;

  display.drawRoundRect(rarityBadgeX, y, rarityBadgeW, rarityBadgeH, 6, {
    fill: '#0f172a',
    stroke: RARITY_COLORS[card.rarity],
    lineWidth: 2,
  });
  display.drawText(
    RARITY_LABELS[card.rarity],
    rarityBadgeX + rarityBadgeW / 2,
    y + rarityBadgeH / 2,
    {
      font: 'bold 24px monospace',
      fill: RARITY_COLORS[card.rarity],
      align: 'center',
      baseline: 'middle',
    }
  );
  y += 60;

  // ── Description Section ───────────────────────────────────────────────────
  display.drawText('DESCRIPTION', RIGHT_ZONE.x + 40, y, {
    font: 'bold 28px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  const descLines = wrapText(card.description, RIGHT_ZONE.w - 80, '28px monospace');
  for (const line of descLines) {
    display.drawText(line, RIGHT_ZONE.x + 60, y, {
      font: '28px monospace',
      fill: unlockInfo.unlocked ? TEXT_PRIMARY : TEXT_SECONDARY,
      align: 'left',
      baseline: 'top',
    });
    y += 34;
  }
  y += 40;

  // ── Unlock Status Section ────────────────────────────────────────────────
  display.drawText('STATUS', RIGHT_ZONE.x + 40, y, {
    font: 'bold 28px monospace',
    fill: TEXT_MUTED,
    align: 'left',
    baseline: 'top',
  });
  y += 40;

  // Status badge
  const statusBadgeW = 200;
  const statusBadgeH = 48;
  const statusBadgeX = RIGHT_ZONE.x + 40;

  if (unlockInfo.unlocked) {
    display.drawRoundRect(statusBadgeX, y, statusBadgeW, statusBadgeH, 8, {
      fill: '#0f3a2a',
      stroke: SUCCESS,
      lineWidth: 2,
    });
    display.drawText('✓ UNLOCKED', statusBadgeX + statusBadgeW / 2, y + statusBadgeH / 2, {
      font: 'bold 28px monospace',
      fill: SUCCESS,
      align: 'center',
      baseline: 'middle',
    });
  } else {
    display.drawRoundRect(statusBadgeX, y, statusBadgeW, statusBadgeH, 8, {
      fill: '#1a202c',
      stroke: LOCK_COLOR,
      lineWidth: 2,
    });
    display.drawText('🔒 LOCKED', statusBadgeX + statusBadgeW / 2, y + statusBadgeH / 2, {
      font: 'bold 28px monospace',
      fill: LOCK_COLOR,
      align: 'center',
      baseline: 'middle',
    });
  }
  y += 70;

  // ── Unlock Requirements (if locked) ───────────────────────────────────────
  if (!unlockInfo.unlocked) {
    display.drawText('HOW TO UNLOCK', RIGHT_ZONE.x + 40, y, {
      font: 'bold 28px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    y += 40;

    // Requirement box
    const reqBoxW = RIGHT_ZONE.w - 80;
    const reqBoxH = unlockInfo.progress ? 120 : 80;

    display.drawRoundRect(RIGHT_ZONE.x + 40, y - 10, reqBoxW, reqBoxH, 8, {
      fill: '#0f172a',
      stroke: BORDER_DEFAULT,
      lineWidth: 2,
    });

    // Requirement text
    const reqLines = wrapText(unlockInfo.unlockRequirement, reqBoxW - 40, '26px monospace');
    let reqY = y + 15;
    for (const line of reqLines.slice(0, 2)) {
      display.drawText(line, RIGHT_ZONE.x + 60, reqY, {
        font: '26px monospace',
        fill: TEXT_SECONDARY,
        align: 'left',
        baseline: 'top',
      });
      reqY += 28;
    }

    // Progress bar if applicable
    if (unlockInfo.progress) {
      reqY += 10;

      // Progress label
      display.drawText(`Progress: ${unlockInfo.progress}`, RIGHT_ZONE.x + 60, reqY, {
        font: '24px monospace',
        fill: TEXT_MUTED,
        align: 'left',
        baseline: 'top',
      });
      reqY += 30;

      // Progress bar background
      const barW = reqBoxW - 80;
      const barH = 12;
      display.drawRoundRect(RIGHT_ZONE.x + 60, reqY, barW, barH, 4, {
        fill: '#1a202c',
        stroke: BORDER_DEFAULT,
        lineWidth: 1,
      });

      // Parse progress for bar fill
      const progressMatch = unlockInfo.progress.match(/(\d+)\/(\d+)/);
      if (progressMatch) {
        const current = parseInt(progressMatch[1], 10);
        const total = parseInt(progressMatch[2], 10);
        const fillRatio = Math.min(1, current / total);
        const fillW = (barW - 4) * fillRatio;

        if (fillW > 0) {
          display.drawRoundRect(RIGHT_ZONE.x + 62, reqY + 2, fillW, barH - 4, 2, {
            fill: doctrineColor,
          });
        }
      }
    }

    y += reqBoxH + 30;
  }

  // ── Card ID / Debug info at bottom (subtle) ─────────────────────────────
  y = Math.max(y, RIGHT_ZONE.y + RIGHT_ZONE.h - 60);

  display.drawText(`ID: ${card.id}`, RIGHT_ZONE.x + 40, y, {
    font: '18px monospace',
    fill: '#334155',
    align: 'left',
    baseline: 'top',
  });
}

// resetCardCollectionPage is already exported at the top of the file
