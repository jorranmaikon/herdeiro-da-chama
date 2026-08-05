import Phaser from 'phaser';

// Trilha por cena + controle de volume (08_ARQUITETURA_TECNICA.md, Seção 5).
// Nenhuma cena chama this.sound diretamente — tudo passa por aqui.
export default class AudioManager {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.currentKey = null;
    this.musicVolume = 0.6;
  }

  /**
   * Toca a trilha da cena. Se já for a mesma faixa, não reinicia —
   * assim a música do menu não corta ao abrir o mapa e voltar.
   */
  playMusic(scene, key, { loop = true, fadeMs = 900 } = {}) {
    if (this.currentKey === key && this.current?.isPlaying) return;

    // Navegadores bloqueiam áudio até a primeira interação do usuário.
    // Se ainda estiver travado, espera o desbloqueio e toca depois.
    if (scene.sound.locked) {
      this.currentKey = key;
      scene.sound.once('unlocked', () => {
        this.currentKey = null;
        this.playMusic(scene, key, { loop, fadeMs });
      });
      return;
    }

    const next = scene.sound.add(key, { loop, volume: 0 });
    next.play();
    scene.tweens.add({ targets: next, volume: this.musicVolume, duration: fadeMs });

    this.fadeOutCurrent(scene, fadeMs);
    this.current = next;
    this.currentKey = key;
  }

  fadeOutCurrent(scene, fadeMs) {
    const old = this.current;
    if (!old) return;
    scene.tweens.add({
      targets: old,
      volume: 0,
      duration: fadeMs,
      onComplete: () => old.destroy(),
    });
  }

  stopMusic() {
    this.current?.stop();
    this.current?.destroy();
    this.current = null;
    this.currentKey = null;
  }

  setMusicVolume(value) {
    this.musicVolume = Phaser.Math.Clamp(value, 0, 1);
    if (this.current) this.current.volume = this.musicVolume;
  }
}
