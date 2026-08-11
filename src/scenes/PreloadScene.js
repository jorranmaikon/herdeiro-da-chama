import Phaser from 'phaser';
import { FOLHAS_DE_INIMIGO } from '../data/enemiesConfig.js';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_CELL } from '../config/gameConfig.js';

// Versão dos assets. INCREMENTAR sempre que qualquer arquivo em public/assets
// mudar sem mudar de nome.
//
// O Vite versiona o bundle JS por hash, mas os arquivos de public/ são
// servidos com o nome fixo — o navegador guarda a versão antiga e o jogo
// continua mostrando arte velha mesmo depois do deploy. Foi o que aconteceu
// com o Ancião: sprite e retrato novos no repositório, versão anterior na
// tela.
const ASSET_VERSION = 34;

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

    // --- Bosque Esmeralda (Região 1) ---
    //
    // As chaves levam prefixo de bioma porque nomes como `plataforma_esq` já
    // existem na Vila com arte diferente. Sem o prefixo, uma sobrescreveria a
    // outra em silêncio e a Vila apareceria com a plataforma do Bosque.
    [0, 1, 2].forEach((i) => {
      this.load.image(`bosque_topo_${i}`, this.url(`assets/tiles/bosque/tile_topo_${i}.png`));
      this.load.image(`bosque_fill_${i}`, this.url(`assets/tiles/bosque/tile_fill_${i}.png`));
    });

    this.load.image('bosque_canto', this.url('assets/tiles/bosque/tile_canto.png'));
    this.load.image('bosque_lateral', this.url('assets/tiles/bosque/tile_lateral.png'));

    [
      ['bosque_plat_esq', 'plataforma_esq'],
      ['bosque_plat_meio', 'plataforma_meio'],
      ['bosque_plat_dir', 'plataforma_dir'],
      ['bosque_oneway', 'plataforma_oneway'],
      ['bosque_espinhos', 'espinhos'],
      ['bosque_borda', 'borda_grama'],
      ['pedra_bosque', 'pedra'],
      ['folha_navalha', 'folha_navalha'],
    ].forEach(([chave, arquivo]) =>
      this.load.image(chave, this.url(`assets/props/bosque/${arquivo}.png`)),
    );

    // O tamanho de célula vem da configuração do inimigo, nunca repetido aqui:
    // ver FOLHAS_DE_INIMIGO em data/enemiesConfig.js.
    FOLHAS_DE_INIMIGO.forEach(({ arquivo, cfg }) =>
      this.load.spritesheet(cfg.textura, this.url(`assets/sprites/bosque/${arquivo}.png`), {
        frameWidth: cfg.celula,
        frameHeight: cfg.celula,
      }),
    );

    [
      ['bosque_copa', 'bg_copa'],
      ['bosque_floresta', 'bg_floresta'],
      ['bosque_arvore', 'bg_arvore'],
    ].forEach(([chave, arquivo]) =>
      this.load.image(chave, this.url(`assets/bg/bosque/${arquivo}.png`)),
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
    this.load.image('mapa_bosque', this.url('assets/ui/mapa_bosque.png'));
    this.load.image('mapa_vila', this.url('assets/ui/mapa_vila.png'));

    // TODAS as trilhas entram aqui, e isso é deliberado apesar dos 13 MB.
    //
    // No iOS, cada elemento de áudio nasce bloqueado e só é liberado se
    // receber play() durante um gesto real do usuário. Só existe um gesto
    // garantido no jogo inteiro: o toque na tela de entrada. Uma faixa baixada
    // depois dele nunca encontraria outro gesto para se liberar e ficaria muda
    // para sempre.
    //
    // Carregando as quatro antes, o toque libera todas de uma vez. O custo é
    // uma barra de carregamento mais longa; o benefício é o áudio funcionar.
    ['mus_titulo', 'mus_cronica', 'mus_mapa', 'mus_fase'].forEach((k) =>
      this.load.audio(k, this.url(`assets/audio/${k}.mp3`)),
    );
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

    // Sem o nome do jogo aqui: ele já está desenhado na capa e aparece inteiro
    // no menu, logo em seguida. Repetir por cima do próprio título borrado só
    // duplicava a informação.
    const convite = this.add
      .text(width / 2, height / 2, 'toque na tela', {
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

    // O `play()` precisa acontecer DENTRO do handler DOM do gesto.
    //
    // No iOS, um elemento de áudio só fica liberado se receber .play() durante
    // o próprio evento de toque. O sistema de input do Phaser não serve aqui:
    // ele enfileira os eventos e os processa no loop de update, ou seja, no
    // frame seguinte — quando o Safari já não considera mais que há um gesto
    // em andamento, e recusa o play em silêncio, sem erro.
    //
    // Por isso este é o único ponto do jogo que escuta o DOM direto.
    const entrar = () => {
      if (this.entrando) return;
      this.entrando = true;

      limpar();
      this.game.audio.desbloquear(this);
      this.game.audio.play(this, 'mus_titulo');

      this.cameras.main.fadeOut(450);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('MenuScene'));
    };

    const alvo = this.game.canvas || document.body;
    const eventos = ['touchend', 'click', 'keydown'];
    const limpar = () => eventos.forEach((e) => {
      alvo.removeEventListener(e, entrar);
      document.removeEventListener(e, entrar);
    });
    eventos.forEach((e) => {
      alvo.addEventListener(e, entrar);
      document.addEventListener(e, entrar);
    });
    this.events.once('shutdown', limpar);
  }
}
