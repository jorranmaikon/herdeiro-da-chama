import Enemy, { ESTADO } from './Enemy.js';

// Mini-Boss (04_BESTIARIO_MACRO.md, Seções 1 e 5).
//
// Encerra uma sub-seção do bioma. Combina padrões já vistos com uma variação
// nova, e alterna entre DOIS padrões de ataque — é isso que o separa de um
// Comum, não a quantidade de vida.
//
// A máquina de estados continua sendo a da classe-base: esta subclasse só
// escolhe qual padrão executar e conduz cada um. Nenhum mini-boss futuro
// precisa de classe nova — muda a configuração de dados.
export default class EnemyMiniBoss extends Enemy {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg);

    this.padraoAtual = null;
    this.ultimoPadrao = null;
  }

  comportamento(time, player) {
    if (this.estado === ESTADO.RECUPERAR) {
      this.setVelocityX(0);
      if (time >= this.proximaAcaoEm) {
        this.golpeAtivo = false;
        this.estado = ESTADO.IDLE;
        this.padraoAtual = null;
      }
      return;
    }

    if (this.estado === ESTADO.ATACAR) {
      this.conduzirPadrao(time, player);
      return;
    }

    if (this.estado !== ESTADO.PERSEGUIR) {
      this.setVelocityX(0);
      this.tocar('idle');
      return;
    }

    // Perseguindo: anda até a distância de ataque e escolhe um padrão.
    this.setFlipX(this.direcao < 0);

    if (this.distanciaAoJogador > this.cfg.alcanceAtaque) {
      this.setVelocityX(this.direcao * this.cfg.velocidade);
      this.tocar('andar');
      return;
    }

    this.iniciarPadrao(time);
  }

  // Alterna os padrões em vez de sortear.
  //
  // Sorteio puro repete o mesmo ataque três vezes seguidas com frequência
  // incômoda, e o jogador não consegue aprender a leitura — a alternância
  // garante que os dois apareçam e mantém a luta legível.
  iniciarPadrao(time) {
    const proximo = this.ultimoPadrao === 'investida' ? 'pisada' : 'investida';
    this.padraoAtual = proximo;
    this.ultimoPadrao = proximo;

    this.estado = ESTADO.ATACAR;
    this.setVelocityX(0);
    this.tocar(proximo === 'investida' ? 'preparar' : 'erguer', true);
    this.proximaAcaoEm = time + this.cfg[
      proximo === 'investida' ? 'telegrafoInvestidaMs' : 'telegrafoPisadaMs'
    ];
    this.faseDoPadrao = 'telegrafo';
  }

  conduzirPadrao(time, player) {
    if (time < this.proximaAcaoEm) {
      // Telegraph: parado. Um ataque telegrafado em movimento não telegrafa.
      this.setVelocityX(0);
      return;
    }

    if (this.faseDoPadrao === 'telegrafo') {
      this.faseDoPadrao = 'golpe';
      this.golpeAtivo = true;

      if (this.padraoAtual === 'investida') {
        // A investida é a única que se desloca: é a versão maior e mais lenta
        // da investida do Lobo, e o jogador já sabe lê-la.
        this.direcao = player.x < this.x ? -1 : 1;
        this.setFlipX(this.direcao < 0);
        this.setVelocityX(this.direcao * this.cfg.velocidadeInvestida);
        this.tocar('investir', true);
        this.proximaAcaoEm = time + this.cfg.duracaoInvestidaMs;
      } else {
        // A pisada acontece no lugar e bate em ÁREA ao redor.
        this.setVelocityX(0);
        this.tocar('pisar', true);
        this.proximaAcaoEm = time + this.cfg.duracaoPisadaMs;
        this.aoPisar?.();
      }
      return;
    }

    this.setVelocityX(0);
    this.golpeAtivo = false;
    this.estado = ESTADO.RECUPERAR;
    this.proximaAcaoEm = time + this.cfg.recuperacaoMs;
    this.tocar('idle');
  }
}
