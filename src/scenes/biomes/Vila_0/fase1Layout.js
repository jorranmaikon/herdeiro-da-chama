// Layout da Fase 1 — "Despertar" (Vila Inicial, Região 0).
// Ensina Mover + Pular. Sem inimigos (02_CONTINENTE.md, Região 0).
//
// Coordenadas em TILES (64px). GROUND_ROW é a linha do chão.
//
// LIMITES FÍSICOS — derivados de PLAYER_TUNING, não alterar sem recalcular:
//   plataformas no MÁXIMO 2 tiles acima do chão (pulo sobe 2,75)
//   vãos no MÁXIMO 3 tiles (alcance horizontal 3,66)
export const TILES_WIDE = 92;
export const GROUND_ROW = 9;

// [tileInicial, quantidadeDeTiles] — os vãos entre segmentos ensinam o pulo,
// em dificuldade crescente (1 -> 2 -> 3 tiles).
export const GROUND_SEGMENTS = [
  [0, 14],
  [15, 11],
  [28, 10],
  [41, 8],
  [52, 12],
  [67, 7],
  [77, 15],
];

// Plataformas opcionais, sempre a 2 tiles do chão.
export const PLATFORMS = [
  [20, 3],
  [33, 3],
  [46, 2],
  [71, 2],
  [84, 3],
];

// Checkpoints — no início de cada trecho seguro, logo após um vão.
export const CHECKPOINTS = [16, 29, 42, 53, 78];

// Marcos visuais da região (02_CONTINENTE.md: moinho antigo e árvore central).
// O moinho fica isolado, sem cerca ou plataforma por perto, pra ter destaque.
export const PROPS = [
  { key: 'arvore', tileX: 7 },
  { key: 'arvore', tileX: 25 },
  { key: 'moinho', tileX: 60 },
];

// Cada cerca delimita algo que existe no cenário — nunca decoração solta.
export const FENCES = [
  { tileX: 31, pieces: 3, motivo: 'horta da vila' },
  { tileX: 79, pieces: 2, motivo: 'pasto na saída' },
];

export const SPAWN_TILE = 2;
export const EXIT_TILE = 89;
