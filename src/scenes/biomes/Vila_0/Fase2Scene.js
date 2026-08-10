import { TILE, GROUND_INSET } from '../../../config/gameConfig.js';
import VilaSceneBase from './VilaSceneBase.js';
import NPC from '../../../entities/npcs/NPC.js';
import * as L from './fase2Layout.js';

// Fase 2 da Vila Inicial — "Arredores".
//
// Fase de exploração (VS_0_VILA_INICIAL.md, Seção 3): ensina Interagir, entrega
// os "pequenos sinais" pelo cenário e fecha a Região 0. Concluí-la dispara a
// Crônica de Partida — é aqui que o protagonista deixa a vila.
//
// A montagem comum vive em VilaSceneBase; aqui fica só o Ancião, o desvio
// bloqueado e a saída.
export default class Fase2Scene extends VilaSceneBase {
  constructor() {
    super('Fase2Scene', L);
  }

  create() {
    this.buildCommon();

    this.conversando = false;
    this.anciaoOuvido = false;
    this.curaColetada = false;

    this.buildAnciao();
    this.buildItemCura();
    this.buildExit();
    this.buildPlayer();
    this.buildCamera();

    this.input.keyboard.on('keydown-ESC', () => this.leave());
    this.game.audio.play(this, 'mus_fase');
  }

  // --------------------------------------------------------------------
  // Ancião
  // --------------------------------------------------------------------
  buildAnciao() {
    this.anciao = new NPC(this, L.ANCIAO_TILE * TILE, this.groundY + GROUND_INSET, {
      sprite: 'anciao',
      nome: 'Ancião',
      aoInteragir: () => this.conversar(),
    });
    this.anciao.setDepth(-4);
  }

  conversar() {
    if (this.conversando) return;
    this.conversando = true;

    // Overlay em paralelo: a cena de baixo pausa, mas continua visível.
    this.scene.pause();
    this.scene.launch('DialogueOverlay', {
      id: 'anciao_vila',
      from: this.scene.key,
      onClose: () => {
        this.conversando = false;
        this.anciaoOuvido = true;
      },
    });
  }

  // --------------------------------------------------------------------
  // Desvio bloqueado
  // --------------------------------------------------------------------
  // O item fica sob uma plataforma a 1 tile do chão. O jogador tem 2 tiles de
  // altura, então não entra em pé — nenhuma barreira extra é necessária, a
  // própria física resolve. Com o Rolamento (Brasa 1, Bosque Esmeralda) ele
  // passa. Fica VISÍVEL desde a primeira passagem, plantando a curiosidade que
  // o 03_GAMEPLAY_MACRO.md, Seção 6, pede.
  buildItemCura() {
    const x = L.ITEM_CURA_TILE * TILE;
    this.itemCura = this.add
      .image(x, this.groundY + GROUND_INSET, 'item_cura')
      .setOrigin(0.5, 1)
      .setDepth(-5);

    this.tweens.add({
      targets: this.itemCura,
      y: this.itemCura.y - 6,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.curaZone = this.add.zone(x, this.groundY - 24, 60, 56);
    this.physics.add.existing(this.curaZone, true);
  }

  coletarCura() {
    if (this.curaColetada) return;
    this.curaColetada = true;

    this.tweens.killTweensOf(this.itemCura);
    this.tweens.add({
      targets: this.itemCura,
      y: this.itemCura.y - 40,
      alpha: 0,
      duration: 420,
      onComplete: () => this.itemCura.destroy(),
    });
    this.showNotice('Ervas curativas');
  }


  afterPlayerBuilt() {
    this.physics.add.overlap(this.player, this.curaZone, () => this.coletarCura());
  }

  // --------------------------------------------------------------------
  // Ciclo
  // --------------------------------------------------------------------
  update(time) {
    if (!this.updateCommon(time)) return;

    const perto = this.anciao.atualizar(this.player, this.input$.interactPressed());
    this.input$.setInteractAvailable(perto);

    this.input$.lateUpdate();
  }

  faseId() {
    return 'vila_2';
  }

  finishPhase() {
    if (this.finished) return;
    this.finished = true;
    this.concluirFase();

    this.cameras.main.fadeOut(700);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Fim da Vila Inicial: a Crônica de Partida marca a saída rumo ao
      // Bosque Esmeralda (VS_0_VILA_INICIAL.md, Seção 2).
      this.scene.start('ChronicleScene', { id: 'cronica_vila_02' });
    });
  }

  leave() {
    this.scene.start('VilaMapaScene');
  }
}
