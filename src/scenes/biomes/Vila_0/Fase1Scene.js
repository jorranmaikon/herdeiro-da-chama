import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, TILE, GROUND_INSET, SKY_COLOR,
  GRAVITY, PLAYER_HEIGHT,
} from '../../../config/gameConfig.js';

// A grama da plataforma é mais rasa que a do chão, então o topo da colisão
// desce menos do que o GROUND_INSET usado nos tiles de terreno.
const PLATFORM_INSET = 6;
import Player from '../../../entities/Player.js';
import InputManager from '../../../managers/InputManager.js';
import * as L from './fase1Layout.js';

// Fase 1 da Vila Inicial (Região 0).
// Estrutura de cena conforme 03_GAMEPLAY_MACRO.md, Seção 8: spawn definido,
// checkpoints intermediários, saída visualmente distinta.
export default class Fase1Scene extends Phaser.Scene {
  constructor() {
    super('Fase1Scene');
  }

  create() {
    this.worldWidth = L.TILES_WIDE * TILE;
    this.groundY = L.GROUND_ROW * TILE;

    // Estado explícito: a cena é reiniciada ao voltar pelo mapa, e o Phaser
    // reaproveita a instância — sem isso o `finished` de uma partida anterior
    // travaria a nova.
    this.finished = false;
    this.attackConsumed = false;

    this.buildParallax();
    this.buildBackgroundProps();
    this.buildTerrain();
    this.buildForegroundProps();
    this.buildCheckpoints();
    this.buildTrainingDummy();
    this.buildExit();
    this.buildPlayer();
    this.buildCamera();

    this.input.keyboard.on('keydown-ESC', () => this.leave());
    this.game.audio.play(this, 'mus_fase');
  }

  // --------------------------------------------------------------------
  // Cenário
  // --------------------------------------------------------------------
  // Três camadas, cada uma mais lenta que a da frente. tileSprite repete a
  // textura sozinho — as artes foram feitas com emenda horizontal invisível.
  buildParallax() {
    this.cameras.main.setBackgroundColor(SKY_COLOR);

    // Alturas espelhadas em tools/preview_fase.py — a preview só serve para
    // validar se mostrar exatamente o mesmo que o jogo.
    //
    // A treeline termina na linha do chão (a saia sólida continua abaixo,
    // tapando o que se veria por dentro de um vão); as colinas assomam ACIMA
    // dela, senão somem, e param bem antes do topo, senão cobrem o céu.
    const ARVORES_SKIRT = 280;
    const COLINAS_TOP = 300;
    const alturaColinas = this.textures.get('bg_colinas').getSourceImage().height;

    const layers = [
      { key: 'bg_ceu', scroll: 0, bottom: GAME_HEIGHT },
      { key: 'bg_colinas', scroll: 0.15, bottom: COLINAS_TOP + alturaColinas },
      { key: 'bg_arvores', scroll: 0.35, bottom: this.groundY + ARVORES_SKIRT },
    ];

    this.parallax = layers.map(({ key, scroll, bottom }, i) => {
      const src = this.textures.get(key).getSourceImage();
      const layer = this.add
        .tileSprite(0, bottom, GAME_WIDTH, src.height, key)
        .setOrigin(0, 1)
        .setScrollFactor(0)
        .setDepth(-100 + i);
      return { layer, scroll };
    });
  }

  // A camada fica fixa na tela e quem rola e a TEXTURA dentro dela. Assim uma
  // faixa de GAME_WIDTH cobre o mundo inteiro, por mais longa que seja a fase.
  updateParallax() {
    const { scrollX } = this.cameras.main;
    this.parallax.forEach(({ layer, scroll }) => {
      layer.tilePositionX = scrollX * scroll;
    });
  }

