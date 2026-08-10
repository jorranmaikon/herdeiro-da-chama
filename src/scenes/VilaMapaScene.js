import BiomeMapaScene from './BiomeMapaScene.js';

// Mapa do Bioma — Vila Inicial (06_INTERFACE_UX.md, Seção 2.2).
//
// São DUAS fases, e não as quatro do padrão de bioma: a Região 0 é tutorial sem
// combate (exceção registrada no VS_0_VILA_INICIAL.md, Seção 3).
//
// A Fase 1 é o marcador de BAIXO, junto ao portão de entrada da vila; a Fase 2
// é o de cima, onde a trilha segue para o Bosque Esmeralda. A ordem acompanha o
// sentido da jornada no mapa, de fora para dentro do continente.
//
// As coordenadas são os centros dos marcadores já desenhados na arte,
// convertidos da resolução original (1536x1024) para o canvas do jogo.
export default class VilaMapaScene extends BiomeMapaScene {
  constructor() {
    super('VilaMapaScene', {
      regiao: 'vila',
      titulo: 'Vila Inicial',
      textura: 'mapa_vila',
      pontos: {
        vila_1: { x: 638, y: 501 },
        vila_2: { x: 604, y: 232 },
      },
    });
  }
}
