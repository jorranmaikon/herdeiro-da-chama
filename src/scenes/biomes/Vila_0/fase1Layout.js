// Layout da Fase 1 — "Despertar" (Vila Inicial, Região 0).
//
// Ensina Mover, Pular e Atacar. Sem inimigos: a Região 0 não tem nenhum
// (02_CONTINENTE.md), então o ataque é ensinado num alvo de treino estático.
//
// Este arquivo é DADO PURO — nenhuma lógica de cena. A montagem fica em
// Fase1Scene.js.
//
// Coordenadas em TILES de 64px. GROUND_ROW é a linha do chão.
//
// LIMITES FÍSICOS — derivados de PLAYER_TUNING (gameConfig.js). Não alterar
// sem recalcular lá:
//   plataformas no MÁXIMO 2 tiles acima do chão (o pulo sobe ~2,75)
//   vãos no MÁXIMO 3 tiles (alcance horizontal ~3,66)

export const TILES_WIDE = 72;
export const GROUND_ROW = 9;

// Quantas linhas de terra desenhar abaixo da linha do chão. 3 cobre a tela
// inteira até a borda inferior sem sobrar buraco.
export const FILL_ROWS = 3;

// [tileInicial, quantidadeDeTiles].
// Os vãos entre segmentos ensinam o pulo em dificuldade crescente: 1 -> 2 -> 3.
// O vão de 3 tiles (43–45) é o clímax do tutorial e vem logo antes do respiro
// da vila.
export const GROUND_SEGMENTS = [
  [0, 13],   // spawn, chão plano, sem risco — só mover
  [14, 9],   // primeiro desnível (vão de 1)
  [25, 10],  // vão de 2
  [37, 6],   // vão de 2
  [46, 16],  // vão de 3, depois o trecho da vila
  [64, 8],   // vão de 2, depois a saída
];

// Plataformas suspensas: [tileInicial, quantidadeDeTiles, alturaEmTiles].
// Altura contada a partir da linha do chão. Nunca acima de MAX_PLATFORM_TILES.
export const PLATFORMS = [
  [16, 3, 1],  // degrau baixo — introduz o pulo sem punição
  [20, 2, 2],  // já na altura máxima
  [28, 3, 2],
  [33, 2, 1],
  [39, 3, 2],
  [56, 2, 1],  // dentro da vila, opcional — leva a nada, só convida a pular
];

// Checkpoints — sempre no início de um trecho seguro, logo após um vão.
export const CHECKPOINTS = [15, 26, 47];

export const SPAWN_TILE = 2;
export const EXIT_TILE = 69;

// Alvo de treino: ensina o Ataque. Objeto de cenário destrutível, sem IA e
// sem dano — não é inimigo (04_BESTIARIO_MACRO.md não se aplica).
export const TRAINING_DUMMY_TILE = 60;

// --- Cenário ---------------------------------------------------------------
// Camada de FUNDO: parallax leve (scrollFactor < 1), sem colisão.
// São os marcos visuais e os edifícios da vila (02_CONTINENTE.md, Região 0).
export const BACKGROUND_PROPS = [
  { key: 'arvore', tileX: 5, scroll: 0.75 },        // marco visual do spawn
  { key: 'casa_taipa', tileX: 47, scroll: 0.8 },
  { key: 'moinho', tileX: 52, scroll: 0.7 },        // marco visual, isolado
  { key: 'casa_madeira', tileX: 57, scroll: 0.8 },
];

// Camada de FRENTE: mesma velocidade do chão, assentados sobre ele.
// A forja apagada e a barraca vazia são os "pequenos sinais" de que algo mudou
// (02_CONTINENTE.md, Região 0 — Lore).
export const FOREGROUND_PROPS = [
  { key: 'arbusto', tileX: 3 },
  { key: 'arbusto', tileX: 10 },
  { key: 'arbusto', tileX: 30 },
  { key: 'arbusto', tileX: 41 },
  { key: 'poco', tileX: 49 },
  { key: 'barraca', tileX: 53 },
  { key: 'barril', tileX: 55.6 },
  { key: 'caixa', tileX: 56.6 },
  { key: 'forja', tileX: 58 },
  { key: 'bigorna', tileX: 59.4 },
  { key: 'arbusto', tileX: 66 },
];

// Cercas: repetem lado a lado. Cada uma delimita algo que existe no cenário —
// nunca decoração solta.
export const FENCES = [
  { tileX: 8, pieces: 2, motivo: 'horta ao lado da árvore central' },
  { tileX: 64, pieces: 3, motivo: 'pasto na saída da vila' },
];
