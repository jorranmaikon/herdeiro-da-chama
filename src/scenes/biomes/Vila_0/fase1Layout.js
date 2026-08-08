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
//
// ESPAÇAMENTO: a primeira montagem colocou casa em cima de moinho e o alvo de
// treino sumiu no meio dos props. A fase foi alongada de 72 para 92 tiles e
// cada elemento ganhou espaço livre em volta. Vale a regra: melhor ter menos
// props e conseguir ler cada um do que empilhar tudo.

export const TILES_WIDE = 92;
export const GROUND_ROW = 9;

// Quantas linhas de terra desenhar abaixo da linha do chão.
export const FILL_ROWS = 3;

// [tileInicial, quantidadeDeTiles].
// Os vãos entre segmentos ensinam o pulo em dificuldade crescente: 1 -> 2 -> 3.
// O vão de 3 tiles (51–53) é o clímax do tutorial e vem logo antes do respiro
// da vila.
export const GROUND_SEGMENTS = [
  [0, 16],   // spawn e árvore central — chão plano, só mover
  [17, 10],  // primeiro desnível (vão de 1)
  [29, 12],  // vão de 2 — plataformas e alvo de treino
  [43, 8],   // vão de 2 — casa isolada na borda da vila
  [54, 24],  // vão de 3 — a vila propriamente dita
  [80, 12],  // vão de 2 — saída
];

// Plataformas suspensas: [tileInicial, quantidadeDeTiles, alturaEmTiles].
// Altura contada a partir da linha do chão. Nunca acima de MAX_PLATFORM_TILES.
export const PLATFORMS = [
  [19, 3, 1],  // degrau baixo — introduz o pulo sem punição
  [23, 2, 2],  // já na altura máxima
  [31, 3, 2],
  [39, 2, 1],
];

// Checkpoints — sempre no início de um trecho seguro, logo após um vão.
export const CHECKPOINTS = [18, 30, 55];

export const SPAWN_TILE = 2;
export const EXIT_TILE = 89;

// Alvo de treino: ensina o Ataque. Fica sozinho no meio de um segmento, sem
// nenhum prop por perto — na primeira montagem ele desaparecia no cenário.
// Objeto de cenário destrutível, sem IA e sem dano: não é inimigo.
export const TRAINING_DUMMY_TILE = 36;

// --- Cenário ---------------------------------------------------------------
// Camada de FUNDO: parallax leve (scrollFactor < 1), sem colisão.
// offsetY afunda o prop no chão — a árvore tem raízes que se espalham para os
// lados e, assentada exatamente na linha do chão, deixava terra flutuando.
export const BACKGROUND_PROPS = [
  { key: 'arvore', tileX: 6, scroll: 0.75, offsetY: 26 },  // marco visual
  { key: 'casa_madeira', tileX: 46, scroll: 0.8 },         // casa isolada
  { key: 'casa_taipa', tileX: 58, scroll: 0.8 },           // vila
  { key: 'moinho', tileX: 68, scroll: 0.7 },               // marco visual
];

// Camada de FRENTE: mesma velocidade do chão, assentados sobre ele.
// A forja apagada é um dos "pequenos sinais" de que algo mudou
// (02_CONTINENTE.md, Região 0 — Lore).
//
// A barraca de mercado e a bigorna ficaram DE FORA: não havia espaço para
// exibi-las sem encostar num edifício de fundo. Os assets seguem prontos no
// repositório para quando a fase 2 (exploração) for montada.
export const FOREGROUND_PROPS = [
  { key: 'arbusto', tileX: 3 },
  { key: 'arbusto', tileX: 13 },
  { key: 'arbusto', tileX: 26 },
  { key: 'barril', tileX: 44 },
  { key: 'caixa', tileX: 44.9 },
  { key: 'arbusto', tileX: 50 },
  { key: 'poco', tileX: 63 },
  { key: 'forja', tileX: 73 },
  { key: 'arbusto', tileX: 76 },
  { key: 'arbusto', tileX: 86 },
];

// Cercas: repetem lado a lado. Cada peça tem ~4,2 tiles de largura, e o alcance
// é validado em Fase1Scene para nunca atravessar um vão — cerca suspensa sobre
// o abismo denuncia na hora que o cenário é só decoração.
export const FENCES = [
  { tileX: 9, pieces: 1, motivo: 'horta ao lado da árvore central' },
  { tileX: 82, pieces: 2, motivo: 'pasto na saída da vila' },
];
