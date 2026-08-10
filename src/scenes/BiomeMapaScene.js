import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { fasesDaRegiao, faseLiberada } from '../data/progressao.js';

// Base dos Mapas de Bioma (06_INTERFACE_UX.md, Seção 2.2).
//
// Nasceu de VilaMapaScene: ao criar o mapa do Bosque, a cena inteira teria sido
// copiada trocando só a arte, o título e as coordenadas dos marcadores. Isso é
// o que cada bioma declara agora; o resto é comum.
//
// O estado de cada fase (liberada ou não) NÃO fica aqui nem no bioma: vem de
// data/progressao.js, que é a fonte única da ordem do jogo. Um mapa que
// guardasse seu próprio `liberada: true` sairia do ar assim que o save
// passasse a valer.
export default class BiomeMapaScene extends Phaser.Scene {
  /**
   * @param {string} key    chave da cena
   * @param {object} cfg    { regiao, titulo, textura, pontos }
   *   `pontos` mapeia id de fase -> {x, y} em coordenadas do canvas.
   */
  constructor(key, cfg) {
    super(key);
    this.cfg = cfg;
  }

  create() {
    this.entrando = false;

    this.add
      .image(0, 0, this.cfg.textura)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.game.audio.play(this, 'mus_mapa');
    this.game.audio.createToggle(this);

    this.titulo(this.cfg.titulo);
    this.desenharTrilha();
    this.rodape('Toque na fase para entrar');

    this.botaoVoltar();
    this.input.keyboard.on('keydown-ESC', () => this.voltar());
    this.cameras.main.fadeIn(600);
  }

  titulo(texto) {
    this.add
      .text(GAME_WIDTH / 2, 44, texto, {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffe9b0',
        backgroundColor: '#00000088',
        padding: { x: 18, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  rodape(texto) {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 34, texto, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffe9b0',
        backgroundColor: '#00000077',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  /** Fases da região, cruzadas com as coordenadas e o estado de desbloqueio. */
  fases() {
    return fasesDaRegiao(this.cfg.regiao)
      .map((f, i) => ({
        ...f,
        ...this.cfg.pontos[f.id],
        numero: i + 1,
        liberada: faseLiberada(f.id),
      }))
      .filter((f) => f.x !== undefined);
  }

  desenharTrilha() {
    const fases = this.fases();

    // Linha ligando as fases, reforçando a progressão linear. Fica sob os
    // marcadores da arte, não por cima deles.
    const linha = this.add.graphics().setDepth(5);
    linha.lineStyle(4, 0xffe9b0, 0.35);
    linha.beginPath();
    fases.forEach((f, i) => (i === 0 ? linha.moveTo(f.x, f.y) : linha.lineTo(f.x, f.y)));
    linha.strokePath();

    fases.forEach((fase) => {
      const { x, y, liberada } = fase;

      const ponto = this.add
        .circle(x, y, 16, liberada ? 0xffb84d : 0x4a4a4a, liberada ? 0.55 : 0.7)
        .setDepth(10);

      // Fase bloqueada não revela o nome: o mapa mostra que a região continua,
      // sem entregar o conteúdo (06_INTERFACE_UX.md, Regras).
      this.add
        .text(x, y - 44, liberada ? `${fase.numero}. ${fase.nome}` : '?', {
          fontFamily: 'monospace',
          fontSize: liberada ? '17px' : '20px',
          color: liberada ? '#ffe9b0' : '#9a9a9a',
          backgroundColor: '#000000aa',
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(10);

      if (!liberada) return;

      this.tweens.add({
        targets: ponto,
        scale: 1.45,
        alpha: 0.2,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.add
        .zone(x, y, 90, 90)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.entrarNaFase(fase));
    });
  }

  entrarNaFase(fase) {
    if (this.entrando) return;
    this.entrando = true;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(fase.cena));
  }

  // Botão de voltar VISÍVEL. Antes só existia a tecla ESC, e num celular não
  // há tecla nenhuma: quem terminava as duas fases da Vila ficava preso no
  // mapa do bioma, sem caminho de volta ao Mapa do Continente e sem como
  // chegar ao Bosque.
  botaoVoltar() {
    const x = 100;
    const y = GAME_HEIGHT - 46;

    const botao = this.add
      .rectangle(x, y, 170, 44, 0x1a2418, 0.85)
      .setStrokeStyle(2, 0x55603f)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, '< Continente', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffe9b0',
      })
      .setOrigin(0.5)
      .setDepth(21);

    botao.on('pointerdown', () => this.voltar());
  }

  voltar() {
    if (this.entrando) return;
    this.entrando = true;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('ContinenteScene'));
  }
}
