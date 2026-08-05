import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS_CONFIG } from './config/gameConfig.js';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import PauseScene from './scenes/PauseScene.js';
import DialogueOverlay from './scenes/DialogueOverlay.js';
import ChronicleScene from './scenes/ChronicleScene.js';
import MapScene from './scenes/MapScene.js';
import Fase1Scene from './scenes/biomes/Vila_0/Fase1Scene.js';
import AudioManager from './managers/AudioManager.js';

// Bootstrap do jogo (08_ARQUITETURA_TECNICA.md, Seção 3).
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  // HTML5 Audio em vez de WebAudio: no iOS o WebAudio é silenciado pelo botão
  // físico de mudo do aparelho, mesmo com o volume no máximo.
  audio: { disableWebAudio: true },
  physics: PHYSICS_CONFIG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    Fase1Scene,
    PauseScene,
    DialogueOverlay,
    ChronicleScene,
    MapScene,
  ],
};

const game = new Phaser.Game(config);

// Manager global de trilha — vive no jogo, não na cena, pra música atravessar
// transições sem reiniciar (08_ARQUITETURA_TECNICA.md, Seção 5).
game.audio = new AudioManager(game);

// Destrava o áudio no PRIMEIRO gesto do usuário em qualquer lugar da página
// (não só no botão de som). Assim a música começa sozinha quando ele toca
// em "INICIAR", sem precisar apertar o ♪.
const destravarAudio = () => {
  const ctx = game.sound?.context;
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (game.sound?.locked) game.sound.unlock?.();
  const scene = game.scene.getScenes(true)[0];
  if (scene) game.audio.retry(scene);
};
['pointerdown', 'touchend', 'keydown'].forEach((evt) =>
  document.addEventListener(evt, destravarAudio, { once: false }),
);

// O navegador suspende o áudio ao trocar de aba/app. Ao voltar, retoma —
// sem isso a música "para sozinha" depois de um tempo.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const ctx = game.sound?.context;
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  const scene = game.scene.getScenes(true)[0];
  if (scene) game.audio.retry(scene);
});
