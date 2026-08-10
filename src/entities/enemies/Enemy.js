import Phaser from 'phaser';

// Classe-base de todo inimigo do jogo (04_BESTIARIO_MACRO.md, Seção 2).
//
// Implementa a máquina de estados genérica:
//
//   IDLE → ALERTA → PERSEGUIR → ATACAR → RECUPERAR → (IDLE ou MORTO)
//
// As subclasses de categoria (Comum, Guardião de Área, Mini-Boss, Boss) ajustam
// PARÂMETROS — nunca reimplementam a máquina. Um inimigo específico, como o
// Slime, é uma configuração de dados aplicada sobre uma dessas subclasses, não
// uma classe nova.
//
// Nem todo inimigo passa por todos os estados. Um de padrão Contato
// (04_BESTIARIO_MACRO.md, Seção 3) não tem ATACAR separado de PERSEGUIR: o
// dano acontece no encostar. Estados não usados simplesmente não são visitados.
export const ESTADO = {
  IDLE: 'idle',
  ALERTA: 'alerta',
  PERSEGUIR: 'perseguir',
  ATACAR: 'atacar',
  RECUPERAR: 'recuperar',
  MORTO: 'morto',
};

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x  centro horizontal, em px de mundo
   * @param {number} y  base do sprite (o pé), em px de mundo
   * @param {object} cfg configuração de dados do inimigo
   */
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg.textura, 0);
    this.cfg = cfg;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);

    // Hitbox menor que a célula, ancorada na base. A mesma folga que o
    // jogador tem (03_GAMEPLAY_MACRO.md, Seção 3) vale aqui: encostar de
    // raspão na borda do sprite não deve contar como contato.
    const { corpoW, corpoH, celula } = cfg;
    this.body.setSize(corpoW, corpoH);
    this.body.setOffset((celula - corpoW) / 2, celula - corpoH);

    this.estado = ESTADO.IDLE;
    this.vida = cfg.vida;
    this.direcao = -1;
    this.proximaAcaoEm = 0;

    // Limites de patrulha. Vêm de fora porque quem sabe onde o chão acaba é a
    // cena, não o inimigo — sem isso ele patrulha para dentro de um vão e cai.
    this.minX = x;
    this.maxX = x;

    this.criarAnimacoes(scene);
    this.tocar('idle');
  }

  /** Define o trecho em que o inimigo pode andar. */
  patrulharEntre(minX, maxX) {
    this.minX = minX;
    this.maxX = maxX;
    return this;
  }

  // As animações são globais do jogo, não da instância: criar uma vez por
  // textura evita recriar a cada inimigo que nasce.
  criarAnimacoes(scene) {
    const { textura, animacoes } = this.cfg;
    Object.entries(animacoes).forEach(([nome, { linha, taxa, repetir = 0 }]) => {
      const chave = `${textura}-${nome}`;
      if (scene.anims.exists(chave)) return;
      scene.anims.create({
        key: chave,
        frames: scene.anims.generateFrameNumbers(textura, {
          start: linha * 4,
          end: linha * 4 + 3,
        }),
        frameRate: taxa,
        repeat: repetir,
      });
    });
  }

  tocar(nome, forcar = false) {
    this.play(`${this.cfg.textura}-${nome}`, !forcar);
  }

  // --------------------------------------------------------------------
  // Ciclo
  // --------------------------------------------------------------------
  atualizar(player, time) {
    if (this.estado === ESTADO.MORTO || !this.body) return;

    const distancia = Math.abs(player.x - this.x);
    const percebeu = !player.isDead && distancia <= this.cfg.alcanceDeteccao;

    if (percebeu && this.estado === ESTADO.IDLE) this.estado = ESTADO.ALERTA;
    if (!percebeu && this.estado !== ESTADO.IDLE) this.estado = ESTADO.IDLE;

    if (this.estado === ESTADO.ALERTA) {
      // Alerta é uma pausa curta antes de agir: dá ao jogador o instante de
      // leitura que o Bestiário exige antes de qualquer ameaça.
      this.proximaAcaoEm = time + this.cfg.esperaAlertaMs;
      this.estado = ESTADO.PERSEGUIR;
    }

    if (this.estado === ESTADO.PERSEGUIR) this.direcao = player.x < this.x ? -1 : 1;

    this.comportamento(time);
    this.limitarPatrulha();
  }

  /** Comportamento próprio da categoria/inimigo. */
  comportamento() {}

  // Inverte a direção ao alcançar a borda do trecho, e nunca deixa o corpo
  // ultrapassá-la — é o que impede o inimigo de cair num vão do cenário.
  limitarPatrulha() {
    if (this.x <= this.minX) {
      this.x = this.minX;
      this.direcao = 1;
    } else if (this.x >= this.maxX) {
      this.x = this.maxX;
      this.direcao = -1;
    }
  }

  // --------------------------------------------------------------------
  // Dano
  // --------------------------------------------------------------------
  levarDano(quantidade = 1) {
    if (this.estado === ESTADO.MORTO) return;

    this.vida -= quantidade;
    if (this.vida <= 0) {
      this.morrer();
      return;
    }

    this.estado = ESTADO.RECUPERAR;
    this.setVelocityX(-this.direcao * this.cfg.knockback);
    this.tocar('dano', true);
    this.once(`animationcomplete-${this.cfg.textura}-dano`, () => {
      if (this.estado === ESTADO.RECUPERAR) this.estado = ESTADO.IDLE;
    });
  }

  morrer() {
    this.estado = ESTADO.MORTO;
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.tocar('morte', true);
    this.once(`animationcomplete-${this.cfg.textura}-morte`, () => {
      this.aoMorrer?.();
      this.destroy();
    });
  }

  get vivo() {
    return this.estado !== ESTADO.MORTO;
  }
}
