// Layout da Fase 1 — Bosque Esmeralda (Região 1).
//
// Primeira fase do jogo com TERRENO IRREGULAR. Ensina o vocabulário novo do
// bioma: degraus, plataforma atravessável e o desvio alto/baixo que reconverge.
// Sem mecânica nova além da plataforma one-way (03_GAMEPLAY_MACRO.md, Seção 2).
//
// Este arquivo é DADO PURO — nenhuma lógica de cena.
//
// SCHEMA ESTENDIDO em relação a Vila_0/fase1Layout.js:
//   GROUND_SEGMENTS ganha uma 3ª posição: a linha do chão DAQUELE trecho.
//   PLATFORMS passa a usar linha ABSOLUTA (não altura acima do chão) e um
//   tipo de colisão. Sem o tipo, assume-se 'solid' — os layouts da Vila
//   continuam válidos sem edição.
//
// LIMITES FÍSICOS — derivados de PLAYER_TUNING (gameConfig.js):
//   subida máxima de 2 tiles por salto (vale para degrau E para plataforma)
//   vão máximo de 3 tiles
//   Linha menor = mais alto. GROUND_ROW é só a referência base do bioma.

export const TILES_WIDE = 110;
export const GROUND_ROW = 9;
export const FILL_ROWS = 3;

// [tileInicial, quantidade, linhaDoChao].
// A fase sobe do row 9 (portão da vila) até o row 7, desce, e sobe de novo —
// a Árvore Gigante fica sempre à direita, então subir é avançar.
export const GROUND_SEGMENTS = [
  [0, 14, 9],    // spawn — plano, só mover. Última vez que o chão é reto.
  [16, 8, 9],    // vão de 2 — o pulo que ele já sabe, para dar confiança
  [24, 6, 8],    // 1º DEGRAU (adjacente, sobe 1) — o novo vocabulário
  [30, 5, 7],    // 2º degrau, encadeado
  [37, 14, 7],   // trecho do desvio alto/baixo (caminho BAIXO)
  [53, 8, 8],    // desce 1 — descer é sempre livre
  [64, 10, 8],   // checkpoint A, trecho de respiro após o vão de 3
  [74, 6, 9],    // desce ao ponto mais baixo, antes da subida final
  [83, 13, 7],   // sobe de novo, agora só via plataforma
  [99, 10, 8],   // saída da fase
];

// [tileInicial, quantidade, linhaAbsoluta, tipo].
// 'oneway' = atravessável de baixo para cima.
//
// O par 39/43 é deliberado: mesma altura, lado a lado, uma sólida e uma
// atravessável. O contraste ensina a diferença sem uma linha de tutorial.
export const PLATFORMS = [
  [18, 3, 7, 'solid'],    // primeiro pulo do bioma, sem punição
  [26, 2, 6, 'solid'],    // acompanha o degrau
  [39, 3, 5, 'solid'],    // entrada do CAMINHO ALTO
  [43, 3, 5, 'oneway'],   // 1ª ATRAVESSÁVEL — ao lado de uma sólida igual
  [47, 3, 5, 'solid'],    // patamar do item de cura
  [56, 2, 6, 'solid'],
  [66, 3, 6, 'oneway'],
  [80, 3, 8, 'oneway'],   // ponte sobre o vão de 3 e degrau para o row 7
  [87, 2, 5, 'solid'],    // subida final
  [91, 2, 4, 'solid'],
  [95, 4, 3, 'solid'],    // MIRANTE — a Árvore Gigante enquadrada (02_CONTINENTE)
];

// [tileInicial, quantidade]. Perigo estático (03_GAMEPLAY_MACRO.md, Seção 3.1).
// 1 unidade de dano, nunca mata. Todos em chão plano e visíveis antes do salto —
// nunca na borda de um vão, nunca como primeira coisa vista após um pulo cego.
export const HAZARDS = [
  [21, 2],   // primeira lição — a plataforma em 18 é a rota alternativa óbvia
  [44, 3],   // caminho BAIXO do desvio: dá razão mecânica para escolher o alto
  [70, 2],   // teste, já sob pressão de aterrissagem após o vão de 3
];

// [tile, linha]. Fase 1 tem 1 item (VS_1, Seção 9), no caminho ALTO —
// recompensa por escolher o risco.
export const HEALING_ITEMS = [
  [48, 4],
];

// Checkpoints: sempre no início de um trecho seguro, logo após um vão.
export const CHECKPOINTS = [16, 64, 104];

// Ponto mais alto da fase. A Árvore Gigante é enquadrada aqui, como recompensa
// de quem sobe — ela não é camada de parallax (ver BosqueFase1Scene).
export const MIRANTE_TILE = 97;

export const SPAWN_TILE = 2;
export const EXIT_TILE = 107;
