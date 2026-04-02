// Extract Manifest UI — Orchestration
// Coordinates rendering of the extraction decision screen

import { MakkoEngine } from '@makko/engine';
import { RunState, MetaState } from '../../types/state';
import { ExtractManifestAction } from './types';
import { initDecisions, resetState, getDeclaredRatio } from './state';
import { getHeaderContent, getSubtext } from './header';
import { renderBackground, renderHeader } from './render-background';
import { renderLeftColumn } from './render-left';
import { renderCenterColumn } from './render-center';
import { renderRightColumn } from './render-right';
import { renderBottomBar } from './render-bottom';

export type { ExtractManifestAction } from './types';

export function renderExtractManifest(
  run: RunState,
  meta: MetaState,
  mx: number,
  my: number,
  isPressed: boolean,
): ExtractManifestAction | null {
  const display = MakkoEngine.display;
  if (!display) return null;

  initDecisions(run.salvage);

  const header = getHeaderContent(meta.doctrineLocked);
  const declaredRatio = getDeclaredRatio(run.salvage);
  const subtext = getSubtext(header, declaredRatio);

  renderBackground(display);
  renderHeader(display, header, subtext);

  renderLeftColumn(display, run, 160);
  renderCenterColumn(display, run, mx, my, isPressed, 160);
  renderRightColumn(display, run, meta, header.accentColor, 160);

  return renderBottomBar(display, run, meta, mx, my, isPressed, header.accentColor);
}

export function resetExtractManifest(): void {
  resetState();
}
