import Phaser from 'phaser';
import Enemy, { ESTADO } from './Enemy.js';

// Inimigo Comum (04_BESTIARIO_MACRO.md, Seção 1).
//
// Compõe o fluxo normal de combate e ensina um padrão de ataque simples. Morre
// em poucos golpes do ataque básico — o combate do jogo é ágil, não atritado.
//
// Esta classe não reimplementa a máquina de estados: ela só descreve COMO um
// Comum se move entre os estados que a base já define. Hoje há um único modo de
// locomoção, o pulo curto do Slime; quando entrar um Comum que anda no chão
// (o Lobo, na Fase 2), ele vira outra opção de `locomocao` na configuração de
// dados, não outra classe.
export default class EnemyCommon extends Enemy {
  comportamento(time, player) {
    switch (this.cfg.locomocao) {
      case 'andar': return this.andar(time);
      case 'voar': return this.voar(time, player);
      default: return this.saltar(time);
    }
  }

  // --------------------------------------------------------------------
  // Locomoção por saltos (Slime)
  // --------------------------------------------------------------------
  saltar(time) {
    if (this.estado === ESTADO.RECUPERAR) return;

    const noChao = this.body.blocked.down || this.body.touching.down;
    if (!noChao) return;

    // No chão e entre pulos: freia. Sem isso ele desliza no gelo depois de
    // cada aterrissagem.
    this.setVelocityX(0);

    if (time < this.proximaAcaoEm) {
      this.tocar('idle');
      return;
    }

    this.pular(time);
  }

  // --------------------------------------------------------------------
  // Locomoção a pé, com Golpe Telegrafado (Lobo)
  // --------------------------------------------------------------------
  // O padrão inteiro do 04_BESTIARIO_MACRO.md, Seção 2, aparece aqui:
  // persegue → prepara (telegraph visível) → ataca → recupera. A janela de
  // recuperação é a abertura que o jogador precisa aprender a explorar.
  andar(time) {
    if (this.estado === ESTADO.RECUPERAR) {
      // O bote precisa PERCORRER a distância. Zerar a velocidade já no frame
      // seguinte ao disparo transformava o ataque num passo curto e lento — o
      // Lobo saía andando na direção do jogador em vez de avançar.
      if (time < this.boteAte) return;

      this.setVelocityX(0);
      if (time >= this.proximaAcaoEm) this.estado = ESTADO.IDLE;
      return;
    }

    if (this.estado === ESTADO.ATACAR) {
      // Durante o telegraph ele fica PARADO e recuado. Parar é o que torna a
      // antecipação legível — um inimigo que telegrafa andando não telegrafa.
      if (time < this.proximaAcaoEm) {
        this.setVelocityX(0);
        return;
      }
      this.setVelocityX(this.direcao * this.cfg.velocidadeBote);
      this.tocar('bote', true);
      this.estado = ESTADO.RECUPERAR;
      this.boteAte = time + this.cfg.duracaoBoteMs;
      this.proximaAcaoEm = time + this.cfg.duracaoBoteMs + this.cfg.recuperacaoMs;
      return;
    }

    if (this.estado === ESTADO.PERSEGUIR) {
      if (this.distanciaAoJogador <= this.cfg.alcanceBote) {
        this.estado = ESTADO.ATACAR;
        this.proximaAcaoEm = time + this.cfg.telegrafoMs;
        this.setVelocityX(0);
        this.setFlipX(this.direcao < 0);
        this.tocar('preparar', true);
        return;
      }
      this.setVelocityX(this.direcao * this.cfg.velocidade);
      this.setFlipX(this.direcao < 0);
      this.tocar('correr');
      return;
    }

    // Patrulha: vai e volta devagar dentro do próprio trecho.
    this.setVelocityX(this.direcao * this.cfg.velocidadePatrulha);
    this.setFlipX(this.direcao < 0);
    this.tocar('correr');
  }

  // --------------------------------------------------------------------
  // Voo (Morcego)
  // --------------------------------------------------------------------
  voar(time, player) {
    if (this.estado === ESTADO.RECUPERAR) return;

    if (this.estado === ESTADO.IDLE) {
      // Dorme pendurado até perceber o jogador — o estado inicial dá ao
      // jogador a chance de vê-lo antes de ser atacado.
      this.setVelocity(0, 0);
      this.tocar('pendurado');
      return;
    }

    this.direcao = player.x < this.x ? -1 : 1;
    this.setFlipX(this.direcao < 0);

    // Mira o CORPO do jogador, não um ponto acima dele. Perseguir uma altura
    // deslocada fazia o morcego pairar em cima da cabeça sem nunca encostar,
    // oscilando no lugar — ameaça nenhuma, só ruído na tela.
    const corpo = player.body;
    const onda = Math.sin(time / this.cfg.periodoOndaMs) * this.cfg.amplitudeOnda;
    const alvoY = corpo.center.y + onda;

    // Zona morta horizontal: sem ela, ao alcançar o jogador o morcego troca de
    // direção a cada frame e treme em cima dele.
    const dx = player.x - this.x;
    const vx = Math.abs(dx) < this.cfg.zonaMorta ? 0 : this.direcao * this.cfg.velocidade;

    this.setVelocityX(vx);
    this.setVelocityY(Phaser.Math.Clamp(
      (alvoY - this.y) * 4,
      -this.cfg.velocidade,
      this.cfg.velocidade,
    ));
    this.tocar('voar');
  }

  pular(time) {
    const { velocidade, impulsoPulo, intervaloPuloMs, intervaloPatrulhaMs } = this.cfg;

    // Perseguindo pula mais rápido que patrulhando: a diferença de ritmo é o
    // que comunica ao jogador que ele foi notado, sem precisar de ícone.
    const intervalo = this.estado === ESTADO.PERSEGUIR
      ? intervaloPuloMs
      : intervaloPatrulhaMs;

    this.proximaAcaoEm = time + intervalo;
    this.setVelocity(this.direcao * velocidade, impulsoPulo);
    this.setFlipX(this.direcao < 0);
    this.tocar('pulo', true);
  }
}
