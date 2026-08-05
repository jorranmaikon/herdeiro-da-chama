// Resolução base do jogo (07_DIRECAO_ARTE_AUDIO.md, Seção 1).
// Nenhum bioma deve usar resolução diferente desta.
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Grid de tile do level design.
export const TILE_SIZE = 64;

// Altura de referência do protagonista em tela (2,5 tiles).
export const PLAYER_HEIGHT = 160;

// Célula do spritesheet do protagonista e dos NPCs.
export const SPRITE_CELL_WIDTH = 96;
export const SPRITE_CELL_HEIGHT = 160;

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
  maxSpeed: 340,
  acceleration: 2600,
  drag: 2200,
  jumpVelocity: -820,
  // Gravidade extra na queda deixa o pulo "responsivo": sobe rápido, cai mais pesado.
  fallGravityMultiplier: 1.45,
  // Janela após sair da borda em que o pulo ainda é aceito.
  coyoteTimeMs: 110,
  // Input de pulo pressionado pouco antes de aterrissar ainda é executado.
  jumpBufferMs: 130,
  // Corta a altura do pulo se o jogador soltar o botão cedo.
  variableJumpCut: 0.45,
};
