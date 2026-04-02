import { TacticCard } from '../../content/cards';

/** Tutorial interaction type for card locking */
export interface TutorialCardInteraction {
  type: 'dive-card';
  id: string;
}

export interface DiveAction {
  cardId?: string;
  type?: 'REDRAW_HAND' | 'USE_HARDWARE_ABILITY' | 'FRESH_START_REDRAW' | 'SURGICAL_DISCARD' | 'DESPERATE_SCRAMBLE';
  hardwareSlot?: 'hull' | 'scanner' | 'utility';
  cardIndex?: number;
  /** Whether to overcharge a card or hardware ability. */
  overcharge?: boolean;
}
