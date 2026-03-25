/**
 * Menu System
 *
 * Generic menu with keyboard navigation and rendering.
 * Use for title screens, pause menus, settings, etc.
 */

import { MakkoEngine } from '@makko/engine';

/**
 * A single menu item with label and action.
 */
export interface MenuItem {
  /** Display label for the menu item */
  label: string;

  /** Action to execute when selected */
  action: () => void;

  /** Whether this item can be selected (default: true) */
  enabled?: boolean;
}

/**
 * Rendering options for the menu.
 */
export interface MenuRenderOptions {
  /** Font size in pixels */
  fontSize?: number;

  /** Font family */
  fontFamily?: string;

  /** Color for normal items */
  color?: string;

  /** Color for selected item */
  selectedColor?: string;

  /** Color for disabled items */
  disabledColor?: string;

  /** Selector string (e.g., '>' or '*') */
  selector?: string;

  /** Spacing between items in pixels */
  spacing?: number;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

const DEFAULT_OPTIONS: Required<MenuRenderOptions> = {
  fontSize: 32,
  fontFamily: 'monospace',
  color: '#ffffff',
  selectedColor: '#ffcc00',
  disabledColor: '#666666',
  selector: '>',
  spacing: 48,
  align: 'center',
};

/**
 * A navigable menu with keyboard support and rendering.
 *
 * Example:
 *   const menu = new Menu();
 *   menu.addItem({ label: 'Start Game', action: () => startGame() });
 *   menu.addItem({ label: 'Options', action: () => showOptions() });
 *   menu.addItem({ label: 'Quit', action: () => quit() });
 *
 *   // In update:
 *   if (input.isKeyPressed('ArrowUp')) menu.navigateUp();
 *   if (input.isKeyPressed('ArrowDown')) menu.navigateDown();
 *   if (input.isKeyPressed('Enter')) menu.select();
 *
 *   // In render:
 *   menu.render(centerX, 300);
 */
export class Menu {
  private items: MenuItem[] = [];
  private selectedIndex = 0;

  /**
   * Add an item to the menu.
   *
   * @param item - Menu item to add
   */
  addItem(item: MenuItem): void {
    // Default enabled to true
    if (item.enabled === undefined) {
      item.enabled = true;
    }
    this.items.push(item);

    // Ensure selected index points to enabled item
    this.ensureValidSelection();
  }

  /**
   * Remove an item by label.
   *
   * @param label - Label of item to remove
   */
  removeItem(label: string): void {
    this.items = this.items.filter((item) => item.label !== label);
    this.ensureValidSelection();
  }

  /**
   * Clear all items from the menu.
   */
  clear(): void {
    this.items = [];
    this.selectedIndex = 0;
  }

  /**
   * Navigate up to the previous enabled item.
   */
  navigateUp(): void {
    if (this.items.length === 0) return;

    const startIndex = this.selectedIndex;
    do {
      this.selectedIndex--;
      if (this.selectedIndex < 0) {
        this.selectedIndex = this.items.length - 1;
      }
      // Stop if we've wrapped around
      if (this.selectedIndex === startIndex) break;
    } while (!this.items[this.selectedIndex].enabled);
  }

  /**
   * Navigate down to the next enabled item.
   */
  navigateDown(): void {
    if (this.items.length === 0) return;

    const startIndex = this.selectedIndex;
    do {
      this.selectedIndex++;
      if (this.selectedIndex >= this.items.length) {
        this.selectedIndex = 0;
      }
      // Stop if we've wrapped around
      if (this.selectedIndex === startIndex) break;
    } while (!this.items[this.selectedIndex].enabled);
  }

  /**
   * Execute the action of the currently selected item.
   */
  select(): void {
    const item = this.items[this.selectedIndex];
    if (item?.enabled) {
      item.action();
    }
  }

  /**
   * Get the currently selected index.
   */
  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  /**
   * Set the selected index directly.
   *
   * @param index - Index to select
   */
  setSelectedIndex(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.selectedIndex = index;
      this.ensureValidSelection();
    }
  }

  /**
   * Get all menu items.
   */
  getItems(): readonly MenuItem[] {
    return this.items;
  }

  /**
   * Get the number of items.
   */
  get count(): number {
    return this.items.length;
  }

  /**
   * Enable or disable an item by label.
   *
   * @param label - Label of item to modify
   * @param enabled - Whether the item should be enabled
   */
  setItemEnabled(label: string, enabled: boolean): void {
    const item = this.items.find((i) => i.label === label);
    if (item) {
      item.enabled = enabled;
      this.ensureValidSelection();
    }
  }

  /**
   * Render the menu at the specified position.
   *
   * @param x - X position
   * @param y - Y position (of first item)
   * @param options - Rendering options
   */
  render(x: number, y: number, options: MenuRenderOptions = {}): void {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const display = MakkoEngine.display;
    const font = `${opts.fontSize}px ${opts.fontFamily}`;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const isSelected = i === this.selectedIndex;
      const itemY = y + i * opts.spacing;

      // Determine color
      let fill: string;
      if (!item.enabled) {
        fill = opts.disabledColor;
      } else if (isSelected) {
        fill = opts.selectedColor;
      } else {
        fill = opts.color;
      }

      // Build display text
      const prefix = isSelected ? `${opts.selector} ` : '  ';
      const text = prefix + item.label;

      // Calculate X based on alignment
      let drawX = x;
      if (opts.align === 'center') {
        const metrics = display.measureText(text, { font });
        drawX = x - metrics.width / 2;
      } else if (opts.align === 'right') {
        const metrics = display.measureText(text, { font });
        drawX = x - metrics.width;
      }

      display.drawText(text, drawX, itemY, { font, fill });
    }
  }

  /**
   * Ensure the selected index points to an enabled item.
   */
  private ensureValidSelection(): void {
    if (this.items.length === 0) {
      this.selectedIndex = 0;
      return;
    }

    // Clamp to valid range
    if (this.selectedIndex >= this.items.length) {
      this.selectedIndex = this.items.length - 1;
    }

    // If current selection is disabled, find next enabled
    if (!this.items[this.selectedIndex]?.enabled) {
      const startIndex = this.selectedIndex;
      do {
        this.selectedIndex++;
        if (this.selectedIndex >= this.items.length) {
          this.selectedIndex = 0;
        }
        if (this.selectedIndex === startIndex) break;
      } while (!this.items[this.selectedIndex]?.enabled);
    }
  }
}
