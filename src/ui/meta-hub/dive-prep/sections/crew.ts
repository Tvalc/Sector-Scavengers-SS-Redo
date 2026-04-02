// Crew Section Renderer

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../../types/state';
import type { CrewMemberId } from '../../../../content/crew';
import { CREW_ROSTER, getCrewDoctrineAffinity } from '../../../../content/crew';
import { EXPEDITION_DEBT_PER_CREW } from '../../../../config/constants';
import { formatDebt } from '../../../../dive/expedition-starting-debt';
import { renderSectionBackground } from '../layout';
import { renderPaginationControls } from '../pagination';
import { CREW_X, CREW_Y, SECTION_W, SECTION_H, DOCTRINE_COLORS } from '../constants';
import { crewPage, setCrewPage } from '../state';
import { DivePrepAction } from '../types';
import {
  ACCENT, SUCCESS, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BORDER_DEFAULT
} from '../../../panel-layout';
import { isOver } from '../../../panel-layout';

export function renderCrewSection(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  _now: number,
): DivePrepAction | null {
  let action: DivePrepAction | null = null;

  renderSectionBackground(display, CREW_X, CREW_Y, 'CREW');

  const availableCrew: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];

  if (availableCrew.length === 0) {
    display.drawText('No active crew. Wake crew from cryo.', CREW_X + SECTION_W / 2, CREW_Y + SECTION_H / 2, {
      font: 'bold 24px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    return action;
  }

  // Ensure crewPage is valid
  const validPage = Math.max(0, Math.min(crewPage, availableCrew.length - 1));
  if (validPage !== crewPage) setCrewPage(validPage);

  const crewId = availableCrew[crewPage];
  const crew = CREW_ROSTER[crewId];
  const isSelected = divePrep.selectedCrewId === crewId;
  const level = meta.crewLevels[crewId] ?? 1;
  const runs = meta.crewRunsParticipated[crewId] ?? 0;

  // Large crew icon
  const iconY = CREW_Y + 80;
  display.drawCircle(CREW_X + SECTION_W / 2, iconY, 70, {
    fill: '#1a202c',
    stroke: isSelected ? ACCENT : BORDER_DEFAULT,
    lineWidth: isSelected ? 4 : 2,
  });

  const initial = crew.name.charAt(0).toUpperCase();
  display.drawText(initial, CREW_X + SECTION_W / 2, iconY, {
    font: 'bold 80px monospace',
    fill: ACCENT,
    align: 'center',
    baseline: 'middle',
  });

  // Crew name
  const nameY = iconY + 100;
  display.drawText(crew.name.toUpperCase(), CREW_X + SECTION_W / 2, nameY, {
    font: 'bold 32px monospace',
    fill: isSelected ? ACCENT : TEXT_PRIMARY,
    align: 'center',
    baseline: 'top',
  });

  // Role and level
  display.drawText(`${crew.role} · Lv${level} · ${runs} runs`, CREW_X + SECTION_W / 2, nameY + 40, {
    font: '20px monospace',
    fill: TEXT_SECONDARY,
    align: 'center',
    baseline: 'top',
  });

  // Doctrine affinity badge
  const affinity = getCrewDoctrineAffinity(crewId);
  if (affinity) {
    const badgeY = nameY + 80;
    const badgeW = 140;
    const badgeH = 32;
    const badgeX = CREW_X + (SECTION_W - badgeW) / 2;

    display.drawRoundRect(badgeX, badgeY, badgeW, badgeH, 6, {
      fill: '#1a202c',
      stroke: DOCTRINE_COLORS[affinity],
      lineWidth: 2,
    });
    display.drawText(affinity.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH / 2, {
      font: 'bold 16px monospace',
      fill: DOCTRINE_COLORS[affinity],
      align: 'center',
      baseline: 'middle',
    });
  }

  // Debt cost indicator
  const debtY = nameY + 125;
  display.drawText(`+${formatDebt(EXPEDITION_DEBT_PER_CREW)} debt`, CREW_X + SECTION_W / 2, debtY, {
    font: '14px monospace',
    fill: '#f59e0b', // Warning color
    align: 'center',
    baseline: 'top',
  });

  // Pagination controls
  renderPaginationControls(
    display, input, mx, my,
    CREW_X + SECTION_W / 2 - 75,
    CREW_Y + SECTION_H - 90,
    150,
    crewPage,
    availableCrew.length,
    setCrewPage
  );

  // Select button
  const btnW = 140;
  const btnH = 40;
  const btnX = CREW_X + (SECTION_W - btnW) / 2;
  const btnY = CREW_Y + SECTION_H - 40;
  const btnHover = isOver(mx, my, btnX, btnY, btnW, btnH);

  display.drawRoundRect(btnX, btnY, btnW, btnH, 6, {
    fill: isSelected ? '#1a3a4a' : btnHover ? '#1e293b' : '#0f172a',
    stroke: isSelected ? ACCENT : btnHover ? ACCENT : BORDER_DEFAULT,
    lineWidth: 2,
  });
  display.drawText(isSelected ? 'SELECTED ✓' : 'SELECT', btnX + btnW / 2, btnY + btnH / 2, {
    font: 'bold 16px monospace',
    fill: isSelected ? SUCCESS : TEXT_PRIMARY,
    align: 'center',
    baseline: 'middle',
  });

  if (btnHover && input.isMouseReleased(0)) {
    action = { type: 'SELECT_CREW', crewId };
  }

  return action;
}
