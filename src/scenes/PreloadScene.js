import Phaser from 'phaser';

// Carrega assets globais (UI, fontes) + assets do bioma atual (08_ARQUITETURA_TECNICA.md, Seção 4).
// TODO: carregar assets reais assim que o Checklist de Assets de cada Vertical Slice
// (09_TEMPLATE_VERTICAL_SLICE.md, Seção 10) estiver produzido.
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Placeholder: sem assets ainda. Barra de loading básica pra quando existirem.
    const { width, height } = this.cameras.main;
    const box = this.add.rectangle(width / 2, height / 2, 120, 8, 0x333333);
    const bar = this.add.rectangle(width / 2 - 58, height / 2, 4, 4, 0xffb84d).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      bar.width = 116 * value;
    });
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}
