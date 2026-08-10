import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import save from '../managers/SaveManager.js';

// Tela inicial (06_INTERFACE_UX.md, Seção 6).
// A arte de capa já traz os botões desenhados; aqui só posicionamos áreas
// clicáveis sobre eles. Arte provisória.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add.image(0, 0, 'capa_menu').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // A trilha já começou na tela de toque do PreloadScene e atravessa a
    // transição — pedir de novo aqui a reiniciaria do zero.
    this.game.audio.play(this, 'mus_titulo');
    this.game.audio.createToggle(this);

    // Coordenadas dos botões desenhados na capa, convertidas da resolução da
    // arte (1024x572) para o canvas.
    this.hotspot(646, 344, 330, 40, () => this.novoJogo());
    this.hotspot(646, 384, 330, 40, () => this.continuar());
    this.hotspot(646, 424, 330, 40, () => this.notice('Bestiário ainda não implementado'));

    this.noticeText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 26, '', {
        fontFamily: 'monospace',
        fontSize: '17px',
        color: '#ffb84d',
      })
      .setOrigin(0.5);

    // Enter/Espaço fazem o mais provável: continuar, se houver progresso.
    const acaoPadrao = () => (save.temProgresso() ? this.continuar() : this.novoJogo());
    this.input.keyboard.on('keydown-ENTER', acaoPadrao);
    this.input.keyboard.on('keydown-SPACE', acaoPadrao);

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

  // Novo jogo apaga o save e abre pela Crônica de Abertura, antes de qualquer
  // gameplay (VS_0_VILA_INICIAL.md, Seção 2).
  novoJogo() {
    if (save.temProgresso() && !this.confirmandoNovoJogo) {
      // Sobrescrever progresso sem aviso seria perda irreversível — o save é
      // slot único (06_INTERFACE_UX.md, Seção 7).
      this.confirmandoNovoJogo = true;
      this.notice('Isso apaga seu progresso. Toque de novo para confirmar.');
      this.time.delayedCall(3000, () => { this.confirmandoNovoJogo = false; });
      return;
    }

    save.apagar();
    this.irPara('ChronicleScene', { id: 'cronica_vila_01' });
  }

  // Continuar pula a Crônica de Abertura e devolve o jogador ao Mapa do
  // Continente, de onde ele escolhe a região.
  continuar() {
    if (!save.temProgresso()) {
      this.notice('Nenhum jogo salvo ainda');
      return;
    }
    this.irPara('ContinenteScene');
  }

  irPara(cena, dados) {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(cena, dados));
  }
}
