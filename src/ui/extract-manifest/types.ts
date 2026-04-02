// Extract Manifest — Type Definitions

import { HaulDecision } from '../../types/state';

export type ExtractManifestAction =
  | { type: 'CONFIRM_EXTRACT'; decisions: HaulDecision[] }
  | { type: 'DECLARE_ALL' };

export interface HeaderContent {
  title: string;
  subtitle: string;
  declareFlavor: string;
  smuggleWarning: string;
  accentColor: string;
}
