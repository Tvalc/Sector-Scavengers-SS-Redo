export interface DialogueEntry {
  speaker: string;
  text: string;
}

export class DialoguePlayer {
  private entries: DialogueEntry[];
  private currentIndex: number;
  private displayedCharCount: number;
  private accumulatedTime: number;
  private readonly charsPerSecond: number = 30;
  private readonly msPerChar: number;

  constructor(entries: DialogueEntry[]) {
    this.entries = entries;
    this.currentIndex = 0;
    this.displayedCharCount = 0;
    this.accumulatedTime = 0;
    this.msPerChar = 1000 / this.charsPerSecond;
  }

  update(dt: number): void {
    if (this.currentIndex >= this.entries.length) return;
    if (this.displayedCharCount >= this.getCurrentText().length) return;

    this.accumulatedTime += dt;

    const charsToAdd = Math.floor(this.accumulatedTime / this.msPerChar);
    if (charsToAdd > 0) {
      this.displayedCharCount = Math.min(
        this.displayedCharCount + charsToAdd,
        this.getCurrentText().length
      );
      this.accumulatedTime -= charsToAdd * this.msPerChar;
    }
  }

  advance(): void {
    if (this.currentIndex >= this.entries.length) return;

    const currentText = this.getCurrentText();
    if (this.displayedCharCount < currentText.length) {
      // Skip typewriter - reveal full text
      this.displayedCharCount = currentText.length;
    } else {
      // Already fully displayed - advance to next entry if available
      if (this.currentIndex < this.entries.length - 1) {
        this.currentIndex++;
        this.displayedCharCount = 0;
        this.accumulatedTime = 0;
      }
    }
  }

  get isComplete(): boolean {
    if (this.entries.length === 0) return true;
    const isLastEntry = this.currentIndex >= this.entries.length - 1;
    const isFullyDisplayed = this.displayedCharCount >= this.getCurrentText().length;
    return isLastEntry && isFullyDisplayed;
  }

  get currentEntryIndex(): number {
    return this.currentIndex;
  }

  get totalEntries(): number {
    return this.entries.length;
  }

  get isOnLastEntry(): boolean {
    return this.currentIndex >= this.entries.length - 1;
  }

  getDisplayedText(): string {
    if (this.entries.length === 0) return '';
    const text = this.getCurrentText();
    return text.substring(0, this.displayedCharCount);
  }

  getCurrentSpeaker(): string {
    if (this.entries.length === 0) return '';
    const entry = this.entries[this.currentIndex];
    return entry?.speaker ?? '';
  }

  reset(entries?: DialogueEntry[]): void {
    if (entries) {
      this.entries = entries;
    }
    this.currentIndex = 0;
    this.displayedCharCount = 0;
    this.accumulatedTime = 0;
  }

  private getCurrentText(): string {
    const entry = this.entries[this.currentIndex];
    return entry?.text ?? '';
  }
}
