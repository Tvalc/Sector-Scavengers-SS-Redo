import { MakkoEngine } from '@makko/engine';
import { RunState } from '../types/state';
import { SalvageEntry, SALVAGE_DEFS } from '../content/salvage';
import { getItemById } from '../content/hardware';

export type ResultAction = 'CONTINUE';

export interface RunDelta {
  creditsBefore: number;
  debtBefore: number;
  voidBefore: number;
  inventoryCountBefore: number;
}

// Base panel geometry — height expands to fit salvage rows
const PW = 800;
const BASE_PH = 400;
const PX = 960 - PW / 2;
const PY = 540 - BASE_PH / 2 - 60; // shift up a bit to leave room below

const BTN_W = 220;
const BTN_H = 56;
const BTN_X = 960 - BTN_W / 2;

// Height of the delta block when delta !== null
const DELTA_BLOCK_H = 140; // 20 (label) + 4×30 (lines)

// Press-tracking for Continue button
let pressedContinue = false;

/**
 * Render the post-run result panel.
 *
 * @param run           The final RunState (phase must be 'extracted' or 'collapsed').
 * @param creditsEarned Total credits banked this run. 0 for collapses.
 * @param voidEchoGain  VoidEcho gained this run (including walker tier multipliers).
 * @param salvage       Salvage entries from the ended run (run.salvage snapshot).
 * @param itemsFound    Hardware item ids discovered this run (run.itemsFound snapshot).
 * @param mx            Mouse X in game coordinates.
 * @param my            Mouse Y in game coordinates.
 * @param delta         Optional pre-run snapshot for delta readout. Pass null to omit.
 */
