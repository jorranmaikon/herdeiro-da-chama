// Layout da Fase 1 — "Despertar" (Vila Inicial, Região 0).
// Ensina apenas Mover + Pular. Sem inimigos, sem boneco de treino
// (02_CONTINENTE.md, Região 0 — "Inimigos: Nenhum").
//
// Coordenadas em TILES (64px). O eixo Y cresce pra baixo; GROUND_ROW é o chão base.
export const TILES_WIDE = 92;
export const TILES_HIGH = 12;
export const GROUND_ROW = 9;

// Segmentos de chão: [tileInicial, quantidadeDeTiles].
// Os vãos entre segmentos são os buracos que ensinam o pulo, em dificuldade crescente.
export const GROUND_SEGMENTS = [
  [0, 14],   // início seguro — só andar
  [16, 10],  // primeiro vão curto (1 tile)
  [28, 9],   // vão de 2 tiles
  [40, 8],   // vão de 3 tiles
  [51, 12],  // trecho de descanso, onde fica o Camponês
  [66, 7],   // vão de 3 tiles
  [76, 16],  // trecho final até a saída
];

// Plataformas suspensas: [tileX, tileY, quantidadeDeTiles].
// Servem de rota alternativa/aprendizado de altura, nunca obrigatórias.
export const PLATFORMS = [
  [21, 6, 3],
  [33, 6, 3],
  [45, 5, 3],
  [58, 6, 2],
  [70, 5, 3],
];

// Props de cenário (posição em tiles, ancorados pela base).
export const PROPS = [
  { key: 'arvore', tileX: 7, depth: -5 },
  { key: 'moinho', tileX: 34, depth: -5 },
  { key: 'arvore', tileX: 80, depth: -5 },
];

// Cercas decorativas ao longo do caminho.
export const FENCES = [
  { tileX: 3, count: 4 },
  { tileX: 53, count: 5 },
  { tileX: 84, count: 4 },
];

// NPC principal da fase (09_TEMPLATE_VERTICAL_SLICE.md, Seção 2).
export const NPC_CAMPONES = {
  tileX: 56,
  name: 'Camponês',
  textureKey: 'npc_campones',
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
