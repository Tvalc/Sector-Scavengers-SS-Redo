import { MakkoEngine } from '@makko/engine';

export function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

export function drawButton(
  label: string,
  x: number, y: number, w: number, h: number,
  enabled: boolean,
  hover: boolean,
  fillActive: string,
  fillHover: string,
  strokeActive: string,
  strokeHover: string,
  fontSize = 20,
): void {
  const display = MakkoEngine.display;
  const fill = !enabled ? '#1a202c' : hover ? fillHover : fillActive;
  const stroke = !enabled ? '#4a5568' : hover ? strokeHover : strokeActive;
  const color = enabled ? '#ffffff' : '#4a5568';
  
  display.drawRect(x, y, w, h, { fill, stroke, lineWidth: 1 });
  display.drawText(label, x + w / 2, y + h / 2, {
    font: `${fontSize}px monospace`,
    fill: color,
    align: 'center',
    baseline: 'middle',
  });
}