  // Marcos e edifícios ficam atrás do plano jogável, com parallax leve.
  // Sem colisão: são fundo (decisão registrada no VS_0_VILA_INICIAL.md).
  buildBackgroundProps() {
    L.BACKGROUND_PROPS.forEach(({ key, tileX, scroll, offsetY = 0 }) => {
      this.add
        .image(tileX * TILE, this.groundY + GROUND_INSET + offsetY, key)
        .setOrigin(0.5, 1)
        .setScrollFactor(scroll, 1)
        .setDepth(-50);
    });
  }

  // --------------------------------------------------------------------
  // Chão e plataformas
  // --------------------------------------------------------------------
  buildTerrain() {
    this.solids = this.physics.add.staticGroup();

    L.GROUND_SEGMENTS.forEach(([start, count]) => {
      this.addGroundSegment(start, count);
    });

    L.PLATFORMS.forEach(([start, count, heightTiles]) => {
      this.addPlatform(start, count, heightTiles);
    });
  }

  // Alterna entre as 3 variações de tile. Com uma variação só, a mesma
  // pedrinha reaparece a cada 64px e a repetição fica óbvia.
  tileVariant(prefix, tileX) {
    return `${prefix}_${tileX % 3}`;
  }

  addGroundSegment(start, count) {
    for (let i = 0; i < count; i++) {
      const x = (start + i) * TILE;
      this.add
        .image(x, this.groundY, this.tileVariant('tile_topo', start + i))
        .setOrigin(0, 0)
        .setDepth(-10);

      for (let row = 1; row <= L.FILL_ROWS; row++) {
        this.add
          .image(x, this.groundY + row * TILE, this.tileVariant('tile_fill', start + i + row))
          .setOrigin(0, 0)
          .setDepth(-10);
      }
    }

    // Um único corpo estático por segmento em vez de um por tile: menos
    // objetos de física e nenhuma "quina" interna onde o jogador possa travar.
    // O topo da colisão desce GROUND_INSET para acompanhar as pontas vazadas
    // da grama — sem isso o personagem parece flutuar acima do chão.
    this.addSolid(start * TILE, this.groundY + GROUND_INSET, count * TILE, TILE * 2);
  }

  // A plataforma é montada com três peças: ponta esquerda, meio repetível e
  // ponta direita. As pontas são arredondadas — é o que a faz ler como
  // plataforma e não como um naco de chão — e por isso não podem repetir.
  addPlatform(start, count, heightTiles) {
    const y = this.groundY - heightTiles * TILE;
    const x0 = start * TILE;
    const width = count * TILE;

    const esq = this.textures.get('plataforma_esq').getSourceImage();
    const meio = this.textures.get('plataforma_meio').getSourceImage();
    const dir = this.textures.get('plataforma_dir').getSourceImage();

    this.add.image(x0, y, 'plataforma_esq').setOrigin(0, 0).setDepth(-9);
    this.add.image(x0 + width, y, 'plataforma_dir').setOrigin(1, 0).setDepth(-9);

    const meioX = x0 + esq.width;
    const meioW = width - esq.width - dir.width;
    if (meioW > 0) {
      this.add
        .tileSprite(meioX, y, meioW, meio.height, 'plataforma_meio')
        .setOrigin(0, 0)
        .setDepth(-9);
    }

    // A colisão cobre a largura inteira, incluindo as pontas.
    this.addSolid(x0, y + PLATFORM_INSET, width, TILE);
  }

  /** Corpo estático invisível. A arte é desenhada à parte.
   *  Recebe o canto superior esquerdo, mas posiciona pelo centro: um corpo
   *  estático do Arcade é sempre centrado no GameObject, e usar origin (0,0)
   *  aqui deslocava a colisão em meia caixa. */
  addSolid(x, y, w, h) {
    const body = this.add.rectangle(x + w / 2, y + h / 2, w, h);
    body.setVisible(false);
    this.solids.add(body);
    body.body.setSize(w, h);
    body.body.updateFromGameObject();
    return body;
  }

