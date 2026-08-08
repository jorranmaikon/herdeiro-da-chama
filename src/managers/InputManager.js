import Phaser from 'phaser';
import TouchControls from './TouchControls.js';

// Centraliza teclado e toque (03_GAMEPLAY_MACRO.md, Seção 6).
// Nenhuma cena lê input diretamente — tudo passa por aqui.
export default class InputManager {
  constructor(scene) {
    this.scene = scene;

    // Sem pointers extras não dá pra andar e pular ao mesmo tempo no celular.
    scene.input.addPointer(3);

    this.keys = scene.input.keyboard.addKeys({
      left: 'LEFT',
      right: 'RIGHT',
      up: 'UP',
      a: 'A',
      d: 'D',
      w: 'W',
      space: 'SPACE',
      attack: 'X',
      interact: 'E',
    });

    this.touch = new TouchControls(scene);
  }

  get left() {
    return this.keys.left.isDown || this.keys.a.isDown || this.touch.state.left;
  }

  get right() {
    return this.keys.right.isDown || this.keys.d.isDown || this.touch.state.right;
  }

  get jumpHeld() {
    return (
      this.keys.space.isDown ||
      this.keys.up.isDown ||
      this.keys.w.isDown ||
      this.touch.state.jump
    );
  }

  // Snapshot dos comandos de toque único, tirado UMA vez por frame.
  //
  // Phaser.Input.Keyboard.JustDown consome o estado da tecla na primeira
  // chamada: quem perguntar depois recebe false. Com o Player, o tutorial e os
  // NPCs consultando o mesmo input no mesmo frame, só o primeiro enxergava o
  // comando. Ler tudo de uma vez no começo do frame resolve, e de quebra
  // garante que todos vejam exatamente o mesmo estado.
  beginFrame() {
    this.frame = {
      jump:
        Phaser.Input.Keyboard.JustDown(this.keys.space) ||
        Phaser.Input.Keyboard.JustDown(this.keys.up) ||
        Phaser.Input.Keyboard.JustDown(this.keys.w) ||
        this.touch.pressed.jump,
      attack:
        Phaser.Input.Keyboard.JustDown(this.keys.attack) ||
        this.touch.pressed.attack,
      interact:
        Phaser.Input.Keyboard.JustDown(this.keys.interact) ||
        this.touch.pressed.interact,
    };
  }

  jumpPressed() {
    return this.frame?.jump ?? false;
  }

  attackPressed() {
    return this.frame?.attack ?? false;
  }

  // Botão único e contextual (03_GAMEPLAY_MACRO.md, Seção 6): o que ele faz
  // depende do que está à frente do jogador. No toque tem botão próprio, que
  // só aparece quando há algo ao alcance.
  interactPressed() {
    return this.frame?.interact ?? false;
  }

  // Chamar no FIM do update da cena, senão um toque conta em vários frames.
  lateUpdate() {
    this.touch.clearPressed();
    this.frame = null;
  }

  /** A cena avisa quando há algo interagível por perto. */
  setInteractAvailable(disponivel) {
    this.touch.setInteractVisible(disponivel);
  }
}
