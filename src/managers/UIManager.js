// Atualiza HUD (vida, cooldown, contador de cura) e dispara notificações rápidas
// (06_INTERFACE_UX.md, Seção 1 e 8 / 08_ARQUITETURA_TECNICA.md, Seção 5).

class UIManagerClass {
  updateHealth(current, max) {
    // TODO: atualizar barra de vida fixa (05_BALANCEAMENTO.md, Seção 1 — vida máxima não muda).
  }

  updateCooldown(abilityName, remainingMs, totalMs) {
    // TODO: só exibir quando a habilidade com cooldown estiver desbloqueada (hoje: Chama Reveladora).
  }

  updateHealingItems(count) {}

  notify(type, payload) {
    // TODO: notificações rápidas — 'brasa_coletada', 'habilidade_desbloqueada',
    // 'area_revelada', 'item_cura_coletado' (06_INTERFACE_UX.md, Seção 8).
  }
}

export const UIManager = new UIManagerClass();
