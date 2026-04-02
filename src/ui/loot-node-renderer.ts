import { MakkoEngine } from '@makko/engine';
import { TacticCard, CardRarity } from '../content/cards';
import { RunState } from '../types/state';
import { DoctrineId } from '../content/doctrine';
import { drawCardArt, drawCardBack } from './card-art-map';

export type LootNodeAction =
  | { type: 'CHOOSE_CARD'; cardId: string }
  | { type: 'SKIP' };

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;

// Font sizes - minimum 18px
const FONTS = {
  header: 'bold 36px monospace',
  subHeader: '22px monospace',
  doctrineLabel: '18px monospace',
  doctrinePipLabel: 'bold 16px monospace',
  doctrinePoints: '14px monospace',
  cardName: 'bold 16px sans-serif',
  cardNameSmall: 'bold 14px sans-serif',
  cardDescription: '14px sans-serif',
  doctrineAffiliation: '13px sans-serif',
  deckLabel: '18px monospace',
  deckPill: '14px monospace',
  skipButton: '20px monospace',
};

interface ColorTheme {
  overlay: string;
  header: string;
  subHeader: string;
  corporate: string;
  cooperative: string;
  smuggler: string;
  neutral: string;
  rarity: Record<CardRarity, string>;
  cardBg: string;
  cardBgHover: string;
  cardStroke: string;
  cardStrokeHover: string;
  deckLabel: string;
  deckPill: string;
  skipButton: string;
  skipButtonHover: string;
  [key: string]: string | Record<CardRarity, string>;
}

const COLORS: ColorTheme = {
  overlay: '#0a0d14',
  header: '#f6e05e',
  subHeader: '#a0aec0',
  corporate: '#90cdf4',
  cooperative: '#68d391',
  smuggler: '#f6ad55',
  neutral: '#4a5568',
  rarity: {
    common: '#a0aec0',
    uncommon: '#f6e05e',
    rare: '#fc8181',
    starter: '#718096',
  },
  cardBg: '#1e2433',
  cardBgHover: '#252d40',
  cardStroke: '#4a5568',
  cardStrokeHover: '#ffffff',
  deckLabel: '#718096',
  deckPill: '#2d3748',
  skipButton: '#718096',
  skipButtonHover: '#a0aec0',
};

const DOCTRINE_ORDER: DoctrineId[] = ['corporate', 'cooperative', 'smuggler'];
const DOCTRINE_LABELS: Record<DoctrineId, string> = {
  corporate: 'Corporate',
  cooperative: 'Cooperative',
  smuggler: 'Smuggler',
};

// Portrait card dimensions - scale to fit 90% layout
const CARD_WIDTH = 320;
const CARD_HEIGHT = 440;
const CARD_SPACING = 100;
const CARD_Y = 260;
// Center the three cards with spacing
const totalCardsWidth = CARD_WIDTH * 3 + CARD_SPACING * 2;
const CARD_START_X = (SCREEN_WIDTH - totalCardsWidth) / 2;
const CARD_POSITIONS = [
  CARD_START_X,
  CARD_START_X + CARD_WIDTH + CARD_SPACING,
  CARD_START_X + (CARD_WIDTH + CARD_SPACING) * 2,
];

// Module-level press tracking for card selection
let pressedCardIndex: number | null = null;

// Number formatter
const formatNum = (n: number) => n.toLocaleString('en-US');

