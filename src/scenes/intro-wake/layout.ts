/**
 * Layout constants for Intro Wake Scene
 *
 * Dialogue box sits at the bottom of the screen.
 * Character sprites are rendered above it,
 * bottom-anchored flush with the top of the dialogue area.
 */

// Speaker badge — left-aligned above the dialogue box
export const SPEAKER_BADGE_W = 200;
export const SPEAKER_BADGE_H = 38;
export const SPEAKER_BADGE_X = 120;
export const SPEAKER_BADGE_Y = 755;

// Dialogue text box — bottom of screen
export const TEXT_BOX_X = 120;
export const TEXT_BOX_Y = 811;
export const TEXT_BOX_W = 1680;
export const TEXT_BOX_H = 200;

// Bottom edge of dialogue box — used to align choice cards
export const DIALOGUE_BOTTOM = TEXT_BOX_Y + TEXT_BOX_H; // 1036

// Intro choice cards — bigger cards, bottom-aligned with dialogue box
export const INTRO_CARD_W = 340;
export const INTRO_CARD_H = 420;
export const INTRO_CARD_GAP = 50;

// Offset to move cards down and prevent cut-off at top, plus 25px padding from UI boxes
export const INTRO_CARD_Y_OFFSET = 50;

// Character sprite positions — right side, anchored flush with top of dialogue box
// Dialogue box top edge is at TEXT_BOX_Y (811)
export const CHAR_ANCHOR_Y = 811;
export const NARRATOR_CHAR_X = 1580;
export const SDE_CHAR_X = 1580;
export const CHAR_SCALE = 1.0;
export const NARRATOR_CHAR_SCALE = 1.0;

// Fade timing
export const DIALOGUE_FADE_MS = 600;

export const TYPEWRITER_CHARS_PER_MS = 40 / 1000; // 40 chars/sec
