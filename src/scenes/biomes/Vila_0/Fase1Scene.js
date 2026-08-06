import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TILE,
  GROUND_INSET,
  SKY_COLOR,
} from '../../../config/gameConfig.js';
import Player from '../../../entities/Player.js';
import InputManager from '../../../managers/InputManager.js';
import {
  TILES_WIDE,
  GROUND_ROW,
  GROUND_SEGMENTS,
  PLATFORMS,
  CHECKPOINTS,
  PROPS,
  FENCES,
  SPAWN_TILE,
  EXIT_TILE,
} from './fase1Layout.js';

// Fase 1 da Vila Inicial — "Despertar".
// Progressão linear: o jogador sempre avança para a direita.
export default class Fase1Scene extends Phaser.Scene {
  constructor() {
    super('Fase1Scene');
  }

  create() {
    const worldWidth = TILES_WIDE * TILE;

    // A altura do mundo é igual à da câmera de propósito: assim a câmera nunca
    // rola na vertical e o cenário não "pula" junto com o jogador.
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, worldWidth, GAME_HEIGHT);

    this.groundY = GROUND_ROW * TILE;
    this.deathY = this.groundY + TILE; // abaixo disto, a queda é fatal
    this.morrendo = false;
    this.saiu = false;

    this.controls = new InputManager(this);

    this.createParallax();
    this.createProps();
    this.createTerrain();
    this.createPlayer();
    this.createCheckpoints();
    this.createExit();
    this.createHints();

    this.physics.add.collider(this.player, this.solids);

    // Segue apenas o eixo X (lerpY = 0) — o nível é plano.
    this.cameras.main.startFollow(this.player, true, 0.12, 0);

    this.game.audio.play(this, 'mus_fase');
    this.game.audio.createToggle(this);

