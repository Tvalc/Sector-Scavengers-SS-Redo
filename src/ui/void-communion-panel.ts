// Void Communion panel — hero-style full screen layout with single-panel progression.

import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import {
  VOID_TIERS,
  VoidBranchId,
  VoidTier,
  getPurchasedTiersForBranch,
  getNextTierForBranch,
} from '../content/void-communion';

import { feedbackLayer } from './feedback-layer';
import {
  SCREEN_W,
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
  renderLeftPanelBg,
  renderHeroFrame,
  renderProgressionStepper,
  renderSinglePanelContentArea,
  SinglePanelProgressionConfig,
  ProgressionTier,
} from './panel-layout';
import { setBounds } from './tutorial-bounds';

export type VoidCommunionAction =
  | { type: 'BUY_VOID_TIER'; tierId: string }
  | { type: 'CLOSE_VOID' };

// ── Constants ───────────────────────────────────────────────────────────────
const BRANCHES: VoidBranchId[] = ['survivor', 'risk_taker', 'void_walker'];

const BRANCH_LABELS: Record<VoidBranchId, string> = {
  survivor: 'SURVIVOR',
  risk_taker: 'RISK TAKER',
  void_walker: 'VOID WALKER',
  insurgent: 'INSURGENT',
  archivist: 'ARCHIVIST',
};

const BRANCH_COLORS: Record<VoidBranchId, string> = {
  survivor: '#68d391',
  risk_taker: '#f6ad55',
  void_walker: '#a78bfa',
  insurgent: '#f56565',
  archivist: '#4fd1c5',
};

const BRANCH_ICONS: Record<VoidBranchId, string> = {
  survivor: '◈',
  risk_taker: '⚡',
  void_walker: '◉',
  insurgent: '✦',
  archivist: '◎',
};

const BRANCH_DESCRIPTIONS: Record<VoidBranchId, string> = {
  survivor: 'Defensive path. Gain starting shield charges to protect your hull.',
  risk_taker: 'Aggressive path. Increase scavenge yields for greater rewards.',
  void_walker: 'Void path. Amplify echo gains when facing collapse.',
  insurgent: 'Combat path. Enhanced fighting capabilities.',
  archivist: 'Knowledge path. Uncover hidden truths.',
};

const VOID_ECHO_COLOR = '#a78bfa';

// ── State ────────────────────────────────────────────────────────────────────
let currentBranchPage = 0;

/** Reset the void communion page when opening the panel. */
export function resetVoidPage(): void {
  currentBranchPage = 0;
}

// ── Helper Functions ─────────────────────────────────────────────────────────

function tierState(
  tier: VoidTier,
  purchasedIds: string[],
  voidEcho: number,
): 'purchased' | 'available' | 'locked' | 'unaffordable' {
  if (purchasedIds.includes(tier.id)) return 'purchased';
  const next = getNextTierForBranch(purchasedIds, tier.branch);
  if (!next || next.id !== tier.id) return 'locked';
  if (voidEcho < tier.cost) return 'unaffordable';
  return 'available';
}

function effectLabel(tier: VoidTier): string {
  const e = tier.effect;
  switch (e.type) {
    case 'starting_shields': return `+${e.value} starting shield charge${e.value > 1 ? 's' : ''}`;
    case 'scavenge_bonus': return `Scavenge +₡${e.value}`;
    case 'echo_multiplier': return `Echo multiplier +${e.value}`;
    case 'debt_reduction_per_run': return `Debt −₡${e.amount} per run`;
    case 'signal_extra_choice': return '+1 signal choice';
    case 'smuggler_card_weight_bonus': return 'Smuggler cards more common';
    case 'map_preview_rounds': return `Preview next ${e.count} rounds`;
    case 'lore_always_visible': return 'All lore always visible';
    case 'debt_clear_echo_bonus': return `x${e.multiplier} echo on debt clear`;
    default: return '';
  }
}

function getPurchasedCountForBranch(branch: VoidBranchId, purchasedIds: string[]): number {
  return VOID_TIERS.filter(t => t.branch === branch && purchasedIds.includes(t.id)).length;
}

function getStateColor(state: 'purchased' | 'available' | 'locked' | 'unaffordable', branchColor: string): string {
  switch (state) {
    case 'purchased': return branchColor;
    case 'available': return SUCCESS;
    case 'unaffordable': return GOLD;
    case 'locked': return LOCK_COLOR;
  }
}

