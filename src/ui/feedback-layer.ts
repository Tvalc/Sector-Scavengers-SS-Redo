import { MakkoEngine } from '@makko/engine';

export interface FeedbackEvent {
  text: string;
  x: number;
  y: number;
  color: string;
  startTime: number;
  duration: number;
  vy: number;
}

export class FeedbackLayer {
  private events: FeedbackEvent[] = [];

  spawn(
    text: string,
    x: number,
    y: number,
    color: string,
    duration: number = 1200
  ): void {
    this.events.push({
      text,
      x,
      y,
      color,
      startTime: performance.now(),
      duration,
      vy: -0.04,
    });
  }

  update(now: number): void {
    this.events = this.events.filter(
      (e) => now - e.startTime < e.duration
    );
  }

  render(display: typeof MakkoEngine.display, now: number): void {
    for (const e of this.events) {
      const elapsed = now - e.startTime;
      const ratio = Math.min(1, elapsed / e.duration);
      const alpha = 1 - ratio ** 2;
      const yOffset = e.vy * elapsed;
      display.drawText(e.text, e.x, e.y + yOffset, {
        font: 'bold 22px monospace',
        fill: e.color,
        alpha,
        align: 'center',
        baseline: 'middle',
      });
    }
  }
}

export const feedbackLayer = new FeedbackLayer();
