import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Overlay de diálogo (06_INTERFACE_UX.md, Seção 4).
// Roda em paralelo à cena do bioma, que fica pausada — sem recarregar assets.
export default class DialogueOverlay extends Phaser.Scene {
  constructor() {
    super('DialogueOverlay');
  }

  init(data) {
    this.speakerName = data.name ?? '';
    this.portraitKey = data.portraitKey ?? null;
    this.lines = data.lines ?? [];
    this.callerScene = data.callerScene ?? null;

    this.lineIndex = 0;
    this.charIndex = 0;
    this.isTyping = false;
  }

  create() {
    const boxHeight = 190;
    const boxY = GAME_HEIGHT - boxHeight - 24;
    const margin = 40;

    // Caixa única, fixa na parte inferior — nunca cobre a área de gameplay ativa.
    this.add
      .rectangle(margin, boxY, GAME_WIDTH - margin * 2, boxHeight, 0x140f0a, 0.94)
      .setOrigin(0)
      .setStrokeStyle(3, 0x6b5334);

    let textLeft = margin + 28;

    // Retrato do NPC à esquerda.
    if (this.portraitKey && this.textures.exists(this.portraitKey)) {
      const portrait = this.add
        .image(margin + 20, boxY + boxHeight - 12, this.portraitKey)
        .setOrigin(0, 1);
      portrait.setDisplaySize(portrait.width * (170 / portrait.height), 170);
      textLeft = margin + 20 + portrait.displayWidth + 26;
    }

    this.add.text(textLeft, boxY + 20, this.speakerName, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffb84d',
    });

    this.bodyText = this.add.text(textLeft, boxY + 56, '', {
      fontFamily: 'monospace',
      fontSize: '19px',
      color: '#e8dfd0',
      lineSpacing: 8,
      wordWrap: { width: GAME_WIDTH - textLeft - margin - 40 },
    });

    this.hint = this.add
      .text(GAME_WIDTH - margin - 24, boxY + boxHeight - 18, '[E] continuar', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#9c8a6b',
      })
      .setOrigin(1, 1)
      .setVisible(false);

    this.input.keyboard.on('keydown-E', () => this.advance());
    this.input.keyboard.on('keydown-SPACE', () => this.advance());

    this.startLine();
  }

  startLine() {
    this.charIndex = 0;
    this.isTyping = true;
    this.hint.setVisible(false);
    this.bodyText.setText('');

    this.typeEvent?.remove();
    this.typeEvent = this.time.addEvent({
      delay: 28,
      loop: true,
      callback: () => {
        const line = this.lines[this.lineIndex];
        this.charIndex += 1;
        this.bodyText.setText(line.slice(0, this.charIndex));
        if (this.charIndex >= line.length) this.finishTyping();
      },
    });
  }

  finishTyping() {
    this.typeEvent?.remove();
    this.isTyping = false;
    this.bodyText.setText(this.lines[this.lineIndex]);
    this.hint.setVisible(true);
  }

  advance() {
    // Primeiro toque acelera o texto; o seguinte avança a fala.
    if (this.isTyping) {
      this.finishTyping();
      return;
    }

    this.lineIndex += 1;
    if (this.lineIndex >= this.lines.length) {
      this.close();
      return;
    }
    this.startLine();
  }

  close() {
    this.typeEvent?.remove();
    this.input.keyboard.removeAllListeners();
    if (this.callerScene) this.scene.resume(this.callerScene);
    this.scene.stop();
  }
}
