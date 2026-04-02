// Card Collection Panel - Pagination Controls

import { MakkoEngine } from '@makko/engine';
import { SCREEN_W } from './constants';

/** Render pagination controls, returns new page if clicked */
export function renderPagination(
  display: typeof MakkoEngine.display,
  mx: number,
  my: number,
  currentPageNum: number,
  totalPages: number,
  y: number,
): number | null {
  let newPage: number | null = null;

  const centerX = SCREEN_W / 2;
  const btnH = 70;
  const btnW = 80;
  const pageBtnSize = 55;

  // Previous button
  const prevX = centerX - 220;
  const prevHover = mx >= prevX && mx <= prevX + btnW && my >= y && my <= y + btnH;
  const prevEnabled = currentPageNum > 0;

  display.drawRoundRect(prevX, y, btnW, btnH, 8, {
    fill: prevEnabled ? (prevHover ? '#2d3748' : '#1a202c') : '#0d1117',
    stroke: prevEnabled ? '#4a5568' : '#2d3748',
    lineWidth: 3,
  });
  display.drawText('◀', prevX + btnW / 2, y + btnH / 2, {
    font: 'bold 28px sans-serif',
    fill: prevEnabled ? (prevHover ? '#ffffff' : '#a0aec0') : '#4a5568',
    align: 'center',
    baseline: 'middle',
  });

  if (prevEnabled && prevHover && MakkoEngine.input.isMouseReleased(0)) {
    newPage = currentPageNum - 1;
  }

  // Page indicator text
  display.drawText(`Page ${currentPageNum + 1} of ${totalPages}`, centerX, y + btnH / 2, {
    font: 'bold 28px monospace',
    fill: '#e2e8f0',
    align: 'center',
    baseline: 'middle',
  });

  // Page number buttons
  const maxVisiblePages = Math.min(5, totalPages);
  const startPage = Math.max(0, Math.min(currentPageNum - 2, totalPages - maxVisiblePages));
  let pageBtnX = centerX + 100;

  for (let i = 0; i < maxVisiblePages; i++) {
    const pageNum = startPage + i;
    const isCurrent = pageNum === currentPageNum;
    const pageHover = mx >= pageBtnX && mx <= pageBtnX + pageBtnSize &&
                      my >= y + 8 && my <= y + 8 + pageBtnSize;

    display.drawCircle(pageBtnX + pageBtnSize / 2, y + 8 + pageBtnSize / 2, pageBtnSize / 2, {
      fill: isCurrent ? '#63b3ed' : (pageHover ? '#2d3748' : '#1a202c'),
      stroke: isCurrent ? '#90cdf4' : '#4a5568',
      lineWidth: 3,
    });
    display.drawText(String(pageNum + 1), pageBtnX + pageBtnSize / 2, y + 8 + pageBtnSize / 2, {
      font: isCurrent ? 'bold 26px sans-serif' : '22px sans-serif',
      fill: isCurrent ? '#ffffff' : '#a0aec0',
      align: 'center',
      baseline: 'middle',
    });

    if (!isCurrent && pageHover && MakkoEngine.input.isMouseReleased(0)) {
      newPage = pageNum;
    }

    pageBtnX += pageBtnSize + 15;
  }

  // Next button
  const nextX = pageBtnX + 30;
  const nextHover = mx >= nextX && mx <= nextX + btnW && my >= y && my <= y + btnH;
  const nextEnabled = currentPageNum < totalPages - 1;

  display.drawRoundRect(nextX, y, btnW, btnH, 8, {
    fill: nextEnabled ? (nextHover ? '#2d3748' : '#1a202c') : '#0d1117',
    stroke: nextEnabled ? '#4a5568' : '#2d3748',
    lineWidth: 3,
  });
  display.drawText('▶', nextX + btnW / 2, y + btnH / 2, {
    font: 'bold 28px sans-serif',
    fill: nextEnabled ? (nextHover ? '#ffffff' : '#a0aec0') : '#4a5568',
    align: 'center',
    baseline: 'middle',
  });

  if (nextEnabled && nextHover && MakkoEngine.input.isMouseReleased(0)) {
    newPage = currentPageNum + 1;
  }

  return newPage;
}
