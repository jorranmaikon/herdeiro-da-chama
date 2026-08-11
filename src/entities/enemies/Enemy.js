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
// Piscar de dano: vermelho puro, alternado com a cor normal.
const COR_DANO = 0xff3b30;
const FLASH_INTERVALO_MS = 70;
const FLASH_DANO_MS = 280;
const FLASH_MORTE_MS = 420;

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

    // Inimigo de padrão Contato machuca sempre que encosta; um de padrão Golpe
    // Telegrafado só machuca durante o próprio golpe (04_BESTIARIO_MACRO.md,
    // Seção 3). Sem essa distinção o Lobo daria dano só por passar por perto,
    // e o telegraph não teria função nenhuma.
    this.golpeAtivo = cfg.padrao !== 'telegrafado';

    // Limites de patrulha. Vêm de fora porque quem sabe onde o chão acaba é a
    // cena, não o inimigo — sem isso ele patrulha para dentro de um vão e cai.
    this.minX = x;
    this.maxX = x;

    // Inimigo voador não cai: a altura dele é decidida pelo comportamento, não
    // pela gravidade.
    if (cfg.locomocao === 'voar') this.body.setAllowGravity(false);

    this.conferirFolha(scene);
    this.criarAnimacoes(scene);
    this.tocar('idle');
  }

  // Um sprite fatiado na régua errada não gera erro no Phaser: ele só devolve
  // quadros vazios, e o inimigo fica invisível em silêncio. Aqui isso vira uma
  // mensagem clara no console — barato, e evita caçar o problema no escuro.
  conferirFolha(scene) {
    const textura = scene.textures.get(this.cfg.textura);
    const fonte = textura.getSourceImage();
    const esperado = fonte.width / (this.cfg.colunas || 4);

    if (esperado !== this.cfg.celula) {
      console.error(
        `[${this.cfg.textura}] folha de ${fonte.width}px daria célula de `
        + `${esperado}px, mas a configuração diz ${this.cfg.celula}px. `
        + 'O inimigo vai aparecer vazio.',
      );
    }
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
    Object.entries(animacoes).forEach(([nome, { quadros, taxa, repetir = 0 }]) => {
      const chave = `${textura}-${nome}`;
      if (scene.anims.exists(chave)) return;
      scene.anims.create({
        key: chave,
        // Lista explícita em vez de uma linha inteira da folha: a ordem de
        // leitura da arte nem sempre é a ordem da animação, e algumas linhas
        // têm célula vazia no fim.
        frames: quadros.map((frame) => ({ key: textura, frame })),
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

    // Um ataque já iniciado vai até o fim. Sem esta guarda, o jogador cancelava
    // o bote do Lobo apenas saindo do raio de detecção no meio do telegraph —
    // o inimigo virava um bluff e o padrão deixava de ensinar qualquer coisa.
    const ocupado = this.estado === ESTADO.ATACAR || this.estado === ESTADO.RECUPERAR;

    if (!ocupado) {
      if (percebeu && this.estado === ESTADO.IDLE) this.estado = ESTADO.ALERTA;
      if (!percebeu && this.estado !== ESTADO.IDLE) this.estado = ESTADO.IDLE;
    }

    if (this.estado === ESTADO.ALERTA) {
      // Alerta é uma pausa curta antes de agir: dá ao jogador o instante de
      // leitura que o Bestiário exige antes de qualquer ameaça.
      this.proximaAcaoEm = time + this.cfg.esperaAlertaMs;
      this.estado = ESTADO.PERSEGUIR;
    }

    if (this.estado === ESTADO.PERSEGUIR) this.direcao = player.x < this.x ? -1 : 1;

    this.distanciaAoJogador = distancia;
    this.comportamento(time, player);
    if (this.cfg.locomocao !== 'voar') this.limitarPatrulha();
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
    this.piscarVermelho(FLASH_DANO_MS);
    this.tocar('dano', true);
    this.once(`animationcomplete-${this.cfg.textura}-dano`, () => {
      if (this.estado === ESTADO.RECUPERAR) this.estado = ESTADO.IDLE;
    });
  }

  morrer() {
    this.estado = ESTADO.MORTO;

    // O corpo continua ATIVO e sujeito à gravidade. Desligá-lo congelava o
    // inimigo exatamente onde ele estava — e como o Slime passa metade do
    // tempo no ar, o cadáver ficava pendurado sobre o vão até sumir. Era isso
    // que parecia "objeto flutuando" e também "demora para morrer": ele não
    // estava vivo, estava travado no ar.
    //
    // Só a velocidade horizontal zera; a queda continua, e ele morre no chão.
    this.setVelocityX(0);
    this.piscarVermelho(FLASH_MORTE_MS);

    // A cena desfaz os vínculos AGORA, não ao fim da animação: entre a morte e
    // o último quadro passam vários frames, e nesse intervalo o inimigo já não
    // deve participar de colisão nem de golpe.
    this.aoMorrer?.();

    // A animação de morte é reiniciada à força e o destroy é agendado por
    // TEMPO, não pelo evento de fim de animação.
    //
    // Depender do evento deixava o inimigo parado no último quadro por um
    // intervalo imprevisível: se ele morresse no meio de outra animação, o
    // `once` anterior ainda pendurado consumia o evento e o `once` da morte
    // nunca disparava. O resultado parecia um corpo esperando para sumir.
    this.off(`animationcomplete-${this.cfg.textura}-dano`);
    this.anims.stop();
    this.tocar('morte', true);

    const { quadros, taxa } = this.cfg.animacoes.morte;
    this.scene.time.delayedCall((quadros.length / taxa) * 1000, () => this.destroy());
  }

  // Feedback de acerto. Sem ele o golpe some no meio da animação e o jogador
  // não sabe se conectou — especialmente no Lobo, que aguenta três.
  //
  // setTintFill pinta o sprite INTEIRO de vermelho, ignorando a cor original.
  // setTint comum apenas multiplica, e num inimigo já escuro como o Lobo o
  // resultado quase não aparece.
  piscarVermelho(duracao) {
    const alternar = () => {
      if (!this.active) return;
      if (this.isTinted) this.clearTint();
      else this.setTintFill(COR_DANO);
    };

    this.scene.time.addEvent({
      delay: FLASH_INTERVALO_MS,
      repeat: Math.max(0, Math.round(duracao / FLASH_INTERVALO_MS) - 1),
      callback: alternar,
    });
    this.setTintFill(COR_DANO);

    this.scene.time.delayedCall(duracao, () => {
      if (this.active) this.clearTint();
    });
  }

  /** Se o contato com este inimigo causa dano neste instante. */
  get perigoso() {
    return this.vivo && this.golpeAtivo;
  }

  get vivo() {
    return this.estado !== ESTADO.MORTO;
  }
}
