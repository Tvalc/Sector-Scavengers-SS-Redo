import { MakkoEngine } from '@makko/engine';
import { RunState } from '../types/state';
import { SalvageEntry, SALVAGE_DEFS } from '../content/salvage';
import { getItemById } from '../content/hardware';
import { CORE_CARDS, CardRarity } from '../content/cards';
import { MAX_DEBT_BEFORE_GAME_OVER, MAX_MISSED_PAYMENTS, BILLING_MISSED_PENALTY_RATE } from '../config/constants';

export interface BillingReportInfo {
  billingAmount: number;
  upkeepPerAwakeCrew: number;
  awakeCrewCount: number;
  totalBill: number;
  creditsEarned: number;
  paid: boolean;
  penalty: number;
  consecutiveMissedPayments: number;
  currentDebt: number;
  isCollapse: boolean;
}

export interface ExtractionReportInfo {
  success: boolean;
  breachOccurred: boolean;
  breachDamage: number;
  baseSalvageValue: number;
  extractionBonusPercent: number;
  bonusAmount: number;
  finalValue: number;
  salvageDeclared: SalvageEntry[];
  salvageKept: SalvageEntry[];
}

const COLORS = {
  background: '#0d1117',
  titleExtract: '#68d391',
  titleCollapse: '#fc8181',
  label: '#8b949e',
  value: '#e6edf3',
  creditPositive: '#68d391',
  creditNegative: '#fc8181',
  echoColor: '#9f7aea',
  salvageHeader: '#63b3ed',
  itemHeader: '#f6e05e',
  deltaUp: '#68d391',
  deltaDown: '#fc8181',
  deltaNeutral: '#8b949e',
  billingPaid: '#68d391',
  billingUnpaid: '#fc8181',
  billingLabel: '#8b949e',
  billingValue: '#e6edf3',
  pathCredits: '#63b3ed',
  victory: '#68d391',
  warning: '#f6e05e',
  danger: '#fc8181',
  separator: '#21262d',
  button: '#21262d',
  buttonHover: '#30363d',
  buttonBorder: '#484f58',
  buttonText: '#e6edf3',
  sectionBg: '#161b22',
  sectionBorder: '#21262d',
  amber: '#f59e0b',
};

let pressedContinue = false;

