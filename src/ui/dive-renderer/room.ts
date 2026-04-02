import { MakkoEngine } from '@makko/engine';
import { RunState } from '../../types/state';
import { ROOM_X, ROOM_Y, ROOM_W, ROOM_H } from './constants';

/** Room background color (fallback when no asset available) */
function getRoomBackgroundColor(nodeType: string | undefined): string {
  switch (nodeType) {
    case 'salvage':
      return '#1a2a2a';
    case 'signal':
      return '#1a2a3a';
    case 'cache':
      return '#2a2a1a';
    case 'audit':
      return '#2a1a1a';
    case 'boss':
      return '#2a1a2a';
    default:
      return '#1a2a3a';
  }
}

/** Render the current room (main view) - background only, no overlays */
export function renderRoom(
  display: typeof MakkoEngine.display,
  run: RunState,
): void {
  const currentNodeIndex = run.round - 1;
  const nodeType = run.nodeMap[currentNodeIndex];
  const bgColor = getRoomBackgroundColor(nodeType);

  // Room background - use stored background asset if available, otherwise fallback to theme color
  let backgroundDrawn = false;
  if (run.backgroundAsset) {
    const asset = MakkoEngine.staticAsset(run.backgroundAsset);
    if (asset && asset.image) {
      display.drawImage(asset.image, ROOM_X, ROOM_Y, ROOM_W, ROOM_H);
      backgroundDrawn = true;
    }
  }
  if (!backgroundDrawn) {
    display.drawRect(ROOM_X, ROOM_Y, ROOM_W, ROOM_H, {
      fill: bgColor,
    });
  }
}
