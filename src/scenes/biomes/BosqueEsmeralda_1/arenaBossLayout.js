// Layout da Arena do Guardião da Floresta — Bosque Esmeralda (Região 1).
//
// A luta final do bioma, na base da Árvore Gigante. Arena PLANA e larga: depois
// de três fases inteiras de terreno, o teste é de leitura de padrão, não de
// pulo. A largura existe porque o Mergulho precisa dela — o ataque só é
// esquivável se houver para onde correr.
//
// Sem plataforma nenhuma, sem perigo de cenário, sem inimigo comum. Só ele.
//
// Este arquivo é a arena de teste do Boss. Ela vira a última seção da Fase 4
// quando a fase de exploração for construída.

export const TILES_WIDE = 48;
export const GROUND_ROW = 9;
export const FILL_ROWS = 3;

export const GROUND_SEGMENTS = [
  [0, 48, 9],
];

export const PLATFORMS = [];
export const HEALING_ITEMS = [
  // Duas doses antes do chefe, conforme a régua do 05_BALANCEAMENTO.md.
  [3, 8],
  [6, 8],
];
export const HAZARDS = [];
export const SLIMES = [];

export const CHECKPOINTS = [2];

// A Árvore Gigante enquadrada atrás da arena: é a base dela que a luta acontece.
export const MIRANTE_TILE = 30;

// O Boss, no centro da arena.
export const GUARDIAO_TILE = 32;

export const SPAWN_TILE = 2;
export const EXIT_TILE = 45;
