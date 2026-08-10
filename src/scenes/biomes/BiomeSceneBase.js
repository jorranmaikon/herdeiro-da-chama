import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, TILE, GROUND_INSET, SKY_COLOR,
  GRAVITY, PLAYER_HEIGHT,
} from '../../config/gameConfig.js';
import Player from '../../entities/Player.js';
import save from '../../managers/SaveManager.js';
import InputManager from '../../managers/InputManager.js';

// Base comum a TODAS as fases de TODOS os biomas.
//
// Nasceu de VilaSceneBase: ao começar o Bosque Esmeralda ficou claro que cerca
// de metade daquela classe não tinha nada de Vila — jogador, câmera,
// checkpoint, respawn, saída e notificação são iguais em qualquer bioma. O
// 08_ARQUITETURA_TECNICA.md trata duplicação como dívida, então essa metade
// subiu para cá e cada bioma passou a ter uma base própria só com o que lhe é
// particular (terreno, parallax, props).
//
// O que NÃO mora aqui, de propósito: montagem de terreno e de parallax. Os
// biomas divergem justamente nisso — a Vila tem chão plano e três camadas de
// fundo, o Bosque tem terreno em degraus e duas. Forçar um formato único aqui
// obrigaria cada bioma novo a se encaixar num molde que não cabe.
export default class BiomeSceneBase extends Phaser.Scene {
  /**
   * @param {string} key    chave da cena no Phaser
   * @param {object} layout módulo de layout da fase (dados puros)
   */
  constructor(key, layout) {
    super(key);
    this.L = layout;
  }

  // --------------------------------------------------------------------
  // Contrato que cada bioma implementa
  // --------------------------------------------------------------------
  /** Camadas de fundo do bioma: [{ key, scroll, bottom }]. */
  parallaxLayers() {
    return [];
  }

  /** Linha do chão no tile dado. Biomas de terreno plano devolvem sempre a mesma. */
  groundRowAt() {
    return this.L.GROUND_ROW;
  }

  /** Montagem de cenário própria do bioma. */
  buildScenery() {}

  // --------------------------------------------------------------------
  // Montagem comum
  // --------------------------------------------------------------------
  buildCommon() {
    this.worldWidth = this.L.TILES_WIDE * TILE;
    this.groundY = this.L.GROUND_ROW * TILE;

    // Estado explícito: o Phaser reaproveita a instância quando a cena é
    // reiniciada pelo mapa, e sobra de uma partida anterior travaria a nova.
    this.finished = false;

    this.buildParallax();
    this.buildScenery();
    this.buildCheckpoints();
  }

  /** Y do topo do chão (já com o recuo da grama) no tile dado. */
  groundTopAt(tileX) {
    return this.groundRowAt(tileX) * TILE + GROUND_INSET;
  }

  // Três (ou duas) camadas, cada uma mais lenta que a da frente. tileSprite
  // repete a textura sozinho — as artes têm emenda horizontal invisível.
  buildParallax() {
    this.cameras.main.setBackgroundColor(SKY_COLOR);

    this.parallax = this.parallaxLayers().map(({ key, scroll, bottom }, i) => {
      const src = this.textures.get(key).getSourceImage();
      const layer = this.add
        .tileSprite(0, bottom, GAME_WIDTH, src.height, key)
        .setOrigin(0, 1)
        .setScrollFactor(0)
        .setDepth(-100 + i);
      return { layer, scroll };
    });
  }

  // A camada fica fixa na tela e quem rola é a TEXTURA dentro dela. Assim uma
  // faixa de GAME_WIDTH cobre o mundo inteiro, por mais longa que seja a fase.
  updateParallax() {
    const { scrollX } = this.cameras.main;
    this.parallax.forEach(({ layer, scroll }) => {
      layer.tilePositionX = scrollX * scroll;
    });
  }

  // --------------------------------------------------------------------
  // Colisão
  // --------------------------------------------------------------------
  addSolid(x, y, w, h) {
    const body = this.add.rectangle(x + w / 2, y + h / 2, w, h);
    body.setVisible(false);
    this.solids.add(body);
    body.body.setSize(w, h);
    body.body.updateFromGameObject();
    return body;
  }

