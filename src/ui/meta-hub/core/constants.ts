import { ViewportRect } from './types';

// Screen dimensions
export const SCREEN_W = 1920;
export const SCREEN_H = 1080;

// Viewport hotspot regions (matching background art panels)
export const VIEWPORT: Record<string, ViewportRect> = {
  ship: { x: 500, y: 225, w: 385, h: 365 },
  crew: { x: 945, y: 205, w: 400, h: 370 },
  hardware: { x: 1415, y: 225, w: 400, h: 355 },
};

// Nameplate labels sit at the top of each viewport area
export const NAMEPLATE: Record<string, ViewportRect> = {
  ship: { x: 575, y: 185, w: 250, h: 35 },
  crew: { x: 1020, y: 185, w: 250, h: 35 },
  hardware: { x: 1505, y: 185, w: 250, h: 35 },
};

// Start Expedition button (lower-right blue rounded button area)
export const START_BTN: ViewportRect = { x: 1615, y: 865, w: 240, h: 175 };

// Secondary electric frame above Start Expedition (hover effect)
export const START_BTN_SECONDARY: ViewportRect = { x: 1610, y: 720, w: 250, h: 135 };

// Starting card previews - full size matching card collection (280x360)
export const CARD_PREVIEW = { w: 280, h: 360, gap: 40, y: 675, startX: 1110 };

// Recycle icon area
export const RECYCLE_ICON: ViewportRect = { x: 535, y: 715, w: 180, h: 260 };

// Left sidebar navigation
export const NAV_BTN_W = 180;
export const NAV_BTN_H = 50;
export const NAV_START_X = 160;

export const NAV: Record<string, number> = {
  cardCollection: 227,
  research: 341,
  stationModules: 457,
  crew: 580,
  ships: 702,
  voidShop: 820,
  voidCommunion: 947,
};

// Colors
export const COLOR = {
  accent: '#22d3ee',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  error: '#ef4444',
  errorBg: '#1a0a0a',
  errorBorder: '#ef4444',
  errorText: '#fca5a5',
};

// Error panel layout
export const ERROR_PANEL: ViewportRect = { x: 1300, y: 750, w: 500, h: 180 };

export const DOCTRINE_COLORS: Record<string, string> = {
  corporate: '#f6ad55',
  cooperative: '#68d391',
  smuggler: '#9f7aea',
};

export const RARITY_COLORS: Record<string, string> = {
  starter: '#a0aec0',
  common: '#48bb78',
  uncommon: '#63b3ed',
  rare: '#f6e05e',
};

export const RESOURCE_LABELS: Record<'ship' | 'crew' | 'hardware', string> = {
  ship: 'Ship not selected',
  crew: 'Crew not selected',
  hardware: 'Hardware not equipped',
};

export const PANEL_NAMES: Record<'ship' | 'crew' | 'hardware', string> = {
  ship: 'SHIPS',
  crew: 'CREW',
  hardware: 'HARDWARE',
};
