import BosqueSceneBase from './BosqueSceneBase.js';
import * as L from './fase1Layout.js';

// Fase 1 do Bosque Esmeralda — primeira fase do jogo com terreno irregular.
//
// Ensina o vocabulário novo do bioma sem introduzir mecânica: degraus,
// plataforma atravessável, o desvio alto/baixo que reconverge e o perigo de
// cenário. O Rolamento (Brasa 1) só chega depois do Boss, então tudo aqui é
// vencível com mover, pular e atacar (VS_1_BOSQUE_ESMERALDA.md, Seção 3).
//
// Toda a montagem vive em BosqueSceneBase. O que uma fase declara é só o seu
// layout e para onde ela leva.
export default class BosqueFase1Scene extends BosqueSceneBase {
  constructor() {
    super('BosqueFase1Scene', L);
  }

  faseId() {
    return 'bosque_1';
  }

  proximaCena() {
    return 'BosqueFase2Scene';
  }
}
