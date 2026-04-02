import { DiveNodeType } from '../../types/state';
import { DoctrineId } from '../../content/doctrine';

// Room layout - each round is a full-screen room
// Extended to fill freed top space (was 50px down, now 10px)
export const ROOM_X = 40;
export const ROOM_Y = 10;
export const ROOM_W = 1840;
export const ROOM_H = 700;

// Card panel at bottom (floating over room) - adjusted for portrait cards
export const CARD_PANEL_X = 460;
export const CARD_PANEL_Y = 720;
export const CARD_PANEL_W = 1060;
export const CARD_PANEL_H = 340;
export const CARD_PANEL_RADIUS = 16;

// Portrait card dimensions (2:3 ratio like Compliance Scan card art)
export const CARD_W = 280;
export const CARD_H = 360;
export const CARD_XS = [470, 790, 1110];

// Card layout sections (percentages of card height)
export const CARD_HEADER_H = 50;      // Title banner height
export const CARD_ART_H = 70;           // Art area height (shrunk for larger text)
export const CARD_DESC_H = 174;         // Description area height (expanded for larger text)
export const CARD_PADDING = 12;         // Internal padding
export const CARD_RADIUS = 12;          // Corner radius

// Card visual styling
export const CARD_FRAME_COLOR = '#8b9bb4';
export const CARD_FRAME_WIDTH = 3;
export const CARD_BG_COLOR = '#e8e4d9';  // Parchment/cream background
export const CARD_HEADER_BG = '#c5d1e0'; // Light blue-gray header
export const CARD_DESC_BG = '#f5f3ed';   // Slightly lighter description area

// Minimap / progress indicator - 2x bigger, positioned left of card panel
export const MINIMAP_X = 40;
export const MINIMAP_Y = 720;
export const MINIMAP_W = 400;
export const MINIMAP_H = 340;
export const MINIMAP_PADDING_TOP = 35; // Extra padding below ROUTE label

// Log button
export const LOG_BTN_X = 1660;
export const LOG_BTN_Y = 60;
export const LOG_BTN_W = 50;
export const LOG_BTN_H = 30;

// Draw pile position (beneath energy bar in bottom right HUD)
export const DRAW_PILE_X = 1540;
export const DRAW_PILE_Y = 895;
export const DRAW_CARD_W = 80;
export const DRAW_CARD_H = 104;

// Discard pile position (next to draw pile)
export const DISCARD_PILE_X = 1660;
export const DISCARD_PILE_Y = 895;
export const DISCARD_CARD_W = 80;
export const DISCARD_CARD_H = 104;

// Log overlay
export const LOG_OVERLAY_X = 400;
export const LOG_OVERLAY_Y = 200;
export const LOG_OVERLAY_W = 1120;
export const LOG_OVERLAY_H = 600;
export const LOG_MAX_DISPLAY = 15;

// Node icons and colors
export const NODE_ICONS: Record<DiveNodeType, string> = {
  salvage: '⬡',
  signal: '◈',
  cache: '◆',
  audit: '⚖',
  boss: '☠',
};

export const NODE_COLORS: Record<DiveNodeType, string> = {
  salvage: '#718096',
  signal: '#9f7aea',
  cache: '#f6e05e',
  audit: '#fc8181',
  boss: '#fc8181',
};

export const DOCTRINE_COLORS: Record<DoctrineId, string> = {
  corporate: '#90cdf4',
  cooperative: '#68d391',
  smuggler: '#f6ad55',
};

// Doctrine card mapping
export const DOCTRINE_CARD_MAP: Record<string, DoctrineId> = {
  extract: 'corporate',
  secure_extract: 'corporate',
  quick_extract: 'corporate',
  upgrade: 'corporate',
  analyze: 'corporate',
  corporate_mandate: 'corporate',
  debt_leveraging: 'corporate',
  hostile_extraction: 'corporate',
  debt_conversion: 'corporate',
  threat_analysis: 'corporate',
  sector_lockdown: 'corporate',
  preemptive_shield: 'corporate',
  repair: 'cooperative',
  patch_and_hold: 'cooperative',
  shield: 'cooperative',
  crew_effort: 'cooperative',
  triage: 'cooperative',
  mass_healing: 'cooperative',
  collective_recovery: 'cooperative',
  perimeter: 'cooperative',
  fortress_protocol: 'cooperative',
  last_bastion: 'cooperative',
  scavenge: 'smuggler',
  risky_scavenge: 'smuggler',
  black_market: 'smuggler',
  basic_relay: 'smuggler',
  secure_channel: 'smuggler',
  smugglers_relay: 'smuggler',
  quantum_drop: 'smuggler',
  salvage_protocol: 'smuggler',
  overclock_bots: 'smuggler',
  bot_army: 'smuggler',
  deep_salvage: 'smuggler',
  sector_sweep: 'smuggler',
  ghost_claim: 'smuggler',
  repair_bot: 'smuggler',
  scavenge_bot: 'smuggler',
  overdrive_extract: 'smuggler',
};
