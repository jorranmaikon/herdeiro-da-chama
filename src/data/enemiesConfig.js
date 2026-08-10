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

  locomocao: 'andar',
  velocidadePatrulha: 55,
  velocidade: 130,        // perseguindo
  velocidadeBote: 620,    // o bote em si: rápido o bastante para acertar
  duracaoBoteMs: 260,     // quanto tempo ele mantém essa velocidade
  alcanceDeteccao: 340,
  // Curto de propósito. Com 170px ele telegrafava do outro lado da tela e o
  // bote acabava antes de chegar perto — dava para andar até ele sem risco.
  alcanceBote: 110,
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
