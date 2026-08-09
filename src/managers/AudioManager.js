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
    this.desbloqueado = false;
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
      if (this.pendingKey !== key) return;

      // Entre pedir e chegar, o jogador pode ter trocado de cena. Toca na cena
      // que estiver ativa AGORA, não naquela que fez o pedido — senão a faixa
      // baixa e não toca.
      const ativa = scene.scene.isActive()
        ? scene
        : this.game.scene.getScenes(true)[0];
      if (ativa) this.start(ativa, key);
    });
    scene.load.start();
  }

  start(scene, key) {
    // Tudo aqui usa o SoundManager do JOGO, nunca o da cena. O objeto é o
    // mesmo, mas listeners e tweens presos a uma cena morrem quando ela troca —
    // e é exatamente durante a troca que a música precisa sobreviver.
    const sm = this.game.sound;

    if (sm.context && sm.context.state === 'suspended') {
      sm.context.resume().catch(() => {});
    }

    if (sm.locked) {
      // Ainda travado pelo navegador. Registrar o listener na CENA era o bug:
      // na tela de toque, a cena trocava no mesmo gesto e levava o listener
      // junto, então a faixa nunca chegava a tocar.
      this.aguardarUnlock();
      sm.unlock?.();
      return;
    }

    this.stop();

    const track = sm.add(key, { loop: true, volume: 0 });
    track.play();

    // current precisa estar definido ANTES do fade: o fade compara com ele
    // para saber se ainda é a faixa vigente.
    this.current = track;
    this.currentKey = key;
    this.fadeIn(track);
  }

  /** Libera as faixas já em cache, obrigatoriamente DENTRO de um gesto do
   *  usuário.
   *
   *  No iOS um elemento de áudio nasce bloqueado e só é liberado se receber
   *  .play() durante um evento de toque real. O truque padrão é dar play e
   *  pausar imediatamente: o som não é ouvido, mas a tag passa a estar
   *  liberada para tocar depois, a qualquer momento.
   *
   *  O unlock() do Phaser faz isso sozinho, mas agendando para o PRÓXIMO
   *  touchend — o que nunca chegava, porque a tela de toque sai de cena no
   *  primeiro. Aqui o desbloqueio acontece no gesto que já está acontecendo.
   */
  desbloquear(scene) {
    // Só uma vez. Percorrer o cache dando play/pause em cada MP3 é caro, e
    // isto era chamado a CADA toque na tela: num jogo de plataforma com botões
    // virtuais, o resultado foi engasgo de áudio e queda de frame rate.
    if (this.desbloqueado) return this.game.sound;
    this.desbloqueado = true;

    const sm = this.game.sound;

    if (sm.context && sm.context.state === 'suspended') {
      sm.context.resume().catch(() => {});
    }

    const cache = this.game.cache.audio;
    cache.entries.each((key, tags) => {
      if (!Array.isArray(tags)) return true;
      tags.forEach((tag) => {
        try {
          const promessa = tag.play();
          if (promessa && promessa.then) promessa.catch(() => {});
          tag.pause();
          tag.currentTime = 0;
          tag.dataset.locked = 'false';
        } catch (e) {
          // Navegador recusou. O botão de som segue como alternativa.
        }
      });
      return true;
    });

    sm.locked = false;
    sm.unlocked = true;
    return sm;
  }

  /** Espera o navegador liberar o áudio e então toca na cena ativa do momento. */
  aguardarUnlock() {
    if (this.esperandoUnlock) return;
    this.esperandoUnlock = true;

    this.game.sound.once('unlocked', () => {
      this.esperandoUnlock = false;
      if (!this.enabled || !this.pendingKey) return;
      const ativa = this.game.scene.getScenes(true)[0];
      if (ativa) this.start(ativa, this.pendingKey);
    });
  }

  /** Fade de entrada preso ao loop do JOGO, não ao de uma cena.
   *
   *  Com tween de cena, uma troca no meio do fade matava o tween com o volume
   *  ainda perto de zero — a faixa tocava, mas inaudível.
   */
  fadeIn(track, duracao = 900) {
    const inicio = performance.now();
    const alvo = this.volume;

    const passo = () => {
      // Encerra se a faixa já foi trocada: sem esta saída, dois fades
      // simultâneos disputariam o volume a cada frame.
      if (this.current !== track) return;

      const t = Math.min(1, (performance.now() - inicio) / duracao);
      track.setVolume(alvo * t);
      if (t < 1) this.game.events.once('poststep', passo);
    };
    this.game.events.once('poststep', passo);
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

  /** Silencia a faixa atual em fade, para transições entre cenas.
   *  Também preso ao loop do jogo: a cena que pede o fade costuma ser
   *  justamente a que está saindo.
   */
  fadeToStop(scene, duracao = 500) {
    if (!this.current) return;
    const antiga = this.current;
    const volumeInicial = antiga.volume;
    this.current = null;
    this.currentKey = null;

    const inicio = performance.now();
    const passo = () => {
      const t = Math.min(1, (performance.now() - inicio) / duracao);
      antiga.setVolume(volumeInicial * (1 - t));
      if (t < 1) {
        this.game.events.once('poststep', passo);
      } else {
        antiga.stop();
        antiga.destroy();
      }
    };
    this.game.events.once('poststep', passo);
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