function formatCredits(n: number): string {
  if (n >= 1000000) return `₡${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `₡${(n / 1000).toFixed(1)}K`;
  return `₡${n.toLocaleString('en-US')}`;
}

const formatNum = (n: number) => n.toLocaleString('en-US');

export function renderResult(
  lastRun: RunState,
  haulValue: number,
  echo: number,
  salvage: SalvageEntry[],
  itemsFound: string[],
  mx: number,
  my: number,
  delta: { haulValueBefore: number; debtBefore: number; voidBefore: number; inventoryCountBefore: number } | null,
  debtCleared: boolean | null,
  isPathContinuing: boolean,
  pathCredits: number,
  billingReport: BillingReportInfo | null,
  extractionReport?: ExtractionReportInfo | null,
): 'CONTINUE' | null {
  const display = MakkoEngine.display;
  const input = MakkoEngine.input;
  const collapsed = lastRun.phase === 'collapsed';

  // Full-screen background
  display.drawRect(0, 0, 1920, 1080, { fill: COLORS.background });

  let y = 60;
  const centerX = 960;
  const leftX = 580;

  // ── Title ──────────────────────────────────────────────────────────────
  const titleText = collapsed ? 'COLLAPSED' : 'EXTRACTED';
  const titleColor = collapsed ? COLORS.titleCollapse : COLORS.titleExtract;
  display.drawText(titleText, centerX, y, {
    font: 'bold 64px monospace',
    fill: titleColor,
    align: 'center',
    baseline: 'top',
  });
  y += 80;

  // Separator
  display.drawRect(580, y, 760, 2, { fill: COLORS.separator });
  y += 20;

  // ── Extraction Report ─────────────────────────────────────────────────
  if (extractionReport && !collapsed) {
    y += 4;
    const reportBoxH = extractionReport.breachOccurred ? 140 : 100;
    display.drawRect(560, y - 4, 800, reportBoxH, {
      fill: COLORS.sectionBg,
      stroke: extractionReport.success ? COLORS.titleExtract : COLORS.titleCollapse,
      lineWidth: 2,
    });
    
    display.drawText('EXTRACTION REPORT', leftX, y, {
      font: 'bold 16px monospace',
      fill: extractionReport.success ? COLORS.titleExtract : COLORS.titleCollapse,
      baseline: 'top',
    });
    y += 28;

    // Base salvage value
    display.drawText('Base salvage value:', leftX + 16, y, {
      font: '14px monospace',
      fill: COLORS.label,
      baseline: 'top',
    });
    display.drawText(formatCredits(extractionReport.baseSalvageValue), leftX + 740, y, {
      font: '14px monospace',
      fill: COLORS.value,
      align: 'right',
      baseline: 'top',
    });
    y += 22;

    // Extraction bonus
    if (extractionReport.extractionBonusPercent > 0) {
      display.drawText(`Extraction bonus (${extractionReport.extractionBonusPercent}%):`, leftX + 16, y, {
        font: '14px monospace',
        fill: COLORS.label,
        baseline: 'top',
      });
      display.drawText(`+${formatCredits(extractionReport.bonusAmount)}`, leftX + 740, y, {
        font: '14px monospace',
        fill: COLORS.creditPositive,
        align: 'right',
        baseline: 'top',
      });
      y += 22;
    }

    // Breach warning
    if (extractionReport.breachOccurred) {
      display.drawText(`⚠ HULL BREACH: −${extractionReport.breachDamage} hull`, leftX + 16, y, {
        font: '14px monospace',
        fill: COLORS.titleCollapse,
        baseline: 'top',
      });
      y += 22;
    }

    // Final value
    display.drawText('Final extraction value:', leftX + 16, y, {
      font: 'bold 14px monospace',
      fill: COLORS.creditPositive,
      baseline: 'top',
    });
    display.drawText(formatCredits(extractionReport.finalValue), leftX + 740, y, {
      font: 'bold 16px monospace',
      fill: COLORS.creditPositive,
      align: 'right',
      baseline: 'top',
    });
    y += 36;
  }

  // ── Haul Value ─────────────────────────────────────────────────────────
  display.drawText('HAUL VALUE', leftX, y, {
    font: '16px monospace',
    fill: COLORS.label,
    baseline: 'top',
  });
  display.drawText(formatCredits(haulValue), leftX + 760, y, {
    font: 'bold 20px monospace',
    fill: COLORS.creditPositive,
    align: 'right',
    baseline: 'top',
  });
  y += 36;

  // ── Echo Gained ────────────────────────────────────────────────────────
  if (echo > 0) {
    display.drawText('VOID ECHO GAINED', leftX, y, {
      font: '16px monospace',
      fill: COLORS.label,
      baseline: 'top',
    });
    display.drawText(`+${formatNum(echo)}`, leftX + 760, y, {
      font: 'bold 20px monospace',
      fill: COLORS.echoColor,
      align: 'right',
      baseline: 'top',
    });
    y += 36;
  }

  // ── Salvage Breakdown ──────────────────────────────────────────────────
  if (extractionReport && (extractionReport.salvageDeclared.length > 0 || extractionReport.salvageKept.length > 0)) {
    y += 8;
    const declaredCount = extractionReport.salvageDeclared.length;
    const keptCount = extractionReport.salvageKept.length;
    const boxH = (declaredCount + keptCount) * 26 + 70;
    
    display.drawRect(560, y - 4, 800, boxH, {
      fill: COLORS.sectionBg,
      stroke: COLORS.sectionBorder,
      lineWidth: 1,
    });

    // Declared salvage (sold to Company)
    if (declaredCount > 0) {
      display.drawText('SALVAGE SOLD TO COMPANY', leftX, y, {
        font: 'bold 14px monospace',
        fill: COLORS.creditPositive,
        baseline: 'top',
      });
      y += 26;

      for (const entry of extractionReport.salvageDeclared) {
        const def = SALVAGE_DEFS[entry.tier];
        const tierLabel = def ? def.label : entry.tier;
        const tierColor = def ? def.color : COLORS.value;
        const lineText = `${tierLabel} ×${entry.quantity}  (${formatCredits(entry.valueEach * entry.quantity)})`;
        display.drawText(lineText, leftX + 16, y, {
          font: '16px monospace',
          fill: tierColor,
          baseline: 'top',
        });
        y += 24;
      }
      y += 8;
    }

    // Kept salvage (for base/hidden)
    if (keptCount > 0) {
      display.drawText('SALVAGE KEPT FOR BASE', leftX, y, {
        font: 'bold 14px monospace',
        fill: COLORS.amber,
        baseline: 'top',
      });
      y += 26;

      for (const entry of extractionReport.salvageKept) {
        const def = SALVAGE_DEFS[entry.tier];
        const tierLabel = def ? def.label : entry.tier;
        const tierColor = def ? def.color : COLORS.value;
        const lineText = `${tierLabel} ×${entry.quantity}  (${formatCredits(entry.valueEach * entry.quantity)})`;
        display.drawText(lineText, leftX + 16, y, {
          font: '16px monospace',
          fill: tierColor,
          baseline: 'top',
        });
        y += 24;
      }
      y += 8;
    }
    y += 12;
  } else if (salvage.length > 0) {
    // Fallback: show all salvage if no extraction report
    y += 8;
    display.drawRect(560, y - 4, 800, salvage.length * 28 + 32, {
      fill: COLORS.sectionBg,
      stroke: COLORS.sectionBorder,
      lineWidth: 1,
    });
    display.drawText('SALVAGE RECOVERED', leftX, y, {
      font: 'bold 14px monospace',
      fill: COLORS.salvageHeader,
      baseline: 'top',
    });
    y += 28;

    for (const entry of salvage) {
      const def = SALVAGE_DEFS[entry.tier];
      const tierLabel = def ? def.label : entry.tier;
      const tierColor = def ? def.color : COLORS.value;
      const lineText = `${tierLabel} ×${entry.quantity}  (${formatCredits(entry.valueEach * entry.quantity)})`;
      display.drawText(lineText, leftX + 16, y, {
        font: '16px monospace',
        fill: tierColor,
        baseline: 'top',
      });
      y += 26;
    }
    y += 12;
  }

  // ── Items Found ────────────────────────────────────────────────────────
  if (itemsFound.length > 0) {
    y += 4;
    display.drawRect(560, y - 4, 800, itemsFound.length * 26 + 32, {
      fill: COLORS.sectionBg,
      stroke: COLORS.sectionBorder,
      lineWidth: 1,
    });
    display.drawText('HARDWARE DISCOVERED', leftX, y, {
      font: 'bold 14px monospace',
      fill: COLORS.itemHeader,
      baseline: 'top',
    });
    y += 26;

    for (const itemId of itemsFound) {
      const item = getItemById(itemId);
      const itemName = item ? item.name : itemId;
      display.drawText(`◆ ${itemName}`, leftX + 16, y, {
        font: '16px monospace',
        fill: COLORS.value,
        baseline: 'top',
      });
      y += 24;
    }
    y += 12;
  }

  // ── Delta Comparison ──────────────────────────────────────────────────
  if (delta !== null) {
    y += 4;
    const debtChange = -delta.debtBefore; // Negative debt change = good
    const voidChange = echo - delta.voidBefore;
    const invChange = itemsFound.length; // Approximation

    display.drawRect(560, y - 4, 800, 88, {
      fill: COLORS.sectionBg,
      stroke: COLORS.sectionBorder,
      lineWidth: 1,
    });
    display.drawText('RUN SUMMARY', leftX, y, {
      font: 'bold 14px monospace',
      fill: COLORS.label,
      baseline: 'top',
    });
    y += 24;

    // Debt change — show delta.debtBefore as reference; current debt from billingReport or lastRun
    display.drawText('Debt before this run:', leftX + 16, y, {
      font: '14px monospace',
      fill: COLORS.label,
      baseline: 'top',
    });
    display.drawText(formatCredits(delta.debtBefore), leftX + 740, y, {
      font: '14px monospace',
      fill: COLORS.deltaNeutral,
      align: 'right',
      baseline: 'top',
    });
    y += 22;

    display.drawText('Echo before this run:', leftX + 16, y, {
      font: '14px monospace',
      fill: COLORS.label,
      baseline: 'top',
    });
    display.drawText(`${formatNum(delta.voidBefore)}`, leftX + 740, y, {
      font: '14px monospace',
      fill: COLORS.deltaNeutral,
      align: 'right',
      baseline: 'top',
    });
    y += 28;
  }

  // ── Path Credits ──────────────────────────────────────────────────────
  if (isPathContinuing && pathCredits > 0) {
    y += 4;
    display.drawRect(560, y - 4, 800, 36, {
      fill: COLORS.sectionBg,
      stroke: COLORS.sectionBorder,
      lineWidth: 1,
    });
    display.drawText('EXPEDITION CREDITS', leftX, y, {
      font: '16px monospace',
      fill: COLORS.label,
      baseline: 'top',
    });
    display.drawText(formatCredits(pathCredits), leftX + 760, y, {
      font: 'bold 20px monospace',
      fill: COLORS.pathCredits,
      align: 'right',
      baseline: 'top',
    });
    y += 44;
  }

  // ── Debt Payment Summary ─────────────────────────────────────────────
  if (!collapsed && extractionReport && delta) {
    y += 4;
    const debtPaid = Math.min(extractionReport.finalValue, delta.debtBefore);
    const debtRemaining = Math.max(0, delta.debtBefore - extractionReport.finalValue);
    
    display.drawRect(560, y - 4, 800, 80, {
      fill: COLORS.sectionBg,
      stroke: COLORS.sectionBorder,
      lineWidth: 1,
    });
    display.drawText('DEBT PAYMENT', leftX, y, {
      font: 'bold 14px monospace',
      fill: COLORS.label,
      baseline: 'top',
    });
    y += 26;

    display.drawText('Debt before extraction:', leftX + 16, y, {
      font: '14px monospace',
      fill: COLORS.label,
      baseline: 'top',
    });
    display.drawText(formatCredits(delta.debtBefore), leftX + 740, y, {
      font: '14px monospace',
      fill: COLORS.creditNegative,
      align: 'right',
      baseline: 'top',
    });
    y += 22;

    display.drawText('Paid from extraction:', leftX + 16, y, {
      font: '14px monospace',
      fill: COLORS.creditPositive,
      baseline: 'top',
    });
    display.drawText(`−${formatCredits(debtPaid)}`, leftX + 740, y, {
      font: '14px monospace',
      fill: COLORS.creditPositive,
      align: 'right',
      baseline: 'top',
    });
    y += 22;

    display.drawText('Remaining debt:', leftX + 16, y, {
      font: 'bold 14px monospace',
      fill: debtRemaining > 0 ? COLORS.creditNegative : COLORS.creditPositive,
      baseline: 'top',
    });
    display.drawText(formatCredits(debtRemaining), leftX + 740, y, {
      font: 'bold 14px monospace',
      fill: debtRemaining > 0 ? COLORS.creditNegative : COLORS.creditPositive,
      align: 'right',
      baseline: 'top',
    });
    y += 36;
  }

  // ── Billing Report ────────────────────────────────────────────────────
  if (billingReport !== null) {
    y += 4;
    if (billingReport.isCollapse) {
      // Simplified collapse billing
      const collapseLines = [
        `Outstanding debt: ${formatCredits(billingReport.currentDebt)}`,
        `Consecutive missed payments: ${billingReport.consecutiveMissedPayments}/${MAX_MISSED_PAYMENTS}`,
      ];
      const boxH = collapseLines.length * 24 + 40;
      display.drawRect(560, y - 4, 800, boxH, {
        fill: COLORS.sectionBg,
        stroke: COLORS.danger,
        lineWidth: 2,
      });
      display.drawText('BILLING — COLLAPSED', leftX, y, {
        font: 'bold 14px monospace',
        fill: COLORS.danger,
        baseline: 'top',
      });
      y += 26;

      for (const line of collapseLines) {
        display.drawText(line, leftX + 16, y, {
          font: '14px monospace',
          fill: COLORS.billingValue,
          baseline: 'top',
        });
        y += 22;
      }
      y += 14;
    } else {
      // Full billing report
      const lines: Array<{ label: string; value: string; color: string }> = [
        { label: 'Base billing:', value: formatCredits(billingReport.billingAmount), color: COLORS.billingValue },
        { label: `Crew upkeep (${billingReport.awakeCrewCount} crew):`, value: formatCredits(billingReport.awakeCrewCount * billingReport.upkeepPerAwakeCrew), color: COLORS.billingValue },
        { label: 'Total bill:', value: formatCredits(billingReport.totalBill), color: COLORS.billingValue },
        { label: 'Credits earned:', value: formatCredits(billingReport.creditsEarned), color: COLORS.creditPositive },
      ];

      if (billingReport.paid) {
        lines.push({ label: 'Status:', value: 'PAID', color: COLORS.billingPaid });
      } else {
        lines.push({ label: 'Status:', value: 'MISSED', color: COLORS.billingUnpaid });
        lines.push({ label: 'Penalty added:', value: formatCredits(billingReport.penalty), color: COLORS.creditNegative });
      }

      lines.push({ label: 'Current debt:', value: formatCredits(billingReport.currentDebt), color: billingReport.currentDebt > 0 ? COLORS.creditNegative : COLORS.creditPositive });
      lines.push({ label: 'Consecutive missed:', value: `${formatNum(billingReport.consecutiveMissedPayments)}/${formatNum(MAX_MISSED_PAYMENTS)}`, color: billingReport.consecutiveMissedPayments > 0 ? COLORS.warning : COLORS.billingValue });

      const boxH = lines.length * 22 + 36;
      display.drawRect(560, y - 4, 800, boxH, {
        fill: COLORS.sectionBg,
        stroke: billingReport.paid ? COLORS.sectionBorder : COLORS.danger,
        lineWidth: billingReport.paid ? 1 : 2,
      });
      display.drawText('BILLING REPORT', leftX, y, {
        font: 'bold 14px monospace',
        fill: COLORS.label,
        baseline: 'top',
      });
      y += 26;

      for (const line of lines) {
        display.drawText(line.label, leftX + 16, y, {
          font: '14px monospace',
          fill: COLORS.billingLabel,
          baseline: 'top',
        });
        display.drawText(line.value, leftX + 740, y, {
          font: 'bold 14px monospace',
          fill: line.color,
          align: 'right',
          baseline: 'top',
        });
        y += 22;
      }
      y += 14;
    }
  }

  // ── Debt Cleared Banner ───────────────────────────────────────────────
  if (debtCleared === true) {
    y += 4;
    display.drawRect(480, y, 960, 60, {
      fill: '#0a2e1a',
      stroke: COLORS.victory,
      lineWidth: 2,
    });
    display.drawText('★ DEBT CLEARED — BALANCE SETTLED ★', centerX, y + 30, {
      font: 'bold 24px monospace',
      fill: COLORS.victory,
      align: 'center',
      baseline: 'middle',
    });
    y += 72;
  }

  // ── Game Over Warning ─────────────────────────────────────────────────
  const isGameOver =
    (billingReport !== null && billingReport.currentDebt >= MAX_DEBT_BEFORE_GAME_OVER) ||
    (billingReport !== null && billingReport.consecutiveMissedPayments >= MAX_MISSED_PAYMENTS);

  if (isGameOver) {
    y += 4;
    display.drawRect(480, y, 960, 50, {
      fill: '#2e0a0a',
      stroke: COLORS.danger,
      lineWidth: 2,
    });
    display.drawText('⚠ CRITICAL: DEBT THRESHOLD BREACHED — CONSIDER RESTRUCTURING ⚠', centerX, y + 25, {
      font: 'bold 16px monospace',
      fill: COLORS.danger,
      align: 'center',
      baseline: 'middle',
    });
    y += 60;
  }

  // ── Continue Button ───────────────────────────────────────────────────
  const btnW = 260;
  const btnH = 52;
  const btnX = centerX - btnW / 2;
  const btnY = 980;

  const hover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;

  display.drawRect(btnX, btnY, btnW, btnH, {
    fill: hover ? COLORS.buttonHover : COLORS.button,
    stroke: COLORS.buttonBorder,
    lineWidth: 2,
  });

  const btnLabel = isPathContinuing ? '[Continue Expedition]' : '[Return to Hub]';
  display.drawText(btnLabel, centerX, btnY + btnH / 2, {
    font: 'bold 18px monospace',
    fill: COLORS.buttonText,
    align: 'center',
    baseline: 'middle',
  });

  // ── Click Handling ────────────────────────────────────────────────────
  if (input.isMousePressed(0) && hover) {
    pressedContinue = true;
  }

  if (input.isMouseReleased(0)) {
    if (hover && pressedContinue) {
      pressedContinue = false;
      return 'CONTINUE';
    }
    pressedContinue = false;
  }

  return null;
}