  // Plataforma atravessável (03_GAMEPLAY_MACRO.md, Seção 2): colide só por
  // cima. Desligar os três outros lados é o que permite subir por baixo e
  // ainda assim aterrissar normalmente ao cair sobre ela.
  //
  // Não existe comando para descer atravessando — é decisão de design, não
  // limitação: descer é sempre contornando pela borda.
  addOneWay(x, y, w, h) {
    const body = this.addSolid(x, y, w, h);
    body.body.checkCollision.down = false;
    body.body.checkCollision.left = false;
    body.body.checkCollision.right = false;
    return body;
  }

  // --------------------------------------------------------------------
  // Saída
  // --------------------------------------------------------------------
  // Visualmente distinta de um beco sem saída (03_GAMEPLAY_MACRO.md, Seção 8):
  // uma coluna de luz suave marcando o fim.
  buildExit() {
    const x = this.L.EXIT_TILE * TILE;
    const y = this.groundTopAt(this.L.EXIT_TILE);

    const glow = this.add
      .rectangle(x, y, 56, TILE * 3, 0xffffff, 0.18)
      .setOrigin(0.5, 1)
      .setDepth(-6);
    this.tweens.add({ targets: glow, alpha: 0.32, yoyo: true, repeat: -1, duration: 1300 });

    this.exitZone = this.add.zone(x, y - TILE * 1.5, 70, TILE * 3);
    this.physics.add.existing(this.exitZone, true);
  }

  /**
   * Identificador desta fase no save (ver data/progressao.js). Uma fase sem id
   * simplesmente não registra conclusão — é o caso de cenas de teste.
   */
  faseId() {
    return null;
  }

  /** Registra a conclusão. Chamado ao alcançar a saída. */
  concluirFase() {
    const id = this.faseId();
    if (id) save.concluirFase(id);
  }

  /** O que acontece ao alcançar a saída. Cada fase decide. */
  finishPhase() {}

  // --------------------------------------------------------------------
  // Checkpoints
  // --------------------------------------------------------------------
  buildCheckpoints() {
    this.checkpoints = [];
    this.activeCheckpoint = {
      x: this.L.SPAWN_TILE * TILE,
      y: this.groundTopAt(this.L.SPAWN_TILE) - PLAYER_HEIGHT,
    };

    this.L.CHECKPOINTS.forEach((tileX) => {
      const x = tileX * TILE;
      const y = this.groundTopAt(tileX);

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

    const tileX = zone.getData('tileX');
    this.activeCheckpoint = {
      x: tileX * TILE,
      y: this.groundTopAt(tileX) - PLAYER_HEIGHT,
    };

    // Feedback discreto, sem pausar o jogo (06_INTERFACE_UX.md, Seção 8).
    this.tweens.add({ targets: zone.getData('marker'), scaleY: 1.15, yoyo: true, duration: 160 });
    this.showNotice('Ponto de descanso');
  }

  // --------------------------------------------------------------------
  // Jogador
  // --------------------------------------------------------------------
  buildPlayer() {
    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, 0, this.worldWidth, GAME_HEIGHT * 2);

    // Sem parede no TOPO: bater a cabeça num teto invisível é pior que sair
    // de quadro por cima. Num plataforma 2D o alto da tela não é um limite
    // físico, é só o fim do enquadramento — a câmera continua presa, então o
    // jogador some por um instante e volta ao cair.
    this.physics.world.setBoundsCollision(true, true, false, true);

    this.player = new Player(
      this,
      this.L.SPAWN_TILE * TILE,
      this.groundTopAt(this.L.SPAWN_TILE) - PLAYER_HEIGHT,
    );
    this.player.setDepth(0);

    this.physics.add.collider(this.player, this.solids);

    this.checkpoints.forEach((zone) => {
      this.physics.add.overlap(this.player, zone, () => this.activateCheckpoint(zone));
    });

    this.input$ = new InputManager(this);

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

  // --------------------------------------------------------------------
  // Ciclo
  // --------------------------------------------------------------------
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
