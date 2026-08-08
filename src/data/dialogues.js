// Diálogos (06_INTERFACE_UX.md, Seção 4). Sempre curtos, sem blocos longos.
//
// `retrato` é a chave da textura do busto; null usa o retrato do protagonista
// (que só aparece quando ele tem uma fala relevante, não em toda interação).
//
// O ANCIÃO (VS_0_VILA_INICIAL.md, Seção 2): não é sábio, não é mentor, não é
// guia. É o morador mais velho da vila — alguém que viveu tempo suficiente
// para perceber que o mundo mudou, sem saber explicar como. Não conhece os
// Guardiões, não conhece as Brasas, não conhece a origem do protagonista, e
// não envia ninguém em missão nenhuma. O protagonista decide ir sozinho.

export const DIALOGUES = {
  anciao_vila: {
    nome: 'Ancião',
    retrato: 'retrato_anciao',
    falas: [
      { texto: 'Você também sentiu, não sentiu.' },
      { texto: 'O bosque anda diferente. Os bichos descem mais perto.' },
      { texto: 'Vivi tempo demais pra achar que isso é normal.' },
      { texto: 'Mas não sei dizer o que é. Ninguém sabe.' },
      { texto: 'Alguém devia ir olhar.', quem: 'anciao' },
      { texto: 'Eu não disse que era pra ser você.' },
    ],
  },
};
