// Configuração de dados dos inimigos (08_ARQUITETURA_TECNICA.md, Seção 8).
//
// Um inimigo específico é DADO aplicado sobre uma das três subclasses de
// categoria — nunca uma classe do zero. Classe nova só se um padrão de ataque
// genuinamente novo aparecer, e nesse caso ele entra antes no
// 04_BESTIARIO_MACRO.md.
//
// Os valores numéricos são referência de design, ajustáveis em playtest
// (05_BALANCEAMENTO.md).

// Slime — Comum, padrão Contato (VS_1_BOSQUE_ESMERALDA.md, Seção 4).
//
// Primeiro alvo do ataque básico no jogo inteiro. Lento e previsível de
// propósito: ensina que encostar dói, sem exigir leitura de telegraph.
// Contato é o único padrão que dispensa antecipação visual — o movimento dele
// já é o aviso.
export const SLIME = {
  textura: 'slime_bosque',
  celula: 128,

  // Corpo bem menor que a célula: o Slime ocupa pouco mais da metade dela, e
  // a hitbox acompanha o corpo, não o quadro.
  // Corpo ajustado à arte definitiva, que é mais alta e mais redonda que a
  // provisória. Continua menor que a célula: a hitbox acompanha o corpo, não
  // o quadro.
  corpoW: 84,
  corpoH: 64,

  vida: 2,          // dois golpes do ataque básico
  dano: 1,          // teto de um Comum (05_BALANCEAMENTO.md, Seção 2)

  velocidade: 90,
  impulsoPulo: -430,
  intervaloPuloMs: 900,      // perseguindo
  intervaloPatrulhaMs: 1600, // patrulhando: bem mais lento
  esperaAlertaMs: 260,
  alcanceDeteccao: 260,
  knockback: 180,

  // Índices na folha 4x4, contados da esquerda para a direita e de cima para
  // baixo. Não seguem a linha inteira: em `dano` o quadro de impacto (5) vem
  // primeiro, e `morte` ignora a célula 15, que está vazia na arte.
  animacoes: {
    idle:  { quadros: [0, 1, 2, 3], taxa: 4, repetir: -1 },
    pulo:  { quadros: [4, 5, 6, 7], taxa: 8 },
    dano:  { quadros: [9, 10, 8], taxa: 12 },
    // Começa em 13, não em 12: o quadro 12 é o corpo ainda inteiro, e exibi-lo
    // depois do golpe fatal dava a impressão de que o Slime tinha sobrevivido.
    // A morte precisa começar já deformando.
    morte: { quadros: [13, 14], taxa: 9 },
  },
};

// Lobo — Comum, padrão Golpe Telegrafado (04_BESTIARIO_MACRO.md, Seção 3).
//
// O primeiro telegraph do jogo. O Slime ensinou que encostar dói; o Lobo
// ensina a LER a antecipação e a explorar a janela de recuperação depois do
// ataque. Por isso ele para completamente durante o telegraph: um inimigo que
// telegrafa andando não telegrafa nada.
export const LOBO = {
  textura: 'lobo_bosque',
  celula: 192,

  corpoW: 124,
  corpoH: 68,

  vida: 3,
  dano: 1,          // teto de um Comum, mesmo sendo mais ameaçador que o Slime

  padrao: 'telegrafado',
  locomocao: 'andar',
  velocidadePatrulha: 55,
  velocidade: 150,        // perseguindo — é assim que ele encurta distância
  duracaoBoteMs: 300,     // a mordida, executada PARADO
  alcanceDeteccao: 340,
  // Ele só morde coladinho. Quem se aproxima é a corrida; o golpe não avança
  // um pixel, senão o Lobo "surfa" na direção do jogador.
  alcanceBote: 78,
  telegrafoMs: 420,       // tempo parado, recuado, antes de avançar
  recuperacaoMs: 620,     // a abertura do jogador, depois do bote
  esperaAlertaMs: 200,
  knockback: 200,

  animacoes: {
    idle:     { quadros: [0, 1, 2, 3], taxa: 5, repetir: -1 },
    correr:   { quadros: [4, 5, 6, 7], taxa: 11, repetir: -1 },
    preparar: { quadros: [9, 10], taxa: 5, repetir: -1 },
    bote:     { quadros: [11], taxa: 1 },
    dano:     { quadros: [12, 13], taxa: 10 },
    morte:    { quadros: [14, 15], taxa: 7 },
  },
};

// Morcego — Comum, padrão Contato.
//
// Primeira ameaça AÉREA do jogo. Existe para dar função aos caminhos altos:
// com ele em cena, subir deixa de ser só atalho e passa a ter custo.
//
// Dorme pendurado até perceber o jogador. Esse estado inicial não é enfeite —
// é a chance de vê-lo antes de ser atacado, que o Bestiário exige.
export const MORCEGO = {
  textura: 'morcego_bosque',
  celula: 128,

  corpoW: 72,
  corpoH: 54,

  vida: 1,          // frágil: a dificuldade dele é a posição, não a resistência
  dano: 1,

  locomocao: 'voar',
  velocidade: 120,
  alcanceDeteccao: 300,
  amplitudeOnda: 26,
  periodoOndaMs: 300,
  zonaMorta: 14,           // evita tremer ao chegar em cima do jogador
  esperaAlertaMs: 220,
  knockback: 160,

  animacoes: {
    pendurado: { quadros: [0, 1, 2, 3], taxa: 3, repetir: -1 },
    idle:      { quadros: [0, 1, 2, 3], taxa: 3, repetir: -1 },
    despertar: { quadros: [4, 5, 6, 7], taxa: 10 },
    voar:      { quadros: [8, 9, 10, 11], taxa: 12, repetir: -1 },
    dano:      { quadros: [13], taxa: 8 },
    morte:     { quadros: [14, 15], taxa: 7 },
  },
};

