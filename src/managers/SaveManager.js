// Save do jogo (08_ARQUITETURA_TECNICA.md, Seção 6).
//
// Slot único, chave única, estrutura versionada para permitir migração futura
// sem quebrar saves antigos. Este é o ÚNICO ponto do código que toca
// `localStorage` — nenhuma cena acessa storage por fora daqui.
//
// O que é salvo hoje é o mínimo que resolve o problema real: quais fases já
// foram concluídas e quais Crônicas já foram vistas. Vida, itens carregados e
// checkpoint atual entram quando existirem sistemas para eles.

const CHAVE = 'herdeiro_da_chama_save';
const VERSAO = 1;

// Fábrica, não constante.
//
// Um objeto literal compartilhado seria copiado com `{ ...VAZIO }`, mas os
// ARRAYS dentro dele continuariam sendo os mesmos: cada fase concluída seria
// empilhada no molde do save vazio, e apagar o progresso não apagaria nada.
function vazio() {
  return {
    version: VERSAO,
    fasesConcluidas: [],
    cronicasVistas: [],
  };
}

class SaveManager {
  constructor() {
    this.dados = this.carregar();
  }

  carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return vazio();

      const dados = JSON.parse(bruto);

      // Save de versão desconhecida é descartado em silêncio em vez de
      // quebrar o jogo. Quando houver migração de verdade, ela entra aqui.
      if (dados.version !== VERSAO) return vazio();

      return { ...vazio(), ...dados };
    } catch {
      // localStorage pode estar indisponível (aba privada, cota cheia). O jogo
      // continua funcionando, só não persiste.
      return vazio();
    }
  }

  salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(this.dados));
    } catch {
      // Falha ao salvar não pode interromper a partida em andamento.
    }
  }

  // --------------------------------------------------------------------
  // Progresso
  // --------------------------------------------------------------------
  temProgresso() {
    return this.dados.fasesConcluidas.length > 0
      || this.dados.cronicasVistas.length > 0;
  }

  faseConcluida(id) {
    return this.dados.fasesConcluidas.includes(id);
  }

  concluirFase(id) {
    if (this.faseConcluida(id)) return;
    this.dados.fasesConcluidas.push(id);
    this.salvar();
  }

  cronicaVista(id) {
    return this.dados.cronicasVistas.includes(id);
  }

  verCronica(id) {
    if (this.cronicaVista(id)) return;
    this.dados.cronicasVistas.push(id);
    this.salvar();
  }

  apagar() {
    this.dados = vazio();
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      // idem
    }
  }
}

// Instância única por sessão de jogo, como os demais managers.
export default new SaveManager();
