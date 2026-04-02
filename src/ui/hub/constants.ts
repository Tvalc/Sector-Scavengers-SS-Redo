import { MakkoEngine } from '@makko/engine';

// Full-screen layout with larger spacing and bigger elements
export const SCREEN_W = 1920;
export const SCREEN_H = 1080;
export const PADDING = 30;

// Left sidebar — status + action buttons (expanded from 240px to 320px)
export const LEFT_PANEL_X = PADDING;
export const LEFT_PANEL_Y = 50;
export const LEFT_PANEL_W = 320;

// Center — holographic route display (hero) - dynamic positioning
export const ROUTE_Y = 50;
export const ROUTE_H = 680;

// Bottom — tactics loadout cards (full dive-rendered size: 280x400)
export const CARDS_Y = 760;
export const CARD_W = 280;
export const CARD_H = 400;
export const CARD_GAP = 40;

// Top tabs (adjusted for new layout)
export const TABS_START_X = LEFT_PANEL_X + LEFT_PANEL_W + 60;
export const TABS_Y = 10;
export const TAB_W = 140;
export const TAB_GAP = 160;

// Route panel positioning (for tab content compatibility)
export const RP_Y = ROUTE_Y;  // Alias for legacy compatibility
export const RP_CONTENT_X = LEFT_PANEL_X + LEFT_PANEL_W + 60;

// Locked card slot dimensions
export const LOCKED_SLOT_W = 140;
export const LOCKED_SLOT_H = 200;
export const LOCKED_GAP = 16;

// Doctrine colors for locked card progress
export const DOCTRINE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  corporate: { bg: '#2d1f0f', text: '#f6ad55', border: '#ed8936' },
  cooperative: { bg: '#1a2f1a', text: '#68d391', border: '#48bb78' },
  smuggler: { bg: '#2d1f4a', text: '#9f7aea', border: '#805ad5' },
  neutral: { bg: '#1a202c', text: '#a0aec0', border: '#4a5568' },
};

export type HubBtnId = 'start-dive' | 'recharge' | 'modules' | 'salvage' | 'scrap';

// Note: Do not export display at module level - import where needed after initEngine
// export const display = MakkoEngine.display;  // REMOVED - causes init order issues
