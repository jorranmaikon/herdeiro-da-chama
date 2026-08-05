import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Menu principal (06_INTERFACE_UX.md, Seção 6).
// TODO: trocar o placeholder de texto pela arte final quando o Vertical Slice
// da Vila Inicial tiver a tela de menu aprovada.
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1410');

    if (this.textures.exists('bg_ceu')) {
      this.add
        .image(0, 0, 'bg_ceu')
        .setOrigin(0)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.35);
    }

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, 'Herdeiro da Chama', {
        fontFamily: 'monospace',
        fontSize: '54px',
        color: '#ffb84d',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'Vila Inicial — Fase 1: Despertar', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#9c8a6b',
      })
      .setOrigin(0.5);

    const start = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '[ Novo Jogo ]', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#e8dfd0',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.on('pointerover', () => start.setColor('#ffb84d'));
    start.on('pointerout', () => start.setColor('#e8dfd0'));
    start.on('pointerdown', () => this.startGame());

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 70, 'Setas/AD mover  •  ESPAÇO pular  •  X atacar  •  E interagir', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#7a6a52',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
  }

  startGame() {
    this.scene.start('Vila0_Fase1');
  }
}
