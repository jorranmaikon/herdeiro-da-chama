// Layout da Fase 2 — "Arredores" (Vila Inicial, Região 0).
//
// Fase de EXPLORAÇÃO (VS_0_VILA_INICIAL.md, Seção 3): percurso mais curto e
// mais horizontal que a Fase 1, com foco em ambiente e diálogo em vez de
// desafio de plataforma. Ensina Interagir.
//
// É aqui que a Vila entrega os "pequenos sinais" de que algo mudou
// (02_CONTINENTE.md, Região 0): a barraca de mercado vazia, a forja apagada.
// Nenhuma linha de texto explica — o cenário conta.
//
// Este arquivo é DADO PURO. A montagem fica em Fase2Scene.js, e
// tools/preview_fase.py lê estes mesmos dados.
//
// Vale o mesmo conjunto de regras de composição da Fase 1: edifício de fundo
// com 2+ tiles livres até a borda de um vão, cerca sempre em dupla e nunca
// alcançando um vão.

export const TILES_WIDE = 78;
export const GROUND_ROW = 9;
export const FILL_ROWS = 3;

// Menos vãos e mais curtos que a Fase 1: aqui o assunto não é o pulo.
export const GROUND_SEGMENTS = [
  [0, 22],   // entrada da borda da vila
  [24, 26],  // vão de 2 — praça: barraca, forja, Ancião
  [52, 26],  // vão de 2 — saída, com o desvio bloqueado no caminho
];

// Só duas plataformas, e ambas com função.
// A de [63, 4, 1] NÃO é para subir: fica a 1 tile do chão e forma uma fresta
// baixa. O jogador tem 2 tiles de altura e não passa por baixo dela em pé —
// é o desvio bloqueado da Seção 8 do VS, que se resolve com o Rolamento
// (Brasa 1, obtida no Bosque Esmeralda).
export const PLATFORMS = [
  [16, 3, 1],
  [68, 4, 1],
];

export const CHECKPOINTS = [2, 53];

export const SPAWN_TILE = 2;
export const EXIT_TILE = 75;

// Item de cura, dentro da fresta. Fica VISÍVEL desde a primeira passagem e
// inalcançável até o jogador ter o Rolamento — planta a curiosidade que o
// 03_GAMEPLAY_MACRO.md, Seção 6, pede.
export const ITEM_CURA_TILE = 70.2;

// O Ancião fica na praça, junto ao poço. Esta é a fase à qual ele pertence
// pelo VS_0_VILA_INICIAL.md.
export const ANCIAO_TILE = 38;

// --- Cenário ---------------------------------------------------------------
export const BACKGROUND_PROPS = [
  { key: 'casa_taipa', tileX: 8, scroll: 0.8 },
  { key: 'casa_madeira', tileX: 31, scroll: 0.8 },
  { key: 'moinho', tileX: 45, scroll: 0.7 },
];

// A árvore central NÃO se repete aqui: ela é o marco visual da Fase 1, e
// reaparecer diluiria isso. O trecho final da fase também fica de propósito
// mais vazio de construções — é a saída da vila rumo ao desconhecido.

// A barraca vazia e a forja apagada são os sinais. Ficam no centro da praça,
// com espaço livre em volta, para o jogador reparar em cada uma.
export const FOREGROUND_PROPS = [
  { key: 'arbusto', tileX: 4 },
  { key: 'barril', tileX: 13 },
  { key: 'caixa', tileX: 13.9 },
  { key: 'arbusto', tileX: 20 },
  { key: 'barraca', tileX: 27 },
  { key: 'poco', tileX: 35 },
  { key: 'forja', tileX: 42 },
  { key: 'bigorna', tileX: 48 },
  { key: 'arbusto', tileX: 66 },
  { key: 'arbusto', tileX: 74 },
];

export const FENCES = [
  { tileX: 6, pieces: 2, motivo: 'horta na entrada' },
  { tileX: 55, pieces: 2, motivo: 'cercado antes do desvio' },
];
