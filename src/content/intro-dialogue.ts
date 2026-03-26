export type IntroSpeaker = 'SYSTEM' | 'CORP_COMMS';

export type IntroEffect = 'alarm_flash' | 'fade_out' | 'fade_in' | 'show_choices';

export interface IntroDialogueEntry {
  id: string;
  speaker: IntroSpeaker;
  text: string;
  effect?: IntroEffect;
}

export const INTRO_DIALOGUE_ENTRIES: IntroDialogueEntry[] = [
  // === CRYO WAKE SEQUENCE ===
  {
    id: 'wake_1',
    speaker: 'SYSTEM',
    text: 'CRYO RECOVERY INITIATED. Vital signs nominal. Neural sync at 94%.',
    effect: 'alarm_flash',
  },
  {
    id: 'wake_2',
    speaker: 'SYSTEM',
    text: 'System check complete. Life support restored. Ship modules: OPERATIONAL.',
  },
  {
    id: 'wake_3',
    speaker: 'SYSTEM',
    text: 'CONTRACT BALANCE: ₡—REDACTED—. Payment required before cycle end. Service guarantees continuation.',
  },

  // === CORPORATE BRIEFING ===
  {
    id: 'briefing_1',
    speaker: 'CORP_COMMS',
    text: 'SALVAGE OPERATIVE. Welcome back to the waking world. Your contract has been renewed.',
    effect: 'fade_in',
  },
  {
    id: 'briefing_2',
    speaker: 'CORP_COMMS',
    text: 'Obligations remain in effect. You will dive designated void sectors. You will recover valuable materials. You will service your debt.',
  },
  {
    id: 'briefing_3',
    speaker: 'CORP_COMMS',
    text: 'Your outstanding balance has accrued. Time is the only currency we accept. Each cycle without payment increases pressure on your... continued employment.',
  },
  {
    id: 'briefing_4',
    speaker: 'CORP_COMMS',
    text: 'Select your operational parameters. Choose wisely—you will live with the consequences. The corporation expects results.',
  },

  // === DECISION MOMENT ===
  {
    id: 'decision_intro',
    speaker: 'SYSTEM',
    text: 'CONTRACT CONFIGURATION READY. Select operational profile to begin service cycle.',
    effect: 'show_choices',
  },
];

export type IntroDialogueId = typeof INTRO_DIALOGUE_ENTRIES[number]['id'];
