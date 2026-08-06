import Phaser from 'phaser';
import {
  NPC_SPRITE_CELL_WIDTH,
  NPC_SPRITE_CELL_HEIGHT,
  GROUND_VISUAL_OFFSET,
} from '../../config/gameConfig.js';

// NPC do mundo (06_INTERFACE_UX.md, Seção 4).
// O sprite de corpo inteiro vive na cena; o retrato só aparece na caixa de diálogo.
export default class NPC extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {object} config
   *   textureKey  - spritesheet de corpo inteiro
   *   frameCount  - quantos frames de idle o sheet tem
   *   portraitKey - textura do retrato usado no diálogo
   *   name        - nome exibido na caixa de diálogo
   *   lines       - array de falas
   */
  constructor(scene, x, y, config) {
    super(scene, x, y, config.textureKey, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // estático — NPC não cai nem é empurrado

    this.npcName = config.name;
    this.portraitKey = config.portraitKey;
    this.lines = config.lines ?? [];
    this.interactRadius = config.interactRadius ?? 110;

    const bodyW = 52;
    const bodyH = 112;
    this.body.setSize(bodyW, bodyH);
    this.body.setOffset(
      (NPC_SPRITE_CELL_WIDTH - bodyW) / 2,
      NPC_SPRITE_CELL_HEIGHT - bodyH - GROUND_VISUAL_OFFSET,
    );
    this.body.updateFromGameObject();

    this.createIdleAnimation(scene, config.textureKey, config.frameCount ?? 2);
    this.play(`${config.textureKey}-idle`);

    // Indicador de interação — só aparece quando o jogador está perto.
    this.prompt = scene.add
      .text(x, y - 102, 'E', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffe9b0',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  createIdleAnimation(scene, key, frameCount) {
    const animKey = `${key}-idle`;
    if (scene.anims.exists(animKey)) return;

    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: frameCount - 1 }),
      // Respiração lenta — antes parecia que o NPC estava ofegante.
      frameRate: 1.2,
      repeat: -1,
      yoyo: true,
    });
  }

  // Vira pro lado onde o jogador está — dá um mínimo de vida ao NPC.
  facePlayer(player) {
    this.setFlipX(player.x < this.x);
  }

  isPlayerInRange(player) {
    return Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= this.interactRadius;
  }

  setPromptVisible(visible) {
    this.prompt.setVisible(visible);
  }
}
