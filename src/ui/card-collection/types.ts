// Card Collection Panel - Type Definitions

import { TacticCard } from '../../content/cards';

export type CardCollectionContext = 'meta' | 'dive' | 'hub';

export interface CardUnlockInfo {
  card: TacticCard;
  unlocked: boolean;
  unlockRequirement: string;
  progress?: string;
  hidden: boolean;
  doctrineAlignment?: 'corporate' | 'cooperative' | 'smuggler';
  doctrinePointsRequired?: number;
}
