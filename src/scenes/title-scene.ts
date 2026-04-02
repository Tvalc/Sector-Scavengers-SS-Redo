import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import { GameStore } from '../app/game-store';

// ── Layout constants ─────────────────────────────────────────────────────────
const W = 1920;
const H = 1080;
const CX = W / 2;

// Button panel drawn size (source asset ss-prop-ui-panel-1 is 353×187)
const BTN_W = 300;
const BTN_H = 120;
const BTN_GAP = 40;

// Horizontal row sits well below the "Signal & Salvage" subtitle on the bg
const BTN_ROW_Y = 765;

// Hover glow pulse speed (cycles per second)
const GLOW_SPEED = 2.5;

// ── Colors ───────────────────────────────────────────────────────────────────
const C_BG        = '#0a0d14';
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

  // Running clock for hover animations
  private time = 0;

  constructor(store: GameStore) {
    super();
    this.store = store;
  }

  enter(): void {
    const { meta } = this.store.getState();
    this.continueEnabled = meta.openingPathChosen !== false;

    this.keyboardIndex = IDX_NEW_GAME;
    this.hoveredIndex = -1;
    this.mouseDownIndex = -1;
    this.resetConfirmActive = false;
    this.inputReady = false;

    MakkoEngine.input.capture(['ArrowLeft', 'ArrowRight', 'Enter', 'Space']);
  }

  exit(): void {
    MakkoEngine.input.releaseCapture(['ArrowLeft', 'ArrowRight', 'Enter', 'Space']);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private isEnabled(index: number): boolean {
    if (index === IDX_CONTINUE) return this.continueEnabled;
    return true;
  }

  /** Center X of a button in the horizontal row. */
  private btnCenterX(index: number): number {
    const totalW = BTN_W * ITEM_COUNT + BTN_GAP * (ITEM_COUNT - 1);
    const startX = CX - totalW / 2;
    return startX + BTN_W / 2 + index * (BTN_W + BTN_GAP);
  }

  private hitTest(index: number, mx: number, my: number): boolean {
    const cx = this.btnCenterX(index);
    const left = cx - BTN_W / 2;
    const top = BTN_ROW_Y - BTN_H / 2;
    return mx >= left && mx <= left + BTN_W && my >= top && my <= top + BTN_H;
  }

  private nextEnabled(from: number, dir: 1 | -1): number {
    let idx = from;
    for (let i = 0; i < ITEM_COUNT; i++) {
      idx = (idx + dir + ITEM_COUNT) % ITEM_COUNT;
      if (this.isEnabled(idx)) return idx;
    }
    return from;
  }

  private expireResetConfirmIfNeeded(): void {
    if (this.resetConfirmActive && performance.now() > this.resetConfirmExpiry) {
      this.resetConfirmActive = false;
    }
  }

  private confirmSelection(index: number): void {
    if (!this.isEnabled(index)) return;

    if (index === IDX_NEW_GAME) {
      this.store.resetToFreshGame();
      this.switchTo('intro_wake_scene');
    } else if (index === IDX_CONTINUE) {
      this.switchTo('station_scene');
    } else if (index === IDX_RESET) {
      if (this.resetConfirmActive) {
        this.store.resetToFreshGame();
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
    this.time += dt / 1000;
    this.expireResetConfirmIfNeeded();

    const input = MakkoEngine.input;
    const mx = input.mouseX;
    const my = input.mouseY;

    this.hoveredIndex = -1;
    for (let i = 0; i < ITEM_COUNT; i++) {
      if (this.isEnabled(i) && this.hitTest(i, mx, my)) {
        this.hoveredIndex = i;
        break;
      }
    }

    if (!this.inputReady) {
      const confirmKeysHeld =
        input.isKeyDown('Enter') ||
        input.isKeyDown('Space') ||
        input.isMouseDown(0);
      if (!confirmKeysHeld) {
        this.inputReady = true;
      }
      return;
    }

    if (input.isMousePressed(0)) {
      this.mouseDownIndex = this.hoveredIndex;
    }
    if (input.isMouseReleased(0)) {
      if (this.mouseDownIndex !== -1 && this.mouseDownIndex === this.hoveredIndex) {
        this.confirmSelection(this.mouseDownIndex);
      }
      this.mouseDownIndex = -1;
    }

    if (input.isKeyPressed('ArrowLeft')) {
      this.keyboardIndex = this.nextEnabled(this.keyboardIndex, -1);
    }
    if (input.isKeyPressed('ArrowRight')) {
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

    // Background image (has title + subtitle baked in)
    const bg = MakkoEngine.staticAsset('ss-background-main-capsule-3');
    if (bg) {
      display.drawImage(bg.image, 0, 0, bg.width, bg.height);
    } else {
      display.clear(C_BG);
    }

    // Button row
    const panel = MakkoEngine.staticAsset('ss-prop-ui-panel-1');
    this.renderButtonItem(IDX_NEW_GAME, 'NEW GAME', panel);
    this.renderButtonItem(IDX_CONTINUE, 'CONTINUE', panel);
    this.renderButtonItem(IDX_RESET, this.resetConfirmActive ? 'CONFIRM?' : 'RESET', panel);

    display.endFrame();
  }

  private isActiveItem(index: number): boolean {
    return this.hoveredIndex === index || (this.hoveredIndex === -1 && this.keyboardIndex === index);
  }

  private renderButtonItem(index: number, label: string, panel: unknown): void {
    const display = MakkoEngine.display;
    const cx = this.btnCenterX(index);
    const drawX = cx - BTN_W / 2;
    const drawY = BTN_ROW_Y - BTN_H / 2;
    const enabled = this.isEnabled(index);
    const active = enabled && this.isActiveItem(index);

    // Hover glow – pulsing cyan rectangle behind the panel
    if (active) {
      const pulse = 0.3 + 0.2 * Math.sin(this.time * GLOW_SPEED * Math.PI * 2);
      const glowPad = 8;
      const glowColor = index === IDX_RESET && this.resetConfirmActive
        ? C_CONFIRM : C_CURSOR;
      display.drawRoundRect(
        drawX - glowPad, drawY - glowPad,
        BTN_W + glowPad * 2, BTN_H + glowPad * 2,
        16,
        { fill: glowColor, alpha: pulse },
      );
    }

    // Draw panel background
    const asset = panel as { image: HTMLImageElement } | null;
    if (asset?.image) {
      display.drawImage(asset.image, drawX, drawY, BTN_W, BTN_H, {
        alpha: enabled ? 1 : 0.4,
      });
    }

    // Text color
    let color: string;
    if (!enabled) {
      color = C_DISABLED;
    } else if (index === IDX_RESET && this.resetConfirmActive) {
      color = C_CONFIRM;
    } else if (index === IDX_RESET && active) {
      color = C_RESET;
    } else if (active) {
      color = C_HOVERED;
    } else {
      color = C_NORMAL;
    }

    // Label
    display.drawText(label, cx, BTN_ROW_Y, {
      font: 'bold 24px monospace',
      fill: color,
      align: 'center',
      baseline: 'middle',
    });

    // Disabled hint for CONTINUE
    if (index === IDX_CONTINUE && !enabled) {
      display.drawText('no save found', cx, BTN_ROW_Y + 24, {
        font: '14px monospace',
        fill: C_DISABLED,
        align: 'center',
        baseline: 'middle',
      });
    }
  }
}
