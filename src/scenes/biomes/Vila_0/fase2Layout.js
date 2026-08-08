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

// Três plataformas, todas com função.
//
// A de [68, 4, 1] NÃO é para subir: fica a 1 tile do chão e forma uma fresta
// baixa. O jogador tem 2 tiles de altura e não passa por baixo dela em pé —
// é o desvio bloqueado da Seção 8 do VS, que se resolve com o Rolamento
// (Brasa 1, obtida no Bosque Esmeralda).
export const PLATFORMS = [
  [16, 3, 1],
  [30, 2, 2],   // guarda o item de cura — exige pulo, mas é alcançável agora
  [68, 4, 1],
];

export const CHECKPOINTS = [2, 53];

export const SPAWN_TILE = 2;
export const EXIT_TILE = 75;

// Item de cura, em cima da plataforma alta da praça.
//
// ELE NÃO FICA NO DESVIO BLOQUEADO, e isso é deliberado: a Fase 2 é a última
// da Vila, e não existe exploração para trás entre biomas
// (06_INTERFACE_UX.md, Seção 2.2). Um item atrás de um obstáculo que só o
// Rolamento abre ficaria inalcançável para sempre, exceto em replay — ou
// seja, um item morto. Aqui ele recompensa exploração de verdade: exige
// desviar do caminho e pular, mas é obtível na primeira passagem.
export const ITEM_CURA_TILE = 31;
export const ITEM_CURA_ALTURA = 2;   // em tiles acima do chão

// O que fica dentro da fresta é uma PISTA, não um item: um brilho fraco no
// escuro, visível e inalcançável, que existe só para o jogador registrar "dá
// pra passar aqui, mas não agora". Vira colecionável de verdade quando o jogo
// tiver um, e aí o replay da fase passa a valer a pena.
export const DESVIO_BLOQUEADO_TILE = 70.2;

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
