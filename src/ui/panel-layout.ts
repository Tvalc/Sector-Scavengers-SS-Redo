// Shared panel layout constants and helpers for hero-style panels

import { MakkoEngine } from '@makko/engine';

// ── Screen Dimensions ────────────────────────────────────────────────────────
export const SCREEN_W = 1920;
export const SCREEN_H = 1080;

// ── Zone Layout ─────────────────────────────────────────────────────────────
export const LEFT_ZONE = { x: 80, y: 110, w: 640, h: 860 };
export const RIGHT_ZONE = { x: 720, y: 110, w: 1120, h: 860 };
export const NAV_Y = 990;

// ── Colors ──────────────────────────────────────────────────────────────────
export const ACCENT = '#22d3ee';
export const GOLD = '#f6ad55';
export const SUCCESS = '#68d391';
export const ERROR = '#fc8181';
export const WARNING = '#f59e0b';
export const TEXT_PRIMARY = '#e2e8f0';
export const TEXT_SECONDARY = '#94a3b8';
export const TEXT_MUTED = '#64748b';
export const BG = '#0a0e14';
export const BG_PANEL = '#0d1117';
export const BORDER_DEFAULT = '#1e293b';
export const LOCK_COLOR = '#4a5568';

// ── Hit Detection ───────────────────────────────────────────────────────────
export function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

