// Research Panel — full-screen hero-style layout for research tracks.
// Uses single-panel progression: stepper at top, current tier content prominently displayed.

import { MakkoEngine } from '@makko/engine';
import type { MetaState } from '../types/state';
import type { ResearchTrackId } from '../content/crew';
import {
  RESEARCH_TRACK_UNLOCKS,
  RESEARCH_THRESHOLDS,
} from '../progression/research-tracks';
import { ALL_CARDS, TacticCard } from '../content/cards';
import { HARDWARE_ITEMS, HardwareItem } from '../content/hardware';
import {
  LEFT_ZONE,
  RIGHT_ZONE,
  ACCENT,
  GOLD,
  SUCCESS,
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
  renderHeroFrame,
  renderProgressionStepper,
  renderSinglePanelContentArea,
  SinglePanelProgressionConfig,
  ProgressionTier,
} from './panel-layout';

// ── Track Definitions ───────────────────────────────────────────────────────
const TRACK_ORDER: ResearchTrackId[] = ['engineering', 'biology', 'psionics'];

const TRACK_NAMES: Record<ResearchTrackId, string> = {
  engineering: 'Engineering',
  biology: 'Biology',
  psionics: 'Psionics',
};

const TRACK_ICONS: Record<ResearchTrackId, string> = {
  engineering: '⚙️',
  biology: '🧬',
  psionics: '🔮',
};

const TRACK_COLORS: Record<ResearchTrackId, string> = {
  engineering: '#ed8936', // orange
  biology: '#48bb78',     // green
  psionics: '#9f7aea',    // purple
};

const TRACK_BG_COLORS: Record<ResearchTrackId, string> = {
  engineering: '#2d1f0f',
  biology: '#1a2f1a',
  psionics: '#2d1f4a',
};

const TRACK_DESCRIPTIONS: Record<ResearchTrackId, string> = {
  engineering: 'Optimize ship systems and construct automated repair solutions. Engineering unlocks cards focused on hull repair and bot deployment.',
  biology: 'Study the unique life forms of the void. Biology unlocks cards for healing, shield regeneration, and survival tactics.',
  psionics: 'Explore the mysteries of void-touched consciousness. Psionics unlocks cards for predicting danger and echo manipulation.',
};

// ── State ────────────────────────────────────────────────────────────────────
let currentTrackPage = 0;

/** Reset the research page when opening the panel. */
export function resetResearchPage(): void {
  currentTrackPage = 0;
}

// ── Action Types ───────────────────────────────────────────────────────────
export type ResearchPanelAction = { type: 'CLOSE_RESEARCH' };

// ── Helper Functions ─────────────────────────────────────────────────────────

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

function getTotalResearchPoints(meta: MetaState): number {
  return (meta.researchPoints.engineering ?? 0) +
         (meta.researchPoints.biology ?? 0) +
         (meta.researchPoints.psionics ?? 0);
}

/**
 * Renders card thumbnails in a row.
 */
function renderCardThumbnails(
  display: typeof MakkoEngine.display,
  cardIds: string[],
  x: number,
  y: number,
  w: number
): void {
  const thumbW = 120;
  const thumbH = 80;
  const thumbGap = 16;
  const startX = x + (w - (cardIds.length * thumbW + (cardIds.length - 1) * thumbGap)) / 2;

  cardIds.forEach((cardId, idx) => {
    const card = ALL_CARDS.find(c => c.id === cardId);
    if (!card) return;

    const cardX = startX + idx * (thumbW + thumbGap);
    const rarityColor = getRarityColor(card.rarity);

    // Card thumbnail
    display.drawRoundRect(cardX, y, thumbW, thumbH, 4, {
      fill: '#e8e4d9',
      stroke: rarityColor,
      lineWidth: 2,
    });

    // Rarity strip
    display.drawRect(cardX + 2, y + thumbH - 4, thumbW - 4, 2, { fill: rarityColor });

    // Initial
    const initial = card.name.charAt(0).toUpperCase();
    display.drawCircle(cardX + thumbW / 2, y + thumbH / 2 - 4, 14, {
      fill: '#2d3748',
      stroke: rarityColor,
      lineWidth: 2,
    });
    display.drawText(initial, cardX + thumbW / 2, y + thumbH / 2 - 4, {
      font: 'bold 14px sans-serif',
      fill: rarityColor,
      align: 'center',
      baseline: 'middle',
    });

    // Name below
    const shortName = card.name.length > 12 ? card.name.substring(0, 10) + '...' : card.name;
    display.drawText(shortName, cardX + thumbW / 2, y + thumbH + 22, {
      font: 'bold 20px monospace',
      fill: TEXT_PRIMARY,
      align: 'center',
      baseline: 'middle',
    });
  });
}

