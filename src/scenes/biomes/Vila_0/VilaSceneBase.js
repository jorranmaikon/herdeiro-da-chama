import { GAME_HEIGHT, TILE, GROUND_INSET } from '../../../config/gameConfig.js';
import BiomeSceneBase from '../BiomeSceneBase.js';

// A grama da plataforma é mais rasa que a do chão, então o topo da colisão
// desce menos do que o GROUND_INSET usado nos tiles de terreno.
const PLATFORM_INSET = 6;

// Espessura do corpo de colisão da plataforma. Fina de propósito: só o topo é
// sólido, o resto da altura fica livre para passar por baixo.
//
// O valor não é arbitrário. Numa plataforma a 1 tile do chão, ele define a
// altura do vão por baixo: 14px de colisão deixam 44px livres. É a folga que o
// Rolamento (Brasa 1) precisará caber quando for implementado — o corpo do
// jogador tem 104px em pé e terá de encolher para 44px ou menos durante a
// esquiva. Mexer aqui exige rever isso.
const PLATFORM_SOLID_H = 14;

// Base comum das fases da Vila Inicial.
//
// Reúne o que toda fase do bioma precisa montar igual: parallax, terreno,
// plataformas, props, checkpoints, jogador, câmera, morte por queda e
// notificações. Cada fase concreta fornece seu módulo de layout e acrescenta
// só o que lhe é próprio — o tutorial na Fase 1, o NPC e o desvio bloqueado
// na Fase 2.
//
// Existe porque a Fase 2 repetiria cerca de 250 linhas da Fase 1 palavra por
// palavra, e o 08_ARQUITETURA_TECNICA.md trata duplicação como dívida: uma
// correção de colisão ou de parallax precisaria ser feita duas vezes, e
// esquecer uma delas é questão de tempo.
export default class VilaSceneBase extends BiomeSceneBase {
  // Três camadas. As alturas são espelhadas em tools/preview_fase.py — a
  // preview só serve para validar se mostrar exatamente o mesmo que o jogo.
  //
  // A treeline termina na linha do chão (a saia sólida continua abaixo,
  // tapando o que se veria por dentro de um vão); as colinas assomam ACIMA
  // dela, senão somem, e param bem antes do topo, senão cobrem o céu.
  parallaxLayers() {
    const ARVORES_SKIRT = 280;
    const COLINAS_TOP = 300;
    const alturaColinas = this.textures.get('bg_colinas').getSourceImage().height;

    return [
      { key: 'bg_ceu', scroll: 0, bottom: GAME_HEIGHT },
      { key: 'bg_colinas', scroll: 0.15, bottom: COLINAS_TOP + alturaColinas },
      { key: 'bg_arvores', scroll: 0.35, bottom: this.groundY + ARVORES_SKIRT },
    ];
  }

  // Cenário próprio da Vila: props de fundo, terreno plano, props de frente.
  buildScenery() {
    this.buildBackgroundProps();
    this.buildTerrain();
    this.buildForegroundProps();
  }

  // Marcos e edifícios ficam atrás do plano jogável, com parallax leve.
  // Sem colisão: são fundo (decisão registrada no VS_0_VILA_INICIAL.md).
  buildBackgroundProps() {
    this.L.BACKGROUND_PROPS.forEach(({ key, tileX, scroll, offsetY = 0 }) => {
      this.add
        .image(tileX * TILE, this.groundY + GROUND_INSET + offsetY, key)
        .setOrigin(0.5, 1)
        .setScrollFactor(scroll, 1)
        .setDepth(-50);
    });
  }

  // --------------------------------------------------------------------
  // Chão e plataformas
  // --------------------------------------------------------------------
  buildTerrain() {
    this.solids = this.physics.add.staticGroup();

    this.L.GROUND_SEGMENTS.forEach(([start, count]) => {
      this.addGroundSegment(start, count);
    });

    this.L.PLATFORMS.forEach(([start, count, heightTiles]) => {
      this.addPlatform(start, count, heightTiles);
    });
  }

