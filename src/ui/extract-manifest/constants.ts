// Extract Manifest — Visual Constants

export const COLORS = {
  background: '#0a0d14',
  grid: '#1a2030',
  accentCyan: '#00d4ff',
  accentAmber: '#f59e0b',
  accentRed: '#ef4444',
  accentPurple: '#a855f7',
  accentGreen: '#22c55e',
  muted: '#6b7280',
  gold: '#fbbf24',
  white: '#ffffff',
  red: '#ef4444',
  hiddenBg: '#2a1810',
  hiddenBorder: '#8b4513',
} as const;

// 90% screen layout - recalculated from 1920x1080
const SCREEN_W = 1920;
const MARGIN = Math.floor(SCREEN_W * 0.05); // 5% margin each side
const USABLE_W = SCREEN_W - MARGIN * 2;

export const LAYOUT = {
  leftX: MARGIN,
  leftW: Math.floor(USABLE_W * 0.30),
  centerX: MARGIN + Math.floor(USABLE_W * 0.32),
  centerW: Math.floor(USABLE_W * 0.36),
  rightX: MARGIN + Math.floor(USABLE_W * 0.70),
  rightW: Math.floor(USABLE_W * 0.30),
  rowHeight: 72,
  headerHeight: 100,
  bottomBarY: 1000,
  buttonHeight: 64,
  crewPanelY: 650,
} as const;

// Font sizes - minimum 18px
export const FONTS = {
  headerTitle: 'bold 40px monospace',
  headerSubtitle: '22px monospace',
  headerSubtext: '18px monospace',
  columnTitle: 'bold 28px monospace',
  body: '20px monospace',
  bodySmall: '18px monospace',
  label: '18px monospace',
  value: '22px monospace',
  valueLarge: 'bold 36px monospace',
  button: 'bold 20px monospace',
  buttonSmall: 'bold 16px monospace',
  crewSpeaker: 'bold 20px monospace',
  crewText: '18px monospace',
  riskLabel: '20px monospace',
  riskValue: 'bold 22px monospace',
  emptyState: '22px monospace',
} as const;
