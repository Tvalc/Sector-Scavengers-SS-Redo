import { MakkoEngine } from '@makko/engine';
import { Game } from './game/game';

async function main() {
  await MakkoEngine.initEngine({
    manifests: ['/sprites-manifest.json', '/static-asset-manifest.json'],
    canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
    width: 1920,
    height: 1080,
  });

  const game = new Game();
  game.start();
}

main().catch((err: Error) => console.error(err.message, err.stack));
