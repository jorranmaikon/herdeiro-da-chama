import Phaser from 'phaser';
import { regiaoLiberada } from '../data/progressao.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Mapa do Continente (06_INTERFACE_UX.md, Seção 2.1).
// As 9 regiões aparecem desde o início; as não visitadas ficam como "?" —
// reforça "o mundo é maior do que o jogador consegue explorar".
// Ordem definitiva em 02_CONTINENTE.md.
// Posições dos rótulos na arte do mapa, convertidas de 1536x1024 para o canvas.
// A ordem segue a espiral do 02_CONTINENTE.md: da Vila, na borda, até o Vulcão,
// no centro geográfico.
const REGIOES = [
  { id: 'vila', nome: 'Vila Inicial', x: 254, y: 594, destino: 'VilaMapaScene' },
  { id: 'bosque', nome: 'Bosque Esmeralda', x: 177, y: 413, destino: 'BosqueMapaScene' },
  { id: 'floresta', nome: 'Floresta Sombria', x: 229, y: 204 },
  { id: 'montanhas', nome: 'Montanhas de Ferro', x: 414, y: 92 },
  { id: 'picos', nome: 'Picos Congelados', x: 1029, y: 138 },
  { id: 'reino', nome: 'Reino Esquecido', x: 1033, y: 379 },
  { id: 'pantano', nome: 'Pântano Maldito', x: 1010, y: 605 },
  { id: 'abismo', nome: 'O Abismo', x: 771, y: 443 },
  { id: 'vulcao', nome: 'Vulcão da Origem', x: 606, y: 356 },
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
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 32, 'Toque numa região liberada para entrar', {
        fontFamily: 'monospace',
        fontSize: '19px',
        color: '#ffe9b0',
        backgroundColor: '#00000077',
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.botaoVoltar();
    this.cameras.main.fadeIn(600);
  }

  marcador(regiao) {
    const liberada = !!regiaoLiberada(regiao.id);

    // A arte do mapa traz o nome de TODAS as regiões escrito. Isso contraria o
    // 06_INTERFACE_UX.md (Seção 2.1): região não visitada mostra apenas a
    // silhueta e um "?", sem revelar conteúdo. Por isso o rótulo das regiões
    // bloqueadas é COBERTO por uma placa opaca com "?" — a silhueta do terreno
    // continua visível, que é justamente o que a regra quer preservar.
    if (!liberada) {
      this.add
        .rectangle(regiao.x, regiao.y, 172, 34, 0x1a1712, 0.94)
        .setStrokeStyle(2, 0x4a3f30)
        .setDepth(9);
    }

    // Região liberada: o marcador sobe para não cobrir o nome que a arte já
    // desenha — escrever o nome de novo por cima ficava duplicado.
    // Região bloqueada: o marcador some e sobra só o "?" sobre a placa opaca.
    const my = liberada ? regiao.y - 40 : regiao.y;

    let ponto = null;
    if (liberada) {
      this.add.circle(regiao.x, my, 17, 0x000000, 0.55).setDepth(9);
      ponto = this.add.circle(regiao.x, my, 9, 0xffb84d).setDepth(10);
    }

    const rotulo = this.add
      .text(regiao.x, my, liberada ? '' : '?', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#9a9a9a',
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
        .zone(regiao.x, regiao.y - 20, 190, 90)
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
        this.scene.start(regiao.destino, { origem: regiao }),
      );
    });
  }

  // Saída para o menu. Sem ela, o Mapa do Continente também seria um beco sem
  // saída no celular.
  botaoVoltar() {
    const x = 100;
    const y = GAME_HEIGHT - 46;

    const botao = this.add
      .rectangle(x, y, 150, 44, 0x1a2418, 0.85)
      .setStrokeStyle(2, 0x55603f)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, '< Menu', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffe9b0',
      })
      .setOrigin(0.5)
      .setDepth(21);

    botao.on('pointerdown', () => {
      if (this.entrando) return;
      this.entrando = true;
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }
}
