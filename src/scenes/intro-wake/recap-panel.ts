/**
 * Recap Panel — Holographic HUD Bonus Reveal Screen
 *
 * Speaker-attributed debrief where rescued crew (or VALU if solo)
 * frames the outcome, followed by the bonus reveal list.
 * Displays on a spaceship cockpit background with holographic frame.
 */

import { MakkoEngine } from '@makko/engine';
import { IntroTerminalOutcome, IntroBonus } from '../../content/intro-narrative';
import { getPrimaryRescuedSpeaker, getPathRescuedSpeaker } from '../../content/crew-voice';
import { STARTING_DEBT } from '../../config/constants';
import { CORE_CARDS } from '../../content/cards';
import { CREW_ROSTER, CrewMemberId } from '../../content/crew';
import { HARDWARE_ITEMS } from '../../content/hardware';
import { OpeningPathId } from '../../content/opening-paths';

// Layout constants for holographic frame (900x640 - shorter from bottom)
const PANEL_X = 510;
const PANEL_Y = 260; // Moved UP 30px from previous position
const PANEL_WIDTH = 900;
const PANEL_HEIGHT = 640; // 100px shorter
const SPEAKER_BADGE_X = 800;
const SPEAKER_BADGE_Y = 870; // Moved DOWN to bottom of screen, replacing footer
const SPEAKER_BADGE_W = 320;
const SPEAKER_BADGE_H = 48;
const SPEAKER_LINE_Y = 925; // Below the badge

// Content layout inside frame
const LEFT_COLUMN_X = PANEL_X + 50;
const RIGHT_COLUMN_X = PANEL_X + 480;
const CONTENT_START_Y = PANEL_Y + 80;
const ROW_HEIGHT = 52;
const SECTION_GAP = 20;
const PROMPT_Y = 980;

// Helper to format numbers with commas
function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function renderRecapPanel(display: typeof MakkoEngine.display, outcome: IntroTerminalOutcome): void {
  // Draw background image first
  renderBackground(display);

  // Draw vignette for text readability
  renderVignette(display);

  // Speaker attribution block
  const pathVoice = getPathRescuedSpeaker(outcome.openingPathId);
  const rolledVoice = getPrimaryRescuedSpeaker(outcome.bonuses ?? []);
  const voice = pathVoice.speaker !== 'VALU' ? pathVoice : rolledVoice;

  // Draw holographic frame (no black backing)
  renderHolographicFrame(display);

  // Speaker badge above frame (unchanged position)
  renderSpeakerBadge(display, voice.speaker);

  // Spoken line below badge (unchanged position)
  renderSpokenLine(display, voice.line);

  // Collect crew data
  const bonuses = outcome.bonuses ?? [];
  const pathCrewIds = getPathCrewIds(outcome.openingPathId);
  const bonusCrewIds = bonuses
    .filter((b) => b.type === 'crew')
    .map((b) => b.crewId as CrewMemberId);

  const allCrewIds: CrewMemberId[] = [...pathCrewIds];
  for (const id of bonusCrewIds) {
    if (!allCrewIds.includes(id)) {
      allCrewIds.push(id);
    }
  }

  // LEFT COLUMN: Crew section
  let leftY = CONTENT_START_Y;
  leftY = renderCrewSection(display, leftY, allCrewIds);

  // RIGHT COLUMN: Stats and bonuses
  let rightY = CONTENT_START_Y;

  // Credits
  if (outcome.rolledCredits !== undefined) {
    const creditsColor = outcome.rolledCredits >= 500 ? '#68d391' : '#e2e8f0';
    renderStatRow(display, rightY, 'STARTING CREDITS', `₡${formatNumber(outcome.rolledCredits)}`, creditsColor);
    rightY += ROW_HEIGHT;
  }

  // Void Echo
  if (outcome.rolledVoidEcho !== undefined) {
    renderStatRow(display, rightY, 'VOID ECHO', `+${formatNumber(outcome.rolledVoidEcho)}`, '#4ecdc4');
    rightY += ROW_HEIGHT;
  }

  // Starting Debt
  const startingDebt = outcome.startingDebt ?? STARTING_DEBT;
  renderStatRow(display, rightY, 'STARTING DEBT', `₡${formatNumber(startingDebt)}`, '#fc8181');
  rightY += ROW_HEIGHT + 20;

  // Divider line between sections
  display.drawLine(RIGHT_COLUMN_X, rightY - 10, RIGHT_COLUMN_X + 360, rightY - 10, {
    stroke: '#00d4ff',
    lineWidth: 2,
    alpha: 0.4,
  });

  // Bonus entries (excluding crew)
  for (const bonus of bonuses) {
    if (bonus.type === 'crew') continue;
    const { label, value, color } = formatBonus(bonus);
    renderBonusRow(display, rightY, label, value, color);
    rightY += ROW_HEIGHT;
  }

  // Scanning line effect
  renderScanLine(display);

  // Prompt at bottom center - gold and larger
  renderPrompt(display);
}

