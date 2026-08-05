import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TILE_SIZE,
  GROUND_VISUAL_OFFSET,
  SKY_COLOR,
} from '../../../config/gameConfig.js';
import Player from '../../../entities/Player.js';
import NPC from '../../../entities/npcs/NPC.js';
import InputManager from '../../../managers/InputManager.js';
import {
  TILES_WIDE,
  TILES_HIGH,
  GROUND_ROW,
  GROUND_SEGMENTS,
  PLATFORMS,
  CHECKPOINTS,
  PROPS,
  FENCES,
  NPC_CAMPONES,
  EXIT_TILE_X,
} from './fase1Layout.js';

// Fase 1 da Vila Inicial — "Despertar".
// Progressão linear: o jogador sempre avança pra direita (06_INTERFACE_UX.md, Seção 2.2).
export default class Fase1Scene extends Phaser.Scene {
  constructor() {
    super('Vila0_Fase1');
  }

  create() {
    const worldWidth = TILES_WIDE * TILE_SIZE;
    // A altura do mundo é igual à da câmera de propósito: assim a câmera NUNCA
    // rola na vertical e o cenário não "pula" junto com o jogador.
    const worldHeight = GAME_HEIGHT;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Multitouch: sem pointers extras, andar e pular ao mesmo tempo não funciona no celular.
    this.input.addPointer(3);

    this.controls = new InputManager(this);

    // Y a partir do qual a queda é fatal (bem abaixo do chão, dentro dos vãos).
    this.deathY = (GROUND_ROW + 1) * TILE_SIZE;
    this.isRespawning = false;

    this.createParallax();
    this.createProps();
    this.createTerrain();
    this.createPlayer();
    this.createCheckpoints();
    this.createNPCs();
    this.createExit();
    this.createHints();

    this.physics.add.collider(this.player, this.solids);

    // Segue apenas no eixo X (lerpY = 0). O nível é plano e o pulo não deve
    // arrastar a câmera pra cima.
    this.cameras.main.startFollow(this.player, true, 0.12, 0);
    this.cameras.main.setFollowOffset(0, 0);
    this.game.audio.playMusic(this, 'mus_fase_vila');
    this.game.audio.createToggleButton(this);
    this.cameras.main.fadeIn(600);
  }

