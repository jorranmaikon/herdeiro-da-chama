import Phaser from 'phaser';

// Configuração mínima antes de carregar qualquer asset (08_ARQUITETURA_TECNICA.md, Seção 4).
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
