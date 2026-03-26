import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import { GameStore } from '../app/game-store';

// ── Layout constants ─────────────────────────────────────────────────────────
const W = 1920;
const H = 1080;
const CX = W / 2;

const TITLE_Y = 320;
const SUBTITLE_Y = 410;
const DIVIDER_Y = 480;
const DIVIDER_X1 = 660;
const DIVIDER_X2 = 1260;
const MENU_START_Y = 560;
const MENU_SPACING = 80;
const ITEM_HIT_W = 400;
const ITEM_HIT_H = 50;

// ── Colors ───────────────────────────────────────────────────────────────────
const C_BG        = '#0a0d14';
const C_TITLE     = '#4ecdc4';
const C_SUBTITLE  = '#718096';
const C_DIVIDER   = '#2d3a4a';
const C_NORMAL    = '#e2e8f0';
const C_HOVERED   = '#ffffff';
const C_DISABLED  = '#4a5568';
const C_CURSOR    = '#4ecdc4';
const C_RESET     = '#fc8181';
const C_CONFIRM   = '#e53e3e';

// ── Reset confirmation timeout ────────────────────────────────────────────────
const RESET_CONFIRM_MS = 3000;

// ── Menu item index ───────────────────────────────────────────────────────────
const IDX_NEW_GAME  = 0;
const IDX_CONTINUE  = 1;
const IDX_RESET     = 2;
const ITEM_COUNT    = 3;

export class TitleScene extends BaseScene {
  readonly id = 'title_scene';

  private store: GameStore;
  private continueEnabled = false;

  // Mouse hover / click tracking
  private hoveredIndex = -1;
  private mouseDownIndex = -1;

  // Keyboard selection
  private keyboardIndex = 0;

  // Reset confirmation state
  private resetConfirmActive = false;
  private resetConfirmExpiry = 0;

  // Guard: don't accept any input until confirm keys have been fully released
  // at least once. Prevents keys held during page-load from firing immediately.
  private inputReady = false;

  constructor(store: GameStore) {
    super();
    this.store = store;
  }

  enter(): void {
    const { meta } = this.store.getState();
    this.continueEnabled = meta.openingPathChosen !== false;

    // Start keyboard cursor on first enabled item
    this.keyboardIndex = IDX_NEW_GAME;

    // Clear any stale state
    this.hoveredIndex = -1;
    this.mouseDownIndex = -1;
    this.resetConfirmActive = false;

    // Block input until all confirm keys are released — prevents keys held
    // at page-load or preview-reload from immediately triggering an option.
    this.inputReady = false;

    MakkoEngine.input.capture(['ArrowUp', 'ArrowDown', 'Enter', 'Space']);
  }

