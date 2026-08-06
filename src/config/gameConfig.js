// Resolução base do jogo (07_DIRECAO_ARTE_AUDIO.md, Seção 1).
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Grid de tile do level design.
export const TILE_SIZE = 64;

// Célula do spritesheet do protagonista — redesenhado, agora alinhado ao
// grid de tile (07_DIRECAO_ARTE_AUDIO.md, Seção 1).
export const SPRITE_CELL_WIDTH = 64;
export const SPRITE_CELL_HEIGHT = 64;

// Célula do spritesheet dos NPCs. Ainda na escala antiga porque o Camponês
// não foi redesenhado junto do protagonista — cada spritesheet tem sua própria
// célula até que os NPCs também sejam atualizados pro novo padrão.
export const NPC_SPRITE_CELL_WIDTH = 120;
export const NPC_SPRITE_CELL_HEIGHT = 144;

// O tile de grama tem as pontas das folhas transparentes no topo. Sem esse ajuste,
// personagens e objetos parecem flutuar acima do chão. Tudo é desenhado
// levemente "afundado" na grama.
export const GROUND_VISUAL_OFFSET = 14;

// Cor do topo do céu, usada pra preencher a área acima da textura de fundo
// sem criar emenda visível.
export const SKY_COLOR = 0xf6c07e;

// Referência de física, ajustável em playtest (03_GAMEPLAY_MACRO.md, Seção 2).
export const PHYSICS_CONFIG = {
  default: 'arcade',
  arcade: {
    gravity: { y: 2200 },
    debug: false,
  },
};

// Valores de movimento — referência de design, não spec final (03_GAMEPLAY_MACRO.md, Seção 2).
export const PLAYER_TUNING = {
  maxSpeed: 320,
  acceleration: 2600,
  drag: 2200,
  jumpVelocity: -880,
  // Gravidade extra na queda deixa o pulo "responsivo": sobe rápido, cai mais pesado.
  fallGravityMultiplier: 1.45,
  // Janela após sair da borda em que o pulo ainda é aceito.
  coyoteTimeMs: 110,
  // Input de pulo pressionado pouco antes de aterrissar ainda é executado.
  jumpBufferMs: 130,
  // Corta a altura do pulo se o jogador soltar o botão cedo.
  variableJumpCut: 0.45,
};
