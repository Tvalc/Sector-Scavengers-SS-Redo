// Extract Manifest — Header Content by Doctrine

import { HeaderContent } from './types';
import { COLORS } from './constants';

export function getHeaderContent(doctrineLocked: string | null): HeaderContent {
  switch (doctrineLocked) {
    case 'smuggler':
      return {
        title: 'HAUL ASSESSMENT — PRIVATE CONTRACTOR SUBMISSION',
        subtitle: 'Nexus "chooses not to know" about certain arrangements. Use that gift wisely.',
        declareFlavor: 'Transparency builds trust. Trust gets you better contracts tomorrow.',
        smuggleWarning: 'The unlogged cargo stays between us. And the automated systems that may or may not be watching.',
        accentColor: COLORS.accentPurple,
      };
    case 'cooperative':
      return {
        title: 'SHARED RECOVERY MANIFEST — COLLECTIVE DISTRIBUTION',
        subtitle: 'What we declare benefits all of us. What we hide... benefits only some.',
        declareFlavor: 'Shared resources build collective strength. The crew eats when the ledger is honest.',
        smuggleWarning: 'Withholding from the collective is a choice you make alone. The consequences, we bear together.',
        accentColor: COLORS.accentGreen,
      };
    case 'corporate':
    default:
      return {
        title: 'EXTRACTION MANIFEST — NEXUS CORP COMPLIANCE DIVISION',
        subtitle: 'Automated assessment. Automated consequences. Your cooperation is logged.',
        declareFlavor: 'You are acknowledging Nexus ownership of these materials. The Company will credit your debt account at standard rates.',
        smuggleWarning: 'Undeclared items constitute material withholding. Automated systems are calibrated to detect such events.',
        accentColor: COLORS.accentCyan,
      };
  }
}

export function getSubtext(header: HeaderContent, declaredRatio: number): { text: string; color: string } {
  const isMostlyDeclared = declaredRatio >= 0.7;
  const isMostlySmuggled = declaredRatio <= 0.3;

  if (isMostlyDeclared) {
    return { text: header.declareFlavor, color: COLORS.muted };
  }
  if (isMostlySmuggled) {
    return { text: header.smuggleWarning, color: COLORS.accentAmber };
  }
  return {
    text: 'You are dividing the haul between declared and undeclared. The system notes your choice.',
    color: COLORS.muted,
  };
}
