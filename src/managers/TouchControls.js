import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';

// Controles de toque para mobile.
// Só são criados quando o dispositivo tem touch — no desktop o teclado continua
// sendo o único input, sem poluir a tela com botões.
export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.enabled = scene.sys.game.device.input.touch;

    this.state = { left: false, right: false, jump: false, attack: false, interact: false };
    this.justPressed = { jump: false, attack: false, interact: false };

    // Guarda qual dedo (pointer.id) pressionou cada botão. Sem isso, soltar um dedo
    // liberava todos os botões e era impossível andar e pular ao mesmo tempo.
    this.ownerPointer = {};

    if (this.enabled) this.build();
  }

  build() {
    const R = 52;
    const bottom = GAME_HEIGHT - 90;

    // D-pad à esquerda, ações à direita — um polegar em cada lado.
    this.makeButton(100, bottom, R, '◀', 'left');
    this.makeButton(230, bottom, R, '▶', 'right');

    this.makeButton(GAME_WIDTH - 110, bottom, R + 8, '▲', 'jump');
    this.makeButton(GAME_WIDTH - 235, bottom - 60, R, '⚔', 'attack');
    this.makeButton(GAME_WIDTH - 235, bottom + 55, R - 6, 'E', 'interact');
  }

  makeButton(x, y, radius, label, action) {
    const circle = this.scene.add
      .circle(x, y, radius, 0x000000, 0.35)
      .setStrokeStyle(3, 0xffe9b0, 0.55)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: `${Math.round(radius * 0.7)}px`,
        color: '#ffe9b0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    const press = (pointer) => {
      // Se outro dedo já segura este botão, ignora.
      if (this.ownerPointer[action] !== undefined) return;
      this.ownerPointer[action] = pointer.id;
      this.state[action] = true;
      if (action in this.justPressed) this.justPressed[action] = true;
      circle.setFillStyle(0xffb84d, 0.4);
      text.setColor('#fff8e6');
    };

    const release = (pointer) => {
      // Só solta se for o mesmo dedo que pressionou.
      if (this.ownerPointer[action] !== pointer.id) return;
      delete this.ownerPointer[action];
      this.state[action] = false;
      circle.setFillStyle(0x000000, 0.35);
      text.setColor('#ffe9b0');
    };

    circle.on('pointerdown', press);
    circle.on('pointerup', release);
    circle.on('pointerout', release);

    // Rede de segurança: se o dedo sumir sem disparar pointerup no botão
    // (ex: arrastou pra fora), o estado não pode ficar travado.
    this.scene.input.on('pointerup', release);
    this.scene.input.on('pointerupoutside', release);
  }

  // Consome as flags de "just pressed" — chamado uma vez por frame, no fim do update.
  clearJustPressed() {
    this.justPressed.jump = false;
    this.justPressed.attack = false;
    this.justPressed.interact = false;
  }
}
