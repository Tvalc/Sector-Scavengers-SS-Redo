/**
 * Types for Intro Wake Scene
 */

import { IntroSpeaker } from '../../content/intro-narrative';

export type Stage = 'previously' | 'opening' | 'choice_1' | 'bridge' | 'terminal_lines' | 'recap' | 'done';

export interface AlarmFlashState {
  active: boolean;
  flashCount: number;
  elapsedMs: number;
}

export interface SpeakerColors {
  bg: string;
  border: string;
  text: string;
}

export type SpeakerColorMap = Record<IntroSpeaker, SpeakerColors>;
