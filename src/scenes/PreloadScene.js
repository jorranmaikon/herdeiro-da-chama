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
const ASSET_VERSION = 7;

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
    this.load.image('capa_menu_blur', this.url('assets/ui/capa_menu_blur.png'));
    this.load.image('mapa_continente', this.url('assets/ui/mapa_continente.png'));
    this.load.image('mapa_vila', this.url('assets/ui/mapa_vila.png'));

    // Das quatro trilhas, só a do título entra aqui. As outras somam 10 MB e
    // deixariam a primeira tela em branco por vários segundos no celular — o
    // AudioManager baixa cada uma na primeira vez que é pedida.
    //
    // A do título é a exceção porque precisa estar pronta no instante do toque:
    // se dependesse de download, a cena trocaria antes de a faixa chegar e o
    // menu abriria em silêncio, que é justamente o que a tela de toque existe
    // para evitar.
    this.load.audio('mus_titulo', this.url('assets/audio/mus_titulo.mp3'));
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
    this.telaDeToque();
  }

  // Porta de entrada do jogo.
  //
  // Existe por um motivo específico: navegador nenhum deixa um site tocar som
  // antes de o usuário interagir com a página. Sem esta tela, quem abrisse o
  // jogo cairia direto no menu EM SILÊNCIO, e a música do título — a primeira
  // coisa que dá identidade ao jogo — só entraria depois de um toque qualquer,
  // possivelmente já no meio de outra tela.
  //
  // Pedindo um toque aqui, o gesto acontece antes do menu existir, e a música
  // começa junto com ele.
  telaDeToque() {
    const { width, height } = this.cameras.main;

    // Capa desfocada: o jogador já vê o mundo do jogo, mas o desfoque deixa
    // claro que isto é uma antessala, não o menu.
    this.add
      .image(0, 0, 'capa_menu_blur')
      .setOrigin(0)
      .setDisplaySize(width, height);

    this.add
      .text(width / 2, height / 2 - 40, 'HERDEIRO DA CHAMA', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#ede3d0',
        stroke: '#14110c',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const convite = this.add
      .text(width / 2, height / 2 + 46, 'toque na tela', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffe9b0',
        stroke: '#14110c',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: convite,
      alpha: 0.35,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const entrar = () => {
      if (this.entrando) return;
      this.entrando = true;

      // Destrava explicitamente antes de pedir a faixa: o Phaser só considera
      // o áudio liberado depois de chamar unlock(), e sem isso a primeira
      // tentativa de tocar cai no caminho de "ainda bloqueado".
      this.sound.unlock?.();
      this.game.audio.play(this, 'mus_titulo');

      this.cameras.main.fadeOut(450);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('MenuScene'));
    };

    // pointerUP, não pointerDOWN: o navegador (e o Phaser) liberam o áudio ao
    // SOLTAR o toque. Disparando no toque inicial, a faixa era pedida um
    // instante antes de existir permissão para tocá-la.
    this.input.once('pointerup', entrar);
    this.input.keyboard.once('keydown', entrar);
  }
}
