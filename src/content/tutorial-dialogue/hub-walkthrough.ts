import type { TutorialDialogueEntry } from './types';

// Hub Walkthrough Tutorial - Step 2 (18 entries)
export const HUB_WALKTHROUGH_ENTRIES: TutorialDialogueEntry[] = [
  {
    step: 2,
    speaker: 'VALU',
    text: 'Start Dive. One energy block consumed. Obligation. Not opportunity.',
    highlight: 'start-dive-btn',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: '₡20,000 per block. Emergency costs more. Machine cares about throughput.',
    highlight: 'recharge-btn',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Scrap Job. Free. Once per run. Machine permits data generation.',
    highlight: 'scrap-btn',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Salvage Market. Sell what you extract. Credits become balance. Balance becomes debt reduction.',
    highlight: 'salvage-btn',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Overview tab. Energy, credits, bill countdown. Debt is the only metric that matters.',
    highlight: 'tab-overview',
    lockHub: true,
    expectedInteraction: { type: 'hub-tab', id: 'overview' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: '₡1,000,000 debt. Earn credits. Spend energy. Reduce the debt. Survive.',
    highlight: 'debt-display',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Cards: Scavenge, Repair, Extract. More unlock through play. Collection tracks progress.',
    highlight: 'tactics-loadout',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Bill countdown. Machine collects periodically. Pay: debt shrinks. Skip: debt doubles.',
    highlight: 'bill-countdown',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Crew tab. Live crew cost upkeep. Assignments provide bonuses. First free. Second costs.',
    highlight: 'tab-crew',
    lockHub: true,
    expectedInteraction: { type: 'hub-tab', id: 'crew' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Assign crew for bonuses: REPAIRS, SCAV, MARKET. Idle crew waste resources.',
    highlight: 'crew-roster',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Station Modules. Permanent infrastructure. Upgrades compound across runs.',
    highlight: 'modules-section',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Ships • Void • Hardware. Three systems. All permanent. All expensive.',
    highlight: 'tab-secondary',
    lockHub: true,
    expectedInteraction: { type: 'hub-tab', id: 'secondary' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Void Communion. Hardware. Ships. Explore these when debt permits.',
    highlight: 'secondary-nav-buttons',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Ships. Focus one at a time. Progress per run. Claimed ships grant permanent bonuses.',
    highlight: 'ships-section',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Overview. The debt number. Your cards below. Tools provided. Survival is incidental.',
    highlight: 'tab-overview',
    lockHub: true,
    expectedInteraction: { type: 'hub-tab', id: 'overview' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Scavenge. Repair. Extract. More unlock through failure, doctrine, research.',
    highlight: 'tab-overview',
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Win: zero debt. Lose: debt over ₡10M or 3 missed bills. Machine compounds failure.',
    highlight: null,
    lockHub: true,
    expectedInteraction: { type: 'next-btn' }
  },
  {
    step: 2,
    speaker: 'VALU',
    text: 'Button waits. Machine waits. You are a debt instrument. Move.',
    highlight: 'start-dive-btn',
    lockHub: false,
    expectedInteraction: { type: 'hub-btn', id: 'start-dive' }
  }
];
