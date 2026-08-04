import Enemy from './Enemy.js';

// Categoria "Boss" (04_BESTIARIO_MACRO.md, Seção 5): 3+ padrões de ataque,
// mínimo 2 fases de vida recomendado, arena obrigatória.
export default class EnemyBoss extends Enemy {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, config);
    this.attackPatterns = config.attackPatterns ?? [];
    this.lifePhases = config.lifePhases ?? 2;
    this.currentPhase = 1;
  }
}
