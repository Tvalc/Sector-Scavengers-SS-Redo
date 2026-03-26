import { IntroDialogueEntry, IntroEffect } from '../content/intro-dialogue';

/**
 * Controls playback of intro dialogue with typewriter effect.
 *
 * Linear sequence through dialogue entries. Each entry displays with
 * a typewriter effect at 30 chars/sec. Player can skip ahead or advance.
 */
export class IntroController {
  private entries: IntroDialogueEntry[];
  private elapsedMs: number = 0;
  private started: boolean = false;

  /** Current dialogue index (0-based) */
  currentIndex: number = 0;

  /** Text currently visible (typewriter progress) */
  displayedText: string = '';

  /** Whether the current entry's text is fully displayed */
  isTextComplete: boolean = false;

  /** Whether all dialogue has been consumed */
  isComplete: boolean = false;

  /** Characters per second for typewriter effect */
  private static readonly CHARS_PER_SEC = 30;

  constructor(entries: IntroDialogueEntry[]) {
    this.entries = entries;
  }

  /**
   * Begin playback from the first entry.
   */
  start(): void {
    this.started = true;
    this.currentIndex = 0;
    this.elapsedMs = 0;
    this.displayedText = '';
    this.isTextComplete = false;
    this.isComplete = this.entries.length === 0;
  }

  /**
   * Update typewriter progress.
   * @param dt Delta time in milliseconds
   */
  update(dt: number): void {
    if (!this.started || this.isComplete) return;

    const entry = this.entries[this.currentIndex];
    if (!entry) return;

    if (this.isTextComplete) return;

    this.elapsedMs += dt;

    // Calculate how many characters should be visible
    const charsToShow = Math.floor((this.elapsedMs / 1000) * IntroController.CHARS_PER_SEC);
    const fullText = entry.text;

    if (charsToShow >= fullText.length) {
      this.displayedText = fullText;
      this.isTextComplete = true;
    } else {
      this.displayedText = fullText.slice(0, charsToShow);
    }
  }

  /**
   * Advance dialogue: skip typewriter if incomplete, or go to next entry.
   * Sets isComplete when all entries are consumed.
   */
  advance(): void {
    if (!this.started || this.isComplete) return;

    if (!this.isTextComplete) {
      // Skip typewriter - reveal full text immediately
      const entry = this.entries[this.currentIndex];
      if (entry) {
        this.displayedText = entry.text;
        this.isTextComplete = true;
      }
      return;
    }

    // Move to next entry
    this.currentIndex++;
    this.elapsedMs = 0;
    this.displayedText = '';
    this.isTextComplete = false;

    if (this.currentIndex >= this.entries.length) {
      this.isComplete = true;
      this.currentIndex = this.entries.length;
    }
  }

  /**
   * Get the current dialogue entry, or null if complete/not started.
   */
  getCurrentEntry(): IntroDialogueEntry | null {
    if (!this.started || this.isComplete) return null;
    return this.entries[this.currentIndex] ?? null;
  }

  /**
   * Get the current entry's effect, if any.
   * Returns null if no current entry or no effect.
   */
  checkEffects(): IntroEffect | null {
    const entry = this.getCurrentEntry();
    return entry?.effect ?? null;
  }
}
