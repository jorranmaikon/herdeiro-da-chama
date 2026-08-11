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

  // Padrão Contato, não Telegrafado.
  //
  // A mordida parada não ficou boa: o Lobo travava na frente do jogador e a
  // animação de ataque não lia como ameaça. Um predador que corre em cima já
  // comunica o perigo pela própria corrida — e Contato é padrão legítimo do
  // 04_BESTIARIO_MACRO.md Seção 3 para inimigo rápido e previsível.
  //
  // O que ele ensina passa a ser posicionamento e ritmo de ataque, não leitura
  // de antecipação. Essa lição fica com o Urso, que tem telegraph de verdade.
  padrao: 'contato',
  locomocao: 'andar',
  velocidadePatrulha: 55,
  velocidade: 165,        // rápido: é a corrida que ameaça
  alcanceDeteccao: 380,
  alcanceBote: 0,         // nunca entra em modo de golpe
  duracaoBoteMs: 0,
  telegrafoMs: 0,
  recuperacaoMs: 0,
  esperaAlertaMs: 200,
  knockback: 200,

  animacoes: {
    idle:     { quadros: [0, 1, 2, 3], taxa: 5, repetir: -1 },
    correr:   { quadros: [4, 5, 6, 7], taxa: 11, repetir: -1 },
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

  corpoW: 56,
  corpoH: 40,

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
    // Rápida e com pouca gravidade: a trajetória é quase reta, apontada ao
    // corpo do jogador. Com gravidade alta a compensação da queda obrigava a
    // pedra a sair muito para cima, e ela passava por cima de quem estava
    // logo à frente — parecia que o Goblin mirava o céu.
    velocidade: 520,
    gravidade: 150,
    subidaMaxima: 170,      // teto do arco, para não virar tiro vertical
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
  celula: 400,
  // Sete linhas de animação em vez de quatro: ele tem mais ações que os
  // Comuns. O padrão, quando omitido, é 4x4.
  colunas: 4,
  linhas: 7,

  corpoW: 300,
  corpoH: 175,

  vida: 10,
  dano: 1,          // ~1,5 unidade na régua do 05_BALANCEAMENTO.md, Seção 2

  velocidade: 120,
  alcanceDeteccao: 1200,    // a arena inteira

  // --- Golpe de pata, executado ANDANDO -------------------------------
  // Ele nunca ataca parado: um chefe que trava no lugar para bater vira um
  // poste, e era isso que o fazia errar o alvo. O corpo continua avançando
  // durante todo o golpe.
  alcanceGarra: 300,
  // Tempos generosos. Com telegrafo curto era impossível encaixar um golpe
  // sem trocar dano, e trocar dano com um chefe de 14 de vida contra um
  // jogador de poucas unidades não é dificuldade — é aritmética perdida.
  // A janela de ataque do jogador é o telegrafo mais a recuperação.
  telegrafoGarraMs: 520,
  duracaoGarraMs: 620,
  velocidadeGarra: 170,     // o avanço durante o golpe
  larguraGarra: 90,

  // --- Salto ----------------------------------------------------------
  // Substitui a investida reta. O arco cai ONDE o jogador está em vez de
  // passar reto por ele, e a aterrissagem já é o ataque de área.
  alcanceSalto: 340,        // daqui para longe ele salta
  telegrafoSaltoMs: 900,    // agachado, comprimindo — o aviso

  // DISTÂNCIA FIXA, sem mira preditiva.
  //
  // O salto deixa de perseguir para virar algo que se pode LER: ele sempre
  // cobre a mesma distância na direção em que o jogador estava, e sempre com
  // o mesmo arco. Assim dá para correr por baixo dele no tempo certo, que é a
  // esquiva que a luta precisava ter.
  distanciaSalto: 480,
  impulsoSalto: -1050,      // 0,95s no ar e 251px de altura: cabe passar embaixo
  raioImpacto: 520,         // a onda de choque da aterrissagem

  // --- Rugido ---------------------------------------------------------
  // Marco, não fase de vida: não causa dano, e depois dele os intervalos
  // entre ataques encurtam.
  rugidoEmVida: 0.5,
  duracaoRugidoMs: 900,
  aceleracaoAposRugido: 0.8,

  recuperacaoMs: 1150,      // a abertura do jogador, depois de cada padrão
  esperaAlertaMs: 300,
  knockback: 120,           // pesado: quase não recua

  // Folha de 4 colunas por 7 linhas — 28 quadros.
  animacoes: {
    idle:     { quadros: [0, 1, 2, 3], taxa: 5, repetir: -1 },
    andar:    { quadros: [4, 5, 6, 7], taxa: 8, repetir: -1 },
    garra:    { quadros: [8, 9, 10, 11], taxa: 9 },
    agachar:  { quadros: [12, 13, 14, 15], taxa: 7 },
    saltar:   { quadros: [16, 17, 18], taxa: 8 },
    aterrar:  { quadros: [19], taxa: 1 },
    rugir:    { quadros: [20, 21], taxa: 3 },
    dano:     { quadros: [22, 23], taxa: 9 },
    morte:    { quadros: [24, 25, 26, 27], taxa: 6 },
  },
};

export const FOLHAS_DE_INIMIGO = [
  { arquivo: 'slime', cfg: SLIME },
  { arquivo: 'lobo', cfg: LOBO },
  { arquivo: 'morcego', cfg: MORCEGO },
  { arquivo: 'goblin', cfg: GOBLIN },
  { arquivo: 'urso', cfg: URSO },
];
