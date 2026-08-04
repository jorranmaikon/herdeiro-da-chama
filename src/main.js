import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS_CONFIG } from './config/gameConfig.js';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import PauseScene from './scenes/PauseScene.js';
import DialogueOverlay from './scenes/DialogueOverlay.js';
import ChronicleScene from './scenes/ChronicleScene.js';
import MapScene from './scenes/MapScene.js';

// Bootstrap do jogo (08_ARQUITETURA_TECNICA.md, Seção 3).
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  physics: PHYSICS_CONFIG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, MainMenuScene, PauseScene, DialogueOverlay, ChronicleScene, MapScene],
};

new Phaser.Game(config);
