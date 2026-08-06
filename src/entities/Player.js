import Phaser from 'phaser';
import {
  PLAYER_TUNING,
  PHYSICS_CONFIG,
  SPRITE_CELL_WIDTH,
  SPRITE_CELL_HEIGHT,
  GROUND_VISUAL_OFFSET,
} from '../config/gameConfig.js';

// Protagonista (03_GAMEPLAY_MACRO.md, Seções 1-3).
// Spritesheet 'protagonista' — 80x132 por célula, 4 colunas:
//   linha 0 = Idle | 1 = Correr | 2 = Pular/Cair | 3 = Ataque | 4 = Morte
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'protagonista', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Hurtbox menor que o sprite visual (03_GAMEPLAY_MACRO.md, Seção 3).
    // A base do corpo fica ACIMA da base do sprite: assim os pés afundam na grama
    // em vez de parecerem flutuando sobre ela.
    const bodyW = 22;
    const bodyH = 46;
    this.body.setSize(bodyW, bodyH);
    this.body.setOffset(
      (SPRITE_CELL_WIDTH - bodyW) / 2,
      SPRITE_CELL_HEIGHT - bodyH - GROUND_VISUAL_OFFSET,
    );
    this.setCollideWorldBounds(true);

    this.facing = 1;
    this.isAttacking = false;
    this.lastGroundedAt = 0;
    this.jumpBufferedAt = -9999;

    this.createAnimations(scene);
    this.play('player-idle');
  }

  createAnimations(scene) {
    const defs = [
      // Idle lento de propósito — versão anterior parecia ofegante.
      { key: 'player-idle', row: 0, frames: 4, rate: 2.5, repeat: -1 },
      { key: 'player-run', row: 1, frames: 4, rate: 11, repeat: -1 },
      { key: 'player-jump', row: 2, frames: 4, rate: 8, repeat: 0 },
      { key: 'player-attack', row: 3, frames: 4, rate: 13, repeat: 0 },
      { key: 'player-death', row: 4, frames: 4, rate: 7, repeat: 0 },
      // TODO: 'player-hit' não existe no personagem redesenhado (o novo set não
      // incluiu animação de dano). Por ora reaproveita o Idle como reação —
      // trocar assim que a animação de Hit for gerada no novo estilo.
    ];

    defs.forEach(({ key, row, frames, rate, repeat }) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers('protagonista', {
          start: row * 4,
          end: row * 4 + frames - 1,
        }),
        frameRate: rate,
        repeat,
      });
    });
  }

  update(input, time) {
    if (!this.body) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) this.lastGroundedAt = time;

    this.handleHorizontal(input, onGround);
    this.handleJump(input, time, onGround);
    this.applyFallGravity();
    this.updateAnimation(onGround);
  }

  handleHorizontal(input, onGround) {
    // Durante o ataque o jogador fica ancorado — ataque curto, sem deslizar.
    if (this.isAttacking && onGround) {
      this.setAccelerationX(0);
      this.setVelocityX(0);
      return;
    }

    const { acceleration, drag, maxSpeed } = PLAYER_TUNING;

    if (input.left) {
      this.setAccelerationX(-acceleration);
      this.facing = -1;
      this.setFlipX(true);
    } else if (input.right) {
      this.setAccelerationX(acceleration);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      this.setAccelerationX(0);
      this.setDragX(drag);
    }

    this.body.maxVelocity.x = maxSpeed;
  }

  handleJump(input, time, onGround) {
    const { jumpVelocity, coyoteTimeMs, jumpBufferMs, variableJumpCut } = PLAYER_TUNING;

    if (input.jumpJustPressed()) this.jumpBufferedAt = time;

    const withinCoyote = time - this.lastGroundedAt <= coyoteTimeMs;
    const withinBuffer = time - this.jumpBufferedAt <= jumpBufferMs;

    if (withinBuffer && withinCoyote && !this.isAttacking) {
      this.setVelocityY(jumpVelocity);
      this.jumpBufferedAt = -9999;
      this.lastGroundedAt = -9999;
      this.play('player-jump', true);
    }

    // Pulo variável: soltar o botão cedo encurta a subida.
    if (!input.jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * variableJumpCut);
    }
  }

  applyFallGravity() {
    // Queda mais pesada que a subida (03_GAMEPLAY_MACRO.md, Seção 2).
    const baseGravity = PHYSICS_CONFIG.arcade.gravity.y;
    const extra = PLAYER_TUNING.fallGravityMultiplier - 1;
    this.body.setGravityY(this.body.velocity.y > 0 ? baseGravity * extra : 0);
  }

  attack() {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.play('player-attack', true);
    this.once('animationcomplete-player-attack', () => {
      this.isAttacking = false;
    });
  }

  // Reposiciona o jogador após queda em vão (chamado pela cena).
  respawnAt(x, y) {
    this.isAttacking = false;
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    this.setPosition(x, y);
    this.play('player-idle', true);
  }

  updateAnimation(onGround) {
    if (this.isAttacking) return;

    if (!onGround) {
      if (this.anims.currentAnim?.key !== 'player-jump') {
        this.play('player-jump', true);
      }
      return;
    }

    const moving = Math.abs(this.body.velocity.x) > 20;
    const next = moving ? 'player-run' : 'player-idle';
    if (this.anims.currentAnim?.key !== next) this.play(next, true);
  }
}
