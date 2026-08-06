import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Mapa do Continente (06_INTERFACE_UX.md, Seção 2.1).
// As 9 regiões aparecem desde o início; as não visitadas ficam como "?" —
// reforça "o mundo é maior do que o jogador consegue explorar".
// Ordem definitiva em 02_CONTINENTE.md.
const REGIOES = [
  { id: 'vila', nome: 'Vila Inicial', x: 280, y: 548, liberada: true },
  { id: 'bosque', nome: 'Bosque Esmeralda', x: 215, y: 368 },
  { id: 'floresta', nome: 'Floresta Sombria', x: 240, y: 200 },
  { id: 'montanhas', nome: 'Montanhas de Ferro', x: 437, y: 122 },
  { id: 'picos', nome: 'Picos Congelados', x: 1058, y: 120 },
  { id: 'reino', nome: 'Reino Esquecido', x: 1015, y: 320 },
  { id: 'pantano', nome: 'Pântano Maldito', x: 1022, y: 556 },
  { id: 'abismo', nome: 'O Abismo', x: 760, y: 448 },
  { id: 'vulcao', nome: 'Vulcão da Origem', x: 630, y: 376 },
];

export default class ContinenteScene extends Phaser.Scene {
  constructor() {
    super('ContinenteScene');
  }

  create() {
    this.entrando = false;

    this.add.image(0, 0, 'mapa_continente').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.game.audio.play(this, 'mus_mapa');
    this.game.audio.createToggle(this);

    this.titulo = this.add
      .text(GAME_WIDTH / 2, 36, 'O Continente', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffe9b0',
        backgroundColor: '#00000077',
        padding: { x: 18, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.marcadores = REGIOES.map((r) => this.marcador(r));

    this.dica = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 32, 'Toque na Vila Inicial para começar', {
        fontFamily: 'monospace',
        fontSize: '19px',
        color: '#ffe9b0',
        backgroundColor: '#00000077',
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.cameras.main.fadeIn(600);
  }

  marcador(regiao) {
    const liberada = !!regiao.liberada;

    this.add.circle(regiao.x, regiao.y, 17, 0x000000, 0.55).setDepth(9);
    const ponto = this.add.circle(regiao.x, regiao.y, 9, liberada ? 0xffb84d : 0x6b6b6b).setDepth(10);

    const rotulo = this.add
      .text(regiao.x, regiao.y - 32, liberada ? regiao.nome : '?', {
        fontFamily: 'monospace',
        fontSize: liberada ? '18px' : '22px',
        color: liberada ? '#ffe9b0' : '#9a9a9a',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    if (liberada) {
      this.tweens.add({
        targets: ponto,
        scale: 1.45,
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.add
        .zone(regiao.x, regiao.y, 96, 96)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.entrar(regiao));
    }

    return { regiao, ponto, rotulo };
  }

  // Aproxima a câmera até sobrar só a região escolhida, e então entra nela.
  entrar(regiao) {
    if (this.entrando) return;
    this.entrando = true;

    this.dica.setText(regiao.nome);
    this.tweens.add({ targets: this.titulo, alpha: 0, duration: 300 });

    this.marcadores.forEach(({ regiao: r, ponto, rotulo }) => {
      if (r.id === regiao.id) return;
      this.tweens.add({ targets: [ponto, rotulo], alpha: 0, duration: 400 });
    });

    this.cameras.main.pan(regiao.x, regiao.y, 1700, 'Cubic.easeInOut');
    this.cameras.main.zoomTo(4.2, 1700, 'Cubic.easeInOut');

    this.time.delayedCall(1800, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('VilaMapaScene', { origem: regiao }),
      );
    });
  }
}