  // --------------------------------------------------------------------
  // Props de frente
  // --------------------------------------------------------------------
  buildForegroundProps() {
    L.FOREGROUND_PROPS.forEach(({ key, tileX }) => {
      this.add
        .image(tileX * TILE, this.groundY + GROUND_INSET, key)
        .setOrigin(0.5, 1)
        .setDepth(-5);
    });

    L.FENCES.forEach(({ tileX, pieces }) => {
      const src = this.textures.get('cerca').getSourceImage();
      const wanted = src.width * pieces;
      // Encurta a cerca ate a borda do segmento de chao em que ela comeca.
      // Sem isso ela seguia reta por cima do abismo, denunciando que o cenario
      // e so decoracao.
      const width = Math.min(wanted, this.segmentEndX(tileX) - tileX * TILE);
      if (width < src.width * 0.4) return;

      this.add
        .tileSprite(tileX * TILE, this.groundY + GROUND_INSET, width, src.height, 'cerca')
        .setOrigin(0, 1)
        .setDepth(-5);
    });
  }

  /** Fim (em px) do segmento de chao que contem este tile. 0 se estiver num vao. */
  segmentEndX(tileX) {
    const seg = L.GROUND_SEGMENTS.find(([s, c]) => tileX >= s && tileX < s + c);
    return seg ? (seg[0] + seg[1]) * TILE : 0;
  }

  // --------------------------------------------------------------------
  // Checkpoints
  // --------------------------------------------------------------------
  // PENDÊNCIA DE ASSET: ainda não existe arte de ponto de descanso. Enquanto
  // isso, um marco de pedra desenhado em código — paleta de pedra do bioma,
  // nunca o dourado reservado à Chama (07_DIRECAO_ARTE_AUDIO.md, Seção 2).
  buildCheckpoints() {
    this.checkpoints = [];
    this.activeCheckpoint = { x: L.SPAWN_TILE * TILE, y: this.groundY - PLAYER_HEIGHT };

    L.CHECKPOINTS.forEach((tileX) => {
      const x = tileX * TILE;
      const y = this.groundY + GROUND_INSET;

      const marker = this.add.container(x, y).setDepth(-6);
      marker.add(this.add.rectangle(0, 0, 22, 54, 0x6e655c).setOrigin(0.5, 1));
      marker.add(this.add.rectangle(0, -54, 34, 14, 0x9c9188).setOrigin(0.5, 1));
      marker.add(this.add.rectangle(0, -40, 12, 12, 0x4a453f).setOrigin(0.5, 1));

      const zone = this.add.zone(x, y - 60, 60, 120);
      this.physics.add.existing(zone, true);
      zone.setData({ tileX, marker, reached: false });
      this.checkpoints.push(zone);
    });
  }

  activateCheckpoint(zone) {
    if (zone.getData('reached')) return;
    zone.setData('reached', true);

    this.activeCheckpoint = {
      x: zone.getData('tileX') * TILE,
      y: this.groundY - PLAYER_HEIGHT,
    };

    // Feedback discreto, sem pausar o jogo (06_INTERFACE_UX.md, Seção 8).
    const marker = zone.getData('marker');
    this.tweens.add({ targets: marker, scaleY: 1.15, yoyo: true, duration: 160 });
    this.showNotice('Ponto de descanso');
  }

  // --------------------------------------------------------------------
  // Alvo de treino e saída
  // --------------------------------------------------------------------
  buildTrainingDummy() {
    const x = L.TRAINING_DUMMY_TILE * TILE;
    this.dummy = this.add
      .image(x, this.groundY + GROUND_INSET, 'alvo_treino')
      .setOrigin(0.5, 1)
      .setDepth(-5);
    this.dummyHits = 0;

    this.dummyZone = this.add.zone(x, this.groundY - PLAYER_HEIGHT / 2, 90, PLAYER_HEIGHT);
    this.physics.add.existing(this.dummyZone, true);
  }

