/**
 * Debt Contract Panel — Pre-Expedition Debt Display
 *
 * Displays a random corporate debt contract background image
 * with the player's current debt and breakdown as a holographic overlay.
 */

import { MakkoEngine } from '@makko/engine';
import {
  STARTING_DEBT,
  UPKEEP_PER_CREW,
  EXPEDITION_DEBT_BASE,
  EXPEDITION_DEBT_PER_CREW,
  SHIP_DEBT_MULTIPLIER,
} from '../../config/constants';
import { calculateStartingDebt, getDebtModifiers } from '../../dive/expedition-starting-debt';
import type { MetaState } from '../../types/state';

// Available debt contract background images
const DEBT_CONTRACT_BACKGROUNDS = [
  'ss-background-debt-contract-3',
  'ss-background-debt-contract-5',
  'ss-background-debt-contract-7',
  'ss-background-debt-contract-9',
  'ss-background-debt-contract-10',
  'ss-background-corporate-debt',
];

// Currently selected background (resets when panel closes)
let currentBackground: string | null = null;

function getRandomBackground(): string {
  const index = Math.floor(Math.random() * DEBT_CONTRACT_BACKGROUNDS.length);
  return DEBT_CONTRACT_BACKGROUNDS[index];
}

function getBackgroundForRender(): string {
  if (!currentBackground) {
    currentBackground = getRandomBackground();
  }
  return currentBackground;
}

