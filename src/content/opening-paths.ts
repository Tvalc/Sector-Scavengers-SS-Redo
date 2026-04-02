export type OpeningPathId = 'cold_extract' | 'cut_and_run' | 'duty_claim';

export interface OpeningPathConfig {
  id: OpeningPathId;
  label: string;
  description: string;
  voidEchoBonus: number;
  debt: number;
  startingCredits: number;   // added to meta.credits on path selection
  extractionBonus: number;   // flat credits added on each clean extract
  sidegrade: string;         // one-line balance reminder shown in hub
}

// Sidegrade rationale:
//   cold_extract  — biggest debt but compensated by the highest starting cash
//                   injection and a void echo head-start.
//   cut_and_run   — middle ground: modest void, average debt, small per-run
//                   extraction bonus that compounds over many dives.
//   duty_claim    — largest crew but punishing debt and zero starting cash;
//                   compensates over time via raw dive throughput.

export const OPENING_PATH_CONFIG: Record<OpeningPathId, OpeningPathConfig> = {
  cold_extract: {
    id: 'cold_extract',
    label: 'COLD EXTRACT',
    description: 'Selfish extract. High void. Fly solo.',
    voidEchoBonus: 3,
    debt: 1000000, // 1M base - LOW debt modifier makes this 800K
    startingCredits: 800,
    extractionBonus: 0,
    sidegrade: 'High void. Fly solo. Extra startup cash.',
  },
  cut_and_run: {
    id: 'cut_and_run',
    label: 'CUT AND RUN',
    description: 'Partial rescue. Balanced start. 1 crew.',
    voidEchoBonus: 1,
    debt: 1000000, // 1M base - MEDIUM debt modifier keeps it at 1M
    startingCredits: 500,
    extractionBonus: 30,
    sidegrade: 'Balanced. Small extract bonus per run.',
  },
  duty_claim: {
    id: 'duty_claim',
    label: 'DUTY CLAIM',
    description: 'Save everyone. Strong start. High debt.',
    voidEchoBonus: 0,
    debt: 1000000, // 1M base - HIGH debt modifier makes this 1.25M
    startingCredits: 200,
    extractionBonus: 0,
    sidegrade: 'High debt. Strong crew. No startup cash.',
  },
};

export const OPENING_PATH_ORDER: OpeningPathId[] = [
  'cold_extract',
  'cut_and_run',
  'duty_claim',
];