  hitDummy() {
    if (!this.dummy.visible) return;
    this.dummyHits += 1;

    this.tweens.add({ targets: this.dummy, x: this.dummy.x + 6, yoyo: true, duration: 70 });
    this.cameras.main.shake(90, 0.004);

    if (this.dummyHits >= 3) {
      this.tweens.add({
        targets: this.dummy,
        alpha: 0,
        angle: 25,
        y: this.dummy.y + 18,
        duration: 260,
        onComplete: () => this.dummy.setVisible(false),
      });
      this.showNotice('Alvo destruído');
    }
  }

  buildExit() {
    const x = L.EXIT_TILE * TILE;
    // Saída visualmente distinta de um beco sem saída (03_GAMEPLAY_MACRO.md,
    // Seção 8): uma coluna de luz suave marcando o fim da fase.
    const glow = this.add
      .rectangle(x, this.groundY + GROUND_INSET, 56, TILE * 3, 0xffffff, 0.18)
      .setOrigin(0.5, 1)
      .setDepth(-6);
    this.tweens.add({ targets: glow, alpha: 0.32, yoyo: true, repeat: -1, duration: 1300 });

    this.exitZone = this.add.zone(x, this.groundY - TILE * 1.5, 70, TILE * 3);
    this.physics.add.existing(this.exitZone, true);
  }

  // --------------------------------------------------------------------
  // Jogador
  // --------------------------------------------------------------------
  buildPlayer() {
    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, 0, this.worldWidth, GAME_HEIGHT * 2);

    this.player = new Player(
      this,
      L.SPAWN_TILE * TILE,
      this.groundY - PLAYER_HEIGHT,
    );
    this.player.setDepth(0);

    this.physics.add.collider(this.player, this.solids);

    this.checkpoints.forEach((zone) => {
      this.physics.add.overlap(this.player, zone, () => this.activateCheckpoint(zone));
    });

    this.physics.add.overlap(this.player, this.dummyZone, () => {
      if (this.player.isAttacking && !this.attackConsumed) {
        this.attackConsumed = true;
        this.hitDummy();
      }
    });

    this.physics.add.overlap(this.player, this.exitZone, () => this.finishPhase());

    this.input$ = new InputManager(this);
  }

  buildCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldWidth, GAME_HEIGHT);
    // Suavização + look-ahead, conforme 03_GAMEPLAY_MACRO.md, Seção 7.
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setDeadzone(180, 140);
    cam.fadeIn(400);
  }

  // --------------------------------------------------------------------
  // Ciclo
  // --------------------------------------------------------------------
  update(time) {
    if (this.finished) return;

    this.player.update(this.input$, time);
    this.updateParallax();

    // Libera o próximo acerto no alvo só quando o ataque termina — senão um
    // único golpe contaria vários frames de overlap.
    if (!this.player.isAttacking) this.attackConsumed = false;

    // Queda: morre ao passar do fundo da tela (03_GAMEPLAY_MACRO.md, Seção 4).
    if (!this.player.isDead && this.player.y > GAME_HEIGHT + TILE * 2) {
      this.player.die(() => this.respawn());
    }

    // Precisa ser o ultimo passo: sem isso um toque conta em varios frames.
    this.input$.lateUpdate();
  }

  respawn() {
    this.cameras.main.fadeOut(180);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.player.respawnAt(this.activeCheckpoint.x, this.activeCheckpoint.y);
      this.cameras.main.fadeIn(220);
    });
  }

  finishPhase() {
    if (this.finished) return;
    this.finished = true;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.leave());
  }

  leave() {
    this.scene.start('VilaMapaScene');
  }

  /** Aviso curto no topo da tela, sem pausar o jogo. */
  showNotice(text) {
    const label = this.add
      .text(GAME_WIDTH / 2, 60, text, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e8dfd0',
        backgroundColor: '#00000066',
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    this.tweens.add({
      targets: label,
      alpha: 0,
      delay: 1100,
      duration: 500,
      onComplete: () => label.destroy(),
    });
  }
}
