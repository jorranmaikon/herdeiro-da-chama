import Phaser from 'phaser';

// Controles básicos + física (03_GAMEPLAY_MACRO.md, Seções 1 e 2).
// TODO: coyote time, jump buffer, ataque com hitbox, i-frames, integração com AbilityManager.
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = null) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  update() {
    // TODO: movimento horizontal com aceleração leve, pulo com curva de gravidade ajustável.
  }
}