  createParallax() {
    // Fundo sólido na cor do topo do céu: cobre a área acima da textura sem
    // deixar a emenda vertical do tileSprite aparecer.
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, SKY_COLOR)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-110);

    // As texturas de fundo foram espelhadas na geração dos assets, então emendam
    // perfeitamente quando repetidas — sem corte visível.
    // Linha de base de cada camada. Quanto mais distante, mais ALTA no horizonte:
    // montanhas > colinas verdes > árvores próximas.
    // A base das árvores fica abaixo da linha do chão de propósito — o tileset
    // cobre o excesso e elimina a sensação de que elas flutuam.
    const layers = [
      { key: 'bg_ceu', base: 430, depth: -100, factor: 0.05, prop: 'bgCeu' },
      { key: 'bg_colinas', base: 545, depth: -90, factor: 0.25, prop: 'bgColinas' },
      { key: 'bg_arvores', base: 800, depth: -80, factor: 0.5, prop: 'bgArvores' },
    ];

    this.parallaxLayers = layers.map(({ key, base, depth, factor, prop }) => {
      const img = this.textures.get(key).getSourceImage();
      const sprite = this.add
        .tileSprite(0, base - img.height, GAME_WIDTH, img.height, key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(depth);
      this[prop] = sprite;
      return { sprite, factor };
    });
  }

  updateParallax() {
    const scrollX = this.cameras.main.scrollX;
    this.parallaxLayers.forEach(({ sprite, factor }) => {
      sprite.tilePositionX = scrollX * factor;
    });
  }

  createProps() {
    // Objetos ficam levemente afundados na grama, senão parecem flutuar
    // (o topo do tile de grama é transparente).
    const baseY = GROUND_ROW * TILE_SIZE + GROUND_VISUAL_OFFSET;

    PROPS.forEach(({ key, tileX, depth }) => {
      this.add.image(tileX * TILE_SIZE, baseY, key).setOrigin(0.5, 1).setDepth(depth);
    });

    // As peças de cerca são mais largas que um tile, então o avanço usa a largura
    // real da textura — senão elas se sobrepõem.
    FENCES.forEach(({ startTileX, pieces }) => {
      let x = startTileX * TILE_SIZE;

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

    GROUND_SEGMENTS.forEach(([startTile, length]) => {
      for (let i = 0; i < length; i += 1) {
        const tileX = startTile + i;
        this.addSolidTile(tileX, GROUND_ROW, 'tile_grama');

        // Subsolo apenas visual, sem colisão.
        for (let row = GROUND_ROW + 1; row < TILES_HIGH; row += 1) {
          this.add
            .image(tileX * TILE_SIZE, row * TILE_SIZE, 'tile_terra')
            .setOrigin(0)
            .setDepth(-2);
        }
      }
    });

    PLATFORMS.forEach(([tileX, tileY, length]) => {
      for (let i = 0; i < length; i += 1) {
        this.addSolidTile(tileX + i, tileY, 'tile_grama');
      }
    });
  }

  addSolidTile(tileX, tileY, textureKey) {
    const tile = this.solids
      .create(tileX * TILE_SIZE, tileY * TILE_SIZE, textureKey)
      .setOrigin(0)
      .setDepth(-1);
    tile.refreshBody();
    return tile;
  }

  createPlayer() {
    this.spawnPoint = {
      x: 2 * TILE_SIZE,
      y: (GROUND_ROW - 2) * TILE_SIZE,
    };
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y);
    // Começa no início da fase; passa a valer o último checkpoint ativado.
    this.lastCheckpoint = { ...this.spawnPoint };
  }

  createCheckpoints() {
    // Checkpoints explícitos do layout (05_BALANCEAMENTO.md, Seção 6).
    // Ao morrer, o jogador volta ao último ativado — ou ao início, se nenhum ativou.
    this.checkpoints = CHECKPOINTS.map(({ tileX }) => {
      const x = tileX * TILE_SIZE;
      const y = GROUND_ROW * TILE_SIZE + GROUND_VISUAL_OFFSET;

      const marker = this.add
        .rectangle(x, y - 60, 8, 96, 0x6b5334)
        .setOrigin(0.5, 1)
        .setDepth(-3);
      const flame = this.add
        .circle(x, y - 104, 9, 0x5a4a33)
        .setDepth(-3);

      const zone = this.add.zone(x, y - 60, 60, 140);
      this.physics.add.existing(zone, true);

      // Renasce 2 tiles acima do chão (mesma altura do spawn inicial),
      // senão o jogador reaparece dentro do solo.
      const cp = { x, y: (GROUND_ROW - 2) * TILE_SIZE, zone, flame, active: false };
      this.physics.add.overlap(this.player, zone, () => this.activateCheckpoint(cp));
      return cp;
    });
  }

  activateCheckpoint(cp) {
    if (cp.active) return;
    cp.active = true;
    // Acende visualmente — feedback de que o ponto foi salvo.
    cp.flame.setFillStyle(0xffb84d);
    this.lastCheckpoint = { x: cp.x, y: cp.y };
  }

  createNPCs() {
    this.npcs = [];
    const npc = new NPC(
      this,
      NPC_CAMPONES.tileX * TILE_SIZE,
      GROUND_ROW * TILE_SIZE + GROUND_VISUAL_OFFSET - 66,
      NPC_CAMPONES,
    );
    this.npcs.push(npc);
  }

  createExit() {
    const x = EXIT_TILE_X * TILE_SIZE;
    const y = GROUND_ROW * TILE_SIZE;

    this.exitZone = this.add.zone(x, y - 90, 80, 190);
    this.physics.add.existing(this.exitZone, true);

    this.add
      .text(x, y - 200, 'Bosque\nEsmeralda\n▶', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffe9b0',
        align: 'center',
        backgroundColor: '#00000066',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5);

    this.exitReached = false;
    this.physics.add.overlap(this.player, this.exitZone, () => this.finishPhase());
  }

  createHints() {
    const style = {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#fff4dc',
      backgroundColor: '#00000055',
      padding: { x: 10, y: 6 },
      align: 'center',
    };

    // O texto muda conforme o dispositivo — no celular não existe "ESPAÇO".
    const isTouch = this.sys.game.device.input.touch;
    const moveHint = isTouch ? '◀ ▶ mover' : '← → mover';
    const jumpHint = isTouch ? '▲ pular' : 'ESPAÇO pular';

    const baseY = (GROUND_ROW - 3) * TILE_SIZE;
    this.add.text(3 * TILE_SIZE, baseY, moveHint, style).setOrigin(0.5);
    this.add.text(14 * TILE_SIZE, baseY, jumpHint, style).setOrigin(0.5);
  }

  handleFall() {
    if (this.isRespawning || this.player.y < this.deathY) return;

    this.isRespawning = true;
    this.cameras.main.fadeOut(280);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.player.respawnAt(this.lastCheckpoint.x, this.lastCheckpoint.y);
      this.cameras.main.fadeIn(280);
      this.isRespawning = false;
    });
  }

  finishPhase() {
    if (this.exitReached) return;
    this.exitReached = true;

    this.cameras.main.fadeOut(700);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // TODO: Mapa do Bioma (fases dentro da região) ainda não existe —
      // por ora volta ao Mapa do Continente (06_INTERFACE_UX.md, Seção 2.2).
      this.scene.start('MapScene');
    });
  }

  update(time) {
    if (this.exitReached) return;

    const input = this.controls;

    if (!this.isRespawning) {
      this.player.update(input, time);
      if (input.attackJustPressed()) this.player.attack();
      this.handleFall();
      this.handleNPCInteraction(input);
    }

    this.updateParallax();

    // Consome os toques deste frame — precisa ser a última linha do update.
    input.lateUpdate();
  }

  handleNPCInteraction(input) {
    this.npcs.forEach((npc) => {
      npc.facePlayer(this.player);
      const inRange = npc.isPlayerInRange(this.player);
      npc.setPromptVisible(inRange);

      if (inRange && input.interactJustPressed()) {
        // Diálogo pausa o gameplay (06_INTERFACE_UX.md, Seção 4).
        this.scene.pause();
        this.scene.launch('DialogueOverlay', {
          name: npc.npcName,
          portraitKey: npc.portraitKey,
          lines: npc.lines,
          callerScene: this.scene.key,
        });
      }
    });
  }
}
