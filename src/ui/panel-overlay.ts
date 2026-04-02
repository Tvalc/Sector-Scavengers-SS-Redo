import { MakkoEngine } from '@makko/engine';

/**
 * Draw a full-screen dim overlay between the hub and panel.
 * Must be called BEFORE drawing the panel itself.
 */
export function drawDimOverlay(
  display: typeof MakkoEngine.display,
  alpha: number = 0.70
): void {
  display.drawRect(0, 0, 1920, 1080, { fill: '#000000', alpha });
}

/** Ease-out quadratic: decelerating curve */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 2;
}

/**
 * Manages scale-in/out animation state for panels.
 * Scale runs from 0.9 → 1.0 during open, 1.0 → 0.9 during close.
 */
export class PanelAnimator {
  private openTime: number = 0;
  private closeTime: number = 0;
  private _state: 'idle' | 'opening' | 'closing' = 'idle';

  constructor(private readonly durationMs: number = 200) {}

  get state(): 'idle' | 'opening' | 'closing' {
    return this._state;
  }

  open(): void {
    this.openTime = performance.now();
    this._state = 'opening';
  }

  close(): void {
    this.closeTime = performance.now();
    this._state = 'closing';
  }

  getScale(now: number): number {
    if (this._state === 'idle') return 1.0;

    if (this._state === 'opening') {
      const elapsed = now - this.openTime;
      const t = Math.min(1, Math.max(0, elapsed / this.durationMs));
      return 0.9 + 0.1 * easeOut(t);
    }

    // closing
    const elapsed = now - this.closeTime;
    const t = Math.min(1, Math.max(0, elapsed / this.durationMs));
    if (t >= 1) return 0;
    return 1.0 - 0.1 * easeOut(t);
  }

  isVisible(now: number): boolean {
    if (this._state === 'closing') {
      const elapsed = now - this.closeTime;
      return elapsed < this.durationMs;
    }
    return true;
  }
}
