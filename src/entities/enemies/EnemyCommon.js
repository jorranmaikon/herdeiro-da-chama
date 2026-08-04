import Enemy from './Enemy.js';

// Categoria "Comum" (04_BESTIARIO_MACRO.md, Seção 1).
// Ajusta apenas parâmetros — a FSM vem inteira de Enemy.
export default class EnemyCommon extends Enemy {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, config);
  }
}
