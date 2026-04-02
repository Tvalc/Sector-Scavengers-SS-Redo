import { MakkoEngine } from '@makko/engine';
import { TacticCard, CardRarity } from '../content/cards';
import { DoctrineId } from '../content/doctrine';
import { drawCardArt, drawCardBack } from './card-art-map';

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;

interface ColorTheme {
  overlay: string;
  header: string;
  subHeader: string;
  corporate: string;
  cooperative: string;
  smuggler: string;
  neutral: string;
  rarity: Record<CardRarity, string>;
  cardFrame: string;
  cardBg: string;
  cardHeaderBg: string;
  cardDescBg: string;
  skipButtonFill: string;
  skipButtonText: string;
  skipButtonHover: string;
  white: string;
  description: string;
  [key: string]: string | Record<CardRarity, string>;
}

const COLORS: ColorTheme = {
  overlay: 'rgba(0,0,0,0.85)',
  header: '#22d3ee',
  subHeader: '#94a3b8',
  corporate: '#90cdf4',
  cooperative: '#68d391',
  smuggler: '#f6ad55',
  neutral: '#64748b',
  rarity: {
    starter: '#718096',
    common: '#a0aec0',
    uncommon: '#f6e05e',
    rare: '#fc8181',
  },
  cardFrame: '#4a5568',
  cardBg: '#1e2433',
  cardHeaderBg: '#2d3748',
  cardDescBg: '#1a202c',
  skipButtonFill: '#4a5568',
  skipButtonText: '#94a3b8',
  skipButtonHover: '#cbd5e1',
  white: '#ffffff',
  description: '#94a3b8',
};

const DOCTRINE_LABELS: Record<DoctrineId, string> = {
  corporate: 'Corporate',
  cooperative: 'Cooperative',
  smuggler: 'Smuggler',
};

// Panel dimensions - 90% screen
const PANEL_W = Math.floor(SCREEN_WIDTH * 0.9);
const PANEL_H = Math.floor(SCREEN_HEIGHT * 0.9);

// Card dimensions (smaller than loot node cards for 3-across layout)
const CARD_W = 300;
const CARD_H = 420;

// Skip button dimensions
const SKIP_W = 160;
const SKIP_H = 44;

// Module-level press tracking
let pressedCardIndex: number | null = null;
let pressedSkip = false;

