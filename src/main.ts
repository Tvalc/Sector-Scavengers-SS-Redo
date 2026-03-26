import { MakkoEngine } from '@makko/engine';
import { SceneManager } from './scene/scene-manager';
import { TitleScene } from './scenes/title-scene';
import { IntroWakeScene } from './scenes/intro-wake';
import { GameScene } from './scenes/game-scene';
import { GameStore } from './app/game-store';

// ── Global Store Instance ───────────────────────────────────────────────────

const store = new GameStore();

// ── Main Entry Point ─────────────────────────────────────────────────────────

async function main() {
  await MakkoEngine.initEngine({
    manifests: ['/sprites-manifest.json', '/static-asset-manifest.json'],
    canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
    width: 1920,
    height: 1080,
  });

  const display = MakkoEngine.display;
  display.setImageSmoothing(false);

  // Create scene manager
  const sceneManager = new SceneManager();

  // Register scenes in flow order (title → intro → game)
  await sceneManager.register(new TitleScene(store));
  await sceneManager.register(new IntroWakeScene(store));
  await sceneManager.register(new GameScene(store));

  // Always start at the title screen
  sceneManager.switchTo('title_scene');

  // ── Scene Manager Game Loop ───────────────────────────────────────────────

  let lastTime = 0;

  function gameLoop(currentTime: number): void {
    const dt = currentTime - lastTime;
    lastTime = currentTime;

    // Handle input, update, and render for current scene
    sceneManager.handleInput();
    sceneManager.update(dt);
    sceneManager.render();

    // Clear per-frame input state
    MakkoEngine.input.endFrame();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

main().catch((err: Error) => {
  console.error('[Main] Failed to start:', err.message);
  if (err.stack) {
    console.error(err.stack);
  }
});
