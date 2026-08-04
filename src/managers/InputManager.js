// Centraliza mapeamento de teclas/botão único de interação
// (03_GAMEPLAY_MACRO.md, Seção 6 / 08_ARQUITETURA_TECNICA.md, Seção 5).

class InputManagerClass {
  init(scene) {
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  // TODO: expor helpers (isMovingLeft(), isJumpPressed(), isInteractPressed(), etc.)
  // conforme os controles básicos forem implementados no Player.
}

export const InputManager = new InputManagerClass();
