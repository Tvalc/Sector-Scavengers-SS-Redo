// Research tracks panel — displays research progress and upcoming unlocks

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../../types/state';
import {
  RESEARCH_TRACK_UNLOCKS,
  RESEARCH_THRESHOLDS,
  RESEARCH_DEBT_REDUCTION_BY_LEVEL,
} from '../../progression/research-tracks';
import { ALL_CARDS, TacticCard } from '../../content/cards';
import { HARDWARE_ITEMS } from '../../content/hardware';

const TRACK_NAMES: Record<string, string> = {
  engineering: 'Engineering',
  biology: 'Biology',
  psionics: 'Psionics',
};

const TRACK_COLORS: Record<string, string> = {
  engineering: '#ed8936', // orange
  biology: '#68d391', // green
  psionics: '#9f7aea', // purple
};

const TRACK_BG_COLORS: Record<string, string> = {
  engineering: '#2d1f0f',
  biology: '#1a2f1a',
  psionics: '#2d1f4a',
};

// Card thumbnail dimensions (scaled up for larger layout)
const THUMB_W = 100;
const THUMB_H = 144;
const THUMB_SCALE = THUMB_W / 280;

interface ResearchTrackRow {
  trackId: string;
  name: string;
  points: number;
  currentTier: number;
  nextThreshold: number | null;
  nextUnlocks: { cards: TacticCard[]; hardware: string[] } | null;
  color: string;
}

/** Rarity color mapping for card accents */
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'starter': return '#a0aec0';
    case 'common': return '#48bb78';
    case 'uncommon': return '#63b3ed';
    case 'rare': return '#f6e05e';
    case 'void': return '#9f7aea';
    default: return '#8b9bb4';
  }
}

/** Render a card thumbnail (100x144) */
function renderCardThumbnail(
  display: typeof MakkoEngine.display,
  card: TacticCard,
  x: number,
  y: number,
): void {
  // Rarity accent strip
  const rarityColor = getRarityColor(card.rarity);
  display.drawRect(x - 2, y, THUMB_W + 4, THUMB_H, {
    fill: rarityColor,
    alpha: 0.3,
  });

  // Card background
  display.drawRoundRect(x, y, THUMB_W, THUMB_H, 4, {
    fill: '#e8e4d9',
    stroke: '#8b9bb4',
    lineWidth: 1,
  });

  // Header
  const headerH = 22;
  display.drawRoundRect(x + 4, y + 4, THUMB_W - 8, headerH, 2, {
    fill: '#c5d1e0',
  });
  display.drawRect(x + 4, y + 4 + headerH - 2, THUMB_W - 8, 2, {
    fill: rarityColor,
  });

  // Card name (truncated if needed)
  const nameFont = card.name.length > 12 ? 'bold 14px sans-serif' : 'bold 16px sans-serif';
  display.drawText(card.name.substring(0, 16), x + THUMB_W / 2, y + 4 + headerH / 2, {
    font: nameFont,
    fill: '#2d3748',
    align: 'center',
    baseline: 'middle',
  });

  // Icon area
  const artY = y + 4 + headerH + 5;
  const artH = 56;
  display.drawRoundRect(x + 4, artY, THUMB_W - 8, artH, 2, {
    fill: '#a0aec0',
    alpha: 0.3,
  });

  // Initial icon
  const initial = card.name.charAt(0).toUpperCase();
  display.drawCircle(x + THUMB_W / 2, artY + artH / 2, 12, {
    fill: '#2d3748',
    stroke: rarityColor,
    lineWidth: 1,
  });
  display.drawText(initial, x + THUMB_W / 2, artY + artH / 2, {
    font: 'bold 12px sans-serif',
    fill: rarityColor,
    align: 'center',
    baseline: 'middle',
  });

  // Description area
  const descY = artY + artH + 5;
  display.drawRoundRect(x + 4, descY, THUMB_W - 8, 44, 2, {
    fill: '#f5f3ed',
  });
}

function getResearchRows(meta: MetaState): ResearchTrackRow[] {
  const tracks: ResearchTrackRow[] = [];

  for (const trackId of ['engineering', 'biology', 'psionics'] as const) {
    const points = meta.researchPoints[trackId] ?? 0;
    const currentTier = meta.researchUnlockLevel[trackId] ?? 0;
    const unlocks = RESEARCH_TRACK_UNLOCKS[trackId];

    // Find next threshold
    let nextThreshold: number | null = null;
    let nextUnlocks: { cards: TacticCard[]; hardware: string[] } | null = null;

    if (currentTier < unlocks.length) {
      nextThreshold = unlocks[currentTier].threshold;
      const tierData = unlocks[currentTier];
      nextUnlocks = {
        cards: tierData.cardIds.map(id => {
          const card = ALL_CARDS.find(c => c.id === id);
          return card!;
        }).filter(Boolean),
        hardware: tierData.hardwareIds.map(id => {
          const item = HARDWARE_ITEMS.find(i => i.id === id);
          return item?.name ?? id;
        }),
      };
    }

    tracks.push({
      trackId,
      name: TRACK_NAMES[trackId],
      points,
      currentTier,
      nextThreshold,
      nextUnlocks,
      color: TRACK_COLORS[trackId],
    });
  }

  return tracks;
}

