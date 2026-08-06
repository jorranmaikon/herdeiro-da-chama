import Phaser from 'phaser';

// Trilha por cena (08_ARQUITETURA_TECNICA.md, Seção 5).
//
// Navegadores bloqueiam áudio até o usuário interagir. No iOS o WebAudio ainda
// é silenciado pela chave física de mudo — por isso o jogo roda com
// disableWebAudio (ver main.js). O desbloqueio tenta três caminhos:
// retomar o contexto, o evento 'unlocked' do Phaser, e o primeiro gesto.
export default class AudioManager {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.currentKey = null;
    this.pendingKey = null;
    this.volume = 0.6;
    this.enabled = true;
  }

  play(scene, key) {
    this.pendingKey = key;
    if (!this.enabled) return;
    if (this.currentKey === key && this.current?.isPlaying) return;
    this.start(scene, key);
  }

  start(scene, key) {
    const sm = scene.sound;

    if (sm.context && sm.context.state === 'suspended') {
      sm.context.resume().catch(() => {});
    }

    if (sm.locked) {
      sm.once('unlocked', () => this.retry(scene));
      scene.input.once('pointerdown', () => this.retry(scene));
      return;
    }

    this.stop();

    const track = scene.sound.add(key, { loop: true, volume: 0 });
    track.play();
    scene.tweens.add({ targets: track, volume: this.volume, duration: 800 });

    this.current = track;
    this.currentKey = key;
  }

  retry(scene) {
    if (!this.enabled || !this.pendingKey) return;
    if (this.currentKey === this.pendingKey && this.current?.isPlaying) return;
    if (!scene.scene.isActive()) return;
    this.start(scene, this.pendingKey);
  }

  stop() {
    if (!this.current) return;
    this.current.stop();
    this.current.destroy();
    this.current = null;
    this.currentKey = null;
  }

  toggle(scene) {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (this.pendingKey) this.start(scene, this.pendingKey);
    } else {
      this.stop();
    }
    return this.enabled;
  }

  // Botão presente em todas as cenas. Além de ligar/desligar, é um gesto
  // explícito do usuário — a rede de segurança contra o bloqueio de autoplay.
  createToggle(scene) {
    const x = scene.cameras.main.width - 44;
    const y = 44;

    const bg = scene.add
      .circle(x, y, 22, 0x000000, 0.45)
      .setStrokeStyle(2, 0xffe9b0, 0.6)
      .setScrollFactor(0)
      .setDepth(2000)
      .setInteractive({ useHandCursor: true });

    const icon = scene.add
      .text(x, y, this.enabled ? '♪' : '✕', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: this.enabled ? '#ffe9b0' : '#8a7a62',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);

    bg.on('pointerdown', () => {
      const on = this.toggle(scene);
      icon.setText(on ? '♪' : '✕').setColor(on ? '#ffe9b0' : '#8a7a62');
    });
  }
}