function formatCredits(n: number): string {
  if (n >= 1000000) return `₡${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `₡${(n / 1000).toFixed(0)}K`;
  return `₡${n}`;
}

/**
 * Calculate the expedition debt breakdown components
 * Shows what debt will be when first ship is selected
 */
function calculateDebtBreakdown(meta: MetaState): {
  baseDebt: number;
  crewCount: number;
  crewCost: number;
  projectedTotal: number;
  total: number;
} {
  const awakeCrewCount = meta.leadId ? 1 + meta.companionIds.length : 0;
  
  // Calculate projected expedition debt for a standard ship
  const breakdown = getDebtModifiers(meta, 'standard');
  
  return {
    baseDebt: EXPEDITION_DEBT_BASE,
    crewCount: awakeCrewCount,
    crewCost: breakdown.crewCost,
    projectedTotal: breakdown.finalDebt,
    total: breakdown.finalDebt, // Use projected expedition debt
  };
}

export function renderDebtContractPanel(display: typeof MakkoEngine.display, meta: MetaState): void {
  // Full-screen background
  display.drawRect(0, 0, 1920, 1080, { fill: '#0d1117' });

  // Get and draw the random debt contract background
  const bgName = getBackgroundForRender();
  const bg = MakkoEngine.staticAsset(bgName);

  if (bg) {
    const scaleX = 1920 / bg.width;
    const scaleY = 1080 / bg.height;
    const scale = Math.max(scaleX, scaleY);
    const scaledWidth = bg.width * scale;
    const scaledHeight = bg.height * scale;
    const x = (1920 - scaledWidth) / 2;
    const y = (1080 - scaledHeight) / 2;
    display.drawImage(bg.image, x, y, scaledWidth, scaledHeight);
  }

  // Draw vignette to darken edges for text readability
  renderVignette(display);

  // Draw the holographic debt display overlay
  renderDebtHologram(display, meta);
}

function renderVignette(display: typeof MakkoEngine.display): void {
  // Center area stays clear, edges darken
  const centerX = 960;
  const centerY = 540;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
  
  // Draw radial gradient vignette using concentric circles
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    const progress = i / steps;
    const radius = 400 + progress * (maxRadius - 400);
    const alpha = progress * progress * 0.7; // Stronger darkness at edges
    
    display.drawCircle(centerX, centerY, radius, {
      stroke: '#000000',
      lineWidth: (maxRadius - 400) / steps + 2,
      alpha,
    });
  }
}

function renderDebtHologram(display: typeof MakkoEngine.display, meta: MetaState): void {
  const breakdown = calculateDebtBreakdown(meta);
  const centerX = 960;
  
  // Position in upper area (moved down for better composition)
  const panelY = 220;
  const panelWidth = 720;
  const panelHeight = 500;
  const panelX = centerX - panelWidth / 2;

  // Stronger backdrop for light/dark background compatibility
  // Inner solid area
  display.drawRect(panelX + 40, panelY + 40, panelWidth - 80, panelHeight - 80, {
    fill: '#000000',
    alpha: 0.75,
  });
  
  // Outer gradient fade
  const fadeSteps = 15;
  for (let i = 0; i < fadeSteps; i++) {
    const alpha = 0.6 - (i / fadeSteps) * 0.6;
    const inset = i * 3;
    display.drawRect(panelX + inset, panelY + inset, panelWidth - inset * 2, panelHeight - inset * 2, {
      fill: '#000000',
      alpha,
    });
  }

  // Bright cyan border frame
  display.drawRect(panelX, panelY, panelWidth, panelHeight, {
    stroke: '#00d4ff',
    lineWidth: 3,
    alpha: 0.9,
  });

  // Corner accents - larger and bolder
  const cornerSize = 50;
  const cornerWeight = 4;
  
  // All four corners
  const corners = [
    { x: panelX, y: panelY }, // Top-left
    { x: panelX + panelWidth, y: panelY }, // Top-right
    { x: panelX, y: panelY + panelHeight }, // Bottom-left
    { x: panelX + panelWidth, y: panelY + panelHeight }, // Bottom-right
  ];
  
  for (const corner of corners) {
    const isRight = corner.x > panelX + panelWidth / 2;
    const isBottom = corner.y > panelY + panelHeight / 2;
    const dx = isRight ? -1 : 1;
    const dy = isBottom ? -1 : 1;
    
    // Horizontal line
    display.drawLine(
      corner.x, 
      corner.y, 
      corner.x + dx * cornerSize, 
      corner.y, 
      { stroke: '#00d4ff', lineWidth: cornerWeight, alpha: 1 }
    );
    // Vertical line
    display.drawLine(
      corner.x, 
      corner.y, 
      corner.x, 
      corner.y + dy * cornerSize, 
      { stroke: '#00d4ff', lineWidth: cornerWeight, alpha: 1 }
    );
  }

  // Header bar - thicker
  display.drawRect(panelX + 30, panelY + 35, panelWidth - 60, 4, { 
    fill: '#00d4ff', 
    alpha: 0.8 
  });
  
  // Header text - MUCH LARGER
  display.drawText('CURRENT DEBT OBLIGATION', centerX, panelY + 70, {
    font: 'bold 28px monospace',
    fill: '#00d4ff',
    align: 'center',
    baseline: 'top',
  });

  // Main debt value - MASSIVE with outline effect for contrast
  const debtText = formatCredits(breakdown.total);
  const debtY = panelY + 115;
  
  // Black outline for contrast on light backgrounds
  for (let ox = -3; ox <= 3; ox += 2) {
    for (let oy = -3; oy <= 3; oy += 2) {
      if (Math.abs(ox) + Math.abs(oy) > 4) continue;
      display.drawText(debtText, centerX + ox, debtY + oy, {
        font: 'bold 110px monospace',
        fill: '#000000',
        align: 'center',
        baseline: 'top',
      });
    }
  }
  
  // Red glow layers
  for (let i = 5; i >= 0; i--) {
    const glowAlpha = 0.15 - i * 0.025;
    const offset = i * 3;
    display.drawText(debtText, centerX + offset, debtY, {
      font: 'bold 110px monospace',
      fill: '#ff0040',
      align: 'center',
      baseline: 'top',
      alpha: glowAlpha,
    });
    display.drawText(debtText, centerX - offset, debtY, {
      font: 'bold 110px monospace',
      fill: '#ff0040',
      align: 'center',
      baseline: 'top',
      alpha: glowAlpha,
    });
    display.drawText(debtText, centerX, debtY + offset, {
      font: 'bold 110px monospace',
      fill: '#ff0040',
      align: 'center',
      baseline: 'top',
      alpha: glowAlpha,
    });
  }
  
  // Main debt number
  display.drawText(debtText, centerX, debtY, {
    font: 'bold 110px monospace',
    fill: '#ff2d55',
    align: 'center',
    baseline: 'top',
  });

  // Divider - thicker
  display.drawLine(panelX + 80, panelY + 250, panelX + panelWidth - 80, panelY + 250, {
    stroke: '#00d4ff',
    lineWidth: 2,
    alpha: 0.5,
  });

  // Breakdown section header
  display.drawText('BREAKDOWN', centerX, panelY + 275, {
    font: 'bold 24px monospace',
    fill: '#00d4ff',
    align: 'center',
    baseline: 'top',
  });

  // Breakdown items - LARGER
  let currentY = panelY + 325;
  const lineHeight = 55;

  // Base expedition debt
  renderBreakdownLine(display, centerX, currentY, 'BASE DEBT', formatCredits(breakdown.baseDebt), false);
  currentY += lineHeight;

  // Crew cost for expedition
  if (breakdown.crewCount > 0) {
    const crewLabel = `CREW (${breakdown.crewCount} × ₡50k)`;
    renderBreakdownLine(display, centerX, currentY, crewLabel, formatCredits(breakdown.crewCost), false);
    currentY += lineHeight;
  }

  // Thin divider before next billing
  display.drawLine(panelX + 120, currentY + 10, panelX + panelWidth - 120, currentY + 10, {
    stroke: '#00d4ff',
    lineWidth: 1,
    alpha: 0.3,
  });
  currentY += 35;

  // Next billing info - LARGER
  // Calculate billing based on projected expedition debt (30% of total)
  const billingPercent = 0.30;
  const projectedBilling = Math.floor(breakdown.projectedTotal * billingPercent);
  display.drawText(`FIRST BILLING (30%): ${formatCredits(projectedBilling)}`, centerX, currentY, {
    font: 'bold 22px monospace',
    fill: '#00d4ff',
    align: 'center',
    baseline: 'top',
  });



  // Scanning line effect
  const scanY = panelY + 100 + (Date.now() % 3000) / 3000 * 280;
  if (scanY < panelY + panelHeight - 30) {
    display.drawRect(panelX + 15, scanY, panelWidth - 30, 3, {
      fill: '#00d4ff',
      alpha: 0.2,
    });
  }
}

function renderBreakdownLine(
  display: typeof MakkoEngine.display,
  centerX: number,
  y: number,
  label: string,
  value: string,
  isPenalty: boolean
): void {
  const labelX = centerX - 160;
  const valueX = centerX + 160;

  // Label with outline for readability
  for (let ox = -2; ox <= 2; ox += 2) {
    for (let oy = -2; oy <= 2; oy += 2) {
      if (Math.abs(ox) + Math.abs(oy) > 3) continue;
      display.drawText(label, labelX + ox, y + oy, {
        font: 'bold 22px monospace',
        fill: '#000000',
        align: 'left',
        baseline: 'middle',
      });
    }
  }
  
  display.drawText(label, labelX, y, {
    font: 'bold 22px monospace',
    fill: isPenalty ? '#ff6b6b' : '#a0aec0',
    align: 'left',
    baseline: 'middle',
  });

  // Value with outline
  for (let ox = -2; ox <= 2; ox += 2) {
    for (let oy = -2; oy <= 2; oy += 2) {
      if (Math.abs(ox) + Math.abs(oy) > 3) continue;
      display.drawText(value, valueX + ox, y + oy, {
        font: 'bold 26px monospace',
        fill: '#000000',
        align: 'right',
        baseline: 'middle',
      });
    }
  }
  
  display.drawText(value, valueX, y, {
    font: 'bold 26px monospace',
    fill: isPenalty ? '#ff6b6b' : '#e2e8f0',
    align: 'right',
    baseline: 'middle',
  });
}

export function updateDebtContractInput(): boolean {
  const input = MakkoEngine.input;
  return input.isKeyPressed('Space') || input.isKeyPressed('Enter') || input.isMousePressed(0);
}

export function resetDebtContractBackground(): void {
  currentBackground = null;
}
