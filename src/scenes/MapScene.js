import Phaser from 'phaser';

// Mapa do Continente / Mapa do Bioma, também como overlay (06_INTERFACE_UX.md, Seção 2).
// TODO: Mapa do Continente (silhueta das 9 regiões) e Mapa do Bioma (revelação por sala).
export default class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  create() {
    // Placeholder — acessado pelo Menu de Pausa.
  }
}
