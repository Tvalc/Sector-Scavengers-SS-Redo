import { MakkoEngine } from '@makko/engine';
import { RunState } from '../types/state';
import { SalvageEntry, SALVAGE_DEFS } from '../content/salvage';
import { getItemById } from '../content/hardware';

export type ResultAction = 'CONTINUE';

// Base panel geometry — height expands to fit salvage rows
const PW = 800;
const BASE_PH = 400;
const PX = 960 - PW / 2;
const PY = 540 - BASE_PH / 2 - 60; // shift up a bit to leave room below

const BTN_W = 220;
const BTN_H = 56;
const BTN_X = 960 - BTN_W / 2;

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
 */
export function renderResult(
  run: RunState,
  creditsEarned: number,
  voidEchoGain: number,
  salvage: SalvageEntry[],
  itemsFound: string[],
  mx: number,
  my: number,
): ResultAction | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;

  const extracted = run.phase === 'extracted';
  const accentColor = extracted ? '#48bb78' : '#fc8181';
  const title = extracted ? 'EXTRACTED' : 'COLLAPSED';

  // Dynamic panel height — leave room for salvage rows and items row
  const salvageRowCount = salvage.filter((e) => e.quantity > 0).length;
  const salvageBlockH = salvageRowCount > 0
    ? 30 + salvageRowCount * 28
    : 28;
  const itemsBlockH = itemsFound.length > 0 ? 32 : 0;
  const PH = BASE_PH + salvageBlockH + itemsBlockH;
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

  // ── Salvage section ────────────────────────────────────────────────────────
  const salvageSectionY = PY + 160 + stats.length * 44 + 16;

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