function renderBackground(display: typeof MakkoEngine.display): void {
  const bg = MakkoEngine.staticAsset('ss-background-valu-summary-hud');
  if (bg) {
    const scaleX = 1920 / bg.width;
    const scaleY = 1080 / bg.height;
    const scale = Math.max(scaleX, scaleY);
    const scaledWidth = bg.width * scale;
    const scaledHeight = bg.height * scale;
    const x = (1920 - scaledWidth) / 2;
    const y = (1080 - scaledHeight) / 2;
    display.drawImage(bg.image, x, y, scaledWidth, scaledHeight);
  } else {
    display.clear('#0a0d14');
  }
}

function renderVignette(display: typeof MakkoEngine.display): void {
  const centerX = 960;
  const centerY = 540;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  const steps = 30;
  for (let i = 0; i < steps; i++) {
    const progress = i / steps;
    const radius = 400 + progress * (maxRadius - 400);
    const alpha = progress * progress * 0.7;

    display.drawCircle(centerX, centerY, radius, {
      stroke: '#000000',
      lineWidth: (maxRadius - 400) / steps + 2,
      alpha,
    });
  }
}

function renderHolographicFrame(display: typeof MakkoEngine.display): void {
  // No frame - just the title and scan line

  // Title text - moved up additional 50px total from original position
  renderTitleWithGlow(display, 'MISSION RECAP', PANEL_X + PANEL_WIDTH / 2, PANEL_Y + 15);
}

function renderTitleWithGlow(display: typeof MakkoEngine.display, text: string, x: number, y: number): void {
  // Glow effect
  for (let i = 5; i >= 0; i--) {
    const glowAlpha = 0.2 - i * 0.03;
    const offset = i * 2;
    display.drawText(text, x + offset, y, {
      font: 'bold 36px monospace',
      fill: '#00d4ff',
      align: 'center',
      baseline: 'top',
      alpha: glowAlpha,
    });
    display.drawText(text, x - offset, y, {
      font: 'bold 36px monospace',
      fill: '#00d4ff',
      align: 'center',
      baseline: 'top',
      alpha: glowAlpha,
    });
  }

  display.drawText(text, x, y, {
    font: 'bold 36px monospace',
    fill: '#00d4ff',
    align: 'center',
    baseline: 'top',
  });
}

function renderScanLine(display: typeof MakkoEngine.display): void {
  // Full screen scan line from top to bottom
  const scanY = 50 + (Date.now() % 4000) / 4000 * 980;
  display.drawRect(0, scanY, 1920, 3, {
    fill: '#00d4ff',
    alpha: 0.15,
  });
}

