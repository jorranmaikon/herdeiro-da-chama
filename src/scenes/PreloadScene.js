import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_CELL } from '../config/gameConfig.js';

// Carrega todos os assets do jogo (08_ARQUITETURA_TECNICA.md, Seção 4).
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.showLoadingBar();

    this.load.spritesheet('protagonista', 'assets/sprites/protagonista.png', {
      frameWidth: PLAYER_CELL,
      frameHeight: PLAYER_CELL,
    });

    ['tile_grama', 'tile_terra', 'tile_caminho', 'tile_transicao'].forEach((k) =>
      this.load.image(k, `assets/tiles/${k}.png`),
    );

    ['arvore', 'moinho', 'cerca', 'cerca_poste_esq', 'cerca_poste_dir'].forEach((k) =>
      this.load.image(k, `assets/props/${k}.png`),
    );

    ['bg_ceu', 'bg_colinas', 'bg_arvores'].forEach((k) =>
      this.load.image(k, `assets/bg/${k}.png`),
    );

    this.load.image('capa_menu', 'assets/ui/capa_menu.png');
    this.load.image('mapa_continente', 'assets/ui/mapa_continente.png');

    this.load.audio('mus_titulo', 'assets/audio/titulo.mp3');
    this.load.audio('mus_mapa', 'assets/audio/mapa.mp3');
    this.load.audio('mus_fase', 'assets/audio/fase_vila.mp3');
  }

  showLoadingBar() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor('#1a1410');
    this.add.rectangle(cx, cy, 420, 18, 0x2a2118).setStrokeStyle(2, 0x6b5334);
    const bar = this.add.rectangle(cx - 207, cy, 4, 10, 0xffb84d).setOrigin(0, 0.5);

    this.add
      .text(cx, cy - 42, 'Carregando...', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e8dfd0',
      })
      .setOrigin(0.5);

    this.load.on('progress', (v) => {
      bar.width = 414 * v;
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}
