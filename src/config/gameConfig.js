// Valores travados em 07_DIRECAO_ARTE_AUDIO.md, Seção 1.
// Nenhum bioma deve usar resolução diferente desta.

export const GAME_WIDTH = 384;
export const GAME_HEIGHT = 216;

export const TILE_SIZE = 16;

// Referência de física, ajustável em playtest (03_GAMEPLAY_MACRO.md, Seção 2).
export const PHYSICS_CONFIG = {
  default: 'arcade',
  arcade: {
    gravity: { y: 900 },
    debug: false,
  },
};
