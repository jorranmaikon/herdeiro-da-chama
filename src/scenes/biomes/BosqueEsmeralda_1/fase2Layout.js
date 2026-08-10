// Layout da Fase 2 — Bosque Esmeralda (Região 1).
//
// A fase da VERTICALIDADE (VS_1_BOSQUE_ESMERALDA.md, Seção 3). A Fase 1 sobe e
// desce, mas sempre num scroll lateral; aqui a fase se empilha, e a câmera
// acompanha para cima em três trechos de subida.
//
// Nenhuma mecânica nova: continua sendo mover, pular e atacar. O que muda é a
// direção principal do desafio.
//
// Mesmo schema estendido da Fase 1:
//   GROUND_SEGMENTS = [tileInicial, quantidade, linhaDoChão]
//   PLATFORMS       = [tileInicial, quantidade, linhaAbsoluta, tipo]
//
// LIMITES FÍSICOS: subida máxima de 2 tiles por salto, vão máximo de 3 tiles.
// Linha menor = mais alto.

export const TILES_WIDE = 208;
export const GROUND_ROW = 10;
export const FILL_ROWS = 3;

export const GROUND_SEGMENTS = [
  // --- Sopé: retoma o vocabulário da Fase 1 num fôlego curto ------------
  [0, 12, 10],
  [14, 10, 10],
  [24, 7, 9],    // degrau
  [33, 9, 9],

  // --- 1ª subida: a fase começa a empilhar ------------------------------
  [45, 6, 8],
  [53, 6, 7],
  [61, 8, 6],    // patamar do 1º checkpoint
  [72, 7, 6],

  // --- Patamar intermediário: a FENDA bloqueada mora aqui ---------------
  [82, 16, 6],
  [101, 8, 7],   // desce, alívio antes da 2ª subida

  // --- 2ª subida: a mais alta da fase -----------------------------------
  [112, 6, 6],
  [120, 5, 5],
  [127, 6, 4],
  [136, 10, 3],  // teto da fase — daqui se vê a Árvore Gigante

  // --- Descida longa ----------------------------------------------------
  [149, 8, 5],   // queda de 2 de uma vez, descer é livre
  [160, 9, 7],
  [172, 10, 8],

  // --- Reta final -------------------------------------------------------
  [185, 23, 9],
];

export const PLATFORMS = [
  // --- Sopé ---
  [12, 2, 8, 'solid'],
  [26, 3, 7, 'oneway'],
  [31, 2, 7, 'solid'],

  // --- 1ª subida: alterna sólida e atravessável para o jogador escolher ---
  [42, 3, 8, 'oneway'],
  [49, 3, 7, 'solid'],
  [57, 3, 6, 'oneway'],
  [66, 3, 5, 'solid'],   // desvio alto com item de cura
  [70, 3, 4, 'oneway'],

  // --- Patamar / fenda ---
  [79, 3, 5, 'solid'],
  [86, 3, 4, 'oneway'],
  [92, 3, 4, 'solid'],
  [98, 3, 5, 'oneway'],

  // --- 2ª subida ---
  [109, 3, 7, 'oneway'],
  [117, 2, 5, 'solid'],
  [124, 3, 4, 'oneway'],
  [131, 2, 3, 'solid'],
  [134, 3, 2, 'oneway'],  // último degrau até o teto da fase
  [142, 3, 2, 'solid'],   // patamar do 3º item de cura

  // --- Descida ---
  [147, 3, 4, 'oneway'],
  [156, 3, 5, 'solid'],
  [168, 3, 6, 'oneway'],
  [178, 3, 7, 'solid'],
  [190, 3, 7, 'oneway'],
  [198, 3, 8, 'solid'],
];

// [tile, linha]
export const HEALING_ITEMS = [
  [67, 4],    // desvio alto da 1ª subida
  [93, 3],    // acima do patamar da fenda
  [143, 1],   // teto da fase — o mais alto e o mais escondido
  [179, 6],
];

export const HAZARDS = [
  [17, 2],
  [37, 3],
  [63, 2],    // patamar do checkpoint: obriga a olhar antes de aterrissar
  [84, 3],
  [90, 2],
  [104, 2],
  [138, 3],   // teto da fase
  [163, 2],
  [175, 3],
  [193, 3],
];

export const SLIMES = [
  8, 20, 28, 36,
  47, 55, 64, 75,
  86, 95, 103,
  114, 122, 130, 140,
  152, 165, 174, 188, 200,
];

export const CHECKPOINTS = [14, 61, 101, 136, 185];

// Passagem baixa, visível ao lado do caminho principal e intransponível a pé.
// NÃO é resolvida neste bioma: o Rolamento só chega depois do Boss. É o
// primeiro "isso vai fazer sentido depois" do jogo
// (VS_1_BOSQUE_ESMERALDA.md, Seção 7).
export const FENDA_TILE = 88;

// Ponto mais alto da fase, onde a Árvore Gigante aparece enquadrada.
export const MIRANTE_TILE = 140;

export const SPAWN_TILE = 2;
export const EXIT_TILE = 204;
