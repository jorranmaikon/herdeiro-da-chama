import Phaser from 'phaser';

// NPC do mundo (06_INTERFACE_UX.md, Seção 4).
// O sprite de corpo inteiro vive na cena; o retrato só aparece na caixa de diálogo.
export default class NPC extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {object} config
   *   textureKey  - spritesheet de corpo inteiro (4 frames de idle)
   *   portraitKey - textura do retrato usado no diálogo
   *   name        - nome exibido na caixa de diálogo
   *   lines       - array de falas
   */
  constructor(scene, x, y, config) {
    super(scene, x, y, config.textureKey, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // corpo estático — NPC não cai nem é empurrado

    this.npcName = config.name;
    this.portraitKey = config.portraitKey;
    this.lines = config.lines ?? [];
    this.interactRadius = config.interactRadius ?? 110;

    this.body.setSize(60, 130);
    this.body.setOffset((96 - 60) / 2, 160 - 130);
    // Corpo estático exige refreshBody() após alterar tamanho/offset.
    this.body.updateFromGameObject();

    this.createIdleAnimation(scene, config.textureKey);
    this.play(`${config.textureKey}-idle`);

    // Indicador de interação — só aparece quando o jogador está perto.
    this.prompt = scene.add
      .text(x, y - 110, 'E', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffe9b0',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  createIdleAnimation(scene, key) {
    const animKey = `${key}-idle`;
    if (scene.anims.exists(animKey)) return;

    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
  }

  isPlayerInRange(player) {
    return Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= this.interactRadius;
  }

  setPromptVisible(visible) {
    this.prompt.setVisible(visible);
  }
}
