import type { DialogueEntry } from '../../dialogue/dialogue-player';
import type { TutorialInteraction } from '../../tutorial/tutorial-context';

export type HubHighlight =
  | 'start-dive-btn'
  | 'recharge-btn'
  | 'scrap-btn'
  | 'salvage-btn'
  | 'tab-overview'
  | 'tab-crew'
  | 'tab-secondary'
  | 'bill-countdown'
  | 'hull-display'
  | 'rounds-display'
  | 'card-scavenge'
  | 'card-repair'
  | 'card-extract'
  | 'route-map'
  | 'route-toggle-btn'
  // Panel tutorial highlights (steps 6-10)
  | 'salvage-inventory'
  | 'salvage-sell-btn'
  | 'salvage-pay-debt'
  | 'salvage-debt-display'
  | 'void-echo-count'
  | 'void-branches'
  | 'void-first-tier'
  | 'void-effect'
  | 'void-shop'
  | 'hw-equipped'
  | 'hw-inventory'
  | 'hw-equip-btn'
  | 'cryo-wake-btn'
  | 'cryo-pool'
  | 'modules-grid'
  | 'modules-upgrade-btn'
  // Ships panel highlights (step 12)
  | 'ship-grid'
  | 'ship-progress'
  | 'ship-focus-btn'
  // Sub-panel navigation highlights (secondary tab buttons)
  | 'void-communion-nav'
  | 'hardware-nav'
  | 'cryo-nav'
  | 'modules-nav'
  // Left panel elements (always visible on hub)
  | 'debt-display'
  | 'tactics-loadout'
  // Crew-modules tab content highlights
  | 'crew-roster'
  | 'modules-section'
  // Secondary tab content highlights
  | 'secondary-nav-buttons'
  | 'ships-section'
  // Extraction manifest highlight
  | 'extract-manifest'
  | null;

export interface TutorialDialogueEntry {
  step: number;
  speaker: 'VALU';
  text: string;
  highlight?: HubHighlight;
  lockHub?: boolean;
  lockCards?: boolean;
  expectedInteraction?: TutorialInteraction;
}
