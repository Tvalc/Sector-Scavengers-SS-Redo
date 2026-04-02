// Pagination Controls Rendering

import { MakkoEngine } from '@makko/engine';
import { ACCENT, BORDER_DEFAULT, TEXT_SECONDARY, TEXT_MUTED } from '../../panel-layout';
import { isOver } from '../../panel-layout';

export function renderPaginationControls(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  mx: number,
  my: number,
  x: number,
  y: number,
  w: number,
  currentPage: number,
  totalPages: number,
  onPageChange: (newPage: number) => void,
): void {
  const btnW = 40;
  const btnH = 36;
  const btnY = y;

  // Left arrow
  const leftX = x;
  const leftHover = isOver(mx, my, leftX, btnY, btnW, btnH);
  display.drawRoundRect(leftX, btnY, btnW, btnH, 4, {
    fill: leftHover ? '#1e293b' : '#0f172a',
    stroke: currentPage > 0 ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText('◀', leftX + btnW / 2, btnY + btnH / 2, {
    font: 'bold 20px monospace',
    fill: currentPage > 0 ? ACCENT : TEXT_MUTED,
    align: 'center',
    baseline: 'middle',
  });

  if (leftHover && input.isMouseReleased(0) && currentPage > 0) {
    onPageChange(currentPage - 1);
  }

  // Page counter
  display.drawText(`${currentPage + 1}/${totalPages}`, leftX + btnW + 30, btnY + btnH / 2, {
    font: 'bold 18px monospace',
    fill: TEXT_SECONDARY,
    align: 'left',
    baseline: 'middle',
  });

  // Right arrow
  const rightX = leftX + btnW + 70;
  const rightHover = isOver(mx, my, rightX, btnY, btnW, btnH);
  display.drawRoundRect(rightX, btnY, btnW, btnH, 4, {
    fill: rightHover ? '#1e293b' : '#0f172a',
    stroke: currentPage < totalPages - 1 ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText('▶', rightX + btnW / 2, btnY + btnH / 2, {
    font: 'bold 20px monospace',
    fill: currentPage < totalPages - 1 ? ACCENT : TEXT_MUTED,
    align: 'center',
    baseline: 'middle',
  });

  if (rightHover && input.isMouseReleased(0) && currentPage < totalPages - 1) {
    onPageChange(currentPage + 1);
  }
}