// Goblin Explorador — Guardião de Área, padrão Projétil
// (04_BESTIARIO_MACRO.md, Seções 1 e 3).
//
// Primeiro inimigo do jogo que ataca à distância. Guarda um ponto em vez de
// patrulhar, e recua quando o jogador se aproxima — é isso que o obriga a usar
// o alcance e que dá sentido a um atirador num plataforma.
//
// A escala sinaliza a categoria: maior que um Comum, muito menor que o
// Mini-Boss (07_DIRECAO_ARTE_AUDIO.md, Seção 5).
export const GOBLIN = {
  textura: 'goblin_bosque',
  celula: 160,

  corpoW: 62,
  corpoH: 96,

  vida: 3,
  dano: 1,          // teto de qualquer inimigo que não seja chefe

  padrao: 'projetil',
  locomocao: 'guardar',
  velocidade: 90,          // usada só para recuar
  distanciaMinima: 150,    // abaixo disso ele recua em vez de atirar
  alcanceDeteccao: 420,
  recargaMs: 1500,
  atrasoTiroMs: 260,       // a pedra sai no meio da animação, não no início
  esperaAlertaMs: 260,
  knockback: 170,

  // A pedra: lenta o bastante para ser desviada com um pulo, que é a regra de
  // telegraph do Bestiário aplicada a um projétil.
  projetil: {
    textura: 'pedra_bosque',
    velocidade: 430,
    impulsoVertical: -210,  // sobe antes de cair: é isso que faz o arco
    gravidade: 300,         // própria, bem mais leve que a do mundo
    vidaMs: 3200,
  },

  animacoes: {
    idle:       { quadros: [0, 1, 2, 3], taxa: 5, repetir: -1 },
    arremessar: { quadros: [5, 6, 7], taxa: 9 },
    recuar:     { quadros: [8, 9, 10, 11], taxa: 8, repetir: -1 },
    dano:       { quadros: [12, 13], taxa: 10 },
    morte:      { quadros: [14, 15], taxa: 7 },
  },
};

// Urso Corrompido — MINI-BOSS do Bosque Esmeralda
// (VS_1_BOSQUE_ESMERALDA.md, Seção 5).
//
// Dois padrões, os dois já vistos em versão menor: a Investida é a do Lobo em
// escala maior e mais lenta, e a Pisada é o primeiro ataque de Área do bioma.
// Nenhum padrão inédito — a regra do Bestiário é que um chefe não introduz
// padrão que o jogador nunca viu.
//
// Sem fases de vida: é Mini-Boss, não Boss (04_BESTIARIO_MACRO.md, Seção 5).
export const URSO = {
  textura: 'urso_bosque',
  celula: 320,

  corpoW: 230,
  corpoH: 130,

  vida: 12,
  dano: 1,          // ~1,5 unidade na régua do 05_BALANCEAMENTO.md, Seção 2

  padrao: 'telegrafado',    // só machuca durante o próprio golpe
  velocidade: 95,
  alcanceDeteccao: 900,     // a arena inteira
  alcanceAtaque: 420,       // daqui para dentro ele já ataca

  // Perto ele pisa, longe ele investe. Entre os dois, alterna.
  alcancePisada: 190,
  alcanceInvestida: 300,
  previsaoS: 0.30,          // mira onde o jogador vai estar, não onde está

  telegrafoInvestidaMs: 700,
  velocidadeInvestida: 460,
  duracaoInvestidaMs: 620,

  telegrafoPisadaMs: 780,   // mais longo: é o ataque de área, precisa ser lido
  duracaoPisadaMs: 420,
  raioPisada: 260,          // bem maior que o corpo: obriga a se afastar

  recuperacaoMs: 900,       // a abertura do jogador, depois de cada padrão
  esperaAlertaMs: 300,
  knockback: 120,           // pesado: quase não recua

  animacoes: {
    idle:     { quadros: [0, 1, 2, 3], taxa: 5, repetir: -1 },
    andar:    { quadros: [0, 1, 2, 3], taxa: 8, repetir: -1 },
    preparar: { quadros: [4, 5, 6], taxa: 5, repetir: -1 },
    investir: { quadros: [7], taxa: 1 },
    erguer:   { quadros: [8, 9], taxa: 4, repetir: -1 },
    pisar:    { quadros: [10, 11], taxa: 9 },
    dano:     { quadros: [12, 13], taxa: 9 },
    morte:    { quadros: [14, 15], taxa: 6 },
  },
};
