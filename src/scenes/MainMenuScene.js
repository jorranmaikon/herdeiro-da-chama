import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Menu principal (06_INTERFACE_UX.md, Seção 6).
// TODO: trocar placeholder de texto pela arte final quando o Vertical Slice
// da Vila Inicial tiver os assets aprovados (VS_00_VILA_INICIAL.md, Seção 10).
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1410');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Herdeiro da Chama', {
        fontSize: '14px',
        color: '#ffb84d',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, '[ Novo Jogo ]', {
        fontSize: '8px',
        color: '#e0d8c8',
      })
      .setOrigin(0.5);

    // TODO: iniciar cena da Vila Inicial (Vila_0) quando ela estiver implementada.
  }
}
