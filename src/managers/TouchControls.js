import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Botões virtuais, criados só em dispositivo com toque — no desktop a tela
// fica limpa e o teclado é o único input.
export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.enabled = scene.sys.game.device.input.touch;

    this.state = { left: false, right: false, jump: false, attack: false };
    this.pressed = { jump: false, attack: false };

    // Guarda qual dedo pressionou cada botão. Sem isso, soltar um dedo
    // liberava todos os botões e era impossível andar e pular junto.
    this.owner = {};

    if (this.enabled) this.build();
  }

  build() {
    const bottom = GAME_HEIGHT - 96;
    this.button(104, bottom, 54, '◀', 'left');
    this.button(238, bottom, 54, '▶', 'right');
    this.button(GAME_WIDTH - 112, bottom, 62, '▲', 'jump');
    this.button(GAME_WIDTH - 244, bottom - 42, 54, '⚔', 'attack');
  }

  button(x, y, radius, label, action) {
    const circle = this.scene.add
      .circle(x, y, radius, 0x000000, 0.35)
      .setStrokeStyle(3, 0xffe9b0, 0.55)
      .setScrollFactor(0)
      .setDepth(2000)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(radius * 0.7)}px`,
        color: '#ffe9b0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2001);

    const press = (pointer) => {
      if (this.owner[action] !== undefined) return;
      this.owner[action] = pointer.id;
      this.state[action] = true;
      if (action in this.pressed) this.pressed[action] = true;
      circle.setFillStyle(0xffb84d, 0.4);
    };

    const release = (pointer) => {
      if (this.owner[action] !== pointer.id) return;
      delete this.owner[action];
      this.state[action] = false;
      circle.setFillStyle(0x000000, 0.35);
    };

    circle.on('pointerdown', press);
    circle.on('pointerup', release);
    circle.on('pointerout', release);
    // Rede de segurança: dedo arrastado pra fora não pode travar o botão.
    this.scene.input.on('pointerup', release);
    this.scene.input.on('pointerupoutside', release);
  }

  clearPressed() {
    this.pressed.jump = false;
    this.pressed.attack = false;
  }
}
