import BosqueSceneBase from './BosqueSceneBase.js';
import * as L from './arenaBossLayout.js';

// Arena do Guardião da Floresta — a luta que encerra o Bosque Esmeralda.
//
// Cena isolada por enquanto, para o chefe poder ser testado sem atravessar as
// três fases antes. Vira a última seção da Fase 4 quando a fase de exploração
// for construída — o Boss é configuração de dados sobre uma cena de bioma, não
// depende de estar nesta cena em particular.
export default class BosqueBossScene extends BosqueSceneBase {
  constructor() {
    super('BosqueBossScene', L);
  }

  faseId() {
    return 'bosque_4';
  }
}
