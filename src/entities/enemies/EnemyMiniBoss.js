import Enemy from './Enemy.js';

// Categoria "Mini-Boss" (04_BESTIARIO_MACRO.md, Seção 5): 2 padrões de ataque,
// fase de vida opcional, arena opcional.
export default class EnemyMiniBoss extends Enemy {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, config);
    this.attackPatterns = config.attackPatterns ?? [];
  }
}