function getDoctrineForCard(cardId: string): DoctrineId | null {
  const doctrineMap: Record<string, DoctrineId> = {
    extract: 'corporate',
    secure_extract: 'corporate',
    quick_extract: 'corporate',
    upgrade: 'corporate',
    analyze: 'corporate',
    corporate_mandate: 'corporate',
    debt_leveraging: 'corporate',
    hostile_extraction: 'corporate',
    debt_conversion: 'corporate',
    threat_analysis: 'corporate',
    sector_lockdown: 'corporate',
    preemptive_shield: 'corporate',
    repair: 'cooperative',
    patch_and_hold: 'cooperative',
    shield: 'cooperative',
    crew_effort: 'cooperative',
    triage: 'cooperative',
    mass_healing: 'cooperative',
    collective_recovery: 'cooperative',
    perimeter: 'cooperative',
    fortress_protocol: 'cooperative',
    last_bastion: 'cooperative',
    scavenge: 'smuggler',
    risky_scavenge: 'smuggler',
    black_market: 'smuggler',
    basic_relay: 'smuggler',
    secure_channel: 'smuggler',
    smugglers_relay: 'smuggler',
    quantum_drop: 'smuggler',
    salvage_protocol: 'smuggler',
    overclock_bots: 'smuggler',
    bot_army: 'smuggler',
    deep_salvage: 'smuggler',
    sector_sweep: 'smuggler',
    ghost_claim: 'smuggler',
    repair_bot: 'smuggler',
    scavenge_bot: 'smuggler',
    overdrive_extract: 'smuggler',
  };
  return doctrineMap[cardId] ?? null;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function getActiveDoctrine(points: Record<DoctrineId, number>): DoctrineId | null {
  let maxPoints = -1;
  let active: DoctrineId | null = null;
  for (const d of DOCTRINE_ORDER) {
    if (points[d] > maxPoints) {
      maxPoints = points[d];
      active = d;
    }
  }
  return active;
}

export function renderLootNode(
  offerings: TacticCard[],
  run: RunState,
  unlockedIds: string[],
  mx: number,
  my: number,
  now: number,
): { action: LootNodeAction | null } {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  // Full-screen overlay
  display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, { fill: COLORS.overlay });

  // Header
  display.drawText('\u2014 LOOT NODE \u2014', SCREEN_WIDTH / 2, 100, {
    font: FONTS.header,
    fill: COLORS.header,
    align: 'center',
  });

  // Sub-header
  display.drawText(
    `Round ${formatNum(run.lootNodeRound)} complete. Choose a card to add to your deck.`,
    SCREEN_WIDTH / 2,
    160,
    {
      font: FONTS.subHeader,
      fill: COLORS.subHeader,
      align: 'center',
    },
  );

  // Doctrine indicator bar
  renderDoctrineBar(display, run.doctrineRunPoints, 220);

  // Card offers
  let action: LootNodeAction | null = null;

  // Handle mouse interactions
  const isMouseDown = input.isMouseDown(0);
  const isMouseReleased = input.isMouseReleased(0);

  for (let i = 0; i < offerings.length; i++) {
    const card = offerings[i];
    const x = CARD_POSITIONS[i] - CARD_WIDTH / 2;
    const y = CARD_Y;

    // Check hover
    const hovered = mx >= x && mx <= x + CARD_WIDTH && my >= y && my <= y + CARD_HEIGHT;

    // Handle click tracking
    if (hovered && isMouseDown) {
      pressedCardIndex = i;
    }
    if (pressedCardIndex === i && isMouseReleased && hovered) {
      action = { type: 'CHOOSE_CARD', cardId: card.id };
      pressedCardIndex = null;
    }

    // Card position
    const cardX = x;
    const rarityColor = COLORS.rarity[card.rarity] ?? COLORS.rarity.common;

    // Try to draw real card art first
    const hasArt = drawCardArt(display, card.id, cardX, y, CARD_WIDTH, CARD_HEIGHT, 1);

    if (!hasArt) {
      // Fallback: use card back image (no placeholder graphics)
      drawCardBack(display, cardX, y, CARD_WIDTH, CARD_HEIGHT, 1, i * 0.3);
    }

    // Draw card frame overlay for hover effect
    if (hovered) {
      display.drawRoundRect(cardX - 2, y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 10, {
        stroke: '#ffffff',
        lineWidth: 4,
        alpha: 0.8,
      });
    }

    // Draw card name at bottom overlay
    const nameBgY = y + CARD_HEIGHT - 50;
    display.drawRect(cardX, nameBgY, CARD_WIDTH, 50, {
      fill: '#0d1117',
      alpha: 0.85,
    });

    const nameFont = card.name.length > 18 ? FONTS.cardNameSmall : FONTS.cardName;
    display.drawText(card.name, cardX + CARD_WIDTH / 2, nameBgY + 28, {
      font: nameFont,
      fill: '#ffffff',
      align: 'center',
      baseline: 'middle',
    });

    // Doctrine badge at top
    const doctrine = getDoctrineForCard(card.id);
    if (doctrine) {
      const badgeWidth = 100;
      const badgeHeight = 28;
      const badgeX = cardX + (CARD_WIDTH - badgeWidth) / 2;
      const badgeY = y + 12;
      const doctrineColor = COLORS[doctrine];

      display.drawRoundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6, {
        fill: '#0d1117',
        stroke: doctrineColor,
        lineWidth: 2,
        alpha: 0.9,
      });

      display.drawText(DOCTRINE_LABELS[doctrine], badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 4, {
        font: FONTS.doctrineAffiliation,
        fill: doctrineColor,
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  // Reset pressed state if mouse released outside
  if (isMouseReleased && pressedCardIndex !== null) {
    pressedCardIndex = null;
  }

  // Current deck strip - positioned below cards
  renderDeckStrip(display, run, 720 + CARD_HEIGHT + 40);

  // Skip button
  const skipY = 980;
  const skipWidth = 280;
  const skipHeight = 50;
  const skipX = (SCREEN_WIDTH - skipWidth) / 2;

  const skipHovered = mx >= skipX && mx <= skipX + skipWidth && my >= skipY && my <= skipY + skipHeight;
  const skipColor = skipHovered ? COLORS.skipButtonHover : COLORS.skipButton;

  // Skip button background on hover
  if (skipHovered) {
    display.drawRoundRect(skipX, skipY, skipWidth, skipHeight, 8, {
      fill: '#1a202c',
      stroke: skipColor,
      lineWidth: 2,
    });
  }

  display.drawText('Skip \u2014 take nothing', SCREEN_WIDTH / 2, skipY + skipHeight / 2 + 6, {
    font: FONTS.skipButton,
    fill: skipColor,
    align: 'center',
  });

  // Handle skip click
  if (skipHovered && isMouseDown) {
    pressedCardIndex = -1; // Use -1 to indicate skip is pressed
  }
  if (pressedCardIndex === -1 && isMouseReleased && skipHovered) {
    action = { type: 'SKIP' };
    pressedCardIndex = null;
  }

  return { action };
}

function renderDoctrineBar(
  display: typeof MakkoEngine.display,
  points: Record<DoctrineId, number>,
  y: number,
): void {
  const barWidth = 600;
  const barX = (SCREEN_WIDTH - barWidth) / 2;
  const activeDoctrine = getActiveDoctrine(points);

  // Label
  display.drawText('Doctrine Lean:', barX - 140, y + 18, {
    font: FONTS.doctrineLabel,
    fill: COLORS.subHeader,
    align: 'left',
  });

  // Three pips
  const pipWidth = 170;
  const pipGap = 45;
  const startX = barX;

  for (let i = 0; i < DOCTRINE_ORDER.length; i++) {
    const doctrine = DOCTRINE_ORDER[i];
    const x = startX + i * (pipWidth + pipGap);
    const isActive = doctrine === activeDoctrine;
    const doctrinePoints = points[doctrine];

    // Pip background
    const bgColor = isActive ? COLORS[doctrine] : '#2d3748';
    display.drawRoundRect(x, y, pipWidth, 36, 6, {
      fill: bgColor,
      stroke: isActive ? '#ffffff' : '#4a5568',
      lineWidth: isActive ? 3 : 2,
    });

    // Label
    display.drawText(DOCTRINE_LABELS[doctrine], x + 12, y + 24, {
      font: FONTS.doctrinePipLabel,
      fill: isActive ? '#1a202c' : '#a0aec0',
      align: 'left',
    });

    // Progress bar (5 = full)
    const progress = Math.min(doctrinePoints / 5, 1);
    const progressWidth = (pipWidth - 24) * progress;
    if (progressWidth > 0) {
      display.drawRoundRect(x + 12, y + 28, progressWidth, 6, 3, {
        fill: isActive ? '#1a202c' : '#4a5568',
      });
    }

    // Points text
    display.drawText(`${formatNum(doctrinePoints)}/5`, x + pipWidth - 12, y + 24, {
      font: FONTS.doctrinePoints,
      fill: isActive ? '#1a202c' : '#718096',
      align: 'right',
    });
  }
}

function renderDeckStrip(display: typeof MakkoEngine.display, run: RunState, y: number): void {
  // Combine all cards in the deck
  const allCards = [...run.deck, ...run.discardPile, ...run.hand];

  // Sort and dedupe for display
  const uniqueCards = Array.from(new Set(allCards)).sort();

  // Label
  display.drawText(`Your deck (${formatNum(allCards.length)} cards):`, 80, y + 12, {
    font: FONTS.deckLabel,
    fill: COLORS.deckLabel,
    align: 'left',
  });

  // Card pills
  const pillWidth = 120;
  const pillHeight = 32;
  const pillGap = 10;
  const maxPills = 14;
  const startX = 80;
  const pillsY = y + 40;

  const pillsToShow = uniqueCards.slice(0, maxPills);
  const moreCount = uniqueCards.length - maxPills;

  for (let i = 0; i < pillsToShow.length; i++) {
    const x = startX + i * (pillWidth + pillGap);
    const cardId = pillsToShow[i];

    // Count occurrences
    const count = allCards.filter((c) => c === cardId).length;
    const displayText = count > 1 ? `${cardId.slice(0, 10)} \u00d7${formatNum(count)}` : cardId.slice(0, 12);

    display.drawRoundRect(x, pillsY, pillWidth, pillHeight, 6, {
      fill: COLORS.deckPill,
    });

    display.drawText(displayText, x + pillWidth / 2, pillsY + pillHeight / 2 + 5, {
      font: FONTS.deckPill,
      fill: '#a0aec0',
      align: 'center',
    });
  }

  // Show +N more if overflow
  if (moreCount > 0) {
    const x = startX + maxPills * (pillWidth + pillGap);
    display.drawRoundRect(x, pillsY, pillWidth, pillHeight, 6, {
      fill: '#1a202c',
      stroke: '#4a5568',
    });
    display.drawText(`+${formatNum(moreCount)} more`, x + pillWidth / 2, pillsY + pillHeight / 2 + 5, {
      font: FONTS.deckPill,
      fill: '#718096',
      align: 'center',
    });
  }
}
