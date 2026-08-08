import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, TILE, GROUND_INSET, SKY_COLOR,
  GRAVITY, PLAYER_HEIGHT,
} from '../../../config/gameConfig.js';
import Player from '../../../entities/Player.js';
import InputManager from '../../../managers/InputManager.js';

// A grama da plataforma é mais rasa que a do chão, então o topo da colisão
// desce menos do que o GROUND_INSET usado nos tiles de terreno.
const PLATFORM_INSET = 6;

// Base comum das fases da Vila Inicial.
//
// Reúne o que toda fase do bioma precisa montar igual: parallax, terreno,
// plataformas, props, checkpoints, jogador, câmera, morte por queda e
// notificações. Cada fase concreta fornece seu módulo de layout e acrescenta
// só o que lhe é próprio — o tutorial na Fase 1, o NPC e o desvio bloqueado
// na Fase 2.
//
// Existe porque a Fase 2 repetiria cerca de 250 linhas da Fase 1 palavra por
// palavra, e o 08_ARQUITETURA_TECNICA.md trata duplicação como dívida: uma
// correção de colisão ou de parallax precisaria ser feita duas vezes, e
// esquecer uma delas é questão de tempo.
export default class VilaSceneBase extends Phaser.Scene {
  /**
   * @param {string} key    chave da cena no Phaser
   * @param {object} layout módulo de layout da fase (dados puros)
   */
  constructor(key, layout) {
    super(key);
    this.L = layout;
  }

  /** Montagem comum. A fase concreta chama isto e depois acrescenta o seu. */
  buildCommon() {
    this.worldWidth = this.L.TILES_WIDE * TILE;
    this.groundY = this.L.GROUND_ROW * TILE;

    // Estado explícito: o Phaser reaproveita a instância quando a cena é
    // reiniciada pelo mapa, e sobra de uma partida anterior travaria a nova.
    this.finished = false;

    this.buildParallax();
    this.buildBackgroundProps();
    this.buildTerrain();
    this.buildForegroundProps();
    this.buildCheckpoints();
  }


  // Saída da fase. Visualmente distinta de um beco sem saída
  // (03_GAMEPLAY_MACRO.md, Seção 8): uma coluna de luz suave marcando o fim.
  buildExit() {
    const x = this.L.EXIT_TILE * TILE;
    const glow = this.add
      .rectangle(x, this.groundY + GROUND_INSET, 56, TILE * 3, 0xffffff, 0.18)
      .setOrigin(0.5, 1)
      .setDepth(-6);
    this.tweens.add({ targets: glow, alpha: 0.32, yoyo: true, repeat: -1, duration: 1300 });

    this.exitZone = this.add.zone(x, this.groundY - TILE * 1.5, 70, TILE * 3);
    this.physics.add.existing(this.exitZone, true);
  }

  /** O que acontece ao alcançar a saída. Cada fase decide. */
  finishPhase() {}

  /** Atualização comum. Devolve false quando a fase já terminou. */
  updateCommon(time) {
    if (this.finished) return false;

    // Snapshot antes de qualquer consulta: Player, tutorial e NPCs precisam
    // enxergar o mesmo input no mesmo frame.
    this.input$.beginFrame();
    this.player.update(this.input$, time);
    this.updateParallax();

    // Queda: morre ao passar do fundo da tela (03_GAMEPLAY_MACRO.md, Seção 4).
    if (!this.player.isDead && this.player.y > GAME_HEIGHT + TILE * 2) {
      this.player.die(() => this.respawn());
    }
    return true;
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
    this.L.BACKGROUND_PROPS.forEach(({ key, tileX, scroll, offsetY = 0 }) => {
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

    this.L.GROUND_SEGMENTS.forEach(([start, count]) => {
      this.addGroundSegment(start, count);
    });

    this.L.PLATFORMS.forEach(([start, count, heightTiles]) => {
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

      for (let row = 1; row <= this.L.FILL_ROWS; row++) {
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
    this.L.FOREGROUND_PROPS.forEach(({ key, tileX }) => {
      this.add
        .image(tileX * TILE, this.groundY + GROUND_INSET, key)
        .setOrigin(0.5, 1)
        .setDepth(-5);
    });

    this.L.FENCES.forEach(({ tileX, pieces }) => {
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

  segmentEndX(tileX) {
    const seg = this.L.GROUND_SEGMENTS.find(([s, c]) => tileX >= s && tileX < s + c);
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
    this.activeCheckpoint = { x: this.L.SPAWN_TILE * TILE, y: this.groundY - PLAYER_HEIGHT };

    this.L.CHECKPOINTS.forEach((tileX) => {
      const x = tileX * TILE;
      const y = this.groundY + GROUND_INSET;

      // Marco de pedra antigo. Não é fogueira de propósito: fogo aceso
      // produziria laranja incandescente, cor reservada à Chama
      // (07_DIRECAO_ARTE_AUDIO.md, Seção 2).
      const marker = this.add.image(x, y, 'checkpoint').setOrigin(0.5, 1).setDepth(-6);

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
  // Jogador
  // --------------------------------------------------------------------
  buildPlayer() {
    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, 0, this.worldWidth, GAME_HEIGHT * 2);

    this.player = new Player(
      this,
      this.L.SPAWN_TILE * TILE,
      this.groundY - PLAYER_HEIGHT,
    );
    this.player.setDepth(0);

    this.physics.add.collider(this.player, this.solids);

    this.checkpoints.forEach((zone) => {
      this.physics.add.overlap(this.player, zone, () => this.activateCheckpoint(zone));
    });



    this.input$ = new InputManager(this);

    // A saída existe em toda fase, então o overlap dela mora aqui.
    if (this.exitZone) {
      this.physics.add.overlap(this.player, this.exitZone, () => this.finishPhase());
    }

    // Gancho para a fase concreta ligar os overlaps que só ela tem.
    this.afterPlayerBuilt?.();
  }

  buildCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldWidth, GAME_HEIGHT);
    // Suavização + look-ahead, conforme 03_GAMEPLAY_MACRO.md, Seção 7.
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setDeadzone(180, 140);
    cam.fadeIn(400);
  }

  respawn() {
    this.cameras.main.fadeOut(180);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.player.respawnAt(this.activeCheckpoint.x, this.activeCheckpoint.y);
      this.cameras.main.fadeIn(220);
    });
  }

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
