// Toda habilidade de Brasa estende esta base, garantindo a regra de dupla função
// (exploração + combate) do 03_GAMEPLAY_MACRO.md, Seção 5.
// Implementações concretas (Rolamento.js, ChamaReveladora.js, etc.) só são criadas
// quando o Vertical Slice daquele bioma começar (08_ARQUITETURA_TECNICA.md, Seção 7).
export default class AbilityBase {
  onExplore(player, context) {} // pode ser vazio (ex: Escudo do Guardião, sem função de exploração)
  onCombat(player, context) {}
  getCooldown() {
    return 0; // 0 = sem cooldown (padrão de todas, exceto Chama Reveladora)
  }
}
