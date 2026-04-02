import type { TutorialDialogueEntry } from './types';

/**
 * Expedition Debt Tutorial Entries
 *
 * VALU explains the debt and billing systems at key moments:
 * - First time seeing debt contract (intro)
 * - First time seeing billing forecast (end of expedition)
 * - First time seeing post-ship progress (mid-expedition)
 */

// Debt Contract Tutorial - Step 30 (shown after debt contract screen)
export const DEBT_CONTRACT_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 30,
    speaker: 'VALU',
    text: 'Nexus Corporation requires debt acknowledgement. Your revival incurs obligation.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 30,
    speaker: 'VALU',
    text: 'Debt is the primary lose condition. Exceed ten million credits, and contract terminates. Three missed payments, same result.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 30,
    speaker: 'VALU',
    text: 'Every expedition triggers billing. Base amount plus crew upkeep per active crew member. More crew equals more pressure.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 30,
    speaker: 'VALU',
    text: 'Extracted credits automatically apply to outstanding debt. Nexus prefers direct deduction. No option to withhold.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 30,
    speaker: 'VALU',
    text: 'Surplus after debt payment is yours. Hardware. Crew. Expansion. Profit from efficiency.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];

// Billing Forecast Tutorial - Step 31 (shown when first seeing billing forecast)
export const BILLING_FORECAST_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 31,
    speaker: 'VALU',
    text: 'Billing forecast. Predictive calculation before obligation settlement.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 31,
    speaker: 'VALU',
    text: 'Green indicates coverage. Expedition earnings exceed billing obligation. Debt will decrease.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 31,
    speaker: 'VALU',
    text: 'Yellow signals proximity. Earnings approach billing amount. Marginal coverage. Risk of shortfall.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 31,
    speaker: 'VALU',
    text: 'Red indicates default. Insufficient earnings. Bill will be missed. Debt doubles. Consecutive missed payments accumulate.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 31,
    speaker: 'VALU',
    text: 'Forecast is prediction only. Actual billing applies after confirmation. Proceed when ready.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];

// Post-Ship Progress Tutorial - Step 32 (shown first time seeing post-ship progress)
export const POST_SHIP_PROGRESS_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 32,
    speaker: 'VALU',
    text: 'Expedition progress summary. Accumulated resources across multiple ships.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 32,
    speaker: 'VALU',
    text: 'Left panel: current ship results. Center panel: expedition totals and progress. Right panel: next target preview.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 32,
    speaker: 'VALU',
    text: 'Credits accumulate across ships. Salvage accumulates. Deck expands. All resources persist until expedition completion or collapse.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 32,
    speaker: 'VALU',
    text: 'Expedition billing applies once at conclusion. Single calculation based on total accumulated credits. More efficient than per-ship billing.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 32,
    speaker: 'VALU',
    text: 'Continue to select next target. Expedition persists until boss node cleared or hull collapsed.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];

// Missed Payment Warning Tutorial - Step 33 (shown when about to miss first payment)
export const MISSED_PAYMENT_WARNING_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 33,
    speaker: 'VALU',
    text: 'Warning. Billing shortfall predicted. Earnings insufficient for obligation.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 33,
    speaker: 'VALU',
    text: 'Missed payment penalty: debt increases by full billing amount. Current debt doubles in effect.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 33,
    speaker: 'VALU',
    text: 'Consecutive missed payments tracked. Maximum tolerance: three. Fourth terminates contract.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 33,
    speaker: 'VALU',
    text: 'Recommendation: reduce crew count between expeditions. Decrease upkeep burden. Improve billing coverage probability.',
    highlight: null,
    expectedInteraction: { type: 'next-btn' }
  }
];
