import Enemy, { ESTADO } from './Enemy.js';

// Mini-Boss (04_BESTIARIO_MACRO.md, Seções 1 e 5).
//
// Encerra uma sub-seção do bioma, combina padrões já vistos com uma variação
// nova e alterna entre padrões de ataque — é isso que o separa de um Comum,
// não a quantidade de vida.
//
// A máquina de estados continua sendo a da classe-base: esta subclasse só
// escolhe qual padrão executar e conduz cada um.
//
// REGRA DE OURO DESTE CHEFE: ele nunca ataca parado. Todo golpe acontece em
// movimento — avançando a pé, no golpe de pata, ou no ar, no salto. Um chefe
// que trava no lugar para bater vira um poste e erra o alvo.
export default class EnemyMiniBoss extends Enemy {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg);

    this.padraoAtual = null;
    this.ultimoPadrao = null;
    this.jaRugiu = false;
    this.ritmo = 1;          // multiplica os tempos; cai após o rugido
    this.noAr = false;
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

    // Rugido: marco de metade da vida. Interrompe o que estiver fazendo,
    // sinaliza que a luta mudou e acelera os padrões daí em diante.
    if (!this.jaRugiu && this.vida <= this.cfg.vida * this.cfg.rugidoEmVida) {
      this.jaRugiu = true;
      this.ritmo = this.cfg.aceleracaoAposRugido;
      this.estado = ESTADO.RECUPERAR;
      this.proximaAcaoEm = time + this.cfg.duracaoRugidoMs;
      this.setVelocityX(0);
      this.tocar('rugir', true);
      this.aoRugir?.();
      return;
    }

    this.setFlipX(this.direcao < 0);
    this.iniciarPadrao(time);
  }

  // Longe ele salta, perto ele dá a patada. A escolha é por DISTÂNCIA porque
  // alternar cegamente fazia o chefe saltar estando colado e dar patada do
  // outro lado da arena — atacando o vento nos dois casos.
  iniciarPadrao(time) {
    const longe = this.distanciaAoJogador > this.cfg.alcanceSalto;
    this.padraoAtual = longe ? 'salto' : 'garra';
    this.ultimoPadrao = this.padraoAtual;

    this.estado = ESTADO.ATACAR;
    this.faseDoPadrao = 'telegrafo';
    this.setVelocityX(0);

    if (longe) {
      this.tocar('agachar', true);
      this.proximaAcaoEm = time + this.cfg.telegrafoSaltoMs * this.ritmo;
    } else {
      this.tocar('garra', true);
      this.proximaAcaoEm = time + this.cfg.telegrafoGarraMs * this.ritmo;
    }
  }

  conduzirPadrao(time, player) {
    if (this.padraoAtual === 'garra' && this.faseDoPadrao === 'golpe') {
      // Avança enquanto golpeia — o corpo não para.
      this.setVelocityX(this.direcao * this.cfg.velocidadeGarra);
      this.aoGolpearComGarra?.();
    }

    if (this.faseDoPadrao === 'voo') {
      this.conduzirSalto(time);
      return;
    }

    if (time < this.proximaAcaoEm) {
      if (this.faseDoPadrao === 'telegrafo') this.setVelocityX(0);
      return;
    }

    if (this.faseDoPadrao === 'telegrafo') {
      this.faseDoPadrao = this.padraoAtual === 'salto' ? 'voo' : 'golpe';
      this.golpeAtivo = true;

      if (this.padraoAtual === 'salto') this.decolar(player);
      else this.proximaAcaoEm = time + this.cfg.duracaoGarraMs * this.ritmo;
      return;
    }

    this.encerrarPadrao(time);
  }

  decolar(player) {
    // Direção decidida na DECOLAGEM, distância sempre a mesma.
    //
    // Nada de mira preditiva: um salto que persegue não pode ser esquivado por
    // leitura, só por sorte. Com alcance fixo o jogador aprende onde ele vai
    // cair e pode correr por baixo no tempo certo.
    this.direcao = player.x < this.x ? -1 : 1;
    this.setFlipX(this.direcao < 0);

    const tempoDeVoo = (2 * Math.abs(this.cfg.impulsoSalto)) / this.scene.physics.world.gravity.y;
    const velocidade = this.cfg.distanciaSalto / tempoDeVoo;

    this.setVelocity(this.direcao * velocidade, this.cfg.impulsoSalto);
    this.noAr = true;

    // NO AR ele não machuca por encostar. É isso que abre a esquiva por baixo:
    // o corpo passa por cima do jogador sem consequência, e o perigo é só o
    // impacto da aterrissagem, que tem onda de choque e telegraph próprios.
    this.golpeAtivo = false;
    this.tocar('saltar', true);
  }

  // A aterrissagem é detectada pelo CONTATO com o chão, não por temporizador:
  // a altura do terreno varia, e um tempo fixo faria a onda de choque sair no
  // ar ou tarde demais.
  conduzirSalto(time) {
    const tocouChao = this.body.blocked.down || this.body.touching.down;
    if (this.noAr && !tocouChao) return;

    if (this.noAr && tocouChao) {
      this.noAr = false;
      this.setVelocityX(0);
      this.golpeAtivo = true;   // volta a ser perigoso ao tocar o chão
      this.tocar('aterrar', true);
      this.aoAterrar?.();
      this.proximaAcaoEm = time + 220;
      return;
    }

    if (time >= this.proximaAcaoEm) this.encerrarPadrao(time);
  }

  encerrarPadrao(time) {
    this.setVelocityX(0);
    this.golpeAtivo = false;
    this.estado = ESTADO.RECUPERAR;
    this.proximaAcaoEm = time + this.cfg.recuperacaoMs * this.ritmo;
    this.tocar('idle');
  }
}
