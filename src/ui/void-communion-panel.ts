import { MakkoEngine } from '@makko/engine';
import { MetaState } from '../types/state';
import {
  VOID_TIERS,
  VoidBranchId,
  VoidTier,
  getPurchasedTiersForBranch,
  getNextTierForBranch,
} from '../content/void-communion';
import { VOID_SHOP_CARDS } from '../content/void-shop';

export type VoidCommunionAction =
  | { type: 'BUY_VOID_TIER'; tierId: string }
  | { type: 'BUY_VOID_SHOP_CARD'; shopCardId: string };

// ── Layout constants ──────────────────────────────────────────────────────────
const PW = 1200;
const PH = 900;  // expanded to fit shop section below tier tree
const PX = 960 - PW / 2;
const PY = 540 - PH / 2;
const PAD = 32;

const HEADER_H = 64;
const FOOTER_H = 60;

// Tier section
const TIER_CONTENT_H = 440;
const CONTENT_Y = PY + HEADER_H + PAD;
const CONTENT_H = TIER_CONTENT_H;

// Shop section — starts below tier tree
const SHOP_DIVIDER_Y = PY + HEADER_H + PAD + TIER_CONTENT_H + 12;
const SHOP_SECTION_Y = SHOP_DIVIDER_Y + 36;
const SHOP_ROW_H = 72;
const SHOP_BTN_W = 90;
const SHOP_BTN_H = 32;

const BRANCHES: VoidBranchId[] = ['survivor', 'risk_taker', 'void_walker'];
const BRANCH_LABELS: Record<VoidBranchId, string> = {
  survivor: 'SURVIVOR',
  risk_taker: 'RISK TAKER',
  void_walker: 'VOID WALKER',
};

const COL_W = (PW - PAD * 2) / 3;
const ROW_H = CONTENT_H / 3;

const BTN_W = 90;
const BTN_H = 32;

function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

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
  if (e.type === 'starting_shields') return `+${e.value} starting shield`;
  if (e.type === 'scavenge_bonus') return `+${e.value} scavenge credits`;
  if (e.type === 'echo_multiplier') return `+${e.value} echo multiplier`;
  return '';
}

