import BosqueSceneBase from './BosqueSceneBase.js';
import * as L from './fase3Layout.js';

// Fase 3 do Bosque Esmeralda — a fase que combina.
//
// Nenhum vocabulário novo: degrau, plataforma atravessável, desvio alto/baixo,
// perigo de cenário e os três inimigos já apareceram. O que muda é que passam a
// aparecer juntos, e o espaço entre uma ameaça e a seguinte encurta
// (VS_1_BOSQUE_ESMERALDA.md, Seção 3).
//
// Termina na arena do Mini-Boss — o Urso Corrompido. A arena é plana e sem
// plataforma nenhuma de propósito: depois de uma fase inteira de terreno, o
// teste final é de leitura de padrão, não de pulo.
//
// PENDENTE: o Urso ainda não tem arte nem implementação, então hoje a arena é
// só o trecho final da fase. Ele entra sem mudar esta cena — como inimigo, é
// configuração de dados (08_ARQUITETURA_TECNICA.md, Seção 8).
export default class BosqueFase3Scene extends BosqueSceneBase {
  constructor() {
    super('BosqueFase3Scene', L);
  }

  faseId() {
    return 'bosque_3';
  }
}