function renderSpeakerBadge(display: typeof MakkoEngine.display, speaker: string): void {
  // Badge background with border
  display.drawRect(SPEAKER_BADGE_X, SPEAKER_BADGE_Y, SPEAKER_BADGE_W, SPEAKER_BADGE_H, {
    fill: '#1e2433',
    stroke: '#4ecdc4',
    lineWidth: 3,
  });

  // Glow effect
  for (let i = 3; i >= 0; i--) {
    display.drawRect(SPEAKER_BADGE_X - i, SPEAKER_BADGE_Y - i, SPEAKER_BADGE_W + i * 2, SPEAKER_BADGE_H + i * 2, {
      stroke: '#4ecdc4',
      lineWidth: 1,
      alpha: 0.15 - i * 0.03,
    });
  }

  renderTextWithOutline(display, speaker, SPEAKER_BADGE_X + SPEAKER_BADGE_W / 2, SPEAKER_BADGE_Y + SPEAKER_BADGE_H / 2, {
    font: 'bold 24px monospace',
    fill: '#4ecdc4',
    align: 'center',
    baseline: 'middle',
  });
}

function renderSpokenLine(display: typeof MakkoEngine.display, line: string): void {
  const textX = SPEAKER_BADGE_X + SPEAKER_BADGE_W / 2;
  const textY = SPEAKER_LINE_Y;

  renderTextWithOutline(display, line, textX, textY, {
    font: 'italic 24px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'top',
  });
}

function renderPrompt(display: typeof MakkoEngine.display): void {
  const text = '[ PRESS SPACE OR CLICK TO BEGIN ]';
  const x = display.width / 2;
  const y = PROMPT_Y;

  // Gold glow effect like crew callout
  for (let i = 5; i >= 0; i--) {
    const glowAlpha = 0.3 - i * 0.05;
    const offset = i * 2;
    display.drawText(text, x + offset, y, {
      font: 'bold 28px monospace',
      fill: '#f6ad55',
      align: 'center',
      baseline: 'middle',
      alpha: glowAlpha,
    });
    display.drawText(text, x - offset, y, {
      font: 'bold 28px monospace',
      fill: '#f6ad55',
      align: 'center',
      baseline: 'middle',
      alpha: glowAlpha,
    });
  }

  renderTextWithOutline(display, text, x, y, {
    font: 'bold 28px monospace',
    fill: '#f6ad55', // Gold color like crew callout
    align: 'center',
    baseline: 'middle',
  });
}

function getPathCrewIds(pathId: OpeningPathId): CrewMemberId[] {
  const crewAssignment: Record<OpeningPathId, { leadId: CrewMemberId | null; companionIds: CrewMemberId[] }> = {
    cold_extract: { leadId: null, companionIds: [] },
    cut_and_run:  { leadId: 'jax', companionIds: ['del'] },
    duty_claim:   { leadId: 'max', companionIds: ['sera', 'rook'] },
  };
  const crew = crewAssignment[pathId];
  if (!crew) return [];
  const ids: CrewMemberId[] = [];
  if (crew.leadId !== null) ids.push(crew.leadId);
  ids.push(...crew.companionIds);
  return ids;
}

function renderCrewSection(
  display: typeof MakkoEngine.display,
  y: number,
  crewIds: CrewMemberId[]
): number {
  // Section header
  const headerText = crewIds.length > 0 ? `CREW: ${formatNumber(crewIds.length)} RESCUED` : 'CREW: NONE';
  const headerColor = crewIds.length > 0 ? '#f6ad55' : '#718096';

  renderTextWithOutline(display, headerText, LEFT_COLUMN_X, y, {
    font: 'bold 28px monospace',
    fill: headerColor,
    align: 'left',
    baseline: 'top',
  });

  let entryY = y + ROW_HEIGHT;

  // Individual crew entries
  for (const crewId of crewIds) {
    const crew = CREW_ROSTER[crewId];
    if (crew) {
      // Name in bold
      renderTextWithOutline(display, crew.name, LEFT_COLUMN_X, entryY, {
        font: 'bold 24px monospace',
        fill: '#e2e8f0',
        align: 'left',
        baseline: 'top',
      });

      // Role below name, indented
      renderTextWithOutline(display, crew.role, LEFT_COLUMN_X + 20, entryY + 28, {
        font: '20px monospace',
        fill: '#a0aec0',
        align: 'left',
        baseline: 'top',
      });

      entryY += ROW_HEIGHT + 8;
    }
  }

  return entryY + SECTION_GAP;
}

