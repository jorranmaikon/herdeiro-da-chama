import { GAME_HEIGHT, TILE, GROUND_INSET } from '../../../config/gameConfig.js';
import BiomeSceneBase from '../BiomeSceneBase.js';
import EnemyCommon from '../../../entities/enemies/EnemyCommon.js';
import { SLIME } from '../../../data/enemiesConfig.js';

// Recuo do topo de colisão da plataforma de pedra, acompanhando o musgo vazado
// da arte — sem ele o personagem parece flutuar sobre a plataforma.
const PLATFORM_INSET = 6;

// Espessura do corpo de colisão de qualquer plataforma. Fina de propósito: só
// o topo é sólido, o resto da altura fica livre para passar por baixo.
const PLATFORM_SOLID_H = 14;

// Profundidade que a parede de terra desce quando o degrau dá para um vão.
// Não precisa alcançar o fundo do mundo: abaixo disso ninguém vê.
const WALL_ROWS_OVER_GAP = 4;

// Base das fases do Bosque Esmeralda (Região 1).
//
// O que distingue este bioma da Vila, e por isso mora aqui e não em
// BiomeSceneBase:
//
//   - terreno em DEGRAUS: cada segmento tem sua própria linha de chão, e a
//     parede de terra exposta na lateral precisa ser desenhada;
//   - plataformas ATRAVESSÁVEIS por baixo, ao lado das sólidas;
//   - perigos de cenário (03_GAMEPLAY_MACRO.md, Seção 3.1);
//   - duas camadas de fundo em vez de três, com a copa fechando o topo da tela.
export default class BosqueSceneBase extends BiomeSceneBase {
  // --------------------------------------------------------------------
  // Fundo
  // --------------------------------------------------------------------
  // A copa é a única camada ancorada no TOPO da tela: ela fecha o quadro por
  // cima, como quem olha a mata de baixo. As demais sobem a partir do chão.
  parallaxLayers() {
    return [
      { key: 'bosque_floresta', scroll: 0.12, bottom: GAME_HEIGHT },
      { key: 'bosque_copa', scroll: 0.30, bottom: this.textures
        .get('bosque_copa').getSourceImage().height },
    ];
  }

  // --------------------------------------------------------------------
  // Terreno
  // --------------------------------------------------------------------
  groundRowAt(tileX) {
    const seg = this.segmentAt(tileX);
    return seg ? seg[2] : this.L.GROUND_ROW;
  }

  segmentAt(tileX) {
    return this.L.GROUND_SEGMENTS.find(([s, c]) => tileX >= s && tileX < s + c);
  }

  buildScenery() {
    this.solids = this.physics.add.staticGroup();

    // Ordenar aqui, e não confiar na ordem do arquivo de layout, é o que
    // permite descobrir o vizinho de cada segmento sem varrer a lista toda.
    this.segments = [...this.L.GROUND_SEGMENTS].sort((a, b) => a[0] - b[0]);
    this.segments.forEach((seg, i) => this.addGroundSegment(seg, i));

    this.L.PLATFORMS.forEach((p) => this.addPlatform(p));
    this.buildHazards();
    this.buildEnemies();
  }

  // --------------------------------------------------------------------
  // Inimigos
  // --------------------------------------------------------------------
  // A patrulha de cada inimigo é limitada ao SEGMENTO de chão onde ele nasce.
  // Sem isso ele anda até a borda e cai no vão — e um inimigo que se suicida
  // sozinho estraga o encontro antes de o jogador chegar.
  buildEnemies() {
    this.enemies = (this.L.SLIMES || []).map((tileX) => {
      const seg = this.segmentAt(tileX);
      const y = this.groundTopAt(tileX);

      const inimigo = new EnemyCommon(this, tileX * TILE, y, SLIME);
      inimigo.setDepth(-1);

      const margem = TILE * 0.75;
      inimigo.patrulharEntre(
        seg[0] * TILE + margem,
        (seg[0] + seg[1]) * TILE - margem,
      );

      this.physics.add.collider(inimigo, this.solids);
      return inimigo;
    });
  }

