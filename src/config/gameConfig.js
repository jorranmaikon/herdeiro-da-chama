// =====================================================================
// Especificação técnica do jogo (07_DIRECAO_ARTE_AUDIO.md, Seção 1).
// Toda produção de arte respeita estes valores.
// =====================================================================

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Grid do level design.
export const TILE = 64;

// REGRA DE OURO DE ESCALA
// -----------------------
// A célula do spritesheet tem o tamanho em que o personagem é EXIBIDO.
// A arte original é reduzida uma única vez (em tools/build_assets.py) e
// desenhada no jogo em escala 1.0 — nunca ampliada depois.
// Ampliar arte já reduzida destrói a qualidade e não recupera detalhe.
export const PLAYER_CELL = 160;
export const PLAYER_HEIGHT = 128; // ~2 tiles

// O tile de grama tem as pontas das folhas vazadas no topo. Sem este ajuste,
// personagens e objetos parecem flutuar acima do chão.
export const GROUND_INSET = 14;

// Cor do topo do céu — preenche a tela atrás do parallax sem emenda.
export const SKY_COLOR = 0xf6c07e;

// Física (03_GAMEPLAY_MACRO.md, Seção 2). Referência de design, ajustável
// em playtest.
export const GRAVITY = 2200;

export const PLAYER_TUNING = {
  maxSpeed: 340,
  acceleration: 2800,
  drag: 2400,
  jumpVelocity: -880,
  // Queda mais pesada que a subida — deixa o pulo "responsivo".
  fallGravityMultiplier: 1.45,
  // Pequena janela após sair da borda em que o pulo ainda é aceito.
  coyoteTimeMs: 110,
  // Pulo pressionado pouco antes de aterrissar ainda é executado.
  jumpBufferMs: 130,
  // Soltar o botão cedo encurta a subida.
  variableJumpCut: 0.45,
};

// Limites de level design derivados da física acima.
// Recalcule se mexer em jumpVelocity ou GRAVITY.
//   altura máxima do pulo .... ~176px = 2,75 tiles -> plataformas até 2 tiles
//   alcance horizontal ....... ~234px = 3,66 tiles -> vãos até 3 tiles
export const MAX_PLATFORM_TILES = 2;
export const MAX_GAP_TILES = 3;
