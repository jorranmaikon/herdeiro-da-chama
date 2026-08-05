import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TILE_SIZE,
  GROUND_VISUAL_OFFSET,
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
    const worldHeight = TILES_HIGH * TILE_SIZE;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Multitouch: sem pointers extras, andar e pular ao mesmo tempo não funciona no celular.
    this.input.addPointer(3);

    this.controls = new InputManager(this);

    // Y a partir do qual a queda é fatal (bem abaixo do chão, dentro dos vãos).
    this.deathY = (GROUND_ROW + 2) * TILE_SIZE;
    this.isRespawning = false;

    this.createParallax();
    this.createProps();
    this.createTerrain();
    this.createPlayer();
    this.createNPCs();
    this.createExit();
    this.createHints();

    this.physics.add.collider(this.player, this.solids);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(0, 60);
    this.cameras.main.fadeIn(600);
  }

  createParallax() {
    // Camadas fixas na câmera; o deslocamento é feito manualmente em updateParallax().
    this.bgCeu = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_ceu')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-100);

    this.bgColinas = this.add
      .tileSprite(0, GAME_HEIGHT - 420, GAME_WIDTH, 220, 'bg_colinas')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-90);

    this.bgArvores = this.add
      .tileSprite(0, GAME_HEIGHT - 330, GAME_WIDTH, 300, 'bg_arvores')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-80);
  }

  updateParallax() {
    const scrollX = this.cameras.main.scrollX;
    this.bgCeu.tilePositionX = scrollX * 0.05;
    this.bgColinas.tilePositionX = scrollX * 0.25;
    this.bgArvores.tilePositionX = scrollX * 0.5;
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
    // Checkpoint mais recente — atualizado ao pisar em cada segmento de chão.
    this.lastCheckpoint = { ...this.spawnPoint };
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

  // Guarda a posição segura mais recente, pra devolver o jogador ali após uma queda.
  updateCheckpoint() {
    const onGround = this.player.body.blocked.down;
    if (!onGround) return;
    if (this.player.y < this.lastCheckpoint.y - TILE_SIZE * 3) return;
    this.lastCheckpoint = { x: this.player.x, y: this.player.y - TILE_SIZE };
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
      // TODO: voltar ao Mapa do Bioma quando MapScene estiver implementada
      // (06_INTERFACE_UX.md, Seção 2.2). Por ora volta ao menu.
      this.scene.start('MainMenuScene');
    });
  }

  update(time) {
    if (this.exitReached) return;

    const input = this.controls;

    if (!this.isRespawning) {
      this.player.update(input, time);
      if (input.attackJustPressed()) this.player.attack();
      this.updateCheckpoint();
      this.handleFall();
      this.handleNPCInteraction(input);
    }

    this.updateParallax();

    // Consome os toques deste frame — precisa ser a última linha do update.
    input.lateUpdate();
  }

  handleNPCInteraction(input) {
    this.npcs.forEach((npc) => {
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
