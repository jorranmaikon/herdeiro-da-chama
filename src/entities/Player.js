import Phaser from 'phaser';
import { PLAYER_TUNING, GRAVITY, PLAYER_CELL, GROUND_INSET } from '../config/gameConfig.js';

// Protagonista (03_GAMEPLAY_MACRO.md, Seções 1-3).
// Spritesheet 'protagonista' — células de 160x160, 4 colunas:
//   linha 0 = Idle | 1 = Correr | 2 = Pular/Cair | 3 = Ataque | 4 = Morte
//
// O sprite é desenhado em escala 1.0 — a célula já tem o tamanho de exibição.

// Invencibilidade após levar dano, com piscar visual (03_GAMEPLAY_MACRO.md,
// Seção 3). Longa o bastante para sair de cima de um perigo de cenário sem
// tomar um segundo golpe pelo mesmo contato.
const IFRAME_MS = 900;

// Knockback leve. O empurrão vertical é pequeno e serve para tirar o jogador
// do contato — não para arremessá-lo, que faria um perigo jogar dentro de
// outro.
const KNOCKBACK_X = 260;
const KNOCKBACK_Y = -320;

// Janela em que o input horizontal é ignorado depois de um empurrão forte.
const EMPURRAO_SEM_CONTROLE_MS = 260;
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'protagonista', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Hurtbox menor que o sprite (03_GAMEPLAY_MACRO.md, Seção 3).
    // A base do corpo fica ACIMA da base da célula: os pés afundam GROUND_INSET
    // px na grama em vez de parecerem flutuando sobre ela.
    const bodyW = 46;
    const bodyH = 104;
    this.body.setSize(bodyW, bodyH);
    this.body.setOffset((PLAYER_CELL - bodyW) / 2, PLAYER_CELL - bodyH - GROUND_INSET);
    this.setCollideWorldBounds(true);

    this.isAttacking = false;
    this.isDead = false;
    this.invulnerable = false;
    this.semControleAte = 0;
    this.lastGroundedAt = 0;
    this.jumpBufferedAt = -9999;

    this.createAnimations(scene);
    this.play('player-idle');
  }

  createAnimations(scene) {
    const defs = [
      { key: 'player-idle', row: 0, rate: 3, repeat: -1 },
      { key: 'player-run', row: 1, rate: 11, repeat: -1 },
      { key: 'player-jump', row: 2, rate: 8, repeat: 0 },
      { key: 'player-attack', row: 3, rate: 14, repeat: 0 },
      { key: 'player-death', row: 4, rate: 7, repeat: 0 },
    ];

    defs.forEach(({ key, row, rate, repeat }) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers('protagonista', {
          start: row * 4,
          end: row * 4 + 3,
        }),
        frameRate: rate,
        repeat,
      });
    });
  }

  update(input, time) {
    if (!this.body || this.isDead) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) this.lastGroundedAt = time;

    this.moveHorizontal(input, onGround);
    this.handleJump(input, time);
    this.applyFallGravity();

    if (input.attackPressed()) this.attack();

    this.updateAnimation(onGround);
  }

  moveHorizontal(input, onGround) {
    // Arremessado por um golpe pesado: nem input nem atrito agem por um
    // instante. É o que faz o empurrão de fato afastar, em vez de morrer em
    // dois frames de fricção do chão.
    if (this.scene.time.now < this.semControleAte) {
      this.setAccelerationX(0);
      this.setDragX(0);
      return;
    }
    this.setDragX(PLAYER_TUNING.drag);

    // Ataque ancora o jogador no chão — golpe curto, sem deslizar.
    if (this.isAttacking && onGround) {
      this.setAccelerationX(0);
      this.setVelocityX(0);
      return;
    }

    const { acceleration, drag, maxSpeed } = PLAYER_TUNING;

    if (input.left) {
      this.setAccelerationX(-acceleration);
      this.setFlipX(true);
    } else if (input.right) {
      this.setAccelerationX(acceleration);
      this.setFlipX(false);
    } else {
      this.setAccelerationX(0);
      this.setDragX(drag);
    }

    this.body.maxVelocity.x = maxSpeed;
  }

  handleJump(input, time) {
    const { jumpVelocity, coyoteTimeMs, jumpBufferMs, variableJumpCut } = PLAYER_TUNING;

    if (input.jumpPressed()) this.jumpBufferedAt = time;

    const canCoyote = time - this.lastGroundedAt <= coyoteTimeMs;
    const buffered = time - this.jumpBufferedAt <= jumpBufferMs;

    if (buffered && canCoyote && !this.isAttacking) {
      this.setVelocityY(jumpVelocity);
      this.jumpBufferedAt = -9999;
      this.lastGroundedAt = -9999;
      this.play('player-jump', true);
    }

    // Soltar o botão cedo encurta o pulo.
    if (!input.jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * variableJumpCut);
    }
  }

  applyFallGravity() {
    const extra = PLAYER_TUNING.fallGravityMultiplier - 1;
    this.body.setGravityY(this.body.velocity.y > 0 ? GRAVITY * extra : 0);
  }

  attack() {
    if (this.isAttacking) return;
    this.isAttacking = true;
    this.play('player-attack', true);
    this.once('animationcomplete-player-attack', () => {
      this.isAttacking = false;
    });
  }

  // Dano recebido (03_GAMEPLAY_MACRO.md, Seção 3): i-frames com piscar visual
  // e knockback leve. Serve tanto para inimigos quanto para perigo de cenário.
  //
  // NÃO existe controle de vida aqui ainda: o sistema de unidades de vida
  // pertence ao 05_BALANCEAMENTO.md e à HUD, que ainda não foram implementados.
  // Enquanto isso, quem chama recebe o gancho `onDamage` para contabilizar.
  // Perigo de cenário nunca mata (Seção 3.1), então este método jamais leva à
  // morte por conta própria.
  //
  // @param {number} direcao -1 empurra para a esquerda, +1 para a direita
  // @param {number} forca   multiplicador do empurrão (1 = padrão)
  //
  // A força existe para chefes. Um inimigo lento e pesado precisa AFASTAR o
  // jogador ao acertar, senão dá para ficar colado trocando golpes e vencer
  // no braço — o empurrão é o que devolve a distância e obriga a reaproximar,
  // que é onde o padrão de ataque volta a valer.
  hurt(direcao = 1, forca = 1) {
    if (this.isDead || this.invulnerable) return;
    this.invulnerable = true;

    this.setVelocity(direcao * KNOCKBACK_X * forca, KNOCKBACK_Y * (forca > 1 ? 1.15 : 1));

    // Durante um empurrão forte o controle fica suspenso por um instante.
    //
    // Sem isso o atrito do chão come quase todo o recuo em poucos frames — o
    // jogador voltava menos de dois tiles e continuava colado. Com a suspensão
    // ele é de fato arremessado, e o custo de levar dano passa a ser também o
    // caminho de volta.
    if (forca > 1.5) {
      this.semControleAte = this.scene.time.now + EMPURRAO_SEM_CONTROLE_MS;
    }

    const piscar = this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 90,
      yoyo: true,
      repeat: -1,
    });

    this.scene.time.delayedCall(IFRAME_MS, () => {
      piscar.stop();
      this.setAlpha(1);
      this.invulnerable = false;
    });

    this.onDamage?.(1);
  }

  /** Toca a animação de morte e avisa quando terminar. */
  die(onComplete) {
    if (this.isDead) return;
    this.isDead = true;
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    this.body.enable = false;
    this.play('player-death', true);
    this.once('animationcomplete-player-death', () => onComplete?.());
  }

  respawnAt(x, y) {
    this.isDead = false;
    this.isAttacking = false;
    this.invulnerable = false;
    this.semControleAte = 0;
    this.setAlpha(1);
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    this.setPosition(x, y);
    this.body.enable = true;
    this.setVisible(true);
    this.play('player-idle', true);
  }

  updateAnimation(onGround) {
    if (this.isAttacking) return;

    if (!onGround) {
      if (this.anims.currentAnim?.key !== 'player-jump') this.play('player-jump', true);
      return;
    }

    const moving = Math.abs(this.body.velocity.x) > 20;
    const next = moving ? 'player-run' : 'player-idle';
    if (this.anims.currentAnim?.key !== next) this.play(next, true);
  }
}
