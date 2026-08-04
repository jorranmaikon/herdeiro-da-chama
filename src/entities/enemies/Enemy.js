import Phaser from 'phaser';

// Máquina de estados genérica (04_BESTIARIO_MACRO.md, Seção 2):
// IDLE -> ALERT -> CHASE_OR_PREPARE -> ATTACK -> RECOVER -> (IDLE ou DEAD)
//
// EnemyCommon, EnemyMiniBoss e EnemyBoss estendem esta classe apenas para
// ajustar parâmetros — a FSM em si nunca é duplicada por categoria
// (08_ARQUITETURA_TECNICA.md, Seção 8).
export const EnemyState = Object.freeze({
  IDLE: 'IDLE',
  ALERT: 'ALERT',
  CHASE_OR_PREPARE: 'CHASE_OR_PREPARE',
  ATTACK: 'ATTACK',
  RECOVER: 'RECOVER',
  DEAD: 'DEAD',
});

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = null, config = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = EnemyState.IDLE;
    this.config = config; // vida, dano, padrões de ataque — vem de dados, não de subclasse nova.
  }

  update() {
    switch (this.state) {
      case EnemyState.IDLE:
        this.onIdle();
        break;
      case EnemyState.ALERT:
        this.onAlert();
        break;
      case EnemyState.CHASE_OR_PREPARE:
        this.onChaseOrPrepare();
        break;
      case EnemyState.ATTACK:
        this.onAttack();
        break;
      case EnemyState.RECOVER:
        this.onRecover();
        break;
      default:
        break;
    }
  }

  // TODO: cada hook implementado nas subclasses de categoria (EnemyCommon/MiniBoss/Boss),
  // nunca diretamente numa cena de bioma (regra do 08_ARQUITETURA_TECNICA.md, Seção 5).
  onIdle() {}
  onAlert() {}
  onChaseOrPrepare() {}
  onAttack() {}
  onRecover() {}
}
