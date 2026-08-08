import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_CELL } from '../config/gameConfig.js';

// Versão dos assets. INCREMENTAR sempre que qualquer arquivo em public/assets
// mudar sem mudar de nome.
//
// O Vite versiona o bundle JS por hash, mas os arquivos de public/ são
// servidos com o nome fixo — o navegador guarda a versão antiga e o jogo
// continua mostrando arte velha mesmo depois do deploy. Foi o que aconteceu
// com o Ancião: sprite e retrato novos no repositório, versão anterior na
// tela.
const ASSET_VERSION = 6;

// Carrega todos os assets do jogo (08_ARQUITETURA_TECNICA.md, Seção 4).
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  /** Caminho do asset com a versão anexada, para furar o cache do navegador. */
  url(caminho) {
    return `${caminho}?v=${ASSET_VERSION}`;
  }

  preload() {
    this.showLoadingBar();

    this.load.spritesheet('protagonista', this.url('assets/sprites/protagonista.png'), {
      frameWidth: PLAYER_CELL,
      frameHeight: PLAYER_CELL,
    });

    // Chão em 3 variações: alternando entre elas, a repetição do tile deixa
    // de ser perceptível (a mesma pedrinha reaparecia a cada 64px).
    [0, 1, 2].forEach((i) => {
      this.load.image(`tile_topo_${i}`, this.url(`assets/tiles/tile_topo_${i}.png`));
      this.load.image(`tile_fill_${i}`, this.url(`assets/tiles/tile_fill_${i}.png`));
    });

    [
      'moinho', 'arvore', 'casa_taipa', 'casa_madeira',
      'cerca', 'poco', 'barraca', 'barril', 'caixa', 'forja', 'bigorna',
      'plataforma_esq', 'plataforma_meio', 'plataforma_dir',
      'arbusto', 'alvo_treino', 'checkpoint', 'item_cura',
    ].forEach((k) => this.load.image(k, this.url(`assets/props/${k}.png`)));

    ['bg_ceu', 'bg_colinas', 'bg_arvores'].forEach((k) =>
      this.load.image(k, this.url(`assets/bg/${k}.png`)),
    );

    this.load.image('retrato_anciao', this.url('assets/npcs/retrato_anciao.png'));
    this.load.image('anciao', this.url('assets/npcs/anciao.png'));

    ['cronica_vila_01', 'cronica_vila_02'].forEach((k) =>
      this.load.image(k, this.url(`assets/cronicas/${k}.png`)),
    );

    ['checkpoint', 'npc', 'saida', 'bloqueado'].forEach((k) =>
      this.load.image(`icone_${k}`, this.url(`assets/ui/icons/icone_${k}.png`)),
    );

    this.load.image('capa_menu', this.url('assets/ui/capa_menu.png'));
    this.load.image('mapa_continente', this.url('assets/ui/mapa_continente.png'));
    this.load.image('mapa_vila', this.url('assets/ui/mapa_vila.png'));

    this.load.audio('mus_titulo', this.url('assets/audio/titulo.mp3'));
    this.load.audio('mus_mapa', this.url('assets/audio/mapa.mp3'));
    this.load.audio('mus_fase', this.url('assets/audio/fase_vila.mp3'));
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
