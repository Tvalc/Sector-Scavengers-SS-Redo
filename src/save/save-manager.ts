/**
 * Save/Load System
 *
 * LocalStorage persistence for saving game progress between sessions.
 * Always includes version number for safe migration when save format changes.
 *
 * P23 refactor: removed unused template boilerplate — GameSaveData interface,
 * exampleMigration function, HighScoreEntry interface, and HighScoreManager
 * class. Only SaveManager<T> and SaveData are used by the game.
 */

/**
 * Base interface for save data — always include version for migrations.
 * Extend this with your game-specific data.
 */
export interface SaveData {
  version: number;
}

/**
 * SaveManager — handles persistence with versioning and migration.
 * Type parameter T extends SaveData to ensure version field exists.
 */
export class SaveManager<T extends SaveData> {
  private readonly key: string;
  private readonly currentVersion: number;
  private migrateFn?: (data: T) => T;

  constructor(key: string, version: number) {
    this.key = key;
    this.currentVersion = version;
  }

  /**
   * Register a migration function to upgrade old saves.
   * The function receives old data and should return upgraded data.
   */
  setMigration(fn: (data: T) => T): void {
    this.migrateFn = fn;
  }

  /**
   * Save data to LocalStorage.
   */
  save(data: Omit<T, 'version'>): void {
    const saveData = { ...data, version: this.currentVersion } as T;
    localStorage.setItem(this.key, JSON.stringify(saveData));
  }

  /**
   * Load data from LocalStorage.
   * Returns null if no save exists or data is corrupted.
   */
  load(): T | null {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;

    try {
      const data = JSON.parse(raw) as T;
      if (data.version !== this.currentVersion) {
        return this.migrate(data);
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Check if a save exists.
   */
  exists(): boolean {
    return localStorage.getItem(this.key) !== null;
  }

  /**
   * Delete the save.
   */
  delete(): void {
    localStorage.removeItem(this.key);
  }

  private migrate(data: T): T {
    if (this.migrateFn) {
      const migrated = this.migrateFn(data);
      migrated.version = this.currentVersion;
      localStorage.setItem(this.key, JSON.stringify(migrated));
      return migrated;
    }
    data.version = this.currentVersion;
    return data;
  }
}
