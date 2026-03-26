/**
 * Game Scene
 *
 * Thin wrapper around the Game class for SceneManager integration.
 * The Game class handles all gameplay internally: hub, dive, and result screens.
 */

import { BaseScene } from '../scene/base-scene';
import { Game } from '../game/game';
import { GameStore } from '../app/game-store';

/**
 * Main gameplay scene.
 *
 * Delegates update and render to the Game class each frame via the
 * SceneManager loop. Game.update() handles input + drawing (renderers
 * combine both), and Game.render() flushes the WebGL batch.
 */
export class GameScene extends BaseScene {
  readonly id = 'game_scene';

  private game: Game;

  constructor(store: GameStore) {
    super();
    this.game = new Game(store);
  }

  init(): void {
    // No systems needed — Game handles everything internally
  }

  enter(previousScene?: string): void {
    // Initialise state and capture keys on first entry.
    // start() no longer fires a RAF loop, so calling it here is safe.
    if (previousScene !== this.id) {
      this.game.start();
    }
  }

  exit(_nextScene?: string): void {
    // Game handles its own cleanup internally
  }

  update(dt: number): void {
    this.game.update(dt);
    // Game signals scene transitions (e.g. in-game reset) via pendingSceneSwitch
    if (this.game.pendingSceneSwitch !== null) {
      const target = this.game.pendingSceneSwitch;
      this.game.pendingSceneSwitch = null;
      this.switchTo(target);
    }
  }

  render(): void {
    this.game.render();
  }
}
