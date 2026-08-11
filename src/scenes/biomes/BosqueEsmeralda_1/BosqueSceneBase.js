import Phaser from 'phaser';
import { GAME_HEIGHT, TILE, GROUND_INSET } from '../../../config/gameConfig.js';
import BiomeSceneBase from '../BiomeSceneBase.js';
import EnemyCommon from '../../../entities/enemies/EnemyCommon.js';
import EnemyMiniBoss from '../../../entities/enemies/EnemyMiniBoss.js';
import { SLIME, LOBO, MORCEGO, GOBLIN, URSO } from '../../../data/enemiesConfig.js';

// Alcance da espada. Largura generosa de propósito: a regra do
// 03_GAMEPLAY_MACRO.md é hurtbox pequena e alcance folgado — o jogo pune
// leitura ruim, nunca mira imprecisa.
const ATTACK_W = 84;
const ATTACK_ABAIXO = 40;  // quanto o golpe desce além dos pés
const ATTACK_OFFSET = 10;

// Recuo do topo de colisão das plataformas.
//
// É o MESMO GROUND_INSET do terreno, e isso importa: uma plataforma cuja linha
// coincide com a do chão vizinho precisa ter o topo exatamente na mesma altura.
// Com recuos diferentes sobrava um degrau de 2px que o motor tratava como
// parede — o jogador subia na ponte sobre o vão, travava, e caía no buraco.
const PLATFORM_INSET = GROUND_INSET;

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
  // Montagem completa de uma fase do bioma. As fases concretas só declaram o
  // layout e o destino — nenhuma delas repete esta sequência.
  create() {
    this.buildCommon();
    this.buildExit();
    this.buildPlayer();
    this.buildCamera();

    this.input.keyboard.on('keydown-ESC', () => this.leave());
    this.game.audio.play(this, 'mus_fase');
  }

  update(time) {
    if (!this.updateCommon(time)) return;
    this.updateEnemies(time);
    this.input$.lateUpdate();
  }

  /** Para onde esta fase leva ao chegar na saída. */
  proximaCena() {
    // Volta ao mapa do bioma: é lá que o jogador vê a fase seguinte abrir.
    return 'BosqueMapaScene';
  }

  finishPhase() {
    if (this.finished) return;
    this.finished = true;
    this.concluirFase();

    this.cameras.main.fadeOut(700);
    this.cameras.main.once('camerafadeoutcomplete', () => this.leave());
  }

  leave() {
    this.scene.start(this.proximaCena());
  }

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
    this.curaColetadas = new Set();

    // Ordenar aqui, e não confiar na ordem do arquivo de layout, é o que
    // permite descobrir o vizinho de cada segmento sem varrer a lista toda.
    this.segments = [...this.L.GROUND_SEGMENTS].sort((a, b) => a[0] - b[0]);
    this.segments.forEach((seg, i) => this.addGroundSegment(seg, i));

    this.L.PLATFORMS.forEach((p) => this.addPlatform(p));
    this.buildHazards();
    this.buildEnemies();
    this.buildArvoreMirante();
    this.buildFenda();
    this.buildItensCura();
  }

  // --------------------------------------------------------------------
  // Inimigos
  // --------------------------------------------------------------------
  // A patrulha de cada inimigo é limitada ao SEGMENTO de chão onde ele nasce.
  // Sem isso ele anda até a borda e cai no vão — e um inimigo que se suicida
  // sozinho estraga o encontro antes de o jogador chegar.
  buildEnemies() {
    // Cada lista do layout aponta para uma configuração. Inimigo novo é uma
    // entrada aqui, nunca uma classe nova (08_ARQUITETURA_TECNICA.md, Seção 8).
    const listas = [
      [this.L.SLIMES, SLIME, 0],
      [this.L.LOBOS, LOBO, 0],
      // O Morcego começa pendurado, bem acima do chão.
      [this.L.MORCEGOS, MORCEGO, -TILE * 3],
      [this.L.GOBLINS, GOBLIN, 0],
    ];

    this.projeteis = this.physics.add.group();

    this.enemies = listas.flatMap(([tiles, cfg, alturaInicial]) =>
      (tiles || []).map((tileX) => this.criarInimigo(tileX, cfg, alturaInicial)));

    if (this.L.URSO_TILE !== undefined) {
      this.enemies.push(this.criarMiniBoss(this.L.URSO_TILE));
    }
  }

  // --------------------------------------------------------------------
  // Mini-Boss
  // --------------------------------------------------------------------
  criarMiniBoss(tileX) {
    const seg = this.segmentAt(tileX);
    const urso = new EnemyMiniBoss(this, tileX * TILE, this.groundTopAt(tileX), URSO);
    urso.setDepth(-1);

    // Fica no próprio segmento da arena, que é plana e fechada.
    const margem = TILE;
    urso.patrulharEntre(seg[0] * TILE + margem, (seg[0] + seg[1]) * TILE - margem);

    urso.colisorChao = this.physics.add.collider(urso, this.solids);
    urso.colisores = [];
    urso.aoMorrer = () => this.removerInimigo(urso);

    // A Pisada bate em ÁREA ao redor, com telegraph antes (o quadro erguido).
    // Não é contato: acerta mesmo quem está ao lado, e é por isso que ela
    // obriga o jogador a se afastar em vez de rolar por baixo.
    urso.aoPisar = () => this.resolverPisada(urso);
    return urso;
  }

  resolverPisada(urso) {
    this.cameras.main.shake(260, 0.012);

    if (this.player.isDead || this.player.invulnerable) return;
    const dx = Math.abs(this.player.x - urso.x);
    const dy = Math.abs(this.player.y - urso.y);
    if (dx > urso.cfg.raioPisada || dy > urso.cfg.raioPisada) return;

    this.player.hurt(this.player.x < urso.x ? -1 : 1);
  }

  // --------------------------------------------------------------------
  // Projéteis
  // --------------------------------------------------------------------
  // A pedra do Goblin descreve um ARCO, não uma linha reta: é o que dá tempo
  // de reação suficiente para desviar com um pulo, como o Bestiário exige de
  // qualquer padrão que não seja Contato.
  lancarProjetil(origem, direcao) {
    const cfg = origem.cfg.projetil;
    const corpo = origem.body;

    const pedra = this.projeteis.create(
      origem.x + direcao * corpo.halfWidth,
      corpo.center.y - 10,
      cfg.textura,
    );
    pedra.setDepth(-1);
    pedra.body.setAllowGravity(true);
    pedra.body.setGravityY(cfg.gravidade);
    pedra.setVelocity(direcao * cfg.velocidade, -110);

    // Some sozinha depois de um tempo: sem isso, toda pedra errada continuaria
    // viva no mundo até o fim da fase.
    this.time.delayedCall(cfg.vidaMs, () => pedra.destroy());
  }

  criarInimigo(tileX, cfg, alturaInicial = 0) {
      const seg = this.segmentAt(tileX);

      // Um voador pode nascer sobre um vão — é justamente onde ele é mais
      // ameaçador. Sem segmento embaixo, a altura vem da linha base do bioma.
      const y = (seg ? this.groundTopAt(tileX) : this.L.GROUND_ROW * TILE)
        + alturaInicial;

      const inimigo = new EnemyCommon(this, tileX * TILE, y, cfg);
      inimigo.setDepth(-1);

      // Patrulha só faz sentido para quem anda no chão: é o que impede o
      // inimigo de andar até a borda e cair sozinho. Voador não tem borda.
      if (seg && cfg.locomocao !== 'voar') {
        const margem = TILE * 0.75;
        inimigo.patrulharEntre(
          seg[0] * TILE + margem,
          (seg[0] + seg[1]) * TILE - margem,
        );
      }

      // Os colisores são guardados no próprio inimigo para poderem ser
      // destruídos junto com ele. Ver aoMorrer(), abaixo.
      // O colisor com o chão fica separado: ele é o ÚNICO que sobrevive à
      // morte, para o cadáver cair e pousar em vez de congelar no ar.
      inimigo.colisorChao = this.physics.add.collider(inimigo, this.solids);
      inimigo.colisores = [];
      inimigo.aoMorrer = () => this.removerInimigo(inimigo);
      inimigo.aoAtirar = (direcao) => this.lancarProjetil(inimigo, direcao);
      return inimigo;
  }

  // Hitbox do ataque: um retângulo curto À FRENTE do jogador
  // (03_GAMEPLAY_MACRO.md, Seção 3), não o corpo dele.
  //
  // Testado à mão, sem corpo de física. A primeira tentativa usava uma zona
  // com corpo ligado e desligado a cada golpe, e o acerto dependia de o
  // passo de física cair dentro da janela do ataque — o que falhava com
  // frequência. Um teste de retângulos no update é determinístico, roda no
  // frame exato do golpe e é mais simples de ler.
  areaDoGolpe() {
    // Ancorada no CORPO do jogador, nunca em `player.y`.
    //
    // O sprite do protagonista usa a origem padrão do Phaser, (0.5, 0.5), e
    // não (0.5, 1) como os inimigos: `player.y` é o centro da célula de
    // 160px, não os pés. Calcular a caixa a partir de `y` e PLAYER_HEIGHT
    // colocava o golpe flutuando acima do corpo, e ele não acertava nada a
    // distância nenhuma. Ler o corpo direto vale para qualquer origem.
    const corpo = this.player.body;
    const frente = this.player.flipX ? -1 : 1;
    const x = frente > 0
      ? corpo.right + ATTACK_OFFSET
      : corpo.left - ATTACK_OFFSET - ATTACK_W;

    // Vertical: do topo do corpo até um pouco ABAIXO dos pés. Centrar a caixa
    // no meio do corpo deixava só uns 20px de sobreposição com um inimigo
    // baixo como o Slime, e bastava um pulinho para o golpe passar por cima.
    // Descer até abaixo dos pés garante que qualquer coisa no chão à frente
    // esteja no alcance.
    return new Phaser.Geom.Rectangle(
      x,
      corpo.top,
      ATTACK_W,
      corpo.height + ATTACK_ABAIXO,
    );
  }

  resolverGolpe() {
    if (!this.player.isAttacking || this.player.isDead) return;

    const area = this.areaDoGolpe();
    this.enemies.forEach((inimigo) => {
      if (!inimigo.vivo || !inimigo.body || this.golpeConsumido.has(inimigo)) return;

      const c = inimigo.body;
      const alvo = new Phaser.Geom.Rectangle(c.left, c.top, c.width, c.height);
      if (Phaser.Geom.Intersects.RectangleToRectangle(area, alvo)) {
        this.atacarInimigo(inimigo);
      }
    });
  }

  // Um inimigo destruído deixa para trás os colisores que o referenciam, e o
  // corpo deles vira null. A partir daí o passo de física lança exceção a cada
  // frame, o update inteiro da cena para de rodar e NENHUM golpe seguinte é
  // resolvido — o sintoma é matar o primeiro inimigo e nunca mais acertar
  // nada. O Phaser não limpa esses colisores sozinho.
  removerInimigo(inimigo) {
    // Some da lógica na hora: nada de golpe, contato ou update depois da
    // morte. O colisor com o chão continua até o destroy.
    inimigo.colisores?.forEach((c) => this.physics.world.removeCollider(c));
    inimigo.colisores = null;
    this.golpeConsumido.delete(inimigo);

    const i = this.enemies.indexOf(inimigo);
    if (i !== -1) this.enemies.splice(i, 1);

    inimigo.once('destroy', () => {
      if (inimigo.colisorChao) this.physics.world.removeCollider(inimigo.colisorChao);
    });
  }

  // O golpe do jogador só conta UMA vez por ataque. Sem esta trava, o overlap
  // dispara a cada frame em que a animação está no ar e um único golpe mata
  // qualquer coisa.
  atacarInimigo(inimigo) {
    if (this.golpeConsumido.has(inimigo)) return;
    this.golpeConsumido.add(inimigo);
    inimigo.levarDano(1);
    this.cameras.main.shake(70, 0.003);
  }

  tocarInimigo(inimigo) {
    if (!inimigo.perigoso || this.player.isDead || this.player.invulnerable) return;
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

    // Grama e raízes transbordando sobre a quina. Sem isso o degrau termina
    // numa vertical perfeita e lê como bloco colado sobre o cenário — o
    // problema é a regularidade da silhueta, não a cor.
    this.add
      .image(espelhado ? x + TILE : x, row * TILE + GROUND_INSET, 'bosque_borda')
      .setOrigin(espelhado ? 0 : 1, 0)
      .setFlipX(espelhado)
      .setDepth(-8);
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
      this.addOneWay(x0, y + PLATFORM_INSET, width, PLATFORM_SOLID_H);
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
  // Mirante
  // --------------------------------------------------------------------
  // A Árvore Gigante não é camada de parallax: como fundo permanente ela
  // poluía a tela e brigava com o primeiro plano. Ela aparece por
  // ENQUADRAMENTO, em pontos escolhidos — aqui, no ponto mais alto da fase,
  // como recompensa de quem sobe. Continua sendo o marco visual do bioma
  // (02_CONTINENTE.md), mas por composição em vez de onipresença.
  buildArvoreMirante() {
    if (this.L.MIRANTE_TILE === undefined) return;

    this.add
      .image(this.L.MIRANTE_TILE * TILE, this.groundTopAt(this.L.MIRANTE_TILE), 'bosque_arvore')
      .setOrigin(0.5, 1)
      // Parallax bem lento: quanto mais devagar a camada anda, mais distante
      // ela parece. É o que dá escala à árvore sem precisar aumentá-la.
      .setScrollFactor(0.25, 1)
      .setDepth(-60);
  }

  // --------------------------------------------------------------------
  // Itens de cura
  // --------------------------------------------------------------------
  // Itens no caminho ALTO ou em desvios (VS_1_BOSQUE_ESMERALDA.md, Seção 9):
  // recompensa por escolher o risco em vez da rota segura.
  buildItensCura() {
    this.curaZones = this.L.HEALING_ITEMS.map(([tileX, row], i) => {
      const x = tileX * TILE;
      const y = row * TILE;

      const sprite = this.add
        .image(x, y, 'item_cura')
        .setOrigin(0.5, 1)
        .setDepth(-5);

      this.tweens.add({
        targets: sprite,
        y: y - 6,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const zone = this.add.zone(x, y - 24, 60, 56);
      this.physics.add.existing(zone, true);
      zone.setData({ id: i, sprite });
      return zone;
    });
  }

  coletarCura(zone) {
    const id = zone.getData('id');
    if (this.curaColetadas.has(id)) return;
    this.curaColetadas.add(id);

    const sprite = zone.getData('sprite');
    this.tweens.killTweensOf(sprite);
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 40,
      alpha: 0,
      duration: 420,
      onComplete: () => sprite.destroy(),
    });
    this.showNotice('Ervas curativas');
  }

  // --------------------------------------------------------------------
  // Fenda bloqueada
  // --------------------------------------------------------------------
  // Passagem baixa, visível do caminho principal e intransponível a pé.
  // Não se resolve neste bioma — o Rolamento só chega depois do Boss. Existe
  // para plantar curiosidade (03_GAMEPLAY_MACRO.md, Seção 6), e por isso é
  // sinalizada mesmo sem o jogador ter a habilidade.
  buildFenda() {
    if (this.L.FENDA_TILE === undefined) return;

    const x = this.L.FENDA_TILE * TILE;
    const y = this.groundTopAt(this.L.FENDA_TILE);

    // Vão escuro de meio tile de altura: alto o bastante para se ver que é
    // passagem, baixo o bastante para ser obviamente impossível de pé.
    this.add.rectangle(x, y, TILE * 2, TILE * 0.5, 0x121c14, 0.92)
      .setOrigin(0, 1)
      .setDepth(-7);

    const marca = this.add.rectangle(x + TILE, y - TILE * 0.5, TILE * 2, 4, 0xd8cba8, 0.5)
      .setOrigin(0.5, 1)
      .setDepth(-6);
    this.tweens.add({
      targets: marca, alpha: 0.15, yoyo: true, repeat: -1, duration: 1600,
    });
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

    this.physics.add.overlap(this.player, this.projeteis, (_jogador, pedra) => {
      if (this.player.isDead || this.player.invulnerable) return;
      this.player.hurt(this.player.x < pedra.x ? -1 : 1);
      pedra.destroy();
    });

    // A pedra se despedaça ao bater no cenário — não atravessa parede nem
    // fica rolando pelo chão.
    this.physics.add.collider(this.projeteis, this.solids, (pedra) => pedra.destroy());

    // Só o dano por CONTATO usa overlap de física. O golpe é resolvido à mão
    // em resolverGolpe(), com caixa própria.
    this.enemies.forEach((inimigo) => {
      inimigo.colisores.push(
        this.physics.add.overlap(this.player, inimigo, () => this.tocarInimigo(inimigo)),
      );
    });

    this.curaZones.forEach((zone) => {
      this.physics.add.overlap(this.player, zone, () => this.coletarCura(zone));
    });
  }

  /** Chamada pelas fases a cada frame, depois de updateCommon. */
  updateEnemies(time) {
    // Libera o próximo golpe só quando o ataque termina. Sem isso um único
    // golpe acertaria a cada frame em que a animação está no ar.
    if (!this.player.isAttacking) this.golpeConsumido.clear();
    this.resolverGolpe();

    // Cópia da lista: um inimigo pode morrer durante o próprio update e se
    // remover de this.enemies, o que embaralharia o índice de um forEach
    // rodando sobre o array original.
    [...this.enemies].forEach((inimigo) => inimigo.atualizar(this.player, time));
  }
}
