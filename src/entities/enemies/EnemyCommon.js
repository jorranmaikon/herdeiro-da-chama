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
  comportamento(time) {
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