function getDoctrineForCard(cardId: string): DoctrineId | null {
  const doctrineMap: Record<string, DoctrineId> = {
    extract: 'corporate',
    secure_extract: 'corporate',
    quick_extract: 'corporate',
    upgrade: 'corporate',
    analyze: 'corporate',
    corporate_mandate: 'corporate',
    repair: 'cooperative',
    patch_and_hold: 'cooperative',
    shield: 'cooperative',
    crew_effort: 'cooperative',
    scavenge: 'smuggler',
    risky_scavenge: 'smuggler',
    black_market: 'smuggler',
    basic_relay: 'smuggler',
    secure_channel: 'smuggler',
    smugglers_relay: 'smuggler',
    quantum_drop: 'smuggler',
    repair_bot: 'smuggler',
    scavenge_bot: 'smuggler',
    overdrive_extract: 'smuggler',
    hull_surge: 'cooperative',
    last_stand: 'cooperative',
    bulwark: 'cooperative',
    void_siphon: 'smuggler',
    void_shield: 'smuggler',
    echo_extract: 'smuggler',
    salvage_override: 'smuggler',
    distress_response: 'cooperative',
    audit_bribe: 'corporate',
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

function getRarityColor(rarity: CardRarity): string {
  return COLORS.rarity[rarity] ?? COLORS.rarity.common;
}

function getDoctrineColor(doctrine: DoctrineId | null): string {
  if (!doctrine) return COLORS.neutral;
  return COLORS[doctrine];
}

/**
 * Render the inter-ship loot selection screen.
 * 
 * @returns The selected cardId, 'SKIP' if skip button clicked, or null if no choice yet
 */
export function renderIntershipLoot(
  display: typeof MakkoEngine.display,
  availableCards: TacticCard[],
  mx: number,
  my: number,
  now: number,
): string | 'SKIP' | null {
  const input = MakkoEngine.input;

  // Center the panel
  const panelX = (SCREEN_WIDTH - PANEL_W) / 2;
  const panelY = (SCREEN_HEIGHT - PANEL_H) / 2;

  // Full-screen dark overlay
  display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, { fill: COLORS.overlay });

  // Main panel background
  display.drawRoundRect(panelX, panelY, PANEL_W, PANEL_H, 12, {
    fill: COLORS.cardBg,
    stroke: COLORS.cardFrame,
    lineWidth: 2,
  });

  // Header
  display.drawText('SALVAGE RECOVERED — CHOOSE A CARD', SCREEN_WIDTH / 2, panelY + 60, {
    font: 'bold 28px monospace',
    fill: COLORS.header,
    align: 'center',
  });

  // Card starting positions (3 cards centered horizontally)
  const gap = 30;
  const totalCardsWidth = CARD_W * 3 + gap * 2;
  const startX = (SCREEN_WIDTH - totalCardsWidth) / 2;
  const cardY = panelY + 70;

  // Mouse interaction state
  const isMouseDown = input.isMouseDown(0);
  const isMouseReleased = input.isMouseReleased(0);

  let result: string | 'SKIP' | null = null;

  // Render each card
  for (let i = 0; i < availableCards.length; i++) {
    const card = availableCards[i];
    const x = startX + i * (CARD_W + gap);
    const y = cardY;

    // Check hover
    const hovered = mx >= x && mx <= x + CARD_W && my >= y && my <= y + CARD_H;

    // Handle click tracking
    if (hovered && isMouseDown) {
      pressedCardIndex = i;
    }
    if (pressedCardIndex === i && isMouseReleased && hovered) {
      result = card.id;
      pressedCardIndex = null;
    }

    // Try to draw real card art
    const hasArt = drawCardArt(display, card.id, x, y, CARD_W, CARD_H, 1);

    if (!hasArt) {
      // Fallback: use card back image (no placeholder graphics)
      drawCardBack(display, x, y, CARD_W, CARD_H, 1, i * 0.3);
    }

    // Hover frame overlay
    if (hovered) {
      display.drawRoundRect(x - 2, y - 2, CARD_W + 4, CARD_H + 4, 10, {
        stroke: '#22d3ee',
        lineWidth: 4,
        alpha: 0.8,
      });
    }

    // Card name at bottom
    const nameBgY = y + CARD_H - 60;
    display.drawRect(x, nameBgY, CARD_W, 60, {
      fill: '#0d1117',
      alpha: 0.85,
    });

    const nameFontSize = card.name.length > 16 ? 16 : card.name.length > 12 ? 18 : 20;
    display.drawText(card.name, x + CARD_W / 2, nameBgY + 32, {
      font: `bold ${nameFontSize}px sans-serif`,
      fill: '#ffffff',
      align: 'center',
      baseline: 'middle',
    });

    // Doctrine badge at top
    const doctrine = getDoctrineForCard(card.id);
    if (doctrine) {
      const badgeWidth = 100;
      const badgeHeight = 28;
      const badgeX = x + (CARD_W - badgeWidth) / 2;
      const badgeY = y + 12;
      const doctrineColor = getDoctrineColor(doctrine);

      display.drawRoundRect(badgeX, badgeY, badgeWidth, badgeHeight, 6, {
        fill: '#0d1117',
        stroke: doctrineColor,
        lineWidth: 2,
        alpha: 0.9,
      });

      display.drawText(DOCTRINE_LABELS[doctrine], badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 4, {
        font: 'bold 12px sans-serif',
        fill: doctrineColor,
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  // Reset pressed state if mouse released outside
  if (isMouseReleased && pressedCardIndex !== null && result === null) {
    pressedCardIndex = null;
  }

  // Skip button
  const skipX = panelX + PANEL_W - SKIP_W - 30;
  const skipY = panelY + PANEL_H - SKIP_H - 30;

  const skipHovered = mx >= skipX && mx <= skipX + SKIP_W && my >= skipY && my <= skipY + SKIP_H;
  const skipColor = skipHovered ? COLORS.skipButtonHover : COLORS.skipButtonText;

  display.drawRoundRect(skipX, skipY, SKIP_W, SKIP_H, 6, {
    fill: COLORS.skipButtonFill,
    stroke: skipHovered ? skipColor : COLORS.cardFrame,
    lineWidth: skipHovered ? 2 : 1,
  });

  display.drawText('SKIP', skipX + SKIP_W / 2, skipY + SKIP_H / 2 + 2, {
    font: 'bold 16px sans-serif',
    fill: skipColor,
    align: 'center',
    baseline: 'middle',
  });

  // Handle skip click
  if (skipHovered && isMouseDown) {
    pressedSkip = true;
  }
  if (pressedSkip && isMouseReleased && skipHovered) {
    result = 'SKIP';
    pressedSkip = false;
  }
  if (isMouseReleased && pressedSkip) {
    pressedSkip = false;
  }

  return result;
}