export function renderResult(
  run: RunState,
  creditsEarned: number,
  voidEchoGain: number,
  salvage: SalvageEntry[],
  itemsFound: string[],
  mx: number,
  my: number,
  delta: RunDelta | null = null,
): ResultAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  const extracted = run.phase === 'extracted';
  const accentColor = extracted ? '#48bb78' : '#fc8181';
  const title = extracted ? 'EXTRACTED' : 'COLLAPSED';

  // Dynamic panel height — leave room for delta block, salvage rows, and items row
  const deltaExtraH = delta !== null ? DELTA_BLOCK_H : 0;
  const salvageRowCount = salvage.filter((e) => e.quantity > 0).length;
  const salvageBlockH = salvageRowCount > 0
    ? 30 + salvageRowCount * 28
    : 28;
  const itemsBlockH = itemsFound.length > 0 ? 32 : 0;
  const PH = BASE_PH + deltaExtraH + salvageBlockH + itemsBlockH;
  const BTN_Y = PY + PH - 80;

  // ── Panel ──────────────────────────────────────────────────────────────────
  display.drawRect(PX, PY, PW, PH, { fill: '#0d1117', stroke: accentColor, lineWidth: 2 });

  // ── Title ──────────────────────────────────────────────────────────────────
  display.drawText(title, 960, PY + 70, {
    font: 'bold 48px monospace', fill: accentColor, align: 'center', baseline: 'middle',
  });

  // ── Sub-stats ──────────────────────────────────────────────────────────────
  const stats: string[] = [
    `Hull remaining:  ${run.hull}`,
    `Credits banked:  \u20a1${creditsEarned}`,
    `VoidEcho gained: +${voidEchoGain}`,
  ];

  for (let i = 0; i < stats.length; i++) {
    display.drawText(stats[i], 960, PY + 160 + i * 44, {
      font: '24px monospace', fill: '#e2e8f0', align: 'center', baseline: 'middle',
    });
  }

  // ── Delta block (only when delta provided) ─────────────────────────────────
  const afterStatsY = PY + 160 + stats.length * 44 + 16;

  if (delta !== null) {
    const dY = afterStatsY + 10;

    display.drawText('WHAT CHANGED:', 960, dY, {
      font: '16px monospace', fill: '#4a5568', align: 'center', baseline: 'top',
    });

    // Credits line
    const creditsNow = extracted ? delta.creditsBefore + creditsEarned : delta.creditsBefore;
    const creditsDiff = creditsNow - delta.creditsBefore;
    const creditsSign = creditsDiff >= 0 ? '+' : '';
    const creditsColor = creditsDiff > 0 ? '#68d391' : creditsDiff < 0 ? '#fc8181' : '#718096';
    display.drawText(
      `Credits: \u20a1${delta.creditsBefore} \u2192 \u20a1${creditsNow}  (${creditsSign}${creditsDiff})`,
      960, dY + 20 + 30 * 0,
      { font: '20px monospace', fill: creditsColor, align: 'center', baseline: 'top' },
    );

    // Debt line
    const debtNow = delta.debtBefore + run.debtIncrease;
    const debtDiff = debtNow - delta.debtBefore;
    const debtSign = debtDiff >= 0 ? '+' : '';
    const debtColor = debtDiff > 0 ? '#fc8181' : debtDiff < 0 ? '#68d391' : '#718096';
    display.drawText(
      `Debt: \u20a1${delta.debtBefore} \u2192 \u20a1${debtNow}  (${debtSign}${debtDiff})`,
      960, dY + 20 + 30 * 1,
      { font: '20px monospace', fill: debtColor, align: 'center', baseline: 'top' },
    );

    // Void Echo line
    const voidNow = delta.voidBefore + voidEchoGain;
    display.drawText(
      `Void Echo: ${delta.voidBefore} \u2192 ${voidNow}  (+${voidEchoGain})`,
      960, dY + 20 + 30 * 2,
      { font: '20px monospace', fill: '#9f7aea', align: 'center', baseline: 'top' },
    );

    // Salvage line
    const totalSalvageQty = salvage.reduce((sum, e) => sum + e.quantity, 0);
    if (totalSalvageQty > 0) {
      if (extracted) {
        display.drawText(
          `Salvage: +${totalSalvageQty} item${totalSalvageQty !== 1 ? 's' : ''} banked`,
          960, dY + 20 + 30 * 3,
          { font: '20px monospace', fill: '#68d391', align: 'center', baseline: 'top' },
        );
      } else {
        display.drawText(
          `Salvage: ${totalSalvageQty} item${totalSalvageQty !== 1 ? 's' : ''} lost`,
          960, dY + 20 + 30 * 3,
          { font: '20px monospace', fill: '#fc8181', align: 'center', baseline: 'top' },
        );
      }
    }
  }

  // ── Salvage section ────────────────────────────────────────────────────────
  const salvageSectionY = afterStatsY + deltaExtraH;

  // Section divider
  display.drawLine(PX + 40, salvageSectionY, PX + PW - 40, salvageSectionY, {
    stroke: '#2d3748', lineWidth: 1,
  });

  if (extracted) {
    const activeSalvage = salvage.filter((e) => e.quantity > 0);

    if (activeSalvage.length === 0) {
      display.drawText('No salvage recovered.', 960, salvageSectionY + 20, {
        font: '20px monospace', fill: '#4a5568', align: 'center', baseline: 'top',
      });
    } else {
      display.drawText('Salvage banked:', 960, salvageSectionY + 4, {
        font: '16px monospace', fill: '#718096', align: 'center', baseline: 'top',
      });
      for (let i = 0; i < activeSalvage.length; i++) {
        const e = activeSalvage[i];
        const def = SALVAGE_DEFS[e.tier];
        const total = e.quantity * e.valueEach;
        display.drawText(
          `${def.label}: ${e.quantity} \u00d7 \u20a1${e.valueEach} = \u20a1${total}`,
          960,
          salvageSectionY + 26 + i * 28,
          { font: '20px monospace', fill: def.color, align: 'center', baseline: 'top' },
        );
      }
    }
  } else {
    // Collapsed — salvage is lost
    const totalItems = salvage.reduce((sum, e) => sum + e.quantity, 0);
    if (totalItems > 0) {
      display.drawText(
        `Salvage lost \u2014 ${totalItems} item${totalItems !== 1 ? 's' : ''} abandoned.`,
        960,
        salvageSectionY + 16,
        { font: '20px monospace', fill: '#fc8181', align: 'center', baseline: 'top' },
      );
    } else {
      display.drawText('No salvage to recover.', 960, salvageSectionY + 16, {
        font: '20px monospace', fill: '#4a5568', align: 'center', baseline: 'top',
      });
    }
  }

  // ── Items found section ────────────────────────────────────────────────────
  if (itemsFound.length > 0) {
    const itemsSectionY = BTN_Y - itemsBlockH - 14;
    if (extracted) {
      const names = itemsFound
        .map((id) => getItemById(id)?.name ?? id)
        .join(', ');
      display.drawText(`Items found: ${names}`, 960, itemsSectionY, {
        font: '20px monospace', fill: '#f6ad55', align: 'center', baseline: 'top',
      });
    } else {
      display.drawText('Items lost.', 960, itemsSectionY, {
        font: '20px monospace', fill: '#fc8181', align: 'center', baseline: 'top',
      });
    }
  }

  // ── Continue button ────────────────────────────────────────────────────────
  const hover =
    mx >= BTN_X && mx <= BTN_X + BTN_W &&
    my >= BTN_Y && my <= BTN_Y + BTN_H;

  display.drawRect(BTN_X, BTN_Y, BTN_W, BTN_H, {
    fill: hover ? '#276749' : '#1c4532',
    stroke: accentColor,
    lineWidth: 1,
  });
  display.drawText('[Continue]', 960, BTN_Y + BTN_H / 2, {
    font: '24px monospace', fill: '#ffffff', align: 'center', baseline: 'middle',
  });

  if (input.isMousePressed(0) && hover) pressedContinue = true;

  let action: ResultAction | null = null;
  if (input.isMouseReleased(0)) {
    if (pressedContinue && hover) action = 'CONTINUE';
    pressedContinue = false;
  }

  return action;
}
