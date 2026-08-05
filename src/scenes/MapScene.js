import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Mapa do Continente (06_INTERFACE_UX.md, Seção 2.1).
// Mostra as 9 regiões desde o início: as não visitadas aparecem na silhueta,
// mas sem detalhe — reforça "o mundo é maior do que o jogador consegue explorar".
//
// Ordem definitiva das regiões: 02_CONTINENTE.md.
const REGIOES = [
  { id: 'vila', nome: 'Vila Inicial', x: 280, y: 548, liberada: true, cena: 'Vila0_Fase1' },
  { id: 'bosque', nome: 'Bosque Esmeralda', x: 215, y: 368, liberada: false },
  { id: 'floresta', nome: 'Floresta Sombria', x: 240, y: 200, liberada: false },
  { id: 'montanhas', nome: 'Montanhas de Ferro', x: 437, y: 122, liberada: false },
  { id: 'picos', nome: 'Picos Congelados', x: 1058, y: 120, liberada: false },
  { id: 'reino', nome: 'Reino Esquecido', x: 1015, y: 320, liberada: false },
  { id: 'pantano', nome: 'Pântano Maldito', x: 1022, y: 556, liberada: false },
  { id: 'abismo', nome: 'O Abismo', x: 760, y: 448, liberada: false },
  { id: 'vulcao', nome: 'Vulcão da Origem', x: 630, y: 376, liberada: false },
];

export default class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  create() {
    this.entrando = false;

    this.mapa = this.add.image(0, 0, 'mapa_continente').setOrigin(0);
    this.mapa.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.game.audio.playMusic(this, 'mus_mapa');

    this.titulo = this.add
      .text(GAME_WIDTH / 2, 34, 'O Continente', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffe9b0',
        backgroundColor: '#00000077',
        padding: { x: 18, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.marcadores = REGIOES.map((r) => this.criarMarcador(r));

    this.dica = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Toque na Vila Inicial para começar', {
        fontFamily: 'monospace',
        fontSize: '19px',
        color: '#ffe9b0',
        backgroundColor: '#00000077',
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.cameras.main.fadeIn(700);
  }

  criarMarcador(regiao) {
    const cor = regiao.liberada ? 0xffb84d : 0x6b6b6b;

    const anel = this.add.circle(regiao.x, regiao.y, 17, 0x000000, 0.55).setDepth(9);
    const ponto = this.add.circle(regiao.x, regiao.y, 9, cor).setDepth(10);

    // Região não visitada não revela nome (06_INTERFACE_UX.md, Seção 2.1).
    const rotulo = this.add
      .text(regiao.x, regiao.y - 32, regiao.liberada ? regiao.nome : '?', {
        fontFamily: 'monospace',
        fontSize: regiao.liberada ? '18px' : '22px',
        color: regiao.liberada ? '#ffe9b0' : '#9a9a9a',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    if (regiao.liberada) {
      // Pulsa pra chamar atenção da única região disponível.
      this.tweens.add({
        targets: ponto,
        scale: 1.45,
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const zona = this.add
        .zone(regiao.x, regiao.y, 90, 90)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      zona.on('pointerdown', () => this.entrarNaRegiao(regiao));
    }

    return { regiao, anel, ponto, rotulo };
  }

  // Aproxima a câmera até sobrar só a região escolhida, e então entra na fase.
  entrarNaRegiao(regiao) {
    if (this.entrando) return;
    this.entrando = true;

    this.dica.setText(regiao.nome);
    this.tweens.add({ targets: [this.titulo], alpha: 0, duration: 300 });

    // Some com os marcadores das outras regiões durante a aproximação.
    this.marcadores.forEach(({ regiao: r, anel, ponto, rotulo }) => {
      if (r.id === regiao.id) return;
      this.tweens.add({ targets: [anel, ponto, rotulo], alpha: 0, duration: 400 });
    });

    this.cameras.main.pan(regiao.x, regiao.y, 1800, 'Cubic.easeInOut');
    this.cameras.main.zoomTo(4.2, 1800, 'Cubic.easeInOut');

    this.time.delayedCall(1900, () => {
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(regiao.cena);
      });
    });
  }
}
