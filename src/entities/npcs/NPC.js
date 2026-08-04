import Phaser from 'phaser';

// NPC interativo genérico — abre DialogueOverlay ao interagir
// (03_GAMEPLAY_MACRO.md, Seção 6 / 06_INTERFACE_UX.md, Seção 4).
export default class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = null, config = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.dialogueId = config.dialogueId ?? null;
    this.portraitKey = config.portraitKey ?? null;
  }

  interact() {
    // TODO: disparar DialogueOverlay com este NPC como falante.
  }
}
