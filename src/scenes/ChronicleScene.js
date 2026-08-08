import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import { CHRONICLES } from '../data/chronicles.js';

// Tela de Crônica (06_INTERFACE_UX.md, Seção 5).
// Substitui a HUD por completo: imagem estática, zoom lento (Ken Burns), texto
// em typewriter e fade de entrada/saída.
//
// Genérica — recebe o id da Crônica em init(), então a mesma cena serve para
// todas as 8+ do jogo. Nenhum bioma cria uma tela própria.

const ZOOM_INICIAL = 1.06;
const ZOOM_FINAL = 1.18;
const VELOCIDADE_TEXTO = 42;   // ms por caractere
const PAUSA_ENTRE_BLOCOS = 1500;

export default class ChronicleScene extends Phaser.Scene {
  constructor() {
    super('ChronicleScene');
  }

  init(data) {
    this.chronicleId = data.id;
    this.dados = CHRONICLES[data.id];
    // Para onde ir ao terminar. O chamador pode sobrepor o destino padrão.
    this.proxima = data.proxima || this.dados.proxima;
  }

  create() {
    this.blocoAtual = 0;
    this.digitando = false;
    this.encerrando = false;

    this.cameras.main.setBackgroundColor('#000000');

    // A ilustração cobre a tela inteira. O zoom parte de um valor já acima de
    // 1 para que o movimento nunca revele a borda da imagem.
    this.imagem = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.dados.imagem)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.imagem.setScale(this.imagem.scaleX * ZOOM_INICIAL,
                         this.imagem.scaleY * ZOOM_INICIAL);

    const duracaoTotal = this.dados.blocos.length * 3800;
    this.tweens.add({
      targets: this.imagem,
      scaleX: this.imagem.scaleX * (ZOOM_FINAL / ZOOM_INICIAL),
      scaleY: this.imagem.scaleY * (ZOOM_FINAL / ZOOM_INICIAL),
      duration: duracaoTotal,
      ease: 'Sine.easeInOut',
    });

    // Faixa escura atrás do texto: a ilustração varia muito de luminosidade e
    // sem isso o texto some sobre as áreas claras.
    this.add
      .rectangle(0, GAME_HEIGHT - 230, GAME_WIDTH, 230, 0x000000, 0.55)
      .setOrigin(0);

    this.texto = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 150, '', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ede3d0',
        align: 'center',
        lineSpacing: 12,
        wordWrap: { width: GAME_WIDTH - 240 },
      })
      .setOrigin(0.5);

    this.dica = this.add
      .text(GAME_WIDTH - 30, GAME_HEIGHT - 26, 'toque para avançar', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#8a8375',
      })
      .setOrigin(1, 0.5);

    // O jogador nunca é obrigado a esperar: um toque acelera o bloco atual,
    // o seguinte avança (06_INTERFACE_UX.md, Seção 5).
    this.input.on('pointerdown', () => this.avancar());
    this.input.keyboard.on('keydown-SPACE', () => this.avancar());
    this.input.keyboard.on('keydown-ENTER', () => this.avancar());
    this.input.keyboard.on('keydown-ESC', () => this.encerrar());

    this.cameras.main.fadeIn(900);
    this.time.delayedCall(700, () => this.mostrarBloco());
  }

  mostrarBloco() {
    if (this.encerrando) return;

    const conteudo = this.dados.blocos[this.blocoAtual];
    if (conteudo === undefined) {
      this.encerrar();
      return;
    }

    this.texto.setText('');
    this.texto.setAlpha(1);
    this.digitando = true;

    let i = 0;
    this.timerTexto = this.time.addEvent({
      delay: VELOCIDADE_TEXTO,
      repeat: conteudo.length - 1,
      callback: () => {
        i += 1;
        this.texto.setText(conteudo.slice(0, i));
        if (i >= conteudo.length) {
          this.digitando = false;
          this.agendarProximo();
        }
      },
    });
  }

  agendarProximo() {
    this.timerBloco = this.time.delayedCall(PAUSA_ENTRE_BLOCOS, () => {
      this.tweens.add({
        targets: this.texto,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.blocoAtual += 1;
          this.mostrarBloco();
        },
      });
    });
  }

  /** Primeiro toque completa o bloco; o seguinte pula para o próximo. */
  avancar() {
    if (this.encerrando) return;

    if (this.digitando) {
      this.timerTexto?.remove();
      this.texto.setText(this.dados.blocos[this.blocoAtual]);
      this.digitando = false;
      this.agendarProximo();
      return;
    }

    this.timerBloco?.remove();
    this.tweens.killTweensOf(this.texto);
    this.blocoAtual += 1;
    this.mostrarBloco();
  }

  encerrar() {
    if (this.encerrando) return;
    this.encerrando = true;

    this.timerTexto?.remove();
    this.timerBloco?.remove();

    this.cameras.main.fadeOut(900);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.proxima);
    });
  }
}
