// Crônicas — a narrativa do jogo é entregue por aqui, nunca por cutscene
// animada (00_GAME_BIBLE.md, "Direção Cinematográfica").
//
// Cada bloco de texto vira uma "batida": aparece em typewriter, espera, some.
// Blocos curtos, no espírito de Elden Ring / Dark Souls.
//
// LIMITE DE LORE (01_LORE.md): a Crônica de Abertura mostra O QUE aconteceu,
// nunca QUEM nem POR QUÊ. Não nomeia os Guardiões, não menciona as Brasas e
// não liga nada ao protagonista — ele não conhece a própria origem.

export const CHRONICLES = {
  cronica_vila_01: {
    imagem: 'cronica_vila_01',
    proxima: 'ContinenteScene',
    blocos: [
      'Antes dos reinos, antes dos nomes,\nexistia apenas uma montanha.',
      'Dentro dela ardia uma chama.',
      'Enquanto ela queimou, os rios correram\ne as estações seguiram seu ciclo.',
      'Ninguém sabia de onde ela viera.\nNinguém precisava saber.',
      'Então a montanha ruiu.',
      'E o mundo esqueceu o motivo.',
    ],
  },

  // Dispara ao concluir a FASE 2 (exploração), não a Fase 1: é ali que o
  // protagonista deixa de fato a Vila Inicial. Enquanto a Fase 2 não existe,
  // esta Crônica fica registrada e sem gatilho.
  cronica_vila_02: {
    imagem: 'cronica_vila_02',
    proxima: 'VilaMapaScene',
    blocos: [
      'Ele não sabia o que procurava.',
      'Sabia apenas que os sinais vinham do bosque.',
      'E que ninguém mais iria.',
    ],
  },
};