    this.cameras.main.fadeIn(600);
  }

  createParallax() {
    // Fundo sólido atrás de tudo: cobre a área acima das texturas sem emenda.
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, SKY_COLOR)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-110);

    // Linha de base de cada camada. Quanto mais distante, mais ALTA no
    // horizonte. A base das árvores fica abaixo do chão de propósito: o
    // tileset cobre o excesso e elas não parecem flutuar.
    const layers = [
      { key: 'bg_ceu', base: 430, factor: 0.05, depth: -100 },
      { key: 'bg_colinas', base: 545, factor: 0.25, depth: -90 },
      { key: 'bg_arvores', base: 800, factor: 0.5, depth: -80 },
    ];

    this.parallax = layers.map(({ key, base, factor, depth }) => {
      const img = this.textures.get(key).getSourceImage();
      const sprite = this.add
        .tileSprite(0, base - img.height, GAME_WIDTH, img.height, key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(depth);
      return { sprite, factor };
    });
  }

  updateParallax() {
    const scrollX = this.cameras.main.scrollX;
    this.parallax.forEach(({ sprite, factor }) => {
      sprite.tilePositionX = scrollX * factor;
    });
  }

  createProps() {
    // Objetos ficam levemente afundados na grama, senão parecem flutuar
    // (o topo do tile de grama é vazado).
    const baseY = this.groundY + GROUND_INSET;

    PROPS.forEach(({ key, tileX }) => {
      this.add.image(tileX * TILE, baseY, key).setOrigin(0.5, 1).setDepth(-5);
    });

    // As peças de cerca são mais largas que um tile: o avanço usa a largura
    // real da textura, senão elas se sobrepõem.
    FENCES.forEach(({ tileX, pieces }) => {
      let x = tileX * TILE;
      const poste = this.add.image(x, baseY, 'cerca_poste_esq').setOrigin(0, 1).setDepth(-4);
      x += poste.width;
      for (let i = 0; i < pieces; i += 1) {
        const seg = this.add.image(x, baseY, 'cerca').setOrigin(0, 1).setDepth(-4);
        x += seg.width;
      }
      this.add.image(x, baseY, 'cerca_poste_dir').setOrigin(0, 1).setDepth(-4);
    });
  }

  createTerrain() {
    this.solids = this.physics.add.staticGroup();

    GROUND_SEGMENTS.forEach(([start, length]) => {
      for (let i = 0; i < length; i += 1) {
        const tileX = start + i;
        this.solidTile(tileX, GROUND_ROW);
        // Subsolo — apenas visual, sem colisão.
        for (let row = GROUND_ROW + 1; row * TILE < GAME_HEIGHT; row += 1) {
          this.add.image(tileX * TILE, row * TILE, 'tile_terra').setOrigin(0).setDepth(-2);
        }
      }
    });

    PLATFORMS.forEach(([tileX, length]) => {
      for (let i = 0; i < length; i += 1) {
        this.solidTile(tileX + i, GROUND_ROW - 2);
      }
    });
  }

  solidTile(tileX, tileY) {
    const tile = this.solids
      .create(tileX * TILE, tileY * TILE, 'tile_grama')
      .setOrigin(0)
      .setDepth(-1);
    tile.refreshBody();
    return tile;
  }

  createPlayer() {
    this.spawn = { x: SPAWN_TILE * TILE, y: (GROUND_ROW - 2) * TILE };
    this.player = new Player(this, this.spawn.x, this.spawn.y);
    this.checkpoint = { ...this.spawn };
  }

  createCheckpoints() {
    CHECKPOINTS.forEach((tileX) => {
      const x = tileX * TILE;
      const baseY = this.groundY + GROUND_INSET;

      this.add.rectangle(x, baseY - 60, 8, 96, 0x6b5334).setOrigin(0.5, 1).setDepth(-3);
      const chama = this.add.circle(x, baseY - 104, 9, 0x5a4a33).setDepth(-3);

      const zona = this.add.zone(x, baseY - 60, 60, 150);
      this.physics.add.existing(zona, true);

      const cp = { x, y: (GROUND_ROW - 2) * TILE, ativo: false };
      this.physics.add.overlap(this.player, zona, () => {
        if (cp.ativo) return;
        cp.ativo = true;
        chama.setFillStyle(0xffb84d); // acende: feedback de progresso salvo
        this.checkpoint = { x: cp.x, y: cp.y };
      });
    });
  }

  createExit() {
    const x = EXIT_TILE * TILE;

    const zona = this.add.zone(x, this.groundY - 90, 80, 190);
    this.physics.add.existing(zona, true);

    this.add
      .text(x, this.groundY - 210, 'Bosque\nEsmeralda\n▶', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffe9b0',
        align: 'center',
        backgroundColor: '#00000066',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5);

    this.physics.add.overlap(this.player, zona, () => this.finalizar());
  }

  createHints() {
    const isTouch = this.sys.game.device.input.touch;
    const style = {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#fff4dc',
      backgroundColor: '#00000055',
      padding: { x: 10, y: 6 },
      align: 'center',
    };

    const y = (GROUND_ROW - 3) * TILE;
    this.add.text(3 * TILE, y, isTouch ? '◀ ▶ mover' : '← → mover', style).setOrigin(0.5);
    this.add.text(11 * TILE, y, isTouch ? '▲ pular' : 'ESPAÇO pular', style).setOrigin(0.5);
    this.add.text(22 * TILE, y, isTouch ? '⚔ atacar' : 'X atacar', style).setOrigin(0.5);
  }

  handleFall() {
    if (this.morrendo) return;

    // Usa os PÉS, não o centro do sprite — senão a cabeça ainda aparece.
    const feetY = this.player.body.y + this.player.body.height;
    if (feetY < this.deathY) return;

    this.morrendo = true;
    // Some na hora: sem isso o corpo continua caindo visível durante o fade.
    this.player.setVisible(false);
    this.player.body.enable = false;

    this.cameras.main.fadeOut(280);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.player.respawnAt(this.checkpoint.x, this.checkpoint.y);
      this.cameras.main.fadeIn(280);
      this.morrendo = false;
    });
  }

  finalizar() {
    if (this.saiu) return;
    this.saiu = true;
    this.cameras.main.fadeOut(700);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('VilaMapaScene'));
  }

  update(time) {
    if (this.saiu) return;

    if (!this.morrendo) {
      this.player.update(this.controls, time);
      this.handleFall();
    }

    this.updateParallax();
    this.controls.lateUpdate();
  }
}
