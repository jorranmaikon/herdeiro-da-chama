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
  corpoW: 68,
  corpoH: 40,

  vida: 2,          // dois golpes do ataque básico
  dano: 1,          // teto de um Comum (05_BALANCEAMENTO.md, Seção 2)

  velocidade: 90,
  impulsoPulo: -430,
  intervaloPuloMs: 900,      // perseguindo
  intervaloPatrulhaMs: 1600, // patrulhando: bem mais lento
  esperaAlertaMs: 260,
  alcanceDeteccao: 260,
  knockback: 180,

  animacoes: {
    idle:  { linha: 0, taxa: 4, repetir: -1 },
    pulo:  { linha: 1, taxa: 8 },
    dano:  { linha: 2, taxa: 12 },
    morte: { linha: 3, taxa: 9 },
  },
};
