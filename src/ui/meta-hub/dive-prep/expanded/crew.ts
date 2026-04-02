// Expanded Crew View Renderer

import { MakkoEngine } from '@makko/engine';
import type { MetaState, DivePrepState } from '../../../../types/state';
import type { CrewMemberId } from '../../../../content/crew';
import { CREW_ROSTER, getCrewDoctrineAffinity } from '../../../../content/crew';
import { DOCTRINE_COLORS } from '../constants';
import { DivePrepAction } from '../types';
import {
  ACCENT, SUCCESS, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, BORDER_DEFAULT
} from '../../../panel-layout';
import { isOver } from '../../../panel-layout';

export function renderExpandedCrew(
  display: typeof MakkoEngine.display,
  input: typeof MakkoEngine.input,
  meta: MetaState,
  divePrep: DivePrepState,
  mx: number,
  my: number,
  y: number,
  h: number,
  setAction: (a: DivePrepAction) => void,
): void {
  const availableCrew: CrewMemberId[] = [
    ...(meta.leadId !== null ? [meta.leadId] : []),
    ...meta.companionIds,
  ];

  if (availableCrew.length === 0) {
    display.drawText('No active crew', 960, y + h / 2, {
      font: 'bold 32px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'middle',
    });
    return;
  }

  // Show all crew in a horizontal row
  const cardW = 200;
  const cardH = 280;
  const cardGap = 30;
  const totalWidth = availableCrew.length * cardW + (availableCrew.length - 1) * cardGap;
  const startX = 960 - totalWidth / 2;
  const cardY = y + 80;

  for (let i = 0; i < availableCrew.length; i++) {
    const crewId = availableCrew[i];
    const crew = CREW_ROSTER[crewId];
    const isSelected = divePrep.selectedCrewId === crewId;
    const level = meta.crewLevels[crewId] ?? 1;
    const cx = startX + i * (cardW + cardGap);

    // Card background
    const hover = isOver(mx, my, cx, cardY, cardW, cardH);
    display.drawRoundRect(cx, cardY, cardW, cardH, 12, {
      fill: isSelected ? '#1a3a4a' : hover ? '#1e293b' : '#0f172a',
      stroke: isSelected ? ACCENT : hover ? ACCENT : BORDER_DEFAULT,
      lineWidth: isSelected ? 4 : 2,
    });

    // Large initial
    display.drawCircle(cx + cardW / 2, cardY + 80, 50, {
      fill: '#1a202c',
      stroke: isSelected ? ACCENT : BORDER_DEFAULT,
      lineWidth: 2,
    });
    display.drawText(crew.name.charAt(0).toUpperCase(), cx + cardW / 2, cardY + 80, {
      font: 'bold 60px monospace',
      fill: ACCENT,
      align: 'center',
      baseline: 'middle',
    });

    // Name
    display.drawText(crew.name.toUpperCase(), cx + cardW / 2, cardY + 160, {
      font: 'bold 24px monospace',
      fill: isSelected ? ACCENT : TEXT_PRIMARY,
      align: 'center',
      baseline: 'top',
    });

    // Role & level
    display.drawText(`${crew.role} · Lv${level}`, cx + cardW / 2, cardY + 195, {
      font: '18px monospace',
      fill: TEXT_SECONDARY,
      align: 'center',
      baseline: 'top',
    });

    // Passive
    const passiveText = crew.passiveDesc.length > 35
      ? crew.passiveDesc.slice(0, 35) + '...'
      : crew.passiveDesc;
    display.drawText(passiveText, cx + cardW / 2, cardY + 225, {
      font: '14px monospace',
      fill: TEXT_MUTED,
      align: 'center',
      baseline: 'top',
    });

    // Click to select
    if (hover && input.isMouseReleased(0)) {
      setAction({ type: 'SELECT_CREW', crewId });
    }
  }

  // Selected crew details at bottom
  const selectedCrewId = divePrep.selectedCrewId ?? meta.leadId;
  if (selectedCrewId) {
    const crew = CREW_ROSTER[selectedCrewId];
    const affinity = getCrewDoctrineAffinity(selectedCrewId);

    display.drawText(`Selected: ${crew.name} (${crew.role})`, 960, y + h - 120, {
      font: 'bold 28px monospace',
      fill: SUCCESS,
      align: 'center',
      baseline: 'top',
    });

    if (affinity) {
      display.drawText(`Doctrine: ${affinity}`, 960, y + h - 80, {
        font: '22px monospace',
        fill: DOCTRINE_COLORS[affinity],
        align: 'center',
        baseline: 'top',
      });
    }
  }
}