// ── Text Wrapping ────────────────────────────────────────────────────────────
export function wrapText(text: string, maxWidth: number, font: string): string[] {
  const display = MakkoEngine.display;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = display.measureText(testLine, { font });
    if (metrics.width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

// ── Navigation Renderer ─────────────────────────────────────────────────────
export interface NavigationResult {
  newPage: number | null;
}

export function renderNavigation(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  currentPage: number,
  totalPages: number,
  options?: {
    leftBtnX?: number;
    rightBtnX?: number;
    btnY?: number;
    btnW?: number;
    btnH?: number;
    dotStartX?: number;
  }
): number | null {
  const btnY = options?.btnY ?? NAV_Y;
  const btnW = options?.btnW ?? 100;
  const btnH = options?.btnH ?? 60;
  const leftBtnX = options?.leftBtnX ?? 860;
  const rightBtnX = options?.rightBtnX ?? 1060;
  const dotStartX = options?.dotStartX ?? 1200;
  const dotY = btnY + btnH / 2;

  // Left arrow
  const leftHover = isOver(mx, my, leftBtnX, btnY, btnW, btnH);
  display.drawRoundRect(leftBtnX, btnY, btnW, btnH, 6, {
    fill: leftHover ? '#1e293b' : '#0f172a',
    stroke: leftHover ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText('◀', leftBtnX + btnW / 2, btnY + btnH / 2, {
    font: 'bold 32px monospace',
    fill: leftHover ? ACCENT : TEXT_SECONDARY,
    align: 'center',
    baseline: 'middle',
  });

  // Right arrow
  const rightHover = isOver(mx, my, rightBtnX, btnY, btnW, btnH);
  display.drawRoundRect(rightBtnX, btnY, btnW, btnH, 6, {
    fill: rightHover ? '#1e293b' : '#0f172a',
    stroke: rightHover ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText('▶', rightBtnX + btnW / 2, btnY + btnH / 2, {
    font: 'bold 24px monospace',
    fill: rightHover ? ACCENT : TEXT_SECONDARY,
    align: 'center',
    baseline: 'middle',
  });

  // Page counter (X/X format)
  const pageCounterX = dotStartX + 60;
  display.drawText(`${currentPage + 1}/${totalPages}`, pageCounterX, dotY, {
    font: 'bold 28px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'middle',
  });

  // Handle clicks
  if (leftHover && input.isMouseReleased(0)) {
    return (currentPage - 1 + totalPages) % totalPages;
  }
  if (rightHover && input.isMouseReleased(0)) {
    return (currentPage + 1) % totalPages;
  }

  return null;
}

// ── Top Bar Renderer ────────────────────────────────────────────────────────
export interface TopBarAction {
  type: 'CLOSE' | null;
}

export function renderTopBar(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  title: string,
  currentPage: number,
  totalPages: number,
  options?: {
    showPageIndicator?: boolean;
    pageLabel?: string;
    closeX?: number;
    closeY?: number;
    closeW?: number;
    closeH?: number;
  }
): 'CLOSE' | null {
  const showPageIndicator = options?.showPageIndicator ?? true;
  const pageLabel = options?.pageLabel ?? 'Page';
  const closeX = options?.closeX ?? SCREEN_W - 180;
  const closeY = options?.closeY ?? 20;
  const closeW = options?.closeW ?? 160;
  const closeH = options?.closeH ?? 50;

  // Title centered
  display.drawText(title, SCREEN_W / 2, 50, {
    font: 'bold 56px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'middle',
  });

  // Page indicator top-left
  if (showPageIndicator) {
    display.drawText(`${pageLabel} ${currentPage + 1} of ${totalPages}`, 40, 50, {
      font: '28px monospace',
      fill: TEXT_SECONDARY,
      align: 'left',
      baseline: 'middle',
    });
  }

  // Close button top-right
  const closeHover = isOver(mx, my, closeX, closeY, closeW, closeH);
  display.drawRoundRect(closeX, closeY, closeW, closeH, 8, {
    fill: closeHover ? '#2d3748' : '#1a202c',
    stroke: closeHover ? ACCENT : TEXT_MUTED,
    lineWidth: 2,
  });
  display.drawText('✕ CLOSE', closeX + closeW / 2, closeY + closeH / 2, {
    font: 'bold 26px monospace',
    fill: closeHover ? ACCENT : TEXT_SECONDARY,
    align: 'center',
    baseline: 'middle',
  });

  if (closeHover && input.isMouseReleased(0)) {
    return 'CLOSE';
  }

  return null;
}

// ── Panel Background Renderers ──────────────────────────────────────────────
export function renderLeftPanelBg(display: typeof MakkoEngine.display): void {
  display.drawRect(LEFT_ZONE.x, LEFT_ZONE.y, LEFT_ZONE.w, LEFT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });
}

export function renderRightPanelBg(display: typeof MakkoEngine.display): void {
  display.drawRect(RIGHT_ZONE.x, RIGHT_ZONE.y, RIGHT_ZONE.w, RIGHT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });
}

// ── Hero Frame Renderer (for left zone visuals) ────────────────────────────
export function renderHeroFrame(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
  }
): void {
  display.drawRect(x, y, w, h, {
    fill: options?.fill ?? BG,
    stroke: options?.stroke ?? ACCENT,
    lineWidth: options?.lineWidth ?? 2,
  });
}

// ── Level Pips Renderer ────────────────────────────────────────────────────
export function renderLevelPips(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  currentLevel: number,
  maxLevel: number = 3,
  options?: {
    pipW?: number;
    pipH?: number;
    pipGap?: number;
    filledColor?: string;
    emptyColor?: string;
  }
): void {
  const pipW = options?.pipW ?? 48;
  const pipH = options?.pipH ?? 16;
  const pipGap = options?.pipGap ?? 12;
  const filledColor = options?.filledColor ?? ACCENT;
  const emptyColor = options?.emptyColor ?? '#1a202c';

  let pipX = x;
  for (let i = 0; i < maxLevel; i++) {
    const filled = i < currentLevel;
    display.drawRoundRect(pipX, y, pipW, pipH, 4, {
      fill: filled ? filledColor : emptyColor,
      stroke: filled ? filledColor : BORDER_DEFAULT,
      lineWidth: 2,
    });
    pipX += pipW + pipGap;
  }
}

// ── Status Badge Renderer ──────────────────────────────────────────────────
export function renderStatusBadge(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string,
  options?: {
    fill?: string;
    font?: string;
  }
): void {
  display.drawRoundRect(x, y, w, h, 6, {
    fill: options?.fill ?? '#1a202c',
    stroke: color,
    lineWidth: 2,
  });
  display.drawText(label, x + w / 2, y + h / 2, {
    font: options?.font ?? 'bold 24px monospace',
    fill: color,
    align: 'center',
    baseline: 'middle',
  });
}

// ── Button Renderers ───────────────────────────────────────────────────────
export function renderPrimaryButton(
  display: typeof MakkoEngine.display,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  hover: boolean,
  options?: {
    fill?: string;
    fillHover?: string;
    stroke?: string;
    strokeHover?: string;
    textColor?: string;
    textColorHover?: string;
    font?: string;
    radius?: number;
  }
): void {
  const fill = hover
    ? (options?.fillHover ?? '#1e293b')
    : (options?.fill ?? '#0f172a');
  const stroke = hover
    ? (options?.strokeHover ?? ACCENT)
    : (options?.stroke ?? BORDER_DEFAULT);
  const textColor = hover
    ? (options?.textColorHover ?? ACCENT)
    : (options?.textColor ?? TEXT_SECONDARY);

  display.drawRoundRect(x, y, w, h, options?.radius ?? 6, {
    fill,
    stroke,
    lineWidth: 2,
  });
  display.drawText(label, x + w / 2, y + h / 2, {
    font: options?.font ?? 'bold 22px monospace',
    fill: textColor,
    align: 'center',
    baseline: 'middle',
  });
}

export function renderActionButton(
  display: typeof MakkoEngine.display,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  hover: boolean,
  enabled: boolean,
  options?: {
    enabledFill?: string;
    enabledFillHover?: string;
    disabledFill?: string;
    enabledStroke?: string;
    enabledStrokeHover?: string;
    disabledStroke?: string;
    enabledText?: string;
    disabledText?: string;
    font?: string;
    radius?: number;
  }
): void {
  if (enabled) {
    const fill = hover
      ? (options?.enabledFillHover ?? '#1e4a3a')
      : (options?.enabledFill ?? '#0f3a2a');
    const stroke = hover
      ? (options?.enabledStrokeHover ?? SUCCESS)
      : (options?.enabledStroke ?? ACCENT);

    display.drawRoundRect(x, y, w, h, options?.radius ?? 6, {
      fill,
      stroke,
      lineWidth: 2,
    });
    display.drawText(label, x + w / 2, y + h / 2, {
      font: options?.font ?? 'bold 16px monospace',
      fill: options?.enabledText ?? ACCENT,
      align: 'center',
      baseline: 'middle',
    });
  } else {
    display.drawRoundRect(x, y, w, h, options?.radius ?? 6, {
      fill: options?.disabledFill ?? '#1a202c',
      stroke: options?.disabledStroke ?? BORDER_DEFAULT,
      lineWidth: 2,
    });
    display.drawText(label, x + w / 2, y + h / 2, {
      font: options?.font ?? 'bold 16px monospace',
      fill: options?.disabledText ?? TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
  }
}

// ── Single Panel Progression Layout ─────────────────────────────────────────
// Alternative to 3-column layout: one large panel with stepper-style progression

export interface ProgressionTier {
  tierNumber: number;
  label: string;
  isComplete: boolean;
  isCurrent: boolean;
}

export interface SinglePanelProgressionConfig {
  tiers: ProgressionTier[];
  currentTierIndex: number;
  accentColor: string;
  headerTitle?: string;
  headerSubtitle?: string;
}

/**
 * Renders a stepper-style progress indicator at the top of a panel.
 * Shows all tiers as connected steps with current highlighted.
 */
export function renderProgressionStepper(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  w: number,
  config: SinglePanelProgressionConfig
): void {
  const stepCount = config.tiers.length;
  const stepGap = w / (stepCount + 1);
  const stepY = y + 30;
  const lineY = stepY;
  const startX = x + stepGap;

  // Draw connecting line behind steps
  const lineStartX = startX;
  const lineEndX = startX + (stepCount - 1) * stepGap;
  display.drawLine(lineStartX, lineY, lineEndX, lineY, {
    stroke: BORDER_DEFAULT,
    lineWidth: 4,
  });

  // Draw completed portion of line
  const completedEndX = startX + config.currentTierIndex * stepGap;
  if (config.currentTierIndex > 0) {
    display.drawLine(lineStartX, lineY, completedEndX, lineY, {
      stroke: config.accentColor,
      lineWidth: 4,
    });
  }

  // Draw each step
  config.tiers.forEach((tier, index) => {
    const stepX = startX + index * stepGap;
    const stepRadius = tier.isCurrent ? 28 : 22;

    // Step circle
    const fillColor = tier.isComplete ? config.accentColor
      : tier.isCurrent ? GOLD
      : '#1a202c';
    const strokeColor = tier.isComplete || tier.isCurrent ? config.accentColor
      : tier.isCurrent ? GOLD
      : LOCK_COLOR;
    const strokeWidth = tier.isCurrent ? 4 : 2;

    display.drawCircle(stepX, stepY, stepRadius, {
      fill: fillColor,
      stroke: strokeColor,
      lineWidth: strokeWidth,
    });

    // Step number or checkmark
    const stepText = tier.isComplete ? '✓' : `${tier.tierNumber}`;
    const textColor = tier.isComplete ? '#0a0e14'
      : tier.isCurrent ? '#0a0e14'
      : LOCK_COLOR;

    display.drawText(stepText, stepX, stepY, {
      font: tier.isCurrent ? 'bold 30px monospace' : 'bold 24px monospace',
      fill: textColor,
      align: 'center',
      baseline: 'middle',
    });

    // Step label below
    const labelY = stepY + stepRadius + 24;
    const labelColor = tier.isComplete ? config.accentColor
      : tier.isCurrent ? GOLD
      : TEXT_MUTED;

    display.drawText(tier.label, stepX, labelY, {
      font: tier.isCurrent ? 'bold 22px monospace' : '20px monospace',
      fill: labelColor,
      align: 'center',
      baseline: 'middle',
    });
  });
}

/**
 * Renders content area for a single-panel progression view.
 * Shows current tier prominently with context of previous/next.
 */
export function renderSinglePanelContentArea(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  w: number,
  h: number,
  config: SinglePanelProgressionConfig,
  renderCurrentContent: (
    display: typeof MakkoEngine.display,
    x: number,
    y: number,
    w: number,
    h: number
  ) => void,
  renderPreviousSummary?: (
    display: typeof MakkoEngine.display,
    x: number,
    y: number,
    w: number,
    tier: ProgressionTier
  ) => void,
  renderNextPreview?: (
    display: typeof MakkoEngine.display,
    x: number,
    y: number,
    w: number,
    tier: ProgressionTier
  ) => void
): void {
  const currentTier = config.tiers[config.currentTierIndex];
  const hasPrevious = config.currentTierIndex > 0;
  const hasNext = config.currentTierIndex < config.tiers.length - 1;

  // Main content area (current tier)
  const mainY = y;
  const mainH = hasPrevious || hasNext ? h * 0.65 : h;

  // Background for current tier
  display.drawRoundRect(x, mainY, w, mainH, 12, {
    fill: '#0f172a',
    stroke: currentTier?.isComplete ? config.accentColor : GOLD,
    lineWidth: 3,
  });

  // Left accent bar
  display.drawRect(x, mainY, 6, mainH, {
    fill: currentTier?.isComplete ? config.accentColor : GOLD,
  });

  // Render current tier content
  renderCurrentContent(display, x + 30, mainY + 30, w - 60, mainH - 60);

  // Previous tier summary (bottom left)
  if (hasPrevious && renderPreviousSummary) {
    const prevY = y + h * 0.7;
    const prevH = h * 0.3;
    const prevW = hasNext ? w * 0.48 : w;
    const prevTier = config.tiers[config.currentTierIndex - 1];

    display.drawRoundRect(x, prevY, prevW, prevH, 8, {
      fill: '#0a0e14',
      stroke: config.accentColor,
      lineWidth: 2,
      alpha: 0.6,
    });

    display.drawText('✓ COMPLETED', x + 20, prevY + 20, {
      font: 'bold 20px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'top',
    });

    renderPreviousSummary(display, x + 20, prevY + 50, prevW - 40, prevTier);
  }

  // Next tier preview (bottom right)
  if (hasNext && renderNextPreview) {
    const nextY = y + h * 0.7;
    const nextH = h * 0.3;
    const nextW = hasPrevious ? w * 0.48 : w;
    const nextX = hasPrevious ? x + w * 0.52 : x;
    const nextTier = config.tiers[config.currentTierIndex + 1];

    display.drawRoundRect(nextX, nextY, nextW, nextH, 8, {
      fill: '#0a0e14',
      stroke: LOCK_COLOR,
      lineWidth: 2,
    });

    display.drawText('NEXT', nextX + nextW - 20, nextY + 20, {
      font: 'bold 20px monospace',
      fill: TEXT_MUTED,
      align: 'right',
      baseline: 'top',
    });

    renderNextPreview(display, nextX + 20, nextY + 50, nextW - 40, nextTier);
  }
}