// ── Main Render Function ───────────────────────────────────────────────────

export function renderVoidCommunion(
  meta: MetaState,
  mx: number,
  my: number,
  _dt: number,
): VoidCommunionAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  let action: VoidCommunionAction | null = null;

  // Full screen clear
  display.clear(BG);

  // Ensure page is in valid range
  const totalBranches = BRANCHES.length;
  // Allow any page initially, clamp only if out of bounds
  if (currentBranchPage < 0) currentBranchPage = totalBranches - 1;
  if (currentBranchPage >= totalBranches) currentBranchPage = 0;

  const currentBranch = BRANCHES[currentBranchPage];
  const branchColor = BRANCH_COLORS[currentBranch];
  const purchasedCount = getPurchasedCountForBranch(currentBranch, meta.purchasedVoidTiers);

  // ── Top Bar ─────────────────────────────────────────────────────────────────
  const topAction = renderTopBar(
    display, input, mx, my,
    'VOID COMMUNION',
    currentBranchPage,
    totalBranches,
    { pageLabel: 'Branch' }
  );
  if (topAction === 'CLOSE') {
    action = { type: 'CLOSE_VOID' };
  }

  // Void Echo pill in top-right
  const echoPillX = SCREEN_W - 400;
  const echoPillY = 20;
  const echoPillW = 200;
  const echoPillH = 44;
  display.drawRoundRect(echoPillX, echoPillY, echoPillW, echoPillH, 8, {
    fill: '#1a1040',
    stroke: VOID_ECHO_COLOR,
    lineWidth: 2,
  });
  display.drawText(`Void Echo: ${meta.voidEcho}`, echoPillX + echoPillW / 2, echoPillY + echoPillH / 2, {
    font: 'bold 20px monospace',
    fill: VOID_ECHO_COLOR,
    align: 'center',
    baseline: 'middle',
  });
  setBounds('void-echo-count', { x: echoPillX, y: echoPillY, w: echoPillW, h: echoPillH });

  // ── Navigation (process first so clicks aren't blocked by other zones) ───
  const navAction = renderNavigation(
    display, input, mx, my, currentBranchPage, totalBranches
  );
  if (navAction !== null) {
    currentBranchPage = navAction;
  }

  // ── Left Zone: Branch Identity ───────────────────────────────────────────
  renderLeftZone(display, currentBranch);

  // ── Right Zone: Single Panel Progression ───────────────────────────────
  const rightAction = renderRightZone(display, input, mx, my, currentBranch, meta, branchColor);
  if (rightAction) action = rightAction;

  // ── Keyboard Input ────────────────────────────────────────────────────────
  if (input.isKeyPressed('Escape')) {
    action = { type: 'CLOSE_VOID' };
  }

  return action;
}

// ── Left Zone Renderer ───────────────────────────────────────────────────────

function renderLeftZone(
  display: typeof MakkoEngine.display,
  branch: VoidBranchId,
): void {
  renderLeftPanelBg(display);

  const branchColor = BRANCH_COLORS[branch];
  let y = LEFT_ZONE.y + 60;

  // Branch icon (large)
  display.drawText(BRANCH_ICONS[branch], LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
    font: 'bold 120px monospace',
    fill: branchColor,
    align: 'center',
    baseline: 'top',
  });
  y += 160;

  // Branch name
  display.drawText(BRANCH_LABELS[branch], LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
    font: 'bold 48px monospace',
    fill: branchColor,
    align: 'center',
    baseline: 'top',
  });
  y += 80;

  // Branch description (hero/title-only layout - no progress info)
  const descLines = wrapText(BRANCH_DESCRIPTIONS[branch], LEFT_ZONE.w - 80, '30px monospace');
  for (const line of descLines) {
    display.drawText(line, LEFT_ZONE.x + LEFT_ZONE.w / 2, y, {
      font: '30px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'top',
    });
    y += 44;
  }

  setBounds('void-branches', { x: LEFT_ZONE.x, y: LEFT_ZONE.y, w: LEFT_ZONE.w, h: LEFT_ZONE.h });
}

// ── Right Zone Renderer ─────────────────────────────────────────────────────

