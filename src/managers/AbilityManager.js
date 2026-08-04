// Sabe quais Brasas o jogador já tem, registra instâncias de habilidade ativas,
// expõe canUse() para o level design sinalizar bloqueios
// (03_GAMEPLAY_MACRO.md, Seção 6 / 08_ARQUITETURA_TECNICA.md, Seção 5).

class AbilityManagerClass {
  constructor() {
    this.unlocked = new Set(); // ex: 'rolamento', 'chama_reveladora'
    this.instances = new Map(); // nome -> instância de AbilityBase
  }

  unlock(name, abilityInstance) {
    this.unlocked.add(name);
    this.instances.set(name, abilityInstance);
  }

  canUse(name) {
    return this.unlocked.has(name);
  }

  get(name) {
    return this.instances.get(name) ?? null;
  }
}

export const AbilityManager = new AbilityManagerClass();
