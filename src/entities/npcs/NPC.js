import Phaser from 'phaser';
import { TILE } from '../../config/gameConfig.js';

// NPC de mundo (08_ARQUITETURA_TECNICA.md, Seção 3).
//
// Não tem física nem colisão: o jogador atravessa. O que importa é a zona de
// interação e o indicador que aparece quando ele está por perto — botão único
// e contextual, conforme 03_GAMEPLAY_MACRO.md, Seção 6.
//
// A cena decide o que a interação faz; o NPC só avisa que ela é possível.

const RAIO_INTERACAO = TILE * 1.6;

export default class NPC extends Phaser.GameObjects.Container {
  /**
   * @param {object} opcoes
   * @param {string} opcoes.sprite  textura do NPC no mundo
   * @param {string} opcoes.nome    exibido no indicador
   * @param {Function} opcoes.aoInteragir
   */
  constructor(scene, x, y, opcoes) {
    super(scene, x, y);
    scene.add.existing(this);

    this.opcoes = opcoes;
    this.podeInteragir = false;
    this.jaConversou = false;

    if (scene.textures.exists(opcoes.sprite)) {
      this.corpo = scene.add.image(0, 0, opcoes.sprite).setOrigin(0.5, 1);
    } else {
      // Sem arte de corpo inteiro ainda: silhueta neutra, só para o NPC ocupar
      // espaço legível no cenário. Trocar assim que o sprite existir.
      this.corpo = scene.add
        .rectangle(0, 0, 44, 104, 0x3d3428)
        .setOrigin(0.5, 1)
        .setStrokeStyle(2, 0x211c15);
    }
    this.add(this.corpo);

    this.indicador = scene.add
      .text(0, -this.alturaCorpo() - 22, '!', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffb84d',
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.add(this.indicador);

    scene.tweens.add({
      targets: this.indicador,
      y: this.indicador.y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  alturaCorpo() {
    return this.corpo.displayHeight || this.corpo.height || 104;
  }

  /** Chamado pela cena a cada frame. Devolve true se o jogador está no raio. */
  atualizar(player, interagiu) {
    const perto = Math.abs(player.x - this.x) < RAIO_INTERACAO
      && Math.abs(player.y - this.y) < TILE * 3;

    if (perto !== this.podeInteragir) {
      this.podeInteragir = perto;
      this.indicador.setVisible(perto);
    }

    if (perto && interagiu) {
      this.opcoes.aoInteragir?.(this);
      this.jaConversou = true;
    }

    return perto;
  }
}