/**
 * Renders hardware items in a list.
 */
function renderHardwareList(
  display: typeof MakkoEngine.display,
  hardwareIds: string[],
  x: number,
  y: number,
  color: string
): void {
  let hwY = y;
  hardwareIds.forEach(hwId => {
    const hw = HARDWARE_ITEMS.find(h => h.id === hwId);
    if (!hw) return;

    display.drawText(`⚙️ ${hw.name}`, x, hwY, {
      font: 'bold 26px monospace',
      fill: color,
      align: 'left',
      baseline: 'middle',
    });
    hwY += 40;
  });
}

// ── Main Render Function ────────────────────────────────────────────────────

export function renderResearchPanel(
  meta: MetaState,
  mx: number,
  my: number,
  _dt: number
): ResearchPanelAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: ResearchPanelAction | null = null;

  // Full screen clear
  display.clear(BG);

  // Ensure page is in valid range
  const totalTracks = TRACK_ORDER.length;
  currentTrackPage = Math.max(0, Math.min(currentTrackPage, totalTracks - 1));

  const currentTrack = TRACK_ORDER[currentTrackPage];
  const trackColor = TRACK_COLORS[currentTrack];

  const currentPoints = meta.researchPoints[currentTrack] ?? 0;
  const currentTier = meta.researchUnlockLevel[currentTrack] ?? 0;
  const isMaxed = currentTier >= 3;

  // ── Top Bar ─────────────────────────────────────────────────────────────────
  const topAction = renderTopBar(
    display,
    input,
    mx,
    my,
    'RESEARCH',
    currentTrackPage,
    totalTracks,
    { pageLabel: 'Track' }
  );
  if (topAction === 'CLOSE') {
    action = { type: 'CLOSE_RESEARCH' };
  }

  // ── Left Zone: Track Identity ──────────────────────────────────────────────
  renderLeftZone(display, currentTrack, currentPoints, currentTier, isMaxed);

  // ── Right Zone: Single Panel Progression ──────────────────────────────────
  renderRightZone(display, currentTrack, meta, currentPoints, currentTier);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navAction = renderNavigation(display, input, mx, my, currentTrackPage, totalTracks);
  if (navAction !== null) {
    currentTrackPage = navAction;
  }

  // ── Keyboard Input ─────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    action = { type: 'CLOSE_RESEARCH' };
  }

  return action;
}

// ── Left Zone Renderer ───────────────────────────────────────────────────────

function renderLeftZone(
  display: typeof MakkoEngine.display,
  track: ResearchTrackId,
  currentPoints: number,
  currentTier: number,
  isMaxed: boolean,
): void {
  // Background panel
  display.drawRect(LEFT_ZONE.x, LEFT_ZONE.y, LEFT_ZONE.w, LEFT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  const trackColor = TRACK_COLORS[track];

  let y = LEFT_ZONE.y + 40;

  // Track icon (large)
  display.drawText(TRACK_ICONS[track], LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
    font: 'bold 140px monospace',
    fill: trackColor,
    align: 'center',
    baseline: 'top',
  });
  y += 160;

  // Track name
  display.drawText(TRACK_NAMES[track].toUpperCase(), LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
    font: 'bold 56px monospace',
    fill: trackColor,
    align: 'center',
    baseline: 'top',
  });
  y += 80;

  // Track description
  const descLines = wrapText(TRACK_DESCRIPTIONS[track], LEFT_ZONE.w - 80, '30px monospace');
  for (const line of descLines) {
    display.drawText(line, LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
      font: '30px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'top',
    });
    y += 44;
  }
  y += 60;

  // Hero frame
  const frameX = LEFT_ZONE.x + 30;
  const frameY = y;
  const frameW = LEFT_ZONE.w - 60;
  const frameH = 280;

  renderHeroFrame(display, frameX, frameY, frameW, frameH, { stroke: trackColor });

  // Progress section in frame
  display.drawText('PROGRESS', LEFT_ZONE.x + LEFT_ZONE.w / 2, frameY + 30, {
    font: 'bold 32px monospace',
    fill: TEXT_MUTED,
    align: 'center',
    baseline: 'top',
  });

  // Large RP number
  display.drawText(`${currentPoints}`, LEFT_ZONE.x + LEFT_ZONE.w / 2, frameY + 80, {
    font: 'bold 80px monospace',
    fill: trackColor,
    align: 'center',
    baseline: 'top',
  });
  display.drawText('RESEARCH POINTS', LEFT_ZONE.x + LEFT_ZONE.w / 2, frameY + 170, {
    font: '28px monospace',
    fill: TEXT_MUTED,
    align: 'center',
    baseline: 'top',
  });

  // Tier indicator
  const tierText = isMaxed ? 'MAX TIER' : `Tier ${currentTier} of 3`;
  display.drawText(tierText, LEFT_ZONE.x + LEFT_ZONE.w / 2, frameY + 230, {
    font: 'bold 30px monospace',
    fill: isMaxed ? GOLD : TEXT_SECONDARY,
    align: 'center',
    baseline: 'top',
  });
}

