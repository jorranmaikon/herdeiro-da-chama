import BiomeMapaScene from './BiomeMapaScene.js';

// Mapa do Bioma — Bosque Esmeralda (06_INTERFACE_UX.md, Seção 2.2).
//
// A trilha sobe do portão de entrada, no canto inferior, até a base da Árvore
// Gigante, no alto — o mesmo sentido da jornada do bioma. As coordenadas são
// os pontos de chão limpo desenhados na arte, convertidos da resolução original
// (1024x687) para o canvas do jogo.
//
// O padrão de bioma prevê 4 fases (02_CONTINENTE.md). Só as duas primeiras
// existem hoje; as outras aparecem no mapa como bloqueadas assim que forem
// declaradas em data/progressao.js, sem mudança nesta cena.
export default class BosqueMapaScene extends BiomeMapaScene {
  constructor() {
    super('BosqueMapaScene', {
      regiao: 'bosque',
      titulo: 'Bosque Esmeralda',
      textura: 'mapa_bosque',
      pontos: {
        bosque_1: { x: 455, y: 605 },   // portão de entrada, canto inferior
        bosque_2: { x: 690, y: 470 },   // ponte de troncos sobre o riacho
        bosque_3: { x: 330, y: 430 },   // arco de pedra caído
        bosque_4: { x: 600, y: 200 },   // clareira, ao pé da Árvore Gigante
      },
    });
  }
}