  // Alterna entre as 3 variações de tile. Com uma variação só, a mesma
  // pedrinha reaparece a cada 64px e a repetição fica óbvia.
  tileVariant(prefix, tileX) {
    return `${prefix}_${tileX % 3}`;
  }

  addGroundSegment(start, count) {
    for (let i = 0; i < count; i++) {
      const x = (start + i) * TILE;
      this.add
        .image(x, this.groundY, this.tileVariant('tile_topo', start + i))
        .setOrigin(0, 0)
        .setDepth(-10);

      for (let row = 1; row <= this.L.FILL_ROWS; row++) {
        this.add
          .image(x, this.groundY + row * TILE, this.tileVariant('tile_fill', start + i + row))
          .setOrigin(0, 0)
          .setDepth(-10);
      }
    }

    // Um único corpo estático por segmento em vez de um por tile: menos
    // objetos de física e nenhuma "quina" interna onde o jogador possa travar.
    // O topo da colisão desce GROUND_INSET para acompanhar as pontas vazadas
    // da grama — sem isso o personagem parece flutuar acima do chão.
    this.addSolid(start * TILE, this.groundY + GROUND_INSET, count * TILE, TILE * 2);
  }

  // A plataforma é montada com três peças: ponta esquerda, meio repetível e
  // ponta direita. As pontas são arredondadas — é o que a faz ler como
  // plataforma e não como um naco de chão — e por isso não podem repetir.
  addPlatform(start, count, heightTiles) {
    const y = this.groundY - heightTiles * TILE;
    const x0 = start * TILE;
    const width = count * TILE;

    const esq = this.textures.get('plataforma_esq').getSourceImage();
    const meio = this.textures.get('plataforma_meio').getSourceImage();
    const dir = this.textures.get('plataforma_dir').getSourceImage();

    this.add.image(x0, y, 'plataforma_esq').setOrigin(0, 0).setDepth(-9);
    this.add.image(x0 + width, y, 'plataforma_dir').setOrigin(1, 0).setDepth(-9);

    const meioX = x0 + esq.width;
    const meioW = width - esq.width - dir.width;
    if (meioW > 0) {
      this.add
        .tileSprite(meioX, y, meioW, meio.height, 'plataforma_meio')
        .setOrigin(0, 0)
        .setDepth(-9);
    }

    // A colisão é uma FAIXA FINA no topo, não um bloco da altura do tile.
    // Com 64px de altura, uma plataforma a 1 tile do chão fechava a passagem
    // por baixo: o corpo de colisão descia 6px abaixo do próprio chão e virava
    // parede. Além do bug, plataforma suspensa em jogo de plataforma existe
    // para ser atravessada por baixo.
    this.addSolid(x0, y + PLATFORM_INSET, width, PLATFORM_SOLID_H);
  }

  // --------------------------------------------------------------------
  // Props de frente
  // --------------------------------------------------------------------
  buildForegroundProps() {
    this.L.FOREGROUND_PROPS.forEach(({ key, tileX }) => {
      this.add
        .image(tileX * TILE, this.groundY + GROUND_INSET, key)
        .setOrigin(0.5, 1)
        .setDepth(-5);
    });

    this.L.FENCES.forEach(({ tileX, pieces }) => {
      const src = this.textures.get('cerca').getSourceImage();
      const wanted = src.width * pieces;
      // Encurta a cerca ate a borda do segmento de chao em que ela comeca.
      // Sem isso ela seguia reta por cima do abismo, denunciando que o cenario
      // e so decoracao.
      const width = Math.min(wanted, this.segmentEndX(tileX) - tileX * TILE);
      if (width < src.width * 0.4) return;

      this.add
        .tileSprite(tileX * TILE, this.groundY + GROUND_INSET, width, src.height, 'cerca')
        .setOrigin(0, 1)
        .setDepth(-5);
    });
  }

  segmentEndX(tileX) {
    const seg = this.L.GROUND_SEGMENTS.find(([s, c]) => tileX >= s && tileX < s + c);
    return seg ? (seg[0] + seg[1]) * TILE : 0;
  }

}
