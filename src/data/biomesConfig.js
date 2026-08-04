// Metadados de cada bioma (02_CONTINENTE.md + 03_GAMEPLAY_MACRO.md, Seção 5).
// 'implemented: false' até o Vertical Slice correspondente ter o Checklist de
// Produção 100% marcado (09_TEMPLATE_VERTICAL_SLICE.md, Seção 11).

export const BIOMES_CONFIG = [
  { id: 'vila_inicial', order: 0, name: 'Vila Inicial', brasa: null, ability: null, implemented: true },
  { id: 'bosque_esmeralda', order: 1, name: 'Bosque Esmeralda', brasa: 1, ability: 'rolamento', implemented: false },
  { id: 'floresta_sombria', order: 2, name: 'Floresta Sombria', brasa: 2, ability: 'chama_reveladora', implemented: false },
  { id: 'montanhas_de_ferro', order: 3, name: 'Montanhas de Ferro', brasa: 3, ability: 'punho_de_ferro', implemented: false },
  { id: 'pantano_maldito', order: 4, name: 'Pântano Maldito', brasa: 4, ability: 'veu_venenoso', implemented: false },
  { id: 'reino_esquecido', order: 5, name: 'Reino Esquecido', brasa: 5, ability: 'escudo_do_guardiao', implemented: false },
  { id: 'picos_congelados', order: 6, name: 'Picos Congelados', brasa: 6, ability: 'ancoragem_de_gelo', implemented: false },
  { id: 'terras_cinzentas', order: 7, name: 'Terras Cinzentas', brasa: 7, ability: 'asas_de_cinzas', implemented: false },
  { id: 'vulcao_da_origem', order: 8, name: 'Vulcão da Origem', brasa: 'final', ability: null, implemented: false },
];
