// Card Collection Panel - Layout and Styling Constants

export const SCREEN_W = 1920;
export const SCREEN_H = 1080;

// Card dimensions - 6 per row, 2 rows per page with pagination
export const CARD_W = 280;
export const CARD_H = 420;
export const CARD_GAP_X = 24; // Tighter gap for 6 cards
export const CARD_GAP_Y = 30;
export const CARDS_PER_ROW = 6; // 6 cards per row
export const CARDS_PER_PAGE = 12; // 2 rows × 6 columns = 12 cards per page

// Layout
export const HEADER_H = 120;
export const FOOTER_H = 90;
export const GRID_START_Y = HEADER_H + 60;
export const GRID_H = SCREEN_H - HEADER_H - FOOTER_H - 80;

// Card styling
export const CARD_FRAME_COLOR = '#8b9bb4';
export const CARD_BG_COLOR = '#e8e4d9';
export const CARD_HEADER_BG = '#c5d1e0';
export const CARD_DESC_BG = '#f5f3ed';

// Locked card styling
export const META_LOCKED_BG = '#1a202c';
export const META_LOCKED_STROKE = '#4a5568';
export const META_LOCKED_TEXT = '#64748b';

// Doctrine colors
export const DOCTRINE_COLORS: Record<string, { primary: string; bg: string; text: string }> = {
  corporate:   { primary: '#ed8936', bg: '#2d1f0f', text: '#f6ad55' },
  cooperative: { primary: '#48bb78', bg: '#1a2f1a', text: '#68d391' },
  smuggler:    { primary: '#9f7aea', bg: '#2d1f4a', text: '#9f7aea' },
  neutral:     { primary: '#718096', bg: '#1a202c', text: '#a0aec0' },
};