function renderRightZone(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  branch: VoidBranchId,
  meta: MetaState,
  branchColor: string
): VoidCommunionAction | null {
  let action: VoidCommunionAction | null = null;

  // Background panel
  display.drawRect(RIGHT_ZONE.x, RIGHT_ZONE.y, RIGHT_ZONE.w, RIGHT_ZONE.h, {
    fill: BG_PANEL,
    stroke: BORDER_DEFAULT,
    lineWidth: 2,
  });

  let y = RIGHT_ZONE.y + 20;

  // ── Progress Summary Header ───────────────────────────────────────────────
  const purchasedCount = getPurchasedCountForBranch(branch, meta.purchasedVoidTiers);
  const nextTier = getNextTierForBranch(meta.purchasedVoidTiers, branch);

  const progressText = nextTier
    ? `${purchasedCount}/3 purchased — ${nextTier.cost} Echo for next`
    : `${purchasedCount}/3 purchased — PATH COMPLETE`;

  display.drawText(progressText, RIGHT_ZONE.x + RIGHT_ZONE.w - 40, y, {
    font: 'bold 28px monospace',
    fill: TEXT_SECONDARY,
    align: 'right',
    baseline: 'top',
  });
  y += 50;

  // Get tiers for this branch
  const branchTiers = VOID_TIERS
    .filter(t => t.branch === branch)
    .sort((a, b) => a.tier - b.tier);

  const currentTierIdx = branchTiers.findIndex(t => {
    const state = tierState(t, meta.purchasedVoidTiers, meta.voidEcho);
    return state === 'available' || state === 'unaffordable';
  });
  const effectiveIdx = currentTierIdx >= 0 ? currentTierIdx : 3;

  // ── Progression Stepper ─────────────────────────────────────────────────
  const stepperConfig: SinglePanelProgressionConfig = {
    currentTierIndex: effectiveIdx,
    accentColor: branchColor,
    tiers: branchTiers.map((t, i) => {
      const state = tierState(t, meta.purchasedVoidTiers, meta.voidEcho);
      return {
        tierNumber: t.tier,
        label: `Tier ${t.tier}`,
        isComplete: state === 'purchased',
        isCurrent: i === effectiveIdx && !isMaxed(purchasedCount),
      };
    }),
  };

  renderProgressionStepper(display, RIGHT_ZONE.x + 80, y, RIGHT_ZONE.w - 160, stepperConfig);
  y += 110;

  // ── Single Panel Content Area ─────────────────────────────────────────────
  const contentY = y;
  const contentH = RIGHT_ZONE.y + RIGHT_ZONE.h - contentY - 40;

  const renderCurrentContent = (d: typeof MakkoEngine.display, x: number, y: number, w: number, h: number) => {
    if (isMaxed(purchasedCount)) {
      d.drawText('✓ PATH COMPLETE', x + w / 2, y + h / 2 - 30, {
        font: 'bold 40px monospace',
        fill: SUCCESS,
        align: 'center',
        baseline: 'middle',
      });
      d.drawText('All tiers purchased', x + w / 2, y + h / 2 + 20, {
        font: '32px monospace',
        fill: TEXT_SECONDARY,
        align: 'center',
        baseline: 'middle',
      });
      return;
    }

    const currentTier = branchTiers[effectiveIdx];
    if (!currentTier) return;

    const state = tierState(currentTier, meta.purchasedVoidTiers, meta.voidEcho);
    let cy = y;

    // Tier name (prominent)
    d.drawText(currentTier.label, x + w / 2, cy, {
      font: 'bold 36px monospace',
      fill: TEXT_PRIMARY,
      align: 'center',
      baseline: 'top',
    });
    cy += 55;

    // Description
    const descLines = wrapText(currentTier.description, w - 60, '30px monospace');
    for (const line of descLines.slice(0, 2)) {
      d.drawText(line, x + w / 2, cy, {
        font: '30px monospace',
        fill: TEXT_SECONDARY,
        align: 'center',
        baseline: 'top',
      });
      cy += 40;
    }
    cy += 25;

    // Effect (highlighted)
    const effectText = effectLabel(currentTier);
    const effectColor = state === 'purchased' ? branchColor
      : state === 'available' ? SUCCESS
      : TEXT_SECONDARY;

    d.drawText(effectText, x + w / 2, cy, {
      font: 'bold 32px monospace',
      fill: effectColor,
      align: 'center',
      baseline: 'top',
    });
    cy += 60;

    // Cost section
    if (state !== 'purchased') {
      d.drawText('COST', x + w / 2, cy, {
        font: 'bold 24px monospace',
        fill: TEXT_MUTED,
        align: 'center',
        baseline: 'top',
      });
      cy += 35;

      const costColor = meta.voidEcho >= currentTier.cost ? VOID_ECHO_COLOR : ERROR;
      d.drawText(`${currentTier.cost} Void Echo`, x + w / 2, cy, {
        font: 'bold 40px monospace',
        fill: costColor,
        align: 'center',
        baseline: 'top',
      });

      // Buy button (only for available)
      if (state === 'available') {
        const btnW = 160;
        const btnH = 52;
        const btnX = x + (w - btnW) / 2;
        const btnY = y + h - btnH - 20;
        const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

        d.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
          fill: btnHover ? '#1e4a3a' : '#0f3a2a',
          stroke: SUCCESS,
          lineWidth: 2,
        });
        d.drawText('BUY', btnX + btnW / 2, btnY + btnH / 2, {
          font: 'bold 26px monospace',
          fill: SUCCESS,
          align: 'center',
          baseline: 'middle',
        });

        if (btnHover && input.isMouseReleased(0)) {
          action = { type: 'BUY_VOID_TIER', tierId: currentTier.id };
          feedbackLayer.spawn('UNLOCKED', btnX + btnW / 2, btnY - 20, SUCCESS);
        }

        // Set bounds for tutorial (first available tier only)
        const firstAvailableIdx = branchTiers.findIndex(t => {
          const s = tierState(t, meta.purchasedVoidTiers, meta.voidEcho);
          return s === 'available';
        });
        if (firstAvailableIdx === effectiveIdx) {
          setBounds('void-first-tier', { x: btnX, y: btnY, w: btnW, h: btnH });
        }
      }
    }
  };

  const renderPreviousSummary = (d: typeof MakkoEngine.display, x: number, y: number, w: number, tier: ProgressionTier) => {
    const prevTier = branchTiers[tier.tierNumber - 1];
    if (!prevTier) return;

    d.drawText(effectLabel(prevTier), x, y, {
      font: 'bold 20px monospace',
      fill: SUCCESS,
      align: 'left',
      baseline: 'middle',
    });
  };

  const renderNextPreview = (d: typeof MakkoEngine.display, x: number, y: number, w: number, tier: ProgressionTier) => {
    const nextTier = branchTiers[tier.tierNumber - 1];
    if (!nextTier) return;

    d.drawText(`${nextTier.cost} Echo`, x, y, {
      font: '20px monospace',
      fill: TEXT_MUTED,
      align: 'left',
      baseline: 'middle',
    });
    d.drawText(effectLabel(nextTier), x, y + 30, {
      font: '20px monospace',
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

  return action;
}

function isMaxed(purchasedCount: number): boolean {
  return purchasedCount >= 3;
}

// ── Tutorial Highlight Bounds Getters ─────────────────────────────────────────

export function getVoidEchoCountBounds(): { x: number; y: number; w: number; h: number } {
  const echoPillX = SCREEN_W - 400;
  const echoPillY = 20;
  const echoPillW = 200;
  const echoPillH = 44;
  return { x: echoPillX, y: echoPillY, w: echoPillW, h: echoPillH };
}

export function getVoidBranchColumnsBounds(): { x: number; y: number; w: number; h: number } {
  return { x: LEFT_ZONE.x, y: LEFT_ZONE.y, w: LEFT_ZONE.w, h: LEFT_ZONE.h };
}

export function getFirstAvailableTierBounds(meta: MetaState): { x: number; y: number; w: number; h: number } | null {
  const branch = BRANCHES[currentBranchPage];
  const branchTiers = VOID_TIERS
    .filter(t => t.branch === branch)
    .sort((a, b) => a.tier - b.tier);

  const purchasedCount = getPurchasedCountForBranch(branch, meta.purchasedVoidTiers);
  const currentTierIdx = branchTiers.findIndex(t => {
    const state = tierState(t, meta.purchasedVoidTiers, meta.voidEcho);
    return state === 'available' || state === 'unaffordable';
  });

  if (currentTierIdx < 0 || isMaxed(purchasedCount)) return null;

  const contentH = RIGHT_ZONE.h - 170;
  const btnW = 160;
  const btnH = 52;

  return {
    x: RIGHT_ZONE.x + (RIGHT_ZONE.w - btnW) / 2,
    y: RIGHT_ZONE.y + 130 + contentH - btnH - 20,
    w: btnW,
    h: btnH,
  };
}

// Deprecated - kept for compatibility
export function isBackButtonPressed(_mx: number, _my: number, _animator?: unknown): boolean {
  return false;
}
