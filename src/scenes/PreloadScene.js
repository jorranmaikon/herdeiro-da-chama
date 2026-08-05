import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SPRITE_CELL_WIDTH, SPRITE_CELL_HEIGHT } from '../config/gameConfig.js';

// Carrega assets globais + assets do bioma atual (08_ARQUITETURA_TECNICA.md, Seção 4).
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.showLoadingBar();

    const frameConfig = {
      frameWidth: SPRITE_CELL_WIDTH,
      frameHeight: SPRITE_CELL_HEIGHT,
    };

    // --- Personagens ---
    this.load.spritesheet('protagonista', 'assets/sprites/protagonista.png', frameConfig);
    this.load.spritesheet('npc_campones', 'assets/sprites/npc_campones.png', frameConfig);

    // Multitouch precisa ser habilitado antes de qualquer cena de gameplay.
    this.input.addPointer(3);

    // --- UI ---
    this.load.image('retrato_campones', 'assets/ui/retrato_campones.png');
    this.load.image('capa_menu', 'assets/ui/capa_menu.png');
    this.load.image('mapa_continente', 'assets/ui/mapa_continente.png');

    // --- Trilha sonora ---
    this.load.audio('mus_titulo', 'assets/audio/titulo.mp3');
    this.load.audio('mus_mapa', 'assets/audio/mapa.mp3');
    this.load.audio('mus_fase_vila', 'assets/audio/fase_vila.mp3');

    // --- Tiles (Vila Inicial) ---
    this.load.image('tile_grama', 'assets/tiles/tile_grama.png');
    this.load.image('tile_terra', 'assets/tiles/tile_terra.png');
    this.load.image('tile_caminho', 'assets/tiles/tile_caminho.png');
    this.load.image('tile_transicao', 'assets/tiles/tile_transicao.png');

    // --- Props (Vila Inicial) ---
    this.load.image('arvore', 'assets/props/arvore.png');
    this.load.image('moinho', 'assets/props/moinho.png');
    this.load.image('cerca', 'assets/props/cerca.png');
    this.load.image('cerca_poste_esq', 'assets/props/cerca_poste_esq.png');
    this.load.image('cerca_poste_dir', 'assets/props/cerca_poste_dir.png');

    // --- Parallax (Vila Inicial) ---
    this.load.image('bg_ceu', 'assets/bg/bg_ceu.png');
    this.load.image('bg_colinas', 'assets/bg/bg_colinas.png');
    this.load.image('bg_arvores', 'assets/bg/bg_arvores.png');
  }

  showLoadingBar() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, 420, 18, 0x2a2118).setStrokeStyle(2, 0x6b5334);
    const bar = this.add.rectangle(cx - 207, cy, 4, 10, 0xffb84d).setOrigin(0, 0.5);

    this.add
      .text(cx, cy - 40, 'Carregando...', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e8dfd0',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 414 * value;
    });
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}
