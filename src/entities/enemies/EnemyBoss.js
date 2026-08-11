import Enemy, { ESTADO } from './Enemy.js';

// Boss (04_BESTIARIO_MACRO.md, Seções 1 e 5).
//
// Encerra o bioma. Três ou mais padrões, fases de vida, e conexão com a
// revelação de lore da região. A máquina de estados continua sendo a da
// classe-base; esta subclasse escolhe e conduz os padrões.
//
// Nenhum padrão é inédito no bioma: raízes e impacto são Área (o jogador viu na
// pisada do Urso), a navalhada é Projétil (viu na pedra do Goblin) e o golpe de
// galho é Golpe Telegrafado (viu na patada). O que muda é a combinação.
//
// A SEGUNDA FASE não traz padrão novo — é regra do Bestiário. Ela encurta os
// tempos e encadeia raízes com navalhada.
export default class EnemyBoss extends Enemy {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg);

    this.fase = 1;
    this.ritmo = 1;
    this.padraoAtual = null;
    this.ordem = 0;
    this.enterrado = false;
  }

  get tempos() {
    return this.fase === 2 ? this.cfg.fase2 : this.cfg.fase1;
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
      this.tocarParado();
      return;
    }

    this.setFlipX(this.direcao < 0);
    this.iniciarPadrao(time, player);
  }

  tocarParado() {
    this.tocar(this.fase === 2 ? 'enfraquecido' : 'idle');
  }

  // --------------------------------------------------------------------
  // Escolha de padrão
  // --------------------------------------------------------------------
  // Ciclo fixo em vez de sorteio. Um chefe com quatro ataques sorteados vira
  // ruído: o jogador não consegue montar expectativa e a luta parece injusta.
  // Com ordem fixa ele aprende a sequência, e a dificuldade passa a estar em
  // executar a resposta certa, não em adivinhar.
  //
  // A distância ainda manda em um caso: colado, o golpe de galho substitui o
  // que viria — não faz sentido invocar raízes com o jogador em cima.
  iniciarPadrao(time, player) {
    const colado = this.distanciaAoJogador < this.cfg.alcanceGalho;
    const ciclo = this.tempos.ciclo;

    this.padraoAtual = colado ? 'galho' : ciclo[this.ordem % ciclo.length];
    if (!colado) this.ordem += 1;

    this.estado = ESTADO.ATACAR;
    this.faseDoPadrao = 'telegrafo';
    this.setVelocityX(0);

    const animacoes = {
      raizes: 'raizes', navalhada: 'navalhada', galho: 'galho', mergulho: 'afundar',
    };
    this.tocar(animacoes[this.padraoAtual], true);
    this.proximaAcaoEm = time + this.tempos.telegrafo[this.padraoAtual] * this.ritmo;

    if (this.padraoAtual === 'mergulho') this.aoAfundar?.(player);
  }

  conduzirPadrao(time, player) {
    if (this.padraoAtual === 'galho' && this.faseDoPadrao === 'golpe') {
      this.aoGolpearComGalho?.();
    }

    if (this.faseDoPadrao === 'mergulhado') {
      this.conduzirMergulho(time, player);
      return;
    }

    if (time < this.proximaAcaoEm) {
      if (this.faseDoPadrao === 'telegrafo') this.setVelocityX(0);
      return;
    }

    if (this.faseDoPadrao === 'telegrafo') {
      this.golpeAtivo = this.padraoAtual === 'galho';
      this.faseDoPadrao = 'golpe';

      switch (this.padraoAtual) {
        case 'raizes':
          this.aoChamarRaizes?.();
          break;
        case 'navalhada':
          this.aoLancarFolhas?.(this.direcao);
          break;
        case 'mergulho':
          // Some do mundo: nem colide, nem é visível, nem pode levar dano.
          this.enterrado = true;
          this.setVisible(false);
          this.body.enable = false;
          this.faseDoPadrao = 'mergulhado';
          this.proximaAcaoEm = time + this.tempos.perseguicaoMs * this.ritmo;
          return;
        default:
          break;
      }

      this.proximaAcaoEm = time + this.tempos.duracao[this.padraoAtual] * this.ritmo;
      return;
    }

    this.encerrarPadrao(time);
  }

  // A sombra corre pelo chão enquanto ele está enterrado. Quando o tempo acaba,
  // ele despenca onde a sombra parou — não onde o jogador está AGORA. É isso
  // que torna o ataque esquivável correndo: a sombra é lenta o bastante para se
  // fugir dela, e é ela que decide o ponto de queda.
  conduzirMergulho(time) {
    if (time < this.proximaAcaoEm) {
      this.aoMoverSombra?.();
      return;
    }

    const alvo = this.aoEmergir?.();
    this.enterrado = false;
    this.setVisible(true);
    this.body.enable = true;

    if (alvo !== undefined) {
      this.x = alvo;
      this.y = this.scene.groundTopAt(Math.floor(alvo / 64)) - this.cfg.alturaQueda;
    }

    this.setVelocity(0, 0);
    this.golpeAtivo = false;
    this.faseDoPadrao = 'caindo';
    this.tocar('despencar', true);
  }

  atualizar(player, time) {
    super.atualizar(player, time);

    // Aterrissagem do mergulho, detectada pelo CONTATO com o chão. Tempo fixo
    // erraria: a altura de queda muda conforme onde a sombra parou.
    if (this.faseDoPadrao !== 'caindo' || !this.body) return;
    if (!(this.body.blocked.down || this.body.touching.down)) return;

    this.faseDoPadrao = 'golpe';
    this.aoImpactar?.();
    this.encerrarPadrao(time);
  }

  encerrarPadrao(time) {
    this.setVelocityX(0);
    this.golpeAtivo = false;
    this.estado = ESTADO.RECUPERAR;
    this.proximaAcaoEm = time + this.tempos.recuperacaoMs * this.ritmo;
    this.tocarParado();
  }

  // --------------------------------------------------------------------
  // Fases de vida
  // --------------------------------------------------------------------
  levarDano(quantidade = 1) {
    // Enterrado ele não pode ser atingido — está fora do mundo.
    if (this.enterrado) return;

    super.levarDano(quantidade);

    if (this.fase === 1 && this.vivo && this.vida <= this.cfg.vida * this.cfg.viradaEmVida) {
      this.virarFase();
    }
  }

  virarFase() {
    this.fase = 2;
    this.ritmo = this.cfg.aceleracaoFase2;

    // A virada interrompe o que estiver acontecendo e dá um respiro: é o marco
    // que comunica ao jogador que a luta mudou, e sem a pausa ele não percebe.
    this.estado = ESTADO.RECUPERAR;
    this.proximaAcaoEm = this.scene.time.now + this.cfg.duracaoViradaMs;
    this.setVelocity(0, 0);
    this.golpeAtivo = false;
    this.tocar('virada', true);
    this.aoVirarFase?.();
  }
}
