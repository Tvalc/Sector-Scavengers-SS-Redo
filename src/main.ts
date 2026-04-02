import { MakkoEngine, combo } from '@makko/engine';
import { SceneManager } from './scene/scene-manager';
import { TitleScene } from './scenes/title-scene';
import { IntroWakeScene } from './scenes/intro-wake';
import { StationScene } from './scenes/station-scene';
import { RunScene } from './scenes/run-scene';
import { GameStore } from './app/game-store';

async function main() {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

  await MakkoEngine.initEngine({
    manifests: ['/sprites-manifest.json', '/static-asset-manifest.json'],
    canvas,
    width: 1920,
    height: 1080,
    renderer: 'canvas2d',
  });

  const display = MakkoEngine.display;
  display.setAutoFit('window');

  // Initialise shared game store (loads persisted save)
  const store = new GameStore();

  // Register all scenes
  const sceneManager = new SceneManager();
  await sceneManager.register(new TitleScene(store));
  await sceneManager.register(new IntroWakeScene(store));
  await sceneManager.register(new StationScene(store));
  await sceneManager.register(new RunScene(store));

  // Start at title screen
  sceneManager.switchTo('title_scene');

  // Capture Shift+F for fullscreen toggle globally
  MakkoEngine.input.capture([combo('Shift', 'f')]);

  let lastTime = 0;
  function gameLoop(currentTime: number) {
    const dt = currentTime - lastTime;
    lastTime = currentTime;

    // Toggle fullscreen on Shift+F
    if (MakkoEngine.input.isKeyPressed(combo('Shift', 'f'))) {
      if (MakkoEngine.display.isFullscreen) {
        MakkoEngine.display.exitFullscreen();
      } else {
        MakkoEngine.display.requestFullscreen();
      }
    }

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
