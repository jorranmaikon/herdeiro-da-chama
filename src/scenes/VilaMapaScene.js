import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Mapa do Bioma — Vila Inicial (06_INTERFACE_UX.md, Seção 2.2).
// Progressão LINEAR: as fases se encadeiam numa trilha, sem mapa aberto.
//
// A arte é dedicada ao bioma e já traz os dois marcadores de fase desenhados —
// as posições abaixo são os centros desses marcadores, convertidos da resolução
// da arte (1536x1024) para o canvas do jogo. Antes esta cena mostrava um
// recorte ampliado do Mapa do Continente, o que era uma solução provisória.
//
// São DUAS fases, e não as quatro do padrão de bioma: a Região 0 é tutorial sem
// combate, e 4 fases não se justificariam (exceção registrada no
// VS_0_VILA_INICIAL.md, Seção 3).
const FASES = [
  { id: 1, nome: 'Despertar', x: 604, y: 232, cena: 'Fase1Scene', liberada: true },
  { id: 2, nome: 'Arredores', x: 638, y: 501, liberada: false },
];

export default class VilaMapaScene extends Phaser.Scene {
  constructor() {
    super('VilaMapaScene');
  }

  create() {
    this.entrando = false;

    this.add
      .image(0, 0, 'mapa_vila')
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

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
    // Linha ligando as fases, reforçando a progressão linear. Fica sob os
    // marcadores da arte, não por cima deles.
    const linha = this.add.graphics().setDepth(5);
    linha.lineStyle(4, 0xffe9b0, 0.35);
    linha.beginPath();
    FASES.forEach((f, i) => {
      if (i === 0) linha.moveTo(f.x, f.y);
      else linha.lineTo(f.x, f.y);
    });
    linha.strokePath();

    FASES.forEach((fase) => {
      const { x, y } = fase;

      // A arte já desenha o marcador; aqui entra só o realce de estado.
      const ponto = this.add
        .circle(x, y, 16, fase.liberada ? 0xffb84d : 0x4a4a4a, fase.liberada ? 0.55 : 0.7)
        .setDepth(10);

      this.add
        .text(x, y - 44, fase.liberada ? `${fase.id}. ${fase.nome}` : '?', {
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
}
