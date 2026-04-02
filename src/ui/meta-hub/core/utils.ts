import { RARITY_COLORS, RESOURCE_LABELS, PANEL_NAMES } from './constants';

export function isOver(mx: number, my: number, x: number, y: number, w: number, h: number): boolean {
  return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

export function getCardRarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? '#718096';
}

export function getResourceLabel(resource: 'ship' | 'crew' | 'hardware'): string {
  return RESOURCE_LABELS[resource];
}

export function getPanelNameForResource(resource: 'ship' | 'crew' | 'hardware'): string {
  return PANEL_NAMES[resource] ?? 'PANEL';
}