export function renderResearchPanel(
  display: typeof MakkoEngine.display,
  meta: MetaState,
  startX: number,
  startY: number,
  width: number,
): number {
  const rows = getResearchRows(meta);
  const rowHeight = 240; // Much taller for breathing room
  const gap = 28; // Increased gap between rows

  // Header
  display.drawText('RESEARCH TRACKS', startX, startY, {
    font: 'bold 38px monospace',
    fill: '#63b3ed',
    align: 'left',
    baseline: 'top',
  });

  let currentY = startY + 50;

  // Draw each track row
  for (const row of rows) {
    const isMaxed = row.nextThreshold === null;
    const bgColor = isMaxed ? '#1a2f1a' : TRACK_BG_COLORS[row.trackId];

    // Track background card
    display.drawRoundRect(startX, currentY, width, rowHeight, 8, {
      fill: bgColor,
      stroke: isMaxed ? '#f6e05e' : row.color,
      lineWidth: isMaxed ? 3 : 2,
      alpha: 0.6,
    });

    // Track name - larger font
    display.drawText(row.name, startX + 24, currentY + 18, {
      font: 'bold 32px monospace',
      fill: isMaxed ? '#f6e05e' : row.color,
      align: 'left',
      baseline: 'top',
    });

    // Tier badge - larger, 96×36px
    const tierLabel = isMaxed ? '★ MAX' : row.currentTier === 0 ? 'Tier 0' : `Tier ${row.currentTier}`;
    const badgeW = 96;
    const badgeH = 36;
    const badgeColor = isMaxed ? '#f6e05e' : row.color;
    display.drawRoundRect(startX + width - badgeW - 24, currentY + 15, badgeW, badgeH, 4, {
      fill: '#0a0e14',
      stroke: badgeColor,
      lineWidth: 2,
    });
    display.drawText(tierLabel, startX + width - 24 - badgeW / 2, currentY + 15 + badgeH / 2, {
      font: 'bold 28px monospace',
      fill: badgeColor,
      align: 'center',
      baseline: 'middle',
    });

    // Progress bar - 20px height
    const barY = currentY + 70;
    const barWidth = width - 48;
    const barHeight = 20;
    display.drawRoundRect(startX + 24, barY, barWidth, barHeight, 4, {
      fill: '#1a202c',
    });

    if (row.nextThreshold) {
      const progress = Math.min(1, row.points / row.nextThreshold);
      if (progress > 0) {
        display.drawRoundRect(startX + 24, barY, barWidth * progress, barHeight, 4, {
          fill: row.color,
        });
      }
    } else {
      // Maxed out - gold full bar
      display.drawRoundRect(startX + 24, barY, barWidth, barHeight, 4, {
        fill: '#f6e05e',
      });
    }

    // Points text - larger font
    const pointsText = row.nextThreshold
      ? `${row.points} / ${row.nextThreshold} RP`
      : `${row.points} RP (COMPLETE)`;
    display.drawText(pointsText, startX + 24 + barWidth / 2, barY + barHeight / 2, {
      font: 'bold 26px monospace',
      fill: row.nextThreshold ? '#e2e8f0' : '#1a202c',
      align: 'center',
      baseline: 'middle',
    });
    
    // Debt reduction indicator
    const debtReductionY = barY + barHeight + 8;
    const maxLevel = Math.max(
      meta.researchUnlockLevel.engineering ?? 0,
      meta.researchUnlockLevel.biology ?? 0,
      meta.researchUnlockLevel.psionics ?? 0
    );
    const debtReductionPct = Math.round((RESEARCH_DEBT_REDUCTION_BY_LEVEL[maxLevel] ?? 0) * 100);
    
    if (debtReductionPct > 0) {
      display.drawText(`⚡ ${debtReductionPct}% expedition debt reduction (any track)`, startX + 24, debtReductionY, {
        font: '18px monospace',
        fill: '#68d391',
        align: 'left',
        baseline: 'top',
      });
    }

    // Next unlock preview with card thumbnails
    const previewY = barY + barHeight + 28;
    if (row.nextUnlocks && row.nextUnlocks.cards.length > 0) {
      // Label - larger font
      display.drawText('Next unlocks:', startX + 24, previewY, {
        font: '24px monospace',
        fill: '#a0aec0',
        align: 'left',
        baseline: 'top',
      });

      // Card thumbnails (100x144px each)
      let thumbX = startX + 160;
      for (const card of row.nextUnlocks.cards.slice(0, 3)) { // Show up to 3 cards
        renderCardThumbnail(display, card, thumbX, previewY);
        thumbX += THUMB_W + 16;
      }

      // Hardware items text if any - larger font
      if (row.nextUnlocks.hardware.length > 0) {
        const hwText = row.nextUnlocks.hardware.join(', ');
        display.drawText(`+ ${hwText}`, thumbX + 12, previewY + THUMB_H / 2, {
          font: '24px monospace',
          fill: '#68d391',
          align: 'left',
          baseline: 'middle',
        });
      }
    } else if (isMaxed) {
      // Maxed message - larger font
      display.drawText('✓ All research tiers completed', startX + 24, previewY + 30, {
        font: 'bold 28px monospace',
        fill: '#68d391',
        align: 'left',
        baseline: 'top',
      });
    }

    currentY += rowHeight + gap;
  }

  // Return total height used
  return currentY - startY;
}
