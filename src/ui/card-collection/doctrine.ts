// Card Collection Panel - Doctrine Detection and Colors

import { DOCTRINE_COLORS } from './constants';

const corporateCards = [
  'extract', 'secure_extract', 'quick_extract', 'upgrade', 'analyze',
  'corporate_mandate', 'audit_bribe', 'debt_leveraging', 'hostile_extraction',
  'marathon', 'credit_forecast', 'fortress_protocol', 'hull_investment'
];

const cooperativeCards = [
  'repair', 'patch_and_hold', 'shield', 'crew_effort', 'triage', 'field_medicine',
  'hull_surge', 'last_stand', 'bulwark', 'emergency_repair', 'structural_reinforce',
  'triage_protocol', 'bio_scavenge', 'regenerate', 'adaptive_shields',
  'capacitor_overload', 'bio_extract'
];

const smugglerCards = [
  'scavenge', 'risky_scavenge', 'black_market', 'calculated_risk', 'deep_salvage',
  'basic_relay', 'secure_channel', 'smugglers_relay', 'quantum_drop',
  'repair_bot', 'scavenge_bot', 'overdrive_extract', 'bot_swarm', 'overclock_bots',
  'void_pulse', 'entropy_gift', 'ancestral_extract', 'premonition',
  'echo_amplifier_card', 'void_communion_card'
];

/** Get doctrine alignment for a card ID */
export function getCardDoctrine(cardId: string): 'corporate' | 'cooperative' | 'smuggler' | 'neutral' {
  if (corporateCards.includes(cardId)) return 'corporate';
  if (cooperativeCards.includes(cardId)) return 'cooperative';
  if (smugglerCards.includes(cardId)) return 'smuggler';
  return 'neutral';
}

/** Get color scheme for a doctrine */
export function getDoctrineColors(doctrine: string) {
  return DOCTRINE_COLORS[doctrine] ?? DOCTRINE_COLORS.neutral;
}
