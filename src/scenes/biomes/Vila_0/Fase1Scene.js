import { TILE, GROUND_INSET } from '../../../config/gameConfig.js';
import VilaSceneBase from './VilaSceneBase.js';
import TutorialHints from './TutorialHints.js';
import * as L from './fase1Layout.js';

// Fase 1 da Vila Inicial — "Despertar".
//
// Tudo que é montagem comum de fase vive em VilaSceneBase. Aqui fica só o que
// é próprio desta fase: as dicas de comando e o alvo de treino.
//
// Ensina Mover, Pular e Atacar. Sem inimigos: a Região 0 não tem nenhum
// (02_CONTINENTE.md), então o ataque é ensinado num alvo estático.
export default class Fase1Scene extends VilaSceneBase {
  constructor() {
    super('Fase1Scene', L);
  }

  create() {
    this.buildCommon();

    this.attackConsumed = false;
    this.buildTrainingDummy();
    this.buildExit();
    this.buildPlayer();
    this.buildCamera();
    this.buildTutorial();

    this.input.keyboard.on('keydown-ESC', () => this.leave());
    this.game.audio.play(this, 'mus_fase');
  }

  // --------------------------------------------------------------------
  // Alvo de treino
  // --------------------------------------------------------------------
  buildTrainingDummy() {
    const x = L.TRAINING_DUMMY_TILE * TILE;
    this.dummy = this.add
      .image(x, this.groundY + GROUND_INSET, 'alvo_treino')
      .setOrigin(0.5, 1)
      .setDepth(-5);
    this.dummyHits = 0;

    this.dummyZone = this.add.zone(x, this.groundY - 64, 90, 128);
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

  buildTutorial() {
    // O primeiro vão é onde o pulo passa a ser necessário.
    const [inicio, quantidade] = L.GROUND_SEGMENTS[0];
    this.tutorial = new TutorialHints(this, {
      alvoX: L.TRAINING_DUMMY_TILE * TILE,
      primeiroVaoX: (inicio + quantidade) * TILE,
    });
  }


  afterPlayerBuilt() {
    this.physics.add.overlap(this.player, this.dummyZone, () => {
      if (this.player.isAttacking && !this.attackConsumed) {
        this.attackConsumed = true;
        this.hitDummy();
      }
    });
  }

  // --------------------------------------------------------------------
  // Ciclo
  // --------------------------------------------------------------------
  update(time) {
    if (!this.updateCommon(time)) return;

    // Libera o próximo acerto no alvo só quando o ataque termina — senão um
    // único golpe contaria vários frames de overlap.
    if (!this.player.isAttacking) this.attackConsumed = false;

    this.tutorial.atualizar(this.player, this.input$);

    this.input$.lateUpdate();
  }

  faseId() {
    return 'vila_1';
  }

  finishPhase() {
    if (this.finished) return;
    this.finished = true;
    this.concluirFase();
    this.tutorial.destruir();

    this.cameras.main.fadeOut(700);
    // Volta ao Mapa da Vila: o jogador ainda NÃO deixou a região. A Crônica de
    // Partida pertence ao fim da Fase 2 (VS_0_VILA_INICIAL.md, Seção 3).
    this.cameras.main.once('camerafadeoutcomplete', () => this.leave());
  }

  leave() {
    this.tutorial?.destruir();
    this.scene.start('VilaMapaScene');
  }
}