  // O golpe do jogador só conta UMA vez por ataque. Sem esta trava, o overlap
  // dispara a cada frame em que a animação está no ar e um único golpe mata
  // qualquer coisa.
  atacarInimigo(inimigo) {
    if (!this.player.isAttacking || this.golpeConsumido.has(inimigo)) return;
    this.golpeConsumido.add(inimigo);
    inimigo.levarDano(1);
    this.cameras.main.shake(70, 0.003);
  }

  tocarInimigo(inimigo) {
    if (!inimigo.vivo || this.player.isDead || this.player.invulnerable) return;
    // Padrão Contato: o dano vem do encostar, sem telegraph
    // (04_BESTIARIO_MACRO.md, Seção 3).
    this.player.hurt(this.player.x < inimigo.x ? -1 : 1);
  }

  // Alterna entre as 3 variações de tile. Com uma variação só, a mesma
  // pedrinha reaparece a cada 64px e a repetição fica óbvia.
  tileVariant(prefix, tileX) {
    return `${prefix}_${tileX % 3}`;
  }

  addGroundSegment([start, count, row], indice) {
    const topY = row * TILE;

    for (let i = 0; i < count; i++) {
      const tileX = start + i;
      const x = tileX * TILE;

      this.add
        .image(x, topY, this.tileVariant('bosque_topo', tileX))
        .setOrigin(0, 0)
        .setDepth(-10);

      // O preenchimento desce até sair da tela. Com terreno irregular não dá
      // para usar um número fixo de linhas: um segmento alto precisa de mais
      // terra abaixo que um baixo, senão aparece um vazio sob ele.
      for (let y = topY + TILE; y < GAME_HEIGHT; y += TILE) {
        this.add
          .image(x, y, this.tileVariant('bosque_fill', tileX + y / TILE))
          .setOrigin(0, 0)
          .setDepth(-10);
      }
    }

    this.addWalls([start, count, row], indice);

    // Um único corpo estático por segmento em vez de um por tile: menos
    // objetos de física e nenhuma "quina" interna onde o jogador possa travar.
    // O topo desce GROUND_INSET para acompanhar as pontas vazadas da grama.
    this.addSolid(start * TILE, topY + GROUND_INSET, count * TILE, GAME_HEIGHT);
  }

  // Parede de terra exposta na lateral de um degrau.
  //
  // Existe quando o vizinho daquele lado é mais baixo, ou quando não há
  // vizinho encostado (o segmento termina num vão). Sem isso, um degrau parece
  // um tapete de grama flutuando: a arte de topo não tem espessura.
  addWalls([start, count, row], indice) {
    const anterior = this.segments[indice - 1];
    const seguinte = this.segments[indice + 1];

    const colado = (viz, borda) => viz && viz[0] + viz[1] === borda;
    const colouEsq = colado(anterior, start);
    const colouDir = seguinte && seguinte[0] === start + count;

    // Profundidade: até o vizinho, quando ele está colado e mais baixo;
    // até o limite de vão, quando não há vizinho encostado.
    const fundoEsq = colouEsq ? anterior[2] : row + WALL_ROWS_OVER_GAP;
    const fundoDir = colouDir ? seguinte[2] : row + WALL_ROWS_OVER_GAP;

    if (fundoEsq > row) this.addWall(start, row, fundoEsq, false);
    if (fundoDir > row) this.addWall(start + count - 1, row, fundoDir, true);
  }

  // A arte de canto e de lateral foi desenhada com a face exposta à ESQUERDA.
  // Para uma parede virada à direita a mesma arte é espelhada — não há um
  // segundo asset, e não precisa haver: a terra não tem detalhe direcional.
  addWall(tileX, row, fundoRow, espelhado) {
    const x = tileX * TILE;
    const flip = espelhado ? -1 : 1;
    // Com origem em 0 e escala negativa, a imagem cresce para o lado errado;
    // deslocar um tile devolve a peça ao lugar.
    const dx = espelhado ? TILE : 0;

    this.add
      .image(x + dx, row * TILE, 'bosque_canto')
      .setOrigin(0, 0)
      .setScale(flip, 1)
      .setDepth(-9);

    for (let r = row + 1; r < fundoRow; r++) {
      this.add
        .image(x + dx, r * TILE, 'bosque_lateral')
        .setOrigin(0, 0)
        .setScale(flip, 1)
        .setDepth(-9);
    }
  }

