import Phaser from 'phaser';
import TouchControls from './TouchControls.js';

// Centraliza o mapeamento de teclas e o input de toque
// (03_GAMEPLAY_MACRO.md, Seção 6; 08_ARQUITETURA_TECNICA.md, Seção 5).
// Nenhuma cena lê teclado ou toque diretamente — tudo passa por aqui.
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

    this.touch = new TouchControls(scene);
  }

  get left() {
    return this.keys.left.isDown || this.keys.a.isDown || this.touch.state.left;
  }

  get right() {
    return this.keys.right.isDown || this.keys.d.isDown || this.touch.state.right;
  }

  // Pulo pode ser espaço, seta pra cima, W ou o botão de toque.
  get jumpHeld() {
    return (
      this.keys.space.isDown ||
      this.keys.up.isDown ||
      this.keys.w.isDown ||
      this.touch.state.jump
    );
  }

  jumpJustPressed() {
    return (
      Phaser.Input.Keyboard.JustDown(this.keys.space) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.w) ||
      this.touch.justPressed.jump
    );
  }

  attackJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.attack) || this.touch.justPressed.attack;
  }

  // Botão único de interação, contextual (03_GAMEPLAY_MACRO.md, Seção 6).
  interactJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.interact) || this.touch.justPressed.interact;
  }

  pauseJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.pause);
  }

  // Deve ser chamado no fim do update da cena, para não repetir o mesmo toque.
  lateUpdate() {
    this.touch.clearJustPressed();
  }
}
