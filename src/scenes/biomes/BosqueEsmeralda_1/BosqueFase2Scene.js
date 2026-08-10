import BosqueSceneBase from './BosqueSceneBase.js';
import * as L from './fase2Layout.js';

// Fase 2 do Bosque Esmeralda — a fase da verticalidade.
//
// A Fase 1 sobe e desce, mas sempre em scroll lateral. Aqui a fase se empilha:
// duas subidas longas levam do sopé ao ponto mais alto do bioma, e a descida
// depois delas é o alívio. Continua sem mecânica nova — o que muda é a direção
// principal do desafio (VS_1_BOSQUE_ESMERALDA.md, Seção 3).
//
// É aqui que mora a FENDA bloqueada: uma passagem baixa visível do caminho
// principal, intransponível a pé, que só o Rolamento resolve — e o Rolamento
// só chega depois do Boss. É o primeiro "isso vai fazer sentido depois" do
// jogo.
export default class BosqueFase2Scene extends BosqueSceneBase {
  constructor() {
    super('BosqueFase2Scene', L);
  }

  faseId() {
    return 'bosque_2';
  }

}
