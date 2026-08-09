import Phaser from 'phaser';

// Trilha por cena (08_ARQUITETURA_TECNICA.md, Seção 5).
//
// Duas dificuldades moldam este arquivo:
//
// 1. PESO. As quatro faixas somam 13 MB. Carregar tudo antes do menu abrir
//    deixaria a primeira tela em branco por vários segundos no celular — por
//    isso cada faixa é baixada sob demanda, na primeira vez que é pedida, e
//    fica em cache para as próximas.
//
// 2. AUTOPLAY. Navegadores bloqueiam áudio até o usuário interagir com a
//    página; é política do browser, sem contorno por código. O que dá para
//    fazer é estar pronto: tentar tocar de imediato e, se vier bloqueado,
//    destravar no primeiro gesto. No iOS o WebAudio ainda é silenciado pela
//    chave física de mudo — por isso o jogo roda com disableWebAudio
//    (ver main.js).
export default class AudioManager {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.currentKey = null;
    this.pendingKey = null;
    this.volume = 0.6;
    this.enabled = true;
    this.carregando = new Set();
  }

  /** Caminho do arquivo de uma faixa. */
  static caminho(key) {
    return `assets/audio/${key}.mp3`;
  }

  play(scene, key) {
    this.pendingKey = key;
    if (!this.enabled) return;
    if (this.currentKey === key && this.current?.isPlaying) return;

    // Ainda não baixada: carrega agora e toca quando chegar.
    if (!scene.cache.audio.exists(key)) {
      this.carregar(scene, key);
      return;
    }
    this.start(scene, key);
  }

  carregar(scene, key) {
    if (this.carregando.has(key)) return;
    this.carregando.add(key);

    scene.load.audio(key, AudioManager.caminho(key));
    scene.load.once('complete', () => {
      this.carregando.delete(key);
      // Entre pedir e chegar, o jogador pode ter trocado de cena.
      if (this.pendingKey === key && scene.scene.isActive()) {
        this.start(scene, key);
      }
    });
    scene.load.start();
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
    // Entrada em fade: corte seco no volume cheio soa abrupto a cada troca.
    scene.tweens.add({ targets: track, volume: this.volume, duration: 900 });

    this.current = track;
    this.currentKey = key;
  }

  retry(scene) {
    if (!this.enabled || !this.pendingKey) return;
    if (this.currentKey === this.pendingKey && this.current?.isPlaying) return;
    if (!scene.scene.isActive()) return;

    if (!scene.cache.audio.exists(this.pendingKey)) {
      this.carregar(scene, this.pendingKey);
      return;
    }
    this.start(scene, this.pendingKey);
  }

  stop() {
    if (!this.current) return;
    this.current.stop();
    this.current.destroy();
    this.current = null;
    this.currentKey = null;
  }

  /** Silencia a faixa atual em fade, para transições entre cenas. */
  fadeToStop(scene, duracao = 500) {
    if (!this.current) return;
    const antiga = this.current;
    this.current = null;
    this.currentKey = null;
    scene.tweens.add({
      targets: antiga,
      volume: 0,
      duration: duracao,
      onComplete: () => {
        antiga.stop();
        antiga.destroy();
      },
    });
  }

  toggle(scene) {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (this.pendingKey) this.play(scene, this.pendingKey);
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