function renderStatRow(
  display: typeof MakkoEngine.display,
  y: number,
  label: string,
  value: string,
  valueColor: string
): void {
  // Label
  renderTextWithOutline(display, label, RIGHT_COLUMN_X, y, {
    font: 'bold 22px monospace',
    fill: '#a0aec0',
    align: 'left',
    baseline: 'top',
  });

  // Value (larger, right-aligned)
  renderTextWithOutline(display, value, RIGHT_COLUMN_X + 360, y, {
    font: 'bold 28px monospace',
    fill: valueColor,
    align: 'right',
    baseline: 'top',
  });
}

function renderBonusRow(
  display: typeof MakkoEngine.display,
  y: number,
  label: string,
  value: string,
  valueColor: string
): void {
  // Two-line layout for bonuses: label on top, value below
  renderTextWithOutline(display, label, RIGHT_COLUMN_X, y, {
    font: 'bold 20px monospace',
    fill: '#a0aec0',
    align: 'left',
    baseline: 'top',
  });

  renderTextWithOutline(display, value, RIGHT_COLUMN_X + 20, y + 26, {
    font: 'bold 24px monospace',
    fill: valueColor,
    align: 'left',
    baseline: 'top',
  });
}

function renderTextWithOutline(
  display: typeof MakkoEngine.display,
  text: string,
  x: number,
  y: number,
  style: { font: string; fill: string; align: 'left' | 'center' | 'right'; baseline: 'top' | 'middle' | 'bottom' }
): void {
  // Black outline for readability
  for (let ox = -3; ox <= 3; ox += 2) {
    for (let oy = -3; oy <= 3; oy += 2) {
      if (Math.abs(ox) + Math.abs(oy) > 4) continue;
      display.drawText(text, x + ox, y + oy, {
        font: style.font,
        fill: '#000000',
        align: style.align,
        baseline: style.baseline,
      });
    }
  }

  display.drawText(text, x, y, style);
}

function formatBonus(bonus: IntroBonus): { label: string; value: string; color: string } {
  switch (bonus.type) {
    case 'card': {
      const card = CORE_CARDS.find((c) => c.id === bonus.cardId);
      const cardName = card?.name ?? bonus.cardId;
      return { label: 'CARD UNLOCKED', value: cardName, color: '#f6ad55' };
    }

    case 'crew': {
      const crew = CREW_ROSTER[bonus.crewId as keyof typeof CREW_ROSTER];
      const value = crew ? `${crew.name} — ${crew.role}` : bonus.crewId;
      return { label: 'CREW RECOVERED', value, color: '#f6ad55' };
    }

    case 'hardware': {
      const item = HARDWARE_ITEMS.find((i) => i.id === bonus.itemId);
      const itemName = item?.name ?? bonus.itemId;
      return { label: 'HARDWARE FOUND', value: itemName, color: '#63b3ed' };
    }

    case 'void_echo':
      return { label: 'EXTRA ECHO', value: `+${formatNumber(bonus.amount)}`, color: '#4ecdc4' };

    case 'credits_bonus':
      return { label: 'SALVAGE BONUS', value: `+₡${formatNumber(bonus.amount)}`, color: '#68d391' };

    case 'hull_boost':
      return { label: 'HULL PATCHED', value: 'Condition improved', color: '#68d391' };

    default:
      return { label: 'BONUS', value: 'Unknown', color: '#e2e8f0' };
  }
}

