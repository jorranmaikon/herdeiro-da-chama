import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Mapa do Bioma — Vila Inicial (06_INTERFACE_UX.md, Seção 2.2).
// Progressão LINEAR: as fases se encadeiam numa trilha, sem mapa aberto.
//
// A arte é um recorte ampliado do Mapa do Continente na região da Vila.
// TODO: substituir por arte dedicada do bioma quando existir.
const ZOOM = 4.2;
const FOCO = { x: 280, y: 548 }; // posição da Vila no mapa do continente

const FASES = [
  { id: 1, nome: 'Despertar', x: -150, y: 40, cena: 'Fase1Scene', liberada: true },
  { id: 2, nome: 'A Forja', x: -40, y: -30, liberada: false },
  { id: 3, nome: 'A Trilha', x: 80, y: 20, liberada: false },
  { id: 4, nome: 'Arredores', x: 190, y: -40, liberada: false },
];

export default class VilaMapaScene extends Phaser.Scene {
  constructor() {
    super('VilaMapaScene');
  }

  create() {
    this.entrando = false;

    // Recorte da região da Vila, ampliado — continua de onde o zoom do
    // continente parou, sem corte visual entre as duas telas.
    const mapa = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'mapa_continente');
    mapa.setScale(ZOOM);
    mapa.x = GAME_WIDTH / 2 - (FOCO.x - GAME_WIDTH / 2) * ZOOM;
    mapa.y = GAME_HEIGHT / 2 - (FOCO.y - GAME_HEIGHT / 2) * ZOOM;

    // Escurece um pouco pra trilha e rótulos ficarem legíveis sobre a arte.
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35).setOrigin(0);

    this.game.audio.play(this, 'mus_mapa');
    this.game.audio.createToggle(this);

    this.add
      .text(GAME_WIDTH / 2, 44, 'Vila Inicial', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffe9b0',
        backgroundColor: '#00000088',
        padding: { x: 18, y: 8 },
      })
      .setOrigin(0.5);

    this.desenharTrilha();

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 34, 'Toque na fase para entrar', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffe9b0',
        backgroundColor: '#00000077',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5);

    this.cameras.main.fadeIn(600);
  }

  desenharTrilha() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 + 40;

    // Linha ligando as fases, reforçando a progressão linear.
    const linha = this.add.graphics().setDepth(5);
    linha.lineStyle(4, 0x6b5334, 0.9);
    linha.beginPath();
    FASES.forEach((f, i) => {
      const x = cx + f.x;
      const y = cy + f.y;
      if (i === 0) linha.moveTo(x, y);
      else linha.lineTo(x, y);
    });
    linha.strokePath();

    FASES.forEach((fase) => {
      const x = cx + fase.x;
      const y = cy + fase.y;

      this.add.circle(x, y, 22, 0x000000, 0.6).setDepth(9);
      const ponto = this.add
        .circle(x, y, 13, fase.liberada ? 0xffb84d : 0x5a5a5a)
        .setDepth(10);

      this.add
        .text(x, y - 40, fase.liberada ? `${fase.id}. ${fase.nome}` : '?', {
          fontFamily: 'monospace',
          fontSize: fase.liberada ? '17px' : '20px',
          color: fase.liberada ? '#ffe9b0' : '#9a9a9a',
          backgroundColor: '#000000aa',
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(10);

      if (!fase.liberada) return;

      this.tweens.add({
        targets: ponto,
        scale: 1.4,
        duration: 750,
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
}
