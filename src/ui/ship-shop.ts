import { MakkoEngine } from '@makko/engine';
import { TacticCard, CardRarity } from '../content/cards';
import { HardwareItem, ItemRarity, ItemSlot } from '../content/hardware';

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;

interface ColorTheme {
  bg: string;
  panelFill: string;
  panelStroke: string;
  header: string;
  subHeader: string;
  creditsLabel: string;
  creditsValue: string;
  cardRarity: Record<CardRarity, string>;
  hardwareRarity: Record<ItemRarity, string>;
  cardFrame: string;
  cardBg: string;
  cardHeaderBg: string;
  cardDescBg: string;
  hardwareFrame: string;
  hardwareBg: string;
  hardwareHeaderBg: string;
  slotLabel: Record<ItemSlot, string>;
  priceText: string;
  priceInsufficient: string;
  unavailableBg: string;
  unavailableText: string;
  buttonFill: string;
  buttonText: string;
  buttonHover: string;
  white: string;
  description: string;
}

const COLORS: ColorTheme = {
  bg: '#0a0d14',
  panelFill: '#1e2d3d',
  panelStroke: '#22d3ee',
  header: '#22d3ee',
  subHeader: '#94a3b8',
  creditsLabel: '#94a3b8',
  creditsValue: '#f6e05e',
  cardRarity: {
    starter: '#718096',
    common: '#a0aec0',
    uncommon: '#f6e05e',
    rare: '#fc8181',
  },
  hardwareRarity: {
    common: '#a0aec0',
    uncommon: '#63b3ed',
    rare: '#f6e05e',
  },
  cardFrame: '#4a5568',
  cardBg: '#1e2433',
  cardHeaderBg: '#2d3748',
  cardDescBg: '#1a202c',
  hardwareFrame: '#4a5568',
  hardwareBg: '#1a2530',
  hardwareHeaderBg: '#2d3a4a',
  slotLabel: {
    hull: '#f87171',
    scanner: '#60a5fa',
    utility: '#a78bfa',
  },
  priceText: '#22d3ee',
  priceInsufficient: '#ef4444',
  unavailableBg: '#0f172a',
  unavailableText: '#475569',
  buttonFill: '#374151',
  buttonText: '#94a3b8',
  buttonHover: '#cbd5e1',
  white: '#ffffff',
  description: '#94a3b8',
};

// Pricing
const CARD_PRICES: Record<Exclude<CardRarity, 'starter'>, number> = {
  common: 1500,
  uncommon: 3000,
  rare: 6000,
};

const HARDWARE_PRICES: Record<ItemRarity, number> = {
  common: 2000,
  uncommon: 4000,
  rare: 8000,
};

// Panel dimensions
const PANEL_W = 1100;
const PANEL_H = 600;

// Card dimensions
const CARD_W = 180;
const CARD_H = 280;

// Hardware dimensions
const HW_W = 360;
const HW_H = 140;

// Button dimensions
const LEAVE_W = 200;
const LEAVE_H = 48;

// Module-level press tracking
let pressedCardIndex: number | null = null;
let pressedHwIndex: number | null = null;
let pressedLeave = false;

export type ShipShopAction =
  | { type: 'BUY_CARD'; cardId: string }
  | { type: 'BUY_HARDWARE'; itemId: string }
  | { type: 'LEAVE' };

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

function getCardPrice(card: TacticCard): number {
  if (card.rarity === 'starter') return CARD_PRICES.common;
  return CARD_PRICES[card.rarity];
}

/**
 * Render the ship shop (supply depot) screen.
 * 
 * @returns ShipShopAction if a purchase is made or player leaves, null otherwise
 */
