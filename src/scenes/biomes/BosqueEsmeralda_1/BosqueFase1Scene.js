import { TILE } from '../../../config/gameConfig.js';
import BosqueSceneBase from './BosqueSceneBase.js';
import * as L from './fase1Layout.js';

// Fase 1 do Bosque Esmeralda — primeira fase do jogo com terreno irregular.
//
// Ensina o vocabulário novo do bioma sem introduzir mecânica: degraus,
// plataforma atravessável, o desvio alto/baixo que reconverge e o perigo de
// cenário. O Rolamento (Brasa 1) só chega depois do Boss, então tudo aqui é
// vencível com mover, pular e atacar (VS_1_BOSQUE_ESMERALDA.md, Seção 3).
//
// A montagem comum vive em BosqueSceneBase; aqui fica só o item de cura, o
// mirante e a saída.
export default class BosqueFase1Scene extends BosqueSceneBase {
  constructor() {
    super('BosqueFase1Scene', L);
  }

  create() {
    this.buildCommon();

    this.curaColetadas = new Set();

    this.buildArvoreMirante();
    this.buildItensCura();
    this.buildExit();
    this.buildPlayer();
    this.buildCamera();

    this.input.keyboard.on('keydown-ESC', () => this.leave());
    this.game.audio.play(this, 'mus_fase');
  }

  // --------------------------------------------------------------------
  // Mirante
  // --------------------------------------------------------------------
  // A Árvore Gigante não é camada de parallax: como fundo permanente ela
  // poluía a tela e brigava com o primeiro plano. Ela aparece por
  // ENQUADRAMENTO, em pontos escolhidos — aqui, no ponto mais alto da fase,
  // como recompensa de quem sobe. Continua sendo o marco visual do bioma
  // (02_CONTINENTE.md), mas por composição em vez de onipresença.
  buildArvoreMirante() {
    if (L.MIRANTE_TILE === undefined) return;

    this.add
      .image(L.MIRANTE_TILE * TILE, this.groundTopAt(L.MIRANTE_TILE), 'bosque_arvore')
      .setOrigin(0.5, 1)
      // Parallax bem lento: quanto mais devagar a camada anda, mais distante
      // ela parece. É o que dá escala à árvore sem precisar aumentá-la.
      .setScrollFactor(0.25, 1)
      .setDepth(-60);
  }

  // --------------------------------------------------------------------
  // Itens de cura
  // --------------------------------------------------------------------
  // Fase 1 tem 1 item, no caminho ALTO (VS_1_BOSQUE_ESMERALDA.md, Seção 9) —
  // recompensa por escolher o risco em vez do caminho baixo com espinhos.
  buildItensCura() {
    this.curaZones = L.HEALING_ITEMS.map(([tileX, row], i) => {
      const x = tileX * TILE;
      const y = row * TILE;

      const sprite = this.add
        .image(x, y, 'item_cura')
        .setOrigin(0.5, 1)
        .setDepth(-5);

      this.tweens.add({
        targets: sprite,
        y: y - 6,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const zone = this.add.zone(x, y - 24, 60, 56);
      this.physics.add.existing(zone, true);
      zone.setData({ id: i, sprite });
      return zone;
    });
  }

  coletarCura(zone) {
    const id = zone.getData('id');
    if (this.curaColetadas.has(id)) return;
    this.curaColetadas.add(id);

    const sprite = zone.getData('sprite');
    this.tweens.killTweensOf(sprite);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 40,
      alpha: 0,
      duration: 420,
      onComplete: () => sprite.destroy(),
    });
    this.showNotice('Ervas curativas');
  }

  afterBosquePlayerBuilt() {
    this.curaZones.forEach((zone) => {
      this.physics.add.overlap(this.player, zone, () => this.coletarCura(zone));
    });
  }

  // --------------------------------------------------------------------
  // Ciclo
  // --------------------------------------------------------------------
  update(time) {
    if (!this.updateCommon(time)) return;
    this.updateEnemies(time);
    this.input$.lateUpdate();
  }

  finishPhase() {
    if (this.finished) return;
    this.finished = true;

    this.cameras.main.fadeOut(700);
    this.cameras.main.once('camerafadeoutcomplete', () => this.leave());
  }

  leave() {
    this.scene.start('ContinenteScene');
  }
}