  // --------------------------------------------------------------------
  // Plataformas
  // --------------------------------------------------------------------
  addPlatform([start, count, row, tipo = 'solid']) {
    const y = row * TILE;
    const x0 = start * TILE;
    const width = count * TILE;

    if (tipo === 'oneway') {
      this.add
        .tileSprite(x0, y, width, this.textureHeight('bosque_oneway'), 'bosque_oneway')
        .setOrigin(0, 0)
        .setDepth(-9);
      this.addOneWay(x0, y, width, PLATFORM_SOLID_H);
      return;
    }

    // A sólida é montada com três peças: ponta esquerda, meio repetível e
    // ponta direita. As pontas são arredondadas — é o que a faz ler como
    // plataforma e não como um naco de chão — e por isso não podem repetir.
    const esqW = this.textureWidth('bosque_plat_esq');
    const dirW = this.textureWidth('bosque_plat_dir');

    this.add.image(x0, y, 'bosque_plat_esq').setOrigin(0, 0).setDepth(-9);
    this.add.image(x0 + width, y, 'bosque_plat_dir').setOrigin(1, 0).setDepth(-9);

    const meioW = width - esqW - dirW;
    if (meioW > 0) {
      this.add
        .tileSprite(x0 + esqW, y, meioW, this.textureHeight('bosque_plat_meio'),
          'bosque_plat_meio')
        .setOrigin(0, 0)
        .setDepth(-9);
    }

    this.addSolid(x0, y + PLATFORM_INSET, width, PLATFORM_SOLID_H);
  }

  textureWidth(key) {
    return this.textures.get(key).getSourceImage().width;
  }

  textureHeight(key) {
    return this.textures.get(key).getSourceImage().height;
  }

  // --------------------------------------------------------------------
  // Perigos de cenário (03_GAMEPLAY_MACRO.md, Seção 3.1)
  // --------------------------------------------------------------------
  // Elementos fixos, sem IA e sem vida. Causam 1 unidade de dano ao contato,
  // com os mesmos i-frames e knockback de qualquer outro dano, e NUNCA matam:
  // cair em cima custa vida, não a fase.
  buildHazards() {
    this.hazards = [];
    (this.L.HAZARDS || []).forEach(([start, count]) => {
      const row = this.groundRowAt(start);
      const y = row * TILE + GROUND_INSET;
      const width = count * TILE;

      this.add
        .tileSprite(start * TILE, y, width, this.textureHeight('bosque_espinhos'),
          'bosque_espinhos')
        .setOrigin(0, 1)
        .setDepth(-4);

      // A zona é mais BAIXA que a arte de propósito: encostar de raspão na
      // ponta de um espinho não deveria doer. O dano vem de pisar dentro.
      const zone = this.add.zone(start * TILE + width / 2, y - 10, width - 8, 20);
      this.physics.add.existing(zone, true);
      this.hazards.push(zone);
    });
  }

  hitHazard(zone) {
    if (this.player.isDead || this.player.invulnerable) return;

    // Empurra para FORA do perigo, na direção de onde o jogador veio
    // (03_GAMEPLAY_MACRO.md, Seção 3.1). Um perigo nunca pode empurrar para
    // dentro de outro, e por isso a direção sai da posição relativa, não da
    // velocidade — quem entra em queda tem velocidade horizontal quase nula.
    const paraEsquerda = this.player.x < zone.x;
    this.player.hurt(paraEsquerda ? -1 : 1);
  }

  afterPlayerBuilt() {
    this.hazards.forEach((zone) => {
      this.physics.add.overlap(this.player, zone, () => this.hitHazard(zone));
    });

    this.golpeConsumido = new Set();
    this.enemies.forEach((inimigo) => {
      this.physics.add.overlap(this.player, inimigo, () => {
        if (this.player.isAttacking) this.atacarInimigo(inimigo);
        else this.tocarInimigo(inimigo);
      });
    });

    this.afterBosquePlayerBuilt?.();
  }

  /** Chamada pelas fases a cada frame, depois de updateCommon. */
  updateEnemies(time) {
    // Libera o próximo golpe só quando o ataque termina.
    if (!this.player.isAttacking) this.golpeConsumido.clear();

    this.enemies.forEach((inimigo) => inimigo.atualizar(this.player, time));
  }
}
