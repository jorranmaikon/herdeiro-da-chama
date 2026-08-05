import Phaser from 'phaser';

// Trilha por cena + controle de volume (08_ARQUITETURA_TECNICA.md, Seção 5).
// Nenhuma cena chama this.sound diretamente — tudo passa por aqui.
//
// Navegadores (principalmente no celular) bloqueiam áudio até o usuário
// interagir. Por isso existem três caminhos de desbloqueio:
//   1. retomar o AudioContext quando ele estiver suspenso;
//   2. esperar o evento 'unlocked' do Phaser;
//   3. o botão de som, que é sempre um gesto explícito do usuário.
export default class AudioManager {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.currentKey = null;
    this.musicVolume = 0.6;
    this.enabled = true;
    this.pendingKey = null;
  }

  playMusic(scene, key) {
    this.pendingKey = key;
    if (!this.enabled) return;
    if (this.currentKey === key && this.current?.isPlaying) return;
    this.start(scene, key);
  }

  start(scene, key) {
    const sm = scene.sound;

    // AudioContext suspenso (caso mais comum no mobile).
    if (sm.context && sm.context.state === 'suspended') {
      sm.context.resume().catch(() => {});
    }

    if (sm.locked) {
      // Ainda travado: tenta de novo assim que o Phaser destravar, e também
      // no primeiro toque/tecla desta cena — o que vier primeiro.
      sm.once('unlocked', () => this.retry(scene));
      scene.input.once('pointerdown', () => this.retry(scene));
      scene.input.keyboard?.once('keydown', () => this.retry(scene));
      return;
    }

    this.stopCurrent();

    const track = scene.sound.add(key, { loop: true, volume: 0 });
    track.play();
    scene.tweens.add({ targets: track, volume: this.musicVolume, duration: 800 });

    this.current = track;
    this.currentKey = key;
  }

  retry(scene) {
    if (!this.enabled || !this.pendingKey) return;
    if (this.currentKey === this.pendingKey && this.current?.isPlaying) return;
    if (!scene.scene.isActive()) return;
    this.start(scene, this.pendingKey);
  }

  stopCurrent() {
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
      this.stopCurrent();
    }
    return this.enabled;
  }

  setMusicVolume(value) {
    this.musicVolume = Phaser.Math.Clamp(value, 0, 1);
    if (this.current) this.current.volume = this.musicVolume;
  }

  /**
   * Botão de som, presente em todas as cenas.
   * Além de ligar/desligar, ele garante um gesto explícito do usuário —
   * é a rede de segurança para o bloqueio de autoplay.
   */
  createToggleButton(scene, x = null, y = 26) {
    const px = x ?? scene.cameras.main.width - 40;

    const bg = scene.add
      .circle(px, y + 12, 22, 0x000000, 0.45)
      .setStrokeStyle(2, 0xffe9b0, 0.6)
      .setScrollFactor(0)
      .setDepth(2000)
      .setInteractive({ useHandCursor: true });

    const icon = scene.add
      .text(px, y + 12, this.enabled ? '♪' : '✕', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: this.enabled ? '#ffe9b0' : '#8a7a62',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);

    bg.on('pointerdown', () => {
      const on = this.toggle(scene);
      icon.setText(on ? '♪' : '✕');
      icon.setColor(on ? '#ffe9b0' : '#8a7a62');
    });

    return { bg, icon };
  }
}
