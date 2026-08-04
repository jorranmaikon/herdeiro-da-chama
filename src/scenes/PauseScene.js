import Phaser from 'phaser';

// Overlay de pausa — nunca substitui a cena de baixo, roda em paralelo
// (06_INTERFACE_UX.md, Seção 3 / 08_ARQUITETURA_TECNICA.md, Seção 4).
// TODO: implementar Mapa, Habilidades, Brasas Coletadas, Códex, Configurações.
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    // Placeholder — lançada via scene.launch() + scene.pause() da cena de baixo.
  }
}