  exit(): void {
    MakkoEngine.input.releaseCapture(['ArrowUp', 'ArrowDown', 'Enter', 'Space']);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private isEnabled(index: number): boolean {
    if (index === IDX_CONTINUE) return this.continueEnabled;
    return true;
  }

  private itemY(index: number): number {
    return MENU_START_Y + index * MENU_SPACING;
  }

  private hitTest(index: number, mx: number, my: number): boolean {
    const y = this.itemY(index);
    const left  = CX - ITEM_HIT_W / 2;
    const right = CX + ITEM_HIT_W / 2;
    const top    = y - ITEM_HIT_H / 2;
    const bottom = y + ITEM_HIT_H / 2;
    return mx >= left && mx <= right && my >= top && my <= bottom;
  }

  private nextEnabled(from: number, dir: 1 | -1): number {
    let idx = from;
    for (let i = 0; i < ITEM_COUNT; i++) {
      idx = (idx + dir + ITEM_COUNT) % ITEM_COUNT;
      if (this.isEnabled(idx)) return idx;
    }
    return from; // no other enabled item
  }

  private expireResetConfirmIfNeeded(): void {
    if (this.resetConfirmActive && performance.now() > this.resetConfirmExpiry) {
      this.resetConfirmActive = false;
    }
  }

  private confirmSelection(index: number): void {
    if (!this.isEnabled(index)) return;

    if (index === IDX_NEW_GAME) {
      // Reset in-memory store + wipe save, then go straight to intro.
      // Never use window.location.reload() — it reloads the Studio shell.
      this.store.resetToFreshGame();
      this.switchTo('intro_wake_scene');

    } else if (index === IDX_CONTINUE) {
      this.switchTo('game_scene');

    } else if (index === IDX_RESET) {
      if (this.resetConfirmActive) {
        this.store.resetToFreshGame();
        // Re-enter this same scene so continueEnabled refreshes to false
        this.switchTo('title_scene');
      } else {
        this.resetConfirmActive = true;
        this.resetConfirmExpiry = performance.now() + RESET_CONFIRM_MS;
      }
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update(dt: number): void {
    super.update(dt);
    this.expireResetConfirmIfNeeded();

    const input = MakkoEngine.input;
    const mx = input.mouseX;
    const my = input.mouseY;

    // ── Mouse hover detection ──────────────────────────────────────────────
    this.hoveredIndex = -1;
    for (let i = 0; i < ITEM_COUNT; i++) {
      if (this.isEnabled(i) && this.hitTest(i, mx, my)) {
        this.hoveredIndex = i;
        break;
      }
    }

    // ── Input readiness guard ──────────────────────────────────────────────
    // Wait until Enter, Space, and mouse button are all released before
    // accepting any confirmations. This prevents stale input from the
    // previous page-load or preview-reload from firing an option instantly.
    if (!this.inputReady) {
      const confirmKeysHeld =
        input.isKeyDown('Enter') ||
        input.isKeyDown('Space') ||
        input.isMouseDown(0);
      if (!confirmKeysHeld) {
        this.inputReady = true;
      }
      // Consume any pressed/released events this frame without acting on them
      return;
    }

    // ── Mouse click ────────────────────────────────────────────────────────
    if (input.isMousePressed(0)) {
      this.mouseDownIndex = this.hoveredIndex;
    }
    if (input.isMouseReleased(0)) {
      if (this.mouseDownIndex !== -1 && this.mouseDownIndex === this.hoveredIndex) {
        this.confirmSelection(this.mouseDownIndex);
      }
      this.mouseDownIndex = -1;
    }

    // ── Keyboard navigation ────────────────────────────────────────────────
    if (input.isKeyPressed('ArrowUp')) {
      this.keyboardIndex = this.nextEnabled(this.keyboardIndex, -1);
    }
    if (input.isKeyPressed('ArrowDown')) {
      this.keyboardIndex = this.nextEnabled(this.keyboardIndex, 1);
    }
    if (input.isKeyPressed('Enter') || input.isKeyPressed('Space')) {
      this.confirmSelection(this.keyboardIndex);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  render(): void {
    super.render();

    const display = MakkoEngine.display;
    display.beginFrame();
    display.clear(C_BG);

    // Title
    display.drawText('SECTOR SCAVENGERS', CX, TITLE_Y, {
      font: 'bold 72px monospace',
      fill: C_TITLE,
      align: 'center',
      baseline: 'middle',
    });

    // Subtitle
    display.drawText('DEEP SALVAGE OPERATIONS', CX, SUBTITLE_Y, {
      font: '24px monospace',
      fill: C_SUBTITLE,
      align: 'center',
      baseline: 'middle',
    });

    // Divider
    display.drawLine(DIVIDER_X1, DIVIDER_Y, DIVIDER_X2, DIVIDER_Y, {
      stroke: C_DIVIDER,
      lineWidth: 1,
    });

    // Menu items
    this.renderMenuItem(IDX_NEW_GAME, 'NEW GAME');
    this.renderMenuItem(IDX_CONTINUE, this.continueEnabled ? 'CONTINUE' : 'CONTINUE');
    this.renderResetItem();

    display.endFrame();
  }

  private isActiveItem(index: number): boolean {
    return this.hoveredIndex === index || (this.hoveredIndex === -1 && this.keyboardIndex === index);
  }

  private renderMenuItem(index: number, label: string): void {
    const display = MakkoEngine.display;
    const y = this.itemY(index);
    const enabled = this.isEnabled(index);
    const active = enabled && this.isActiveItem(index);

    let color: string;
    if (!enabled) {
      color = C_DISABLED;
    } else if (active) {
      color = C_HOVERED;
    } else {
      color = C_NORMAL;
    }

    if (active) {
      display.drawText('▶', CX - 160, y, {
        font: '28px monospace',
        fill: C_CURSOR,
        align: 'right',
        baseline: 'middle',
      });
    }

    display.drawText(label, CX, y, {
      font: '28px monospace',
      fill: color,
      align: 'center',
      baseline: 'middle',
    });

    // Disabled hint for CONTINUE
    if (index === IDX_CONTINUE && !enabled) {
      display.drawText('no save found', CX, y + 28, {
        font: '16px monospace',
        fill: C_DISABLED,
        align: 'center',
        baseline: 'middle',
      });
    }

  }

  private renderResetItem(): void {
    const display = MakkoEngine.display;
    const index = IDX_RESET;
    const y = this.itemY(index);
    const active = this.isActiveItem(index);

    let label: string;
    let color: string;

    if (this.resetConfirmActive) {
      label = 'CONFIRM RESET? (press again)';
      color = C_CONFIRM;
    } else if (active) {
      label = 'RESET ALL DATA';
      color = C_RESET;
    } else {
      label = 'RESET ALL DATA';
      color = C_NORMAL;
    }

    if (active) {
      display.drawText('▶', CX - 160, y, {
        font: '28px monospace',
        fill: C_CURSOR,
        align: 'right',
        baseline: 'middle',
      });
    }

    display.drawText(label, CX, y, {
      font: '28px monospace',
      fill: color,
      align: 'center',
      baseline: 'middle',
    });
  }
}