// ── Right Zone Renderer ────────────────────────────────────────────────────

function renderRightZone(
  display: typeof MakkoEngine.display,
  track: ResearchTrackId,
  meta: MetaState,
  currentPoints: number,
  currentTier: number,
): void {
  const trackColor = TRACK_COLORS[track];
  const unlocks = RESEARCH_TRACK_UNLOCKS[track];

  // Background panel
  display.drawRect(RIGHT_ZONE.x, RIGHT_ZONE.y, RIGHT_ZONE.w, RIGHT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  let y = RIGHT_ZONE.y + 20;

  // ── Progress Summary Header ───────────────────────────────────────────────
  const nextThreshold = RESEARCH_THRESHOLDS[currentTier] ?? null;
  const prevThreshold = currentTier > 0 ? RESEARCH_THRESHOLDS[currentTier - 1] : 0;

  // Progress bar showing RP toward next tier
  const barW = 400;
  const barH = 20;
  const barX = RIGHT_ZONE.x + (RIGHT_ZONE.w - barW) / 2;

  if (nextThreshold) {
    const progress = (currentPoints - prevThreshold) / (nextThreshold - prevThreshold);

    display.drawRoundRect(barX, y, barW, barH, barH / 2, {
      fill: '#1a202c',
      stroke: BORDER_DEFAULT,
      lineWidth: 1,
    });

    if (progress > 0) {
      display.drawRoundRect(barX + 2, y + 2, (barW - 4) * Math.min(progress, 1), barH - 4, (barH - 4) / 2, {
        fill: trackColor,
      });
    }

    display.drawText(`${currentPoints} / ${nextThreshold} RP for Tier ${currentTier + 1}`, barX + barW / 2, y + barH + 20, {
      font: 'bold 26px monospace',
      fill: TEXT_PRIMARY,
      align: 'center',
      baseline: 'middle',
    });
  } else {
    display.drawText('MAX TIER REACHED — ' + currentPoints + ' RP accumulated', barX + barW / 2, y + 10, {
      font: 'bold 28px monospace',
      fill: GOLD,
      align: 'center',
      baseline: 'top',
    });
  }
  y += 60;

  // ── Progression Stepper ───────────────────────────────────────────────────
  const stepperConfig: SinglePanelProgressionConfig = {
    currentTierIndex: currentTier,
    accentColor: trackColor,
    tiers: [0, 1, 2].map(i => ({
      tierNumber: i + 1,
      label: `Tier ${i + 1}`,
      isComplete: i < currentTier,
      isCurrent: i === currentTier,
    })),
  };

  renderProgressionStepper(display, RIGHT_ZONE.x + 80, y, RIGHT_ZONE.w - 160, stepperConfig);
  y += 100;

  // ── Single Panel Content Area ─────────────────────────────────────────────
  const contentY = y;
  const contentH = RIGHT_ZONE.y + RIGHT_ZONE.h - contentY - 100; // Leave room for totals

  // Build tier data for context
  const tierData = stepperConfig.tiers.map((tier, i) => ({
    ...tier,
    unlocks: unlocks[i],
    threshold: RESEARCH_THRESHOLDS[i],
  }));

  // Main current tier content renderer
  const renderCurrentContent = (d: typeof MakkoEngine.display, x: number, y: number, w: number, h: number) => {
    const currentTierData = tierData[currentTier];
    if (!currentTierData || !currentTierData.unlocks) {
      // Maxed out - show completion message
      d.drawText('✓ ALL TIERS COMPLETE', x + w / 2, y + h / 2, {
        font: 'bold 36px monospace',
        fill: SUCCESS,
        align: 'center',
        baseline: 'middle',
      });
      return;
    }

    let cy = y;

    // Tier label
    d.drawText(currentTierData.unlocks.cardIds.length > 0 ? 'UNLOCKS CARDS' : 'UNLOCKS HARDWARE', x, cy, {
      font: 'bold 22px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'top',
    });
    cy += 42;

    // Card thumbnails
    if (currentTierData.unlocks.cardIds.length > 0) {
      renderCardThumbnails(d, currentTierData.unlocks.cardIds, x, cy, w);
      cy += 140;
    }

    // Hardware section
    if (currentTierData.unlocks.hardwareIds.length > 0) {
      d.drawText('UNLOCKS HARDWARE', x, cy, {
        font: 'bold 22px monospace',
        fill: TEXT_MUTED,
        align: 'left',
        baseline: 'top',
      });
      cy += 42;

      renderHardwareList(d, currentTierData.unlocks.hardwareIds, x, cy, trackColor);
    }

    // RP requirement
    cy = y + h - 40;
    d.drawText(`Requires ${currentTierData.threshold} Research Points`, x + w / 2, cy, {
      font: 'bold 28px monospace',
      fill: currentPoints >= currentTierData.threshold ? SUCCESS : GOLD,
      align: 'center',
      baseline: 'middle',
    });
  };

  // Previous tier summary renderer
  const renderPreviousSummary = (d: typeof MakkoEngine.display, x: number, y: number, w: number, tier: ProgressionTier) => {
    const prevData = tierData[tier.tierNumber - 1];
    if (!prevData || !prevData.unlocks) return;

    d.drawText(`${prevData.unlocks.cardIds.length} cards, ${prevData.unlocks.hardwareIds.length} hardware`, x, y, {
      font: 'bold 22px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'middle',
    });
  };

  // Next tier preview renderer
  const renderNextPreview = (d: typeof MakkoEngine.display, x: number, y: number, w: number, tier: ProgressionTier) => {
    const nextData = tierData[tier.tierNumber - 1];
    if (!nextData || !nextData.unlocks) return;

    d.drawText(`Cards: ${nextData.unlocks.cardIds.length}`, x, y, {
      font: '20px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'middle',
    });
    d.drawText(`Hardware: ${nextData.unlocks.hardwareIds.length}`, x, y + 30, {
      font: '20px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'middle',
    });
    d.drawText(`Cost: ${nextData.threshold} RP`, x, y + 60, {
      font: 'bold 20px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'middle',
    });
  };

  renderSinglePanelContentArea(
    display,
    RIGHT_ZONE.x + 40,
    contentY,
    RIGHT_ZONE.w - 80,
    contentH,
    stepperConfig,
    renderCurrentContent,
    renderPreviousSummary,
    renderNextPreview
  );

  // ── Overall RP Summary at Bottom ────────────────────────────────────────
  const summaryY = RIGHT_ZONE.y + RIGHT_ZONE.h - 60;

  const totalRP = getTotalResearchPoints(meta);
  display.drawText(`Total Research Points: ${totalRP}`, RIGHT_ZONE.x + RIGHT_ZONE.w - 40, summaryY, {
    font: 'bold 32px monospace',
    fill: ACCENT,
    align: 'right',
    baseline: 'top',
  });

  // All tracks summary
  const engPoints = meta.researchPoints.engineering ?? 0;
  const bioPoints = meta.researchPoints.biology ?? 0;
  const psiPoints = meta.researchPoints.psionics ?? 0;

  display.drawText(
    `Eng: ${engPoints} | Bio: ${bioPoints} | Psi: ${psiPoints}`,
    RIGHT_ZONE.x + RIGHT_ZONE.w - 40,
    summaryY + 45,
    {
      font: '26px monospace',
      fill: TEXT_SECONDARY,
      align: 'right',
      baseline: 'top',
    }
  );
}
