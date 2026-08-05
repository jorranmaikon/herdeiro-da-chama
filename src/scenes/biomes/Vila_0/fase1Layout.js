// Layout da Fase 1 — "Despertar" (Vila Inicial, Região 0).
// Ensina apenas Mover + Pular. Sem inimigos (02_CONTINENTE.md, Região 0).
//
// Coordenadas em TILES (64px). GROUND_ROW é a linha do chão base.
//
// LIMITES FÍSICOS (calculados a partir de PLAYER_TUNING — não alterar sem recalcular):
//   altura máxima de pulo ....... 2,75 tiles  -> plataformas no MÁXIMO 2 tiles acima
//   alcance horizontal .......... 3,66 tiles  -> vãos no MÁXIMO 3 tiles
export const TILES_WIDE = 92;
export const TILES_HIGH = 12;
export const GROUND_ROW = 9;

// Segmentos de chão: [tileInicial, quantidadeDeTiles].
// Os vãos entre segmentos ensinam o pulo, em dificuldade crescente (1 -> 2 -> 3 tiles).
export const GROUND_SEGMENTS = [
  [0, 14],   // início seguro — só andar
  [15, 11],  // vão de 1 tile
  [28, 10],  // vão de 2 tiles
  [41, 8],   // vão de 3 tiles
  [52, 12],  // trecho de descanso, onde fica o Camponês
  [67, 7],   // vão de 3 tiles
  [77, 15],  // trecho final até a saída
];

// Plataformas suspensas — rota alternativa opcional, nunca obrigatória.
// Todas a 2 tiles do chão (GROUND_ROW - 2), dentro do alcance do pulo.
export const PLATFORMS = [
  [20, GROUND_ROW - 2, 3],
  [33, GROUND_ROW - 2, 3],
  [46, GROUND_ROW - 2, 2],
  [59, GROUND_ROW - 2, 3],
  [71, GROUND_ROW - 2, 2],
];

// Checkpoints da fase (06_INTERFACE_UX.md, Seção 2.2; 05_BALANCEAMENTO.md, Seção 6).
// Ficam sempre no início de um segmento de chão seguro, logo após um vão.
export const CHECKPOINTS = [
  { tileX: 16 },
  { tileX: 29 },
  { tileX: 42 },
  { tileX: 53 },
  { tileX: 78 },
];

// Props de cenário (posição em tiles, ancorados pela base).
export const PROPS = [
  { key: 'arvore', tileX: 7, depth: -5 },
  { key: 'moinho', tileX: 35, depth: -5 },
  { key: 'arvore', tileX: 82, depth: -5 },
];

// Cercas — cada uma delimita algo que existe de fato no cenário, nunca decoração solta.
export const FENCES = [
  { startTileX: 31, pieces: 3, reason: 'horta do moinho' },
  { startTileX: 54, pieces: 3, reason: 'pasto do campones' },
];

// NPC principal da fase (09_TEMPLATE_VERTICAL_SLICE.md, Seção 2).
export const NPC_CAMPONES = {
  tileX: 58,
  name: 'Camponês',
  textureKey: 'npc_campones',
  frameCount: 2,
  portraitKey: 'retrato_campones',
  lines: [
    'Bom dia! Cedo pra você estar andando por aqui.',
    'A colheita vai bem, graças aos céus. Mas ando dormindo mal.',
    'Tem uns barulhos vindo da mata, à noite. Coisa que eu nunca ouvi antes.',
    'Deve ser bicho. Deve ser só bicho.',
  ],
};

// Ponto de saída da fase — leva de volta ao mapa do Bioma.
export const EXIT_TILE_X = 89;
