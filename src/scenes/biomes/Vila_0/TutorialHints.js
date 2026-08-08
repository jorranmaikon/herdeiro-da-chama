import { TILE } from '../../../config/gameConfig.js';

// Dicas de comando da Fase 1 (Vila Inicial, Região 0).
//
// A Região 0 existe para ensinar os controles básicos (02_CONTINENTE.md), e a
// regra aqui é: a dica aparece quando o comando fica relevante e SOME assim
// que o jogador executa a ação. Nada de tutorial que insiste depois de
// aprendido, nada de caixa de texto travando o jogo.
//
// É local à Vila_0 de propósito: é o único bioma-tutorial do jogo, e um
// "sistema de tutorial" global seria estrutura demais para um uso só
// (00_GAME_BIBLE.md — simplicidade vence).

// No celular a dica mostra o mesmo símbolo do botão virtual; no desktop,
// a tecla. Mostrar "←" para quem joga no toque não ensina nada.
const ROTULOS = {
  toque: { esquerda: '◀', direita: '▶', pular: '▲', atacar: '⚔' },
  teclado: { esquerda: '←', direita: '→', pular: 'ESPAÇO', atacar: 'X' },
};

export default class TutorialHints {
  constructor(scene, { alvoX, primeiroVaoX }) {
    this.scene = scene;
    this.alvoX = alvoX;
    this.primeiroVaoX = primeiroVaoX;

    this.rotulos = scene.sys.game.device.input.touch
      ? ROTULOS.toque
      : ROTULOS.teclado;

    this.feito = { mover: false, pular: false, atacar: false };
    this.dicas = {};
    this.destaqueAlvo = null;
  }

  /** Balão flutuante acima do jogador, preso ao mundo. */
  criarDica(id, texto, x, y) {
    if (this.dicas[id]) return this.dicas[id];

    const caixa = this.scene.add.container(x, y).setDepth(60);

    const label = this.scene.add
      .text(0, 0, texto, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ede3d0',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    const fundo = this.scene.add
      .rectangle(0, 0, label.width + 30, label.height + 20, 0x14110c, 0.86)
      .setStrokeStyle(2, 0x6b5334);

    caixa.add([fundo, label]);
    caixa.setAlpha(0);

    this.scene.tweens.add({ targets: caixa, alpha: 1, duration: 300 });
    this.scene.tweens.add({
      targets: caixa,
      y: y - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.dicas[id] = caixa;
    return caixa;
  }

  esconder(id) {
    const caixa = this.dicas[id];
    if (!caixa) return;
    delete this.dicas[id];

    this.scene.tweens.killTweensOf(caixa);
    this.scene.tweens.add({
      targets: caixa,
      alpha: 0,
      duration: 260,
      onComplete: () => caixa.destroy(),
    });
  }

  /**
   * Chamado a cada frame pela cena.
   * @param {object} player
   * @param {object} input   InputManager, para saber o que foi pressionado
   */
  atualizar(player, input) {
    this.passoMover(player, input);
    this.passoPular(player, input);
    this.passoAtacar(player, input);
  }

  // --- 1. Mover -----------------------------------------------------------
  passoMover(player, input) {
    if (this.feito.mover) return;

    if (!this.dicas.mover) {
      this.criarDica(
        'mover',
        `${this.rotulos.esquerda}   ${this.rotulos.direita}\nandar`,
        player.x,
        player.y - 150,
      );
    }

    // Some no primeiro passo de verdade, não no primeiro toque: encostar no
    // botão sem sair do lugar não é ter aprendido.
    if (Math.abs(player.body.velocity.x) > 40) {
      this.feito.mover = true;
      this.esconder('mover');
    }
  }

  // --- 2. Pular -----------------------------------------------------------
  passoPular(player, input) {
    if (this.feito.pular || !this.feito.mover) return;

    // Só aparece quando o primeiro vão está à vista — antes disso, pular não
    // resolve nada e a dica seria ruído.
    const perto = player.x > this.primeiroVaoX - TILE * 5;
    if (!perto) return;

    if (!this.dicas.pular) {
      this.criarDica(
        'pular',
        `${this.rotulos.pular}\npular`,
        this.primeiroVaoX - TILE * 2,
        player.y - 190,
      );
    }

    if (input.jumpPressed()) {
      this.feito.pular = true;
      this.esconder('pular');
    }
  }

  // --- 3. Atacar ----------------------------------------------------------
  passoAtacar(player, input) {
    if (this.feito.atacar || !this.feito.mover) return;

    const perto = Math.abs(player.x - this.alvoX) < TILE * 5;
    if (!perto) {
      // Saiu de perto sem atacar: recolhe tudo e espera ele voltar.
      if (this.dicas.atacar) this.esconder('atacar');
      this.apagarDestaque();
      return;
    }

    if (!this.dicas.atacar) {
      this.criarDica(
        'atacar',
        `${this.rotulos.atacar}\natacar`,
        this.alvoX,
        player.y - 210,
      );
      this.acenderDestaque();
    }

    if (input.attackPressed()) {
      this.feito.atacar = true;
      this.esconder('atacar');
      this.apagarDestaque();
    }
  }

  /** Anel pulsante marcando o alvo de treino, para ele não sumir no cenário. */
  acenderDestaque() {
    if (this.destaqueAlvo) return;

    const y = this.scene.groundY - TILE;
    this.destaqueAlvo = this.scene.add
      .ellipse(this.alvoX, y, 120, 150)
      .setStrokeStyle(3, 0xffb84d, 0.85)
      .setDepth(55);

    this.scene.tweens.add({
      targets: this.destaqueAlvo,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  apagarDestaque() {
    if (!this.destaqueAlvo) return;
    this.scene.tweens.killTweensOf(this.destaqueAlvo);
    this.destaqueAlvo.destroy();
    this.destaqueAlvo = null;
  }

  destruir() {
    Object.keys(this.dicas).forEach((id) => this.esconder(id));
    this.apagarDestaque();
  }
}
