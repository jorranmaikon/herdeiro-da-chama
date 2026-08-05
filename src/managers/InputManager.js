import Phaser from 'phaser';

// Centraliza o mapeamento de teclas (03_GAMEPLAY_MACRO.md, Seção 6;
// 08_ARQUITETURA_TECNICA.md, Seção 5).
// Nenhuma cena lê teclado diretamente — tudo passa por aqui.
export default class InputManager {
  constructor(scene) {
    this.scene = scene;

    const kb = scene.input.keyboard;
    this.keys = kb.addKeys({
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      down: 'DOWN',
      a: 'A',
      d: 'D',
      w: 'W',
      s: 'S',
      space: 'SPACE',
      attack: 'X',
      interact: 'E',
      pause: 'ESC',
    });
  }

  get left() {
    return this.keys.left.isDown || this.keys.a.isDown;
  }

  get right() {
    return this.keys.right.isDown || this.keys.d.isDown;
  }

  // Pulo pode ser espaço, seta pra cima ou W.
  get jumpHeld() {
    return this.keys.space.isDown || this.keys.up.isDown || this.keys.w.isDown;
  }

  jumpJustPressed() {
    return (
      Phaser.Input.Keyboard.JustDown(this.keys.space) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.w)
    );
  }

  attackJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.attack);
  }

  // Botão único de interação, contextual (03_GAMEPLAY_MACRO.md, Seção 6).
  interactJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.interact);
  }

  pauseJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.pause);
  }
}
