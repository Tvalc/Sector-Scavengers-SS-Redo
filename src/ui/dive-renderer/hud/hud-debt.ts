import { MakkoEngine } from '@makko/engine';
import { RunState, RunPath, MetaState } from '../../../types/state';
import { calculateShipBilling } from '../../../dive/expedition-billing';
import { ROOM_X, ROOM_W } from '../constants';

/** Render debt/billing summary bar below the zone/round indicator */
export function renderDebtBar(
  display: typeof MakkoEngine.display,
  run: RunState,
  meta: MetaState,
  alpha: number,
  runPath?: RunPath | null,
): void {
  const centerX = ROOM_X + ROOM_W / 2;
  const barY = 33;

  // Use expedition debt when on an expedition, otherwise fall back to meta debt
  const debt = runPath ? runPath.expeditionDebt : meta.debt;
  
  // Compute next bill: expedition billing when on expedition, otherwise hub billing
  let totalBill: number;
  if (runPath) {
    totalBill = calculateShipBilling(debt);
  } else {
    const awakeCrew = (meta.leadId ? 1 : 0) + meta.companionIds.length;
    totalBill = meta.billingAmount + awakeCrew * meta.upkeepPerAwakeCrew;
  }

  // Compact single-line debt summary
  const debtText = `DEBT ₡${debt.toLocaleString()}`;
  const billText = `NEXT BILL ₡${totalBill.toLocaleString()}`;

  // Debt in red
  display.drawText(debtText, centerX - 150, barY, {
    font: '13px monospace',
    fill: debt > 0 ? '#fc8181' : '#68d391',
    align: 'center',
    baseline: 'top',
    alpha,
  });

  // Bill amount in amber
  display.drawText(billText, centerX + 150, barY, {
    font: '13px monospace',
    fill: '#f6ad55',
    align: 'center',
    baseline: 'top',
    alpha,
  });

  // NOTE: Salvage value is HIDDEN during dive - players must estimate or use diagnostic cards
  // This creates uncertainty and makes extraction decisions more tense
}