export function renderShipShop(
  display: typeof MakkoEngine.display,
  pathCredits: number,
  shopItems: { cards: TacticCard[]; hardware: HardwareItem[] },
  mx: number,
  my: number,
  now: number,
): ShipShopAction | null {
  const input = MakkoEngine.input;

  // Center the panel
  const panelX = (SCREEN_WIDTH - PANEL_W) / 2;
  const panelY = (SCREEN_HEIGHT - PANEL_H) / 2;

  // Full-screen dark background
  display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, { fill: COLORS.bg });

  // Main panel
  display.drawRoundRect(panelX, panelY, PANEL_W, PANEL_H, 8, {
    fill: COLORS.panelFill,
    stroke: COLORS.panelStroke,
    lineWidth: 1,
  });

  // Header
  display.drawText('SUPPLY DEPOT — SPEND YOUR SALVAGE CREDITS', SCREEN_WIDTH / 2, panelY + 40, {
    font: 'bold 24px monospace',
    fill: COLORS.header,
    align: 'center',
  });

  // Credits display
  display.drawText('AVAILABLE CREDITS:', panelX + 40, panelY + 80, {
    font: '16px monospace',
    fill: COLORS.creditsLabel,
    align: 'left',
  });
  display.drawText(`₡${pathCredits.toLocaleString()}`, panelX + 220, panelY + 80, {
    font: 'bold 18px monospace',
    fill: COLORS.creditsValue,
    align: 'left',
  });

  // Mouse interaction state
  const isMouseDown = input.isMouseDown(0);
  const isMouseReleased = input.isMouseReleased(0);

  let result: ShipShopAction | null = null;

  // === CARDS SECTION (Left side) ===
  const cardsSectionX = panelX + 40;
  const cardsSectionY = panelY + 120;
  const cardsSectionW = 600;

  // Section label
  display.drawText('— CARDS —', cardsSectionX + cardsSectionW / 2, cardsSectionY - 10, {
    font: 'bold 14px monospace',
    fill: COLORS.subHeader,
    align: 'center',
  });

  // Render cards in a row
  const cardGap = 20;
  const cardsStartX = cardsSectionX + (cardsSectionW - (CARD_W * 3 + cardGap * 2)) / 2;

  for (let i = 0; i < shopItems.cards.length; i++) {
    const card = shopItems.cards[i];
    const x = cardsStartX + i * (CARD_W + cardGap);
    const y = cardsSectionY + 20;

    const price = getCardPrice(card);
    const affordable = pathCredits >= price;
    const hovered = mx >= x && mx <= x + CARD_W && my >= y && my <= y + CARD_H;

    // Handle click
    if (hovered && isMouseDown && affordable) {
      pressedCardIndex = i;
    }
    if (pressedCardIndex === i && isMouseReleased && hovered && affordable) {
      result = { type: 'BUY_CARD', cardId: card.id };
      pressedCardIndex = null;
    }

    // Card styling
    const rarityColor = COLORS.cardRarity[card.rarity];
    const isUnavailable = !affordable;

    // Background
    const bgColor = isUnavailable ? COLORS.unavailableBg : COLORS.cardBg;
    const frameColor = isUnavailable ? COLORS.cardFrame : hovered ? COLORS.panelStroke : COLORS.cardFrame;

    display.drawRoundRect(x, y, CARD_W, CARD_H, 6, {
      fill: bgColor,
      stroke: frameColor,
      lineWidth: hovered ? 2 : 1,
    });

    // Header
    const headerH = 40;
    display.drawRoundRect(x + 8, y + 8, CARD_W - 16, headerH, 4, {
      fill: isUnavailable ? COLORS.unavailableBg : COLORS.cardHeaderBg,
    });
    display.drawRect(x + 8, y + 8 + headerH - 2, CARD_W - 16, 2, {
      fill: rarityColor,
    });

    // Name
    const nameSize = card.name.length > 14 ? 10 : card.name.length > 10 ? 12 : 14;
    display.drawText(card.name, x + CARD_W / 2, y + 8 + headerH / 2, {
      font: `bold ${nameSize}px sans-serif`,
      fill: isUnavailable ? COLORS.unavailableText : COLORS.white,
      align: 'center',
      baseline: 'middle',
    });

    // Art area
    const artY = y + 8 + headerH + 6;
    const artH = 80;
    display.drawRoundRect(x + 8, artY, CARD_W - 16, artH, 4, {
      fill: '#2d3748',
      alpha: isUnavailable ? 0.3 : 0.5,
    });

    // Icon
    display.drawCircle(x + CARD_W / 2, artY + artH / 2, 20, {
      fill: COLORS.cardHeaderBg,
      stroke: rarityColor,
      lineWidth: 2,
    });
    display.drawText(card.name.charAt(0).toUpperCase(), x + CARD_W / 2, artY + artH / 2, {
      font: 'bold 16px sans-serif',
      fill: rarityColor,
      align: 'center',
      baseline: 'middle',
    });

    // Description
    const descY = artY + artH + 6;
    const descH = 70;
    display.drawRoundRect(x + 8, descY, CARD_W - 16, descH, 4, {
      fill: isUnavailable ? COLORS.unavailableBg : COLORS.cardDescBg,
    });

    const lines = wrapText(card.description, 18);
    for (let j = 0; j < lines.length && j < 3; j++) {
      display.drawText(lines[j], x + CARD_W / 2, descY + 12 + j * 18, {
        font: '11px sans-serif',
        fill: isUnavailable ? COLORS.unavailableText : COLORS.description,
        align: 'center',
        baseline: 'middle',
      });
    }

    // Price
    const priceY = y + CARD_H - 20;
    const priceText = `₡${price.toLocaleString()}`;
    const priceColor = isUnavailable ? COLORS.priceInsufficient : COLORS.priceText;

    if (isUnavailable) {
      display.drawText('INSUFFICIENT', x + CARD_W / 2, priceY - 8, {
        font: 'bold 10px sans-serif',
        fill: COLORS.priceInsufficient,
        align: 'center',
        baseline: 'middle',
      });
    }
    display.drawText(priceText, x + CARD_W / 2, priceY + 6, {
      font: 'bold 12px monospace',
      fill: priceColor,
      align: 'center',
      baseline: 'middle',
    });
  }

  // Reset pressed state if mouse released outside
  if (isMouseReleased && pressedCardIndex !== null && result === null) {
    pressedCardIndex = null;
  }

  // === HARDWARE SECTION (Right side) ===
  const hwSectionX = panelX + 660;
  const hwSectionY = panelY + 120;
  const hwSectionW = 400;

  // Section label
  display.drawText('— HARDWARE —', hwSectionX + hwSectionW / 2, hwSectionY - 10, {
    font: 'bold 14px monospace',
    fill: COLORS.subHeader,
    align: 'center',
  });

  // Render hardware items stacked
  const hwGap = 20;

  for (let i = 0; i < shopItems.hardware.length; i++) {
    const item = shopItems.hardware[i];
    const x = hwSectionX + (hwSectionW - HW_W) / 2;
    const y = hwSectionY + 20 + i * (HW_H + hwGap);

    const price = HARDWARE_PRICES[item.rarity];
    const affordable = pathCredits >= price;
    const hovered = mx >= x && mx <= x + HW_W && my >= y && my <= y + HW_H;

    // Handle click
    if (hovered && isMouseDown && affordable) {
      pressedHwIndex = i;
    }
    if (pressedHwIndex === i && isMouseReleased && hovered && affordable) {
      result = { type: 'BUY_HARDWARE', itemId: item.id };
      pressedHwIndex = null;
    }

    // Hardware styling
    const rarityColor = COLORS.hardwareRarity[item.rarity];
    const isUnavailable = !affordable;

    const bgColor = isUnavailable ? COLORS.unavailableBg : COLORS.hardwareBg;
    const frameColor = isUnavailable ? COLORS.hardwareFrame : hovered ? COLORS.panelStroke : COLORS.hardwareFrame;

    display.drawRoundRect(x, y, HW_W, HW_H, 6, {
      fill: bgColor,
      stroke: frameColor,
      lineWidth: hovered ? 2 : 1,
    });

    // Header with slot badge
    const headerH = 32;
    display.drawRoundRect(x + 8, y + 8, HW_W - 16, headerH, 4, {
      fill: isUnavailable ? COLORS.unavailableBg : COLORS.hardwareHeaderBg,
    });

    // Slot badge
    const slotColor = COLORS.slotLabel[item.slot];
    display.drawRoundRect(x + 12, y + 12, 50, 20, 3, {
      fill: slotColor,
    });
    display.drawText(item.slot.toUpperCase(), x + 37, y + 22, {
      font: 'bold 9px sans-serif',
      fill: COLORS.bg,
      align: 'center',
      baseline: 'middle',
    });

    // Name
    const nameSize = item.name.length > 18 ? 11 : 13;
    display.drawText(item.name, x + 72, y + 22, {
      font: `bold ${nameSize}px sans-serif`,
      fill: isUnavailable ? COLORS.unavailableText : COLORS.white,
      align: 'left',
      baseline: 'middle',
    });

    // Rarity strip
    display.drawRect(x + HW_W - 50, y + 8, 4, headerH, {
      fill: rarityColor,
    });

    // Description
    const descY = y + 8 + headerH + 8;
    const lines = wrapText(item.description, 40);
    for (let j = 0; j < lines.length && j < 2; j++) {
      display.drawText(lines[j], x + 12, descY + 10 + j * 16, {
        font: '12px sans-serif',
        fill: isUnavailable ? COLORS.unavailableText : COLORS.description,
        align: 'left',
        baseline: 'middle',
      });
    }

    // Price
    const priceText = `₡${price.toLocaleString()}`;
    const priceColor = isUnavailable ? COLORS.priceInsufficient : COLORS.priceText;

    display.drawText(priceText, x + HW_W - 20, y + HW_H - 15, {
      font: 'bold 12px monospace',
      fill: priceColor,
      align: 'right',
      baseline: 'middle',
    });

    if (isUnavailable) {
      display.drawText('INSUFFICIENT', x + HW_W - 20, y + HW_H - 32, {
        font: 'bold 9px sans-serif',
        fill: COLORS.priceInsufficient,
        align: 'right',
        baseline: 'middle',
      });
    }
  }

  if (isMouseReleased && pressedHwIndex !== null && result === null) {
    pressedHwIndex = null;
  }

  // === LEAVE BUTTON ===
  const leaveX = panelX + PANEL_W - LEAVE_W - 40;
  const leaveY = panelY + PANEL_H - LEAVE_H - 40;

  const leaveHovered = mx >= leaveX && mx <= leaveX + LEAVE_W && my >= leaveY && my <= leaveY + LEAVE_H;
  const leaveColor = leaveHovered ? COLORS.buttonHover : COLORS.buttonText;

  display.drawRoundRect(leaveX, leaveY, LEAVE_W, LEAVE_H, 6, {
    fill: COLORS.buttonFill,
    stroke: leaveHovered ? leaveColor : COLORS.cardFrame,
    lineWidth: leaveHovered ? 2 : 1,
  });

  display.drawText('LEAVE DEPOT →', leaveX + LEAVE_W / 2, leaveY + LEAVE_H / 2 + 2, {
    font: 'bold 14px sans-serif',
    fill: leaveColor,
    align: 'center',
    baseline: 'middle',
  });

  // Handle leave click
  if (leaveHovered && isMouseDown) {
    pressedLeave = true;
  }
  if (pressedLeave && isMouseReleased && leaveHovered) {
    result = { type: 'LEAVE' };
    pressedLeave = false;
  }
  if (isMouseReleased && pressedLeave) {
    pressedLeave = false;
  }

  return result;
}
