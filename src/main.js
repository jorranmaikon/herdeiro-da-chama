import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from './config/gameConfig.js';
import AudioManager from './managers/AudioManager.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import ContinenteScene from './scenes/ContinenteScene.js';
import VilaMapaScene from './scenes/VilaMapaScene.js';
import Fase1Scene from './scenes/biomes/Vila_0/Fase1Scene.js';
import ChronicleScene from './scenes/ChronicleScene.js';
import DialogueOverlay from './scenes/DialogueOverlay.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  // HTML5 Audio em vez de WebAudio: no iOS o WebAudio é silenciado pela chave
  // física de mudo do aparelho, mesmo com o volume no máximo.
  audio: { disableWebAudio: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: GRAVITY }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    PreloadScene,
    MenuScene,
    ChronicleScene,
    ContinenteScene,
    VilaMapaScene,
    Fase1Scene,
    DialogueOverlay,
  ],
});

// Manager de trilha global: vive no jogo, não na cena, pra música atravessar
// transições sem reiniciar.
game.audio = new AudioManager(game);

// Destrava o áudio no primeiro gesto em qualquer lugar da página — sem isso
// a música só começaria depois de tocar no botão de som.
const destravarAudio = () => {
  const ctx = game.sound?.context;
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  const cena = game.scene.getScenes(true)[0];
  if (cena) game.audio.retry(cena);
};
['pointerdown', 'touchend', 'keydown'].forEach((e) =>
  document.addEventListener(e, destravarAudio),
);

// O navegador suspende o áudio ao trocar de aba. Ao voltar, retoma.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') destravarAudio();
});
