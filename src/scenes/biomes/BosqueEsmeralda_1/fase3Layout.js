// Layout da Fase 3 — Bosque Esmeralda (Região 1).
//
// A fase que COMBINA (VS_1_BOSQUE_ESMERALDA.md, Seção 3). Nada de vocabulário
// novo: degrau, plataforma atravessável, desvio alto/baixo, perigo de cenário e
// os três inimigos já apareceram. O que muda é que passam a aparecer juntos, e
// o espaço entre uma ameaça e a seguinte encurta.
//
// Termina na arena do Mini-Boss, que é deliberadamente PLANA e sem plataforma:
// depois de uma fase inteira de terreno, o teste final é de leitura de padrão,
// não de pulo.
//
// Mesmo schema estendido das fases anteriores:
//   GROUND_SEGMENTS = [tileInicial, quantidade, linhaDoChão]
//   PLATFORMS       = [tileInicial, quantidade, linhaAbsoluta, tipo]
//
// LIMITES FÍSICOS: subida máxima de 2 tiles por salto, vão máximo de 3 tiles.

export const TILES_WIDE = 240;
export const GROUND_ROW = 9;
export const FILL_ROWS = 3;

export const GROUND_SEGMENTS = [
  // --- Abertura: reconhecimento, densidade baixa ------------------------
  [0, 13, 9],
  [15, 9, 9],
  [24, 8, 8],

  // --- Combinações: vão + degrau + inimigo no mesmo fôlego --------------
  [35, 7, 7],
  [45, 10, 7],
  [58, 6, 8],
  [66, 9, 6],    // salto alto, guardado
  [78, 12, 6],   // checkpoint

  // --- Corredor alto/baixo: as duas rotas correm em paralelo ------------
  [93, 14, 7],
  [110, 8, 8],
  [121, 11, 8],

  // --- Trecho mais denso da fase ---------------------------------------
  [135, 9, 7],
  [147, 7, 6],
  [157, 12, 6],
  [172, 9, 7],
  [184, 10, 8],  // checkpoint antes da arena

  // --- Arena do Mini-Boss: plana, longa, sem plataforma nenhuma --------
  [197, 43, 8],
];

export const PLATFORMS = [
  [13, 3, 7, 'oneway'],
  [21, 2, 7, 'solid'],
  [32, 3, 6, 'oneway'],
  [39, 3, 5, 'solid'],    // desvio alto com item de cura
  [43, 3, 5, 'oneway'],
  [55, 3, 6, 'solid'],
  [62, 3, 5, 'oneway'],
  [72, 3, 4, 'solid'],    // ponto alto guardado
  [76, 3, 4, 'oneway'],
  [90, 3, 6, 'oneway'],
  [97, 3, 5, 'solid'],    // rota alta do corredor
  [102, 3, 5, 'oneway'],
  [107, 3, 6, 'solid'],
  [118, 3, 7, 'oneway'],
  [132, 3, 6, 'solid'],
  [143, 3, 5, 'oneway'],
  [153, 3, 5, 'solid'],   // item de cura antes do trecho denso
  [163, 3, 4, 'oneway'],
  [169, 3, 5, 'solid'],
  [181, 3, 6, 'oneway'],
  [192, 3, 7, 'solid'],   // última travessia antes da arena
];

export const HEALING_ITEMS = [
  [40, 4],
  [73, 3],
  [98, 4],
  [154, 4],
  // Imediatamente antes da arena: a reserva que o Bestiário pede antes de um
  // Mini-Boss (05_BALANCEAMENTO.md, Seção 3).
  [193, 6],
];

export const HAZARDS = [
  [18, 2],
  [27, 3],
  [48, 3],
  [51, 2],
  [69, 2],
  [82, 3],
  [97, 3],    // rota BAIXA do corredor: dá razão para subir
  [101, 2],
  [125, 3],
  [138, 2],
  [160, 3],
  [165, 2],
  [175, 3],
  [188, 2],
];

export const SLIMES = [
  6, 19, 28,
  38, 50, 60, 70, 84,
  99, 113, 127,
  140, 151, 162, 177, 190,
];

export const LOBOS = [
  30, 47, 81, 104, 124, 150, 167, 187,
];

export const MORCEGOS = [
  33, 43, 63, 75, 91, 108, 119, 133, 144, 164, 180,
];

export const CHECKPOINTS = [15, 78, 121, 184];

export const MIRANTE_TILE = 74;

export const SPAWN_TILE = 2;
export const EXIT_TILE = 236;
