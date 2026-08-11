import Phaser from 'phaser';
import { GAME_HEIGHT, TILE, GROUND_INSET } from '../../../config/gameConfig.js';
import BiomeSceneBase from '../BiomeSceneBase.js';
import EnemyCommon from '../../../entities/enemies/EnemyCommon.js';
import EnemyMiniBoss from '../../../entities/enemies/EnemyMiniBoss.js';
import EnemyBoss from '../../../entities/enemies/EnemyBoss.js';
import { SLIME, LOBO, MORCEGO, GOBLIN, URSO, GUARDIAO } from '../../../data/enemiesConfig.js';

// Alcance da espada. Largura generosa de propósito: a regra do
// 03_GAMEPLAY_MACRO.md é hurtbox pequena e alcance folgado — o jogo pune
// leitura ruim, nunca mira imprecisa.
// Pisão. A velocidade mínima impede que encostar por cima andando conte como
// ataque; a tolerância dá folga para o frame em que o pé já entrou um pouco no
// corpo do inimigo.
const PISAO_VELOCIDADE_MIN = 40;
const PISAO_TOLERANCIA = 26;
const PISAO_QUIQUE = -520;

// Quantos tiles antes do chefe a soleira da arena é marcada. Sem isso, numa
// arena onde o chefe fica no meio, a trava fecharia no início do segmento e o
// jogador seria preso muito antes de ver contra o que vai lutar.
const ARENA_ANTECEDENCIA_TILES = 12;

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

    // Sem matar o Mini-Boss não se sai da fase. A parede da frente já impede
    // chegar aqui, mas a trava explícita cobre qualquer caminho que eu não
    // tenha previsto — a saída é o prêmio, não um lugar por onde se passa.
    if (this.miniBoss && this.miniBoss.vivo) return;

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

    if (this.L.GUARDIAO_TILE !== undefined) {
      this.chefe = this.criarChefe(this.L.GUARDIAO_TILE);
      this.enemies.push(this.chefe);
      this.miniBoss = this.chefe;      // reaproveita a trava de arena
      this.prepararArena(this.L.GUARDIAO_TILE);
    }

    if (this.L.URSO_TILE !== undefined) {
      this.miniBoss = this.criarMiniBoss(this.L.URSO_TILE);
      this.enemies.push(this.miniBoss);
      this.prepararArena(this.L.URSO_TILE);
    }
  }

  // Destrói um objeto MATANDO ANTES os tweens dele.
  //
  // O Phaser não cancela tweens ao destruir o alvo: um tween infinito continua
  // rodando e, no frame seguinte, tenta animar um objeto que já não existe —
  // exceção, update da cena morto, jogo travado com a música tocando.
  //
  // Foi o que derrubou a luta do Guardião: a marca das raízes e a sombra do
  // mergulho piscam em loop e são descartadas quando o ataque acaba.
  descartar(objeto) {
    if (!objeto) return;
    this.tweens.killTweensOf(objeto);
    objeto.destroy();
  }

  // --------------------------------------------------------------------
  // Boss (04_BESTIARIO_MACRO.md, Seções 5 e 6)
  // --------------------------------------------------------------------
  criarChefe(tileX) {
    const seg = this.segmentAt(tileX);
    const chefe = new EnemyBoss(this, tileX * TILE, this.groundTopAt(tileX), GUARDIAO);
    chefe.setDepth(-1);
    chefe.patrulharEntre(seg[0] * TILE + TILE, (seg[0] + seg[1]) * TILE - TILE);

    chefe.colisorChao = this.physics.add.collider(chefe, this.solids);
    chefe.colisores = [];
    chefe.aoMorrer = () => this.removerInimigo(chefe);

    chefe.aoChamarRaizes = () => this.brotarRaizes(chefe);
    chefe.aoLancarFolhas = (direcao) => this.lancarFolhas(chefe, direcao);
    chefe.aoGolpearComGalho = () => this.resolverGalho(chefe);
    chefe.aoAfundar = () => this.criarSombra(chefe);
    chefe.aoMoverSombra = () => this.moverSombra(chefe);
    chefe.aoEmergir = () => this.recolherSombra();
    chefe.aoImpactar = () => this.resolverImpactoChefe(chefe);
    chefe.aoVirarFase = () => this.anunciarSegundaFase(chefe);
    return chefe;
  }

  // RAÍZES — padrão Área. A marca no chão vem ANTES, e é ela que torna o
  // ataque justo: o jogador vê onde vai brotar e tem tempo de sair.
  brotarRaizes(chefe) {
    const cfg = chefe.cfg.raizes;
    const inicio = this.player.x - ((cfg.quantidade - 1) / 2) * cfg.espacamento;

    for (let i = 0; i < cfg.quantidade; i++) {
      const x = inicio + i * cfg.espacamento;
      const y = this.groundTopAt(Math.floor(x / TILE));

      const marca = this.add
        .ellipse(x, y, cfg.espacamento * 0.7, 18, 0x2a1d12, 0.75)
        .setOrigin(0.5, 1)
        .setDepth(-3);
      this.tweens.add({ targets: marca, alpha: 0.3, yoyo: true, repeat: -1, duration: 180 });

      this.time.delayedCall(cfg.avisoMs, () => {
        this.descartar(marca);
        this.erguerRaiz(chefe, x, y);
      });
    }
  }

  erguerRaiz(chefe, x, y) {
    const cfg = chefe.cfg.raizes;

    // A raiz reaproveita a arte dos espinhos do bioma: é o mesmo vocabulário
    // visual de "isso brota do chão e machuca", e o jogador já sabe lê-lo.
    const raiz = this.add
      .image(x, y + 10, 'bosque_espinhos')
      .setOrigin(0.5, 1)
      .setScale(1.6)
      .setTint(0x6b5334)
      .setDepth(-3);

    this.tweens.add({ targets: raiz, y, duration: 130, ease: 'Back.easeOut' });

    const golpear = () => {
      if (this.player.isDead || this.player.invulnerable) return;
      if (Math.abs(this.player.x - x) > cfg.espacamento * 0.45) return;
      if (this.player.body.bottom < y - cfg.alturaAcerto) return;

      // Raiz brotando por baixo DERRUBA: o jogador vai ao chão e perde o tempo
      // de levantar. É o que dá peso ao ataque e o que ensina a respeitar a
      // marca no chão.
      this.player.derrubar(this.player.x < x ? -1 : 1);
    };

    golpear();
    const janela = this.time.addEvent({ delay: 60, repeat: 8, callback: golpear });

    this.time.delayedCall(cfg.duracaoMs, () => {
      janela.remove();
      this.tweens.add({
        targets: raiz, y: y + 20, alpha: 0, duration: 200,
        onComplete: () => raiz.destroy(),
      });
    });
  }

  // NAVALHADA — padrão Projétil, em três alturas. A resposta é achar a brecha:
  // uma passa rente ao chão, uma na altura do peito e uma alta.
  lancarFolhas(chefe, direcao) {
    const cfg = chefe.cfg.folhas;

    cfg.alturas.forEach((altura, i) => {
      this.time.delayedCall(i * 90, () => {
        if (!chefe.vivo) return;

        const folha = this.projeteis.create(
          chefe.x + direcao * chefe.body.halfWidth,
          chefe.body.bottom + altura,
          cfg.textura,
        );
        folha.setDepth(-1);
        folha.body.setAllowGravity(false);
        folha.setVelocity(direcao * cfg.velocidade, 0);
        folha.setAngularVelocity(direcao * 720);
        folha.setData('expiraEm', this.time.now + cfg.vidaMs);
      });
    });
  }

  resolverGalho(chefe) {
    if (this.player.isDead || this.player.invulnerable) return;

    const corpo = chefe.body;
    const frente = chefe.flipX ? -1 : 1;
    const inicio = frente > 0 ? corpo.right : corpo.left - chefe.cfg.larguraGalho;
    const fim = inicio + chefe.cfg.larguraGalho;

    const alvo = this.player.body;
    if (alvo.right < Math.min(inicio, fim) || alvo.left > Math.max(inicio, fim)) return;
    if (alvo.bottom < corpo.top || alvo.top > corpo.bottom) return;

    this.player.hurt(frente, chefe.cfg.empurrao);
  }

  // MERGULHO — o ataque assinatura. Ele some, e uma sombra corre pelo chão
  // perseguindo o jogador. A sombra é MAIS LENTA que ele: quem corre escapa,
  // quem para, não. É ela que decide onde o Guardião vai cair.
  criarSombra(chefe) {
    this.sombra = this.add
      .ellipse(chefe.x, this.groundTopAt(Math.floor(chefe.x / TILE)), 200, 44, 0x101a0e, 0.55)
      .setOrigin(0.5, 1)
      .setDepth(-3);

    this.tweens.add({
      targets: this.sombra, scaleX: 1.12, yoyo: true, repeat: -1, duration: 320,
    });
  }

  moverSombra(chefe) {
    if (!this.sombra) return;

    const passo = chefe.cfg.mergulho.velocidadeSombra * (this.game.loop.delta / 1000);
    const rumo = Math.sign(this.player.x - this.sombra.x);
    this.sombra.x += rumo * Math.min(passo, Math.abs(this.player.x - this.sombra.x));
    this.sombra.y = this.groundTopAt(Math.floor(this.sombra.x / TILE));
  }

  recolherSombra() {
    if (!this.sombra) return undefined;
    const x = this.sombra.x;
    this.descartar(this.sombra);
    this.sombra = null;
    return x;
  }

  resolverImpactoChefe(chefe) {
    this.cameras.main.shake(380, 0.02);
    this.poeiraDeImpacto(chefe, chefe.cfg.mergulho.raioImpacto);

    if (this.player.isDead || this.player.invulnerable) return;

    const noAr = !(this.player.body.blocked.down || this.player.body.touching.down);
    if (noAr) return;
    if (Math.abs(this.player.x - chefe.x) > chefe.cfg.mergulho.raioImpacto) return;

    this.player.hurt(this.player.x < chefe.x ? -1 : 1, chefe.cfg.empurrao);
  }

  anunciarSegundaFase(chefe) {
    this.cameras.main.shake(700, 0.01);
    this.cameras.main.flash(220, 40, 30, 20);
    this.poeiraDeImpacto(chefe, chefe.cfg.mergulho.raioImpacto);
    this.showNotice('A casca racha');
  }

  // --------------------------------------------------------------------
  // Arena do Mini-Boss (04_BESTIARIO_MACRO.md, Seção 7)
  // --------------------------------------------------------------------
  // Arena fechada, sem fuga, e sinalizada ANTES da entrada. As duas coisas são
  // exigidas pelo Bestiário, e a segunda importa tanto quanto a primeira: o
  // jogador precisa poder decidir se entra, em vez de ser trancado de surpresa.
  prepararArena(tileX) {
    const seg = this.segmentAt(tileX);

    // A parede da frente fica antes da SAÍDA, não no fim do segmento: a saída
    // costuma ficar dentro da própria arena, e uma parede depois dela deixaria
    // um corredor por onde dava para escapar sem lutar.
    const fimTile = Math.min(seg[0] + seg[1], this.L.EXIT_TILE) - 2;
    const entradaTile = Math.max(seg[0], tileX - ARENA_ANTECEDENCIA_TILES);

    this.arena = {
      entradaX: entradaTile * TILE,
      fimX: fimTile * TILE,
      fechada: false,
    };

    // Sinalização: dois marcos de pedra e uma faixa escura no chão marcando a
    // soleira. É o aviso de que dali para frente não se volta.
    const y = this.groundTopAt(entradaTile);
    [-1, 1].forEach((lado) => {
      this.add
        .rectangle(this.arena.entradaX + lado * 26, y, 16, 78, 0x4a5340)
        .setOrigin(0.5, 1)
        .setDepth(-6);
    });
    this.add
      .rectangle(this.arena.entradaX, y, 10, TILE * 5, 0x1d2a1c, 0.35)
      .setOrigin(0.5, 1)
      .setDepth(-7);
  }

  atualizarArena() {
    const arena = this.arena;
    if (!arena || arena.fechada) return;
    if (this.player.x < arena.entradaX + TILE) return;

    arena.fechada = true;

    // Paredes invisíveis nas duas pontas. Só a de trás precisaria existir para
    // impedir a fuga, mas sem a da frente daria para atravessar a arena
    // correndo e sair pelo outro lado sem lutar.
    arena.paredes = [
      this.addSolid(arena.entradaX - TILE, 0, TILE, GAME_HEIGHT),
      this.addSolid(arena.fimX, 0, TILE, GAME_HEIGHT),
    ];

    this.cameras.main.shake(240, 0.008);
    this.showNotice('Algo bloqueia a passagem');
  }

  abrirArena() {
    const arena = this.arena;
    if (!arena || !arena.fechada || arena.aberta) return;

    arena.aberta = true;
    arena.paredes.forEach((parede) => parede.destroy());
    this.showNotice('O caminho se abre');
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
    urso.aoAterrar = () => this.resolverImpacto(urso);
    urso.aoGolpearComGarra = () => this.resolverGarra(urso);
    urso.aoRugir = () => this.cameras.main.shake(500, 0.006);
    return urso;
  }

  // Impacto da aterrissagem: onda de choque no chão.
  //
  // Quem está NO AR escapa — é a saída que o ataque deixa em aberto, e o que
  // faz dele um ataque legível em vez de um imposto. O telegraph do
  // agachamento existe justamente para dar tempo de pular.
  resolverImpacto(urso) {
    this.cameras.main.shake(320, 0.016);
    this.poeiraDeImpacto(urso, urso.cfg.raioImpacto);

    if (this.player.isDead || this.player.invulnerable) return;

    const noAr = !(this.player.body.blocked.down || this.player.body.touching.down);
    if (noAr) return;

    if (Math.abs(this.player.x - urso.x) > urso.cfg.raioImpacto) return;
    this.player.hurt(this.player.x < urso.x ? -1 : 1, urso.cfg.empurrao);
  }

  // Poeira. Três camadas com tempos diferentes, porque uma nuvem única lê como
  // um retângulo crescendo: as nuvens baixas e rápidas dão o impacto, as altas
  // e lentas dão o peso do bicho.
  // O RAIO vem por parâmetro, não da configuração do inimigo.
  //
  // Antes ela lia `cfg.raioImpacto`, que existe na raiz da configuração do
  // Urso mas fica aninhado em `mergulho` na do Guardião. Chamada com o Boss,
  // o raio vinha `undefined`, o tween recebia uma largura indefinida e
  // derrubava a cena. Um efeito visual não deveria saber a forma da
  // configuração de quem o chamou.
  poeiraDeImpacto(origem, raio) {
    const solo = origem.body.bottom - 4;
    const cor = 0xcdbb95;

    [-1, 1].forEach((lado) => {
      // Frente de poeira correndo rente ao chão.
      const frente = this.add
        .ellipse(origem.x, solo, 40, 22, cor, 0.7)
        .setOrigin(lado < 0 ? 1 : 0, 1)
        .setDepth(-2);
      this.tweens.add({
        targets: frente,
        width: raio,
        height: 46,
        alpha: 0,
        duration: 420,
        ease: 'Cubic.easeOut',
        onComplete: () => frente.destroy(),
      });

      // Tufos soltos, subindo e abrindo em ritmos diferentes.
      for (let i = 0; i < 4; i++) {
        const distancia = 70 + i * 90;
        const tufo = this.add
          .circle(origem.x + lado * 30, solo - 6, 12 + i * 4, cor, 0.55)
          .setDepth(-2);

        this.tweens.add({
          targets: tufo,
          x: origem.x + lado * distancia,
          y: solo - 30 - i * 14,
          scale: 2.1,
          alpha: 0,
          duration: 480 + i * 90,
          ease: 'Quad.easeOut',
          onComplete: () => tufo.destroy(),
        });
      }
    });

    // Pedrinhas saltando: detalhe pequeno que vende o peso do impacto.
    for (let i = 0; i < 6; i++) {
      const lado = i % 2 ? 1 : -1;
      const pedrinha = this.add
        .rectangle(origem.x + lado * 20, solo - 8, 6, 6, 0x8c7f63, 0.9)
        .setDepth(-2);

      this.tweens.add({
        targets: pedrinha,
        x: pedrinha.x + lado * (90 + i * 40),
        y: solo - 90 - i * 10,
        alpha: 0,
        duration: 380 + i * 40,
        ease: 'Quad.easeOut',
        onComplete: () => pedrinha.destroy(),
      });
    }
  }

  // Golpe de pata: acerta a faixa à frente do corpo, avaliado a cada frame
  // enquanto ele avança golpeando.
  resolverGarra(urso) {
    if (this.player.isDead || this.player.invulnerable) return;

    const corpo = urso.body;
    const frente = urso.flipX ? -1 : 1;
    const inicio = frente > 0 ? corpo.right : corpo.left - urso.cfg.larguraGarra;
    const fim = inicio + urso.cfg.larguraGarra;

    const alvo = this.player.body;
    if (alvo.right < Math.min(inicio, fim) || alvo.left > Math.max(inicio, fim)) return;
    if (alvo.bottom < corpo.top || alvo.top > corpo.bottom) return;

    this.player.hurt(frente, urso.cfg.empurrao);
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

    const saidaX = origem.x + direcao * corpo.halfWidth;
    const saidaY = corpo.center.y - 10;

    const pedra = this.projeteis.create(saidaX, saidaY, cfg.textura);
    pedra.setDepth(-1);

    // A gravidade do MUNDO é a do personagem — pesada de propósito, para o
    // pulo ter peso. Aplicada a uma pedra, ela derrubava o arremesso no chão
    // quase na mão do Goblin. O projétil desliga a gravidade global e usa uma
    // própria, bem mais leve, que é o que produz um arco longo.
    pedra.body.setAllowGravity(false);
    pedra.body.setGravityY(cfg.gravidade);

    // MIRA o centro do corpo do jogador, em vez de um impulso vertical fixo.
    //
    // Com impulso fixo a pedra saía sempre para cima, no mesmo arco, e passava
    // por cima de quem estava logo à frente. Aqui o tempo de voo sai da
    // distância horizontal e a velocidade vertical é a que faz a pedra chegar
    // naquela altura nesse tempo, já descontando a queda pela gravidade —
    // continua sendo um arco, mas um arco que aponta para alguém.
    const alvo = this.player.body.center;
    const tempo = Math.max(0.25, Math.abs(alvo.x - saidaX) / cfg.velocidade);
    const vy = (alvo.y - saidaY) / tempo - (cfg.gravidade * tempo) / 2;

    pedra.setVelocity(
      direcao * cfg.velocidade,
      Phaser.Math.Clamp(vy, -cfg.subidaMaxima, cfg.subidaMaxima),
    );
    pedra.setAngularVelocity(direcao * 320);

    // A pedra errada segue viagem até SAIR DA TELA — não evapora no ar perto
    // do jogador, que é o que um temporizador fixo fazia. Quem desvia vê o
    // tiro passar reto e ir embora, e isso é informação: ele entende para onde
    // o Goblin mira.
    //
    // O limite de tempo continua existindo, mas só como rede de segurança para
    // uma pedra que nunca saia do quadro.
    pedra.setData('expiraEm', this.time.now + cfg.vidaMs);
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

    // A saída da fase só libera quando o Mini-Boss cai.
    if (inimigo === this.miniBoss) this.abrirArena();

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

  // Pisão: cair em cima de um inimigo machuca ELE, não o jogador.
  //
  // Vale para qualquer inimigo, inclusive o Mini-Boss. Não é atalho: exige
  // estar caindo e acertar o topo do corpo, e o quique devolve o jogador ao ar
  // sem controle imediato — quem erra a altura leva dano normalmente.
  //
  // Isso muda o valor dos caminhos altos e das plataformas atravessáveis, que
  // deixam de ser só rota e viram posição de ataque.
  tentarPisao(inimigo) {
    const jogador = this.player.body;
    const alvo = inimigo.body;

    const caindo = jogador.velocity.y > PISAO_VELOCIDADE_MIN;
    const acimaDoAlvo = jogador.bottom <= alvo.top + PISAO_TOLERANCIA;
    if (!caindo || !acimaDoAlvo) return false;

    inimigo.levarDano(1);
    this.player.setVelocityY(PISAO_QUIQUE);
    this.cameras.main.shake(60, 0.004);
    return true;
  }

  tocarInimigo(inimigo) {
    if (!inimigo.vivo || this.player.isDead || this.player.invulnerable) return;

    // O pisão é testado ANTES do dano por contato: quem cai em cima de um
    // Slime não deveria se machucar nele.
    if (this.tentarPisao(inimigo)) return;

    if (!inimigo.perigoso) return;
    // Padrão Contato: o dano vem do encostar, sem telegraph
    // (04_BESTIARIO_MACRO.md, Seção 3).
    this.player.hurt(this.player.x < inimigo.x ? -1 : 1, inimigo.cfg.empurrao ?? 1);
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

    // Ancorada no chão MAIS BAIXO da fase, não no chão do mirante.
    //
    // O mirante fica num ponto alto, e apoiar a árvore ali deixava a base dela
    // pairando bem acima do terreno vizinho — como ela é camada de fundo e
    // aparece sobre trechos inteiros da fase, a base precisa ficar abaixo de
    // qualquer chão visível. O extra enterra as raízes em vez de encostá-las.
    const linhaMaisBaixa = Math.max(...this.L.GROUND_SEGMENTS.map(([, , row]) => row));
    const base = linhaMaisBaixa * TILE + GROUND_INSET + TILE;

    this.add
      .image(this.L.MIRANTE_TILE * TILE, base, 'bosque_arvore')
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
  // Limpa projéteis que já saíram de vista. Sem isso cada pedra errada ficaria
  // viva até o fim da fase, e o Goblin atira a cada segundo e meio.
  updateProjeteis(time) {
    const camera = this.cameras.main;
    const margem = 120;

    this.projeteis.getChildren().slice().forEach((pedra) => {
      if (!pedra.active) return;

      const foraDaTela = pedra.x < camera.scrollX - margem
        || pedra.x > camera.scrollX + camera.width + margem
        || pedra.y > GAME_HEIGHT + margem
        || pedra.y < -margem;

      if (foraDaTela || time > pedra.getData('expiraEm')) pedra.destroy();
    });
  }

  updateEnemies(time) {
    this.updateProjeteis(time);
    this.atualizarArena();

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
