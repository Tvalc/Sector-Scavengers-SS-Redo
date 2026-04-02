import { MakkoEngine } from '@makko/engine';

const SPARK_COLORS = ['#00ffff', '#00d4ff', '#7df9ff', '#4deeea', '#ffffff'];

export function renderElectricitySpark(
  display: typeof MakkoEngine.display,
  x: number,
  y: number,
  w: number,
  h: number,
  now: number,
  intensity: number = 1,
): void {
  const numSparks = Math.floor(8 * intensity);

  for (let i = 0; i < numSparks; i++) {
    let startX: number, startY: number;
    const side = Math.floor(Math.random() * 4);

    switch (side) {
      case 0: startX = x + Math.random() * w; startY = y; break;
      case 1: startX = x + w; startY = y + Math.random() * h; break;
      case 2: startX = x + Math.random() * w; startY = y + h; break;
      default: startX = x; startY = y + Math.random() * h; break;
    }

    let currentX = startX;
    let currentY = startY;
    const segments = 3 + Math.floor(Math.random() * 4);

    for (let j = 0; j < segments; j++) {
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;
      const nextX = currentX + offsetX;
      const nextY = currentY + offsetY;

      if (nextX < x - 20 || nextX > x + w + 20 || nextY < y - 20 || nextY > y + h + 20) {
        break;
      }

      const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      const alpha = 0.7 + Math.random() * 0.3;

      display.drawLine(currentX, currentY, nextX, nextY, {
        stroke: color,
        lineWidth: 1 + Math.random() * 2,
        alpha: alpha,
      });

      display.drawCircle(nextX, nextY, 2, {
        fill: color,
        alpha: 0.8,
      });

      currentX = nextX;
      currentY = nextY;
    }
  }

  if (Math.random() > 0.5) {
    const arcX = x + Math.random() * w;
    const arcY = y + Math.random() * h;
    const arcRadius = 10 + Math.random() * 20;

    display.drawCircle(arcX, arcY, arcRadius, {
      stroke: '#00ffff',
      lineWidth: 2,
      alpha: 0.4,
    });
  }
}