export function renderVoidCommunion(
  meta: MetaState,
  mx: number,
  my: number,
): VoidCommunionAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  let action: VoidCommunionAction | null = null;

  // Panel background
  display.drawRect(PX, PY, PW, PH, { fill: '#0a0e18', stroke: '#4a3f6b', lineWidth: 2 });

  // Header
  display.drawText('VOID COMMUNION', PX + PW / 2, PY + HEADER_H / 2, {
    font: 'bold 30px monospace',
    fill: '#b794f4',
    align: 'center',
    baseline: 'middle',
  });
  display.drawText(`Void Echo: ${meta.voidEcho}`, PX + PW - PAD, PY + HEADER_H / 2, {
    font: '20px monospace',
    fill: '#e9d8fd',
    align: 'right',
    baseline: 'middle',
  });

  // Divider
  display.drawLine(PX + PAD, PY + HEADER_H, PX + PW - PAD, PY + HEADER_H, {
    stroke: '#4a3f6b',
    lineWidth: 1,
  });

  // ── Tier tree columns ──────────────────────────────────────────────────────
  for (let ci = 0; ci < BRANCHES.length; ci++) {
    const branch = BRANCHES[ci];
    const colX = PX + PAD + ci * COL_W;

    display.drawText(BRANCH_LABELS[branch], colX + COL_W / 2, CONTENT_Y, {
      font: 'bold 18px monospace',
      fill: '#9f7aea',
      align: 'center',
      baseline: 'top',
    });

    const branchTiers = VOID_TIERS.filter((t) => t.branch === branch).sort(
      (a, b) => a.tier - b.tier,
    );

    for (let ri = 0; ri < branchTiers.length; ri++) {
      const tier = branchTiers[ri];
      const rowY = CONTENT_Y + 28 + ri * ROW_H;
      const state = tierState(tier, meta.purchasedVoidTiers, meta.voidEcho);

      const rowFill =
        state === 'purchased' ? '#1a1040' : state === 'available' ? '#111829' : '#0d1015';
      const rowStroke =
        state === 'purchased' ? '#6b46c1' : state === 'available' ? '#2d3748' : '#1a1f2e';
      const textColor =
        state === 'locked' ? '#4a5568' : state === 'unaffordable' ? '#718096' : '#e2e8f0';

      display.drawRect(colX + 4, rowY, COL_W - 8, ROW_H - 8, {
        fill: rowFill, stroke: rowStroke, lineWidth: 1,
      });

      const labelPrefix = state === 'purchased' ? '[✓] ' : '';
      display.drawText(`${labelPrefix}${tier.label}`, colX + 10, rowY + 10, {
        font: 'bold 15px monospace',
        fill: state === 'purchased' ? '#9f7aea' : textColor,
        align: 'left', baseline: 'top',
      });
      display.drawText(tier.description, colX + 10, rowY + 32, {
        font: '13px monospace',
        fill: state === 'locked' ? '#2d3748' : '#718096',
        align: 'left', baseline: 'top',
      });
      display.drawText(effectLabel(tier), colX + 10, rowY + 52, {
        font: '13px monospace',
        fill: state === 'purchased' ? '#68d391' : state === 'locked' ? '#2d3748' : '#9ae6b4',
        align: 'left', baseline: 'top',
      });

      if (state === 'purchased') {
        display.drawText('Purchased', colX + COL_W - PAD - 4, rowY + 10, {
          font: '13px monospace', fill: '#6b46c1', align: 'right', baseline: 'top',
        });
      } else {
        display.drawText(`${tier.cost} echo`, colX + COL_W - BTN_W - 12, rowY + ROW_H / 2 - 4, {
          font: '13px monospace',
          fill: state === 'locked' ? '#2d3748' : '#a0aec0',
          align: 'right', baseline: 'middle',
        });
        if (state === 'available') {
          const btnX = colX + COL_W - BTN_W - 8;
          const btnY = rowY + (ROW_H - 8) / 2 - BTN_H / 2;
          const hover = isOver(mx, my, btnX, btnY, BTN_W, BTN_H);
          display.drawRect(btnX, btnY, BTN_W, BTN_H, {
            fill: hover ? '#276749' : '#1a3a2a',
            stroke: hover ? '#68d391' : '#276749', lineWidth: 1,
          });
          display.drawText('BUY', btnX + BTN_W / 2, btnY + BTN_H / 2, {
            font: 'bold 14px monospace', fill: '#68d391', align: 'center', baseline: 'middle',
          });
          if (hover && input.isMouseReleased(0)) {
            action = { type: 'BUY_VOID_TIER', tierId: tier.id };
          }
        }
      }
    }
  }

  // ── Void Shop section ──────────────────────────────────────────────────────
  display.drawLine(PX + PAD, SHOP_DIVIDER_Y, PX + PW - PAD, SHOP_DIVIDER_Y, {
    stroke: '#4a3f6b', lineWidth: 1,
  });
  display.drawText('VOID SHOP', PX + PW / 2, SHOP_DIVIDER_Y + 14, {
    font: 'bold 18px monospace', fill: '#ed8936', align: 'center', baseline: 'top',
  });

  const SHOP_COL_W = (PW - PAD * 2) / 4;

  for (let si = 0; si < VOID_SHOP_CARDS.length; si++) {
    const shopCard = VOID_SHOP_CARDS[si];
    const purchased = meta.purchasedVoidShopCards.includes(shopCard.id);
    const affordable = !purchased && meta.voidEcho >= shopCard.cost;
    const colX = PX + PAD + si * SHOP_COL_W;
    const rowY = SHOP_SECTION_Y;

    const rowFill = purchased ? '#1a1a0a' : affordable ? '#111829' : '#0d1015';
    const rowStroke = purchased ? '#744210' : affordable ? '#2d3748' : '#1a1f2e';

    display.drawRect(colX + 4, rowY, SHOP_COL_W - 8, SHOP_ROW_H, {
      fill: rowFill, stroke: rowStroke, lineWidth: 1,
    });

    // Name
    const namePrefix = purchased ? '[✓ Unlocked] ' : '';
    display.drawText(`${namePrefix}${shopCard.name}`, colX + 10, rowY + 8, {
      font: 'bold 14px monospace',
      fill: purchased ? '#f6ad55' : affordable ? '#e2e8f0' : '#718096',
      align: 'left', baseline: 'top',
    });
    // Description
    display.drawText(shopCard.description, colX + 10, rowY + 26, {
      font: '12px monospace',
      fill: purchased ? '#718096' : '#718096',
      align: 'left', baseline: 'top',
    });
    // Cost
    display.drawText(`${shopCard.cost} echo`, colX + 10, rowY + 46, {
      font: '12px monospace',
      fill: purchased ? '#4a5568' : affordable ? '#e9d8fd' : '#4a5568',
      align: 'left', baseline: 'top',
    });

    // BUY button
    if (!purchased) {
      const btnX = colX + SHOP_COL_W - SHOP_BTN_W - 10;
      const btnY = rowY + SHOP_ROW_H / 2 - SHOP_BTN_H / 2;
      const hover = affordable && isOver(mx, my, btnX, btnY, SHOP_BTN_W, SHOP_BTN_H);

      display.drawRect(btnX, btnY, SHOP_BTN_W, SHOP_BTN_H, {
        fill: !affordable ? '#1a1a1a' : hover ? '#744210' : '#3d2000',
        stroke: !affordable ? '#2d2d2d' : hover ? '#f6ad55' : '#744210',
        lineWidth: 1,
      });
      display.drawText('BUY', btnX + SHOP_BTN_W / 2, btnY + SHOP_BTN_H / 2, {
        font: 'bold 13px monospace',
        fill: !affordable ? '#4a5568' : '#f6ad55',
        align: 'center', baseline: 'middle',
      });
      if (hover && input.isMouseReleased(0)) {
        action = { type: 'BUY_VOID_SHOP_CARD', shopCardId: shopCard.id };
      }
    }
  }

  // ── Back button ────────────────────────────────────────────────────────────
  const backW = 140;
  const backH = 40;
  const backX = PX + PAD;
  const backY = PY + PH - FOOTER_H + (FOOTER_H - backH) / 2;
  const backHover = isOver(mx, my, backX, backY, backW, backH);

  display.drawRect(backX, backY, backW, backH, {
    fill: backHover ? '#2d3748' : '#1a202c',
    stroke: '#4a5568', lineWidth: 1,
  });
  display.drawText('← Back', backX + backW / 2, backY + backH / 2, {
    font: '16px monospace', fill: '#a0aec0', align: 'center', baseline: 'middle',
  });

  // Footer divider
  display.drawLine(PX + PAD, PY + PH - FOOTER_H, PX + PW - PAD, PY + PH - FOOTER_H, {
    stroke: '#4a3f6b', lineWidth: 1,
  });

  return action;
}

export function isBackButtonPressed(mx: number, my: number): boolean {
  const backW = 140;
  const backH = 40;
  const backX = PX + PAD;
  const backY = PY + PH - FOOTER_H + (FOOTER_H - backH) / 2;
  return (
    isOver(mx, my, backX, backY, backW, backH) && MakkoEngine.input.isMouseReleased(0)
  );
}
