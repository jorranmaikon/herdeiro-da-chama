import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Menu principal (06_INTERFACE_UX.md, Seção 6).
// A arte de capa já traz os botões desenhados; aqui só posicionamos áreas
// clicáveis por cima deles. Arte provisória — será substituída.
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    this.add.image(0, 0, 'capa_menu').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.game.audio.playMusic(this, 'mus_titulo');

    // Coordenadas relativas aos botões desenhados na arte da capa.
    this.makeHotspot(1046, 176, 300, 92, () => this.startGame());
    this.makeHotspot(1046, 322, 300, 92, () => this.notImplemented('Bestiário'));
    this.makeHotspot(1046, 470, 300, 92, () => this.notImplemented('Sair'));

    this.notice = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffb84d',
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
  }

  makeHotspot(x, y, w, h, onClick) {
    const zone = this.add
      .zone(x, y, w, h)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Brilho sutil ao passar/tocar, já que a arte é estática.
    const glow = this.add
      .rectangle(x, y, w, h, 0xffb84d, 0.14)
      .setOrigin(0.5)
      .setVisible(false);

    zone.on('pointerover', () => glow.setVisible(true));
    zone.on('pointerout', () => glow.setVisible(false));
    zone.on('pointerdown', onClick);
    return zone;
  }

  notImplemented(nome) {
    // TODO: Bestiário e Sair ainda não existem como tela (não estão nos docs 00-09).
    this.notice.setText(`${nome} ainda não implementado`);
    this.time.delayedCall(1800, () => this.notice.setText(''));
  }

  startGame() {
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MapScene'));
  }
}
