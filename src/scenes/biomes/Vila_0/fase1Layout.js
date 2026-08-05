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
  [71, GROUND_ROW - 2, 2],
  [84, GROUND_ROW - 2, 3],
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
// O moinho fica sozinho no trecho de descanso, perto do Camponês e sem cerca
// nem plataforma por perto — é o marco visual da região e precisa de destaque
// (02_CONTINENTE.md, Região 0).
export const PROPS = [
  { key: 'arvore', tileX: 7, depth: -5 },
  { key: 'arvore', tileX: 25, depth: -5 },
  { key: 'moinho', tileX: 62, depth: -5 },
];

// Cercas — cada uma delimita algo que existe de fato no cenário, nunca decoração solta.
// Nenhuma cerca no trecho do moinho — ele precisa ficar isolado.
export const FENCES = [
  { startTileX: 31, pieces: 3, reason: 'horta da vila' },
  { startTileX: 79, pieces: 2, reason: 'pasto na saida da vila' },
];

// NPC principal da fase (09_TEMPLATE_VERTICAL_SLICE.md, Seção 2).
export const NPC_CAMPONES = {
  tileX: 56,
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
