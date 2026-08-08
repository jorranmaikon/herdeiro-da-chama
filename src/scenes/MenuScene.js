import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Tela inicial (06_INTERFACE_UX.md, Seção 6).
// A arte de capa já traz os botões desenhados; aqui só posicionamos áreas
// clicáveis sobre eles. Arte provisória.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add.image(0, 0, 'capa_menu').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.game.audio.play(this, 'mus_titulo');
    this.game.audio.createToggle(this);

    // Coordenadas dos botões desenhados na capa, convertidas da resolução da
    // arte (1024x572) para o canvas.
    this.hotspot(646, 344, 330, 40, () => this.start());
    this.hotspot(646, 384, 330, 40, () => this.notice('Nenhum jogo salvo ainda'));
    this.hotspot(646, 424, 330, 40, () => this.notice('Bestiário ainda não implementado'));

    this.noticeText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, '', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffb84d',
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-ENTER', () => this.start());
    this.input.keyboard.on('keydown-SPACE', () => this.start());

    this.cameras.main.fadeIn(500);
  }

  hotspot(x, y, w, h, onClick) {
    const glow = this.add.rectangle(x, y, w, h, 0xffb84d, 0.14).setVisible(false);
    this.add
      .zone(x, y, w, h)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => glow.setVisible(true))
      .on('pointerout', () => glow.setVisible(false))
      .on('pointerdown', onClick);
  }

  notice(msg) {
    this.noticeText.setText(msg);
    this.time.delayedCall(1800, () => this.noticeText.setText(''));
  }

  start() {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.fadeOut(500);
    // Novo jogo abre pela Crônica de Abertura, antes de qualquer gameplay
    // (VS_0_VILA_INICIAL.md, Seção 2). Ela leva ao Mapa do Continente.
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.start('ChronicleScene', { id: 'cronica_vila_01' }));
  }
}
