import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { DIALOGUES } from '../data/dialogues.js';

// Caixa de diálogo (06_INTERFACE_UX.md, Seção 4).
//
// Roda como cena PARALELA e pausa a de baixo, em vez de substituí-la
// (08_ARQUITETURA_TECNICA.md, Seção 4) — assim o cenário continua visível
// atrás e não há recarga de assets a cada conversa.
//
// O diálogo pausa o gameplay: nenhum inimigo ataca durante uma conversa.

const VELOCIDADE_TEXTO = 26;   // ms por caractere
const ALTURA_CAIXA = 210;

export default class DialogueOverlay extends Phaser.Scene {
  constructor() {
    super('DialogueOverlay');
  }

  init(data) {
    this.dialogo = DIALOGUES[data.id];
    this.cenaDeBaixo = data.from;
    this.aoFechar = data.onClose;
  }

  create() {
    this.indice = 0;
    this.digitando = false;
    this.fechando = false;

    const topo = GAME_HEIGHT - ALTURA_CAIXA;

    this.add.rectangle(0, topo, GAME_WIDTH, ALTURA_CAIXA, 0x14110c, 0.94).setOrigin(0);
    this.add.rectangle(0, topo, GAME_WIDTH, 3, 0x6b5334).setOrigin(0);

    // Retrato à esquerda, ancorado no rodapé da caixa.
    const retrato = this.dialogo.retrato;
    let textoX = 60;
    if (retrato && this.textures.exists(retrato)) {
      this.add.image(30, GAME_HEIGHT - 6, retrato).setOrigin(0, 1).setDepth(2);
      textoX = 310;
    }

    this.add
      .text(textoX, topo + 26, this.dialogo.nome, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffb84d',
      })
      .setOrigin(0);

    this.texto = this.add
      .text(textoX, topo + 68, '', {
        fontFamily: 'monospace',
        fontSize: '23px',
        color: '#ede3d0',
        lineSpacing: 8,
        wordWrap: { width: GAME_WIDTH - textoX - 70 },
      })
      .setOrigin(0);

    this.seta = this.add
      .text(GAME_WIDTH - 44, GAME_HEIGHT - 34, '▼', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffb84d',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.tweens.add({
      targets: this.seta,
      y: this.seta.y - 7,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Um toque acelera o texto; o seguinte avança a fala.
    this.input.on('pointerdown', () => this.avancar());
    this.input.keyboard.on('keydown-SPACE', () => this.avancar());
    this.input.keyboard.on('keydown-E', () => this.avancar());
    this.input.keyboard.on('keydown-ENTER', () => this.avancar());

    this.mostrarFala();
  }

  mostrarFala() {
    const fala = this.dialogo.falas[this.indice];
    if (!fala) {
      this.fechar();
      return;
    }

    this.seta.setVisible(false);
    this.texto.setText('');
    this.digitando = true;

    let i = 0;
    this.timer = this.time.addEvent({
      delay: VELOCIDADE_TEXTO,
      repeat: fala.texto.length - 1,
      callback: () => {
        i += 1;
        this.texto.setText(fala.texto.slice(0, i));
        if (i >= fala.texto.length) {
          this.digitando = false;
          this.seta.setVisible(true);
        }
      },
    });
  }

  avancar() {
    if (this.fechando) return;

    if (this.digitando) {
      this.timer?.remove();
      this.texto.setText(this.dialogo.falas[this.indice].texto);
      this.digitando = false;
      this.seta.setVisible(true);
      return;
    }

    this.indice += 1;
    this.mostrarFala();
  }

  fechar() {
    if (this.fechando) return;
    this.fechando = true;
    this.timer?.remove();

    this.scene.resume(this.cenaDeBaixo);
    this.aoFechar?.();
    this.scene.stop();
  }
}
