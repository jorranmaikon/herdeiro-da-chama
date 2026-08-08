// Layout da Fase 1 — "Despertar" (Vila Inicial, Região 0).
//
// Ensina Mover, Pular e Atacar. Sem inimigos: a Região 0 não tem nenhum
// (02_CONTINENTE.md), então o ataque é ensinado num alvo de treino estático.
//
// Este arquivo é DADO PURO — nenhuma lógica de cena. A montagem fica em
// Fase1Scene.js, e `tools/preview_fase.py` lê estes mesmos dados para gerar
// uma imagem da fase antes de qualquer código rodar.
//
// Coordenadas em TILES de 64px. GROUND_ROW é a linha do chão.
//
// LIMITES FÍSICOS — derivados de PLAYER_TUNING (gameConfig.js):
//   plataformas no MÁXIMO 2 tiles acima do chão (o pulo sobe ~2,75)
//   vãos no MÁXIMO 3 tiles (alcance horizontal ~3,66)
//
// REGRAS DE COMPOSIÇÃO, aprendidas em playtest:
//   - todo edifício de fundo precisa de 2+ tiles livres até a borda de um vão,
//     senão a perspectiva do parallax o faz parecer flutuar sobre o abismo;
//   - a cerca sempre aparece em DUPLA (uma peça sozinha não lê como cerca);
//   - nenhuma cerca pode alcançar um vão;
//   - melhor menos props e conseguir ler cada um do que empilhar tudo.

export const TILES_WIDE = 106;
export const GROUND_ROW = 9;

// Quantas linhas de terra desenhar abaixo da linha do chão.
export const FILL_ROWS = 3;

// [tileInicial, quantidadeDeTiles].
// Os vãos ensinam o pulo em dificuldade crescente: 1 -> 2 -> 3.
// O vão de 3 tiles (60–62) é o clímax do tutorial, logo antes da vila.
export const GROUND_SEGMENTS = [
  [0, 18],   // spawn, árvore central e horta — chão plano, só mover
  [19, 11],  // primeiro desnível (vão de 1)
  [32, 14],  // vão de 2 — plataformas e alvo de treino
  [48, 12],  // vão de 2 — casa isolada na borda da vila
  [63, 28],  // vão de 3 — a vila
  [93, 13],  // vão de 2 — saída e pasto
];

// Plataformas suspensas: [tileInicial, quantidadeDeTiles, alturaEmTiles].
export const PLATFORMS = [
  [21, 3, 1],  // degrau baixo — introduz o pulo sem punição
  [25, 2, 2],  // já na altura máxima
  [34, 3, 2],
  [39, 2, 1],
];

// Checkpoints — sempre no início de um trecho seguro, logo após um vão.
export const CHECKPOINTS = [20, 33, 64];

export const SPAWN_TILE = 2;
export const EXIT_TILE = 103;

// Alvo de treino: ensina o Ataque. Fica sozinho, longe das plataformas e de
// qualquer prop — na primeira montagem ele sumia no cenário.
export const TRAINING_DUMMY_TILE = 44;

// O Ancião fica junto ao poço, no coração da vila. Pelo VS_0 ele pertence à
// Fase 2 (exploração); enquanto ela não existe, mora aqui.
export const ANCIAO_TILE = 76;

// --- Cenário ---------------------------------------------------------------
// Camada de FUNDO: parallax leve (scrollFactor < 1), sem colisão.
// offsetY afunda o prop no chão — a árvore tem raízes que se espalham para os
// lados e, assentada na linha do chão, deixava terra flutuando.
export const BACKGROUND_PROPS = [
  { key: 'arvore', tileX: 6, scroll: 0.75, offsetY: 26 },  // marco visual
  { key: 'casa_madeira', tileX: 53, scroll: 0.8 },         // casa isolada
  { key: 'casa_taipa', tileX: 68, scroll: 0.8 },           // vila
  { key: 'moinho', tileX: 78, scroll: 0.7 },               // marco visual
];

// Camada de FRENTE: mesma velocidade do chão, assentados sobre ele.
// A forja apagada é um dos "pequenos sinais" de que algo mudou
// (02_CONTINENTE.md, Região 0 — Lore).
//
// A barraca de mercado e a bigorna seguem fora: não há espaço para exibi-las
// sem encostar num edifício. Os assets ficam prontos para a fase 2.
export const FOREGROUND_PROPS = [
  { key: 'arbusto', tileX: 3 },
  { key: 'arbusto', tileX: 28 },
  { key: 'barril', tileX: 49 },
  { key: 'caixa', tileX: 49.9 },
  { key: 'arbusto', tileX: 58 },
  { key: 'poco', tileX: 73 },
  { key: 'forja', tileX: 84 },
  { key: 'arbusto', tileX: 89 },
  { key: 'arbusto', tileX: 94 },
];

// Cercas: sempre 2 peças (uma sozinha não lê como cerca). Cada peça tem ~4,2
// tiles, então uma dupla ocupa ~8,3 — só cabe em segmento longo. Fase1Scene
// ainda corta na borda do segmento, como garantia contra cerca sobre o abismo.
export const FENCES = [
  { tileX: 9, pieces: 2, motivo: 'horta ao lado da árvore central' },
  { tileX: 96, pieces: 2, motivo: 'pasto na saída da vila' },
];
