import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig.js';
import save, { TOTAL_PERFIS } from '../managers/SaveManager.js';
import { FASES } from '../data/progressao.js';

// Seleção de perfil (06_INTERFACE_UX.md, Seção 7 — a ser atualizada).
//
// Cinco perfis independentes no mesmo dispositivo. Existe porque o jogo vai ser
// mostrado a várias pessoas, e um slot único faria a segunda apagar o progresso
// da primeira sem aviso.
//
// A tela é deliberadamente simples: linha por perfil, progresso resumido, um
// toque para entrar. Nada de teclado — o alvo é celular.
export default class PerfisScene extends Phaser.Scene {
  constructor() {
    super('PerfisScene');
  }

  create() {
    this.saindo = false;
    this.confirmandoApagar = null;

    this.add.image(0, 0, 'capa_menu_blur')
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45).setOrigin(0);

    this.add.text(GAME_WIDTH / 2, 62, 'Escolha um perfil', {
      fontFamily: 'monospace',
      fontSize: '30px',
      color: '#ffe9b0',
    }).setOrigin(0.5);

    this.aviso = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 34, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffb84d',
    }).setOrigin(0.5);

    this.desenharPerfis();
    this.botaoVoltar();

    this.cameras.main.fadeIn(400);
  }

  desenharPerfis() {
    const alturaLinha = 74;
    const topo = 130;

    save.listarPerfis().forEach((p, i) => {
      const y = topo + i * alturaLinha;
      const emUso = p.numero === save.perfil;

      const fundo = this.add
        .rectangle(GAME_WIDTH / 2, y, 720, 62, 0x1a2418, emUso ? 0.9 : 0.72)
        .setStrokeStyle(2, emUso ? 0xffb84d : 0x55603f);

      this.add.text(GAME_WIDTH / 2 - 330, y, `Perfil ${p.numero}`, {
        fontFamily: 'monospace', fontSize: '22px', color: '#ffe9b0',
      }).setOrigin(0, 0.5);

      this.add.text(GAME_WIDTH / 2 - 120, y, this.resumo(p), {
        fontFamily: 'monospace', fontSize: '17px',
        color: p.usado ? '#cbd6bc' : '#8a9480',
      }).setOrigin(0, 0.5);

      fundo.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.entrar(p));

      if (p.usado) this.botaoApagar(GAME_WIDTH / 2 + 300, y, p);
    });
  }

  resumo(p) {
    if (!p.usado) return 'Vazio — toque para começar';

    const total = FASES.length;
    const data = p.atualizadoEm
      ? new Date(p.atualizadoEm).toLocaleDateString('pt-BR')
      : '';
    return `${p.fasesConcluidas}/${total} fases${data ? `  ·  ${data}` : ''}`;
  }

  botaoApagar(x, y, p) {
    const botao = this.add
      .rectangle(x, y, 108, 36, 0x3a1f1f, 0.9)
      .setStrokeStyle(2, 0x8a4a4a)
      .setInteractive({ useHandCursor: true });

    const rotulo = this.add.text(x, y, 'Apagar', {
      fontFamily: 'monospace', fontSize: '16px', color: '#e8b0b0',
    }).setOrigin(0.5);

    botao.on('pointerdown', (ponteiro, lx, ly, evento) => {
      // Impede que o toque no botão de apagar seja lido também como toque na
      // linha do perfil, que entraria no jogo.
      evento.stopPropagation();

      // Apagar é irreversível: exige dois toques.
      if (this.confirmandoApagar !== p.numero) {
        this.confirmandoApagar = p.numero;
        rotulo.setText('Confirmar');
        this.notice(`Apagar o Perfil ${p.numero}? Toque de novo.`);
        this.time.delayedCall(3000, () => {
          if (this.confirmandoApagar !== p.numero) return;
          this.confirmandoApagar = null;
          rotulo.setText('Apagar');
        });
        return;
      }

      save.apagarPerfil(p.numero);
      this.scene.restart();
    });
  }

  entrar(p) {
    if (this.saindo) return;
    this.saindo = true;

    save.usarPerfil(p.numero);

    // Perfil vazio começa pela Crônica de Abertura, antes de qualquer gameplay
    // (VS_0_VILA_INICIAL.md, Seção 2). Perfil com progresso volta ao Mapa do
    // Continente, de onde o jogador escolhe a região.
    const destino = save.temProgresso() ? 'ContinenteScene' : 'ChronicleScene';
    const dados = save.temProgresso() ? undefined : { id: 'cronica_vila_01' };

    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(destino, dados));
  }

  botaoVoltar() {
    const x = 96;
    const y = GAME_HEIGHT - 46;

    const botao = this.add
      .rectangle(x, y, 150, 44, 0x1a2418, 0.85)
      .setStrokeStyle(2, 0x55603f)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, '< Voltar', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffe9b0',
    }).setOrigin(0.5);

    botao.on('pointerdown', () => {
      if (this.saindo) return;
      this.saindo = true;
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }

  notice(msg) {
    this.aviso.setText(msg);
    this.time.delayedCall(2600, () => this.aviso.setText(''));
  }
}
