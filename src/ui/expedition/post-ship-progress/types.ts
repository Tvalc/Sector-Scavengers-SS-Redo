/**
 * Post-Ship Progress Types
 *
 * State and action types for the post-ship progress screen.
 */

import type { RunPath, PathTreeNode, MetaState, RunState } from '../../../types/state';
import type { ShipBillingResult } from '../../../dive/expedition-billing';

/** State container for post-ship progress rendering. */
export interface PostShipProgressState {
  runPath: RunPath;
  completedNode: PathTreeNode;
  lastRun: RunState | null;
  doctrinePointsGained: Record<string, number>;
  meta: MetaState;
  /** Billing result from processing this ship's billing, if already processed */
  billingResult?: ShipBillingResult;
}

/** Actions emitted by the post-ship progress screen. */
export type PostShipProgressAction =
  | { type: 'CONTINUE' }
  | { type: 'PAY_DEBT'; amount: number }
  | { type: 'EXPEDITION_VICTORY' }
  | { type: 'EXPEDITION_FAILED' };

/** Possible expedition outcomes determining screen flow. */
export type ExpeditionOutcome = 'ongoing' | 'victory' | 'ceiling_death' | 'strike_out';
