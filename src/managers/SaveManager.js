// Save do jogo (08_ARQUITETURA_TECNICA.md, Seção 6).
//
// MÚLTIPLOS PERFIS. O `06_INTERFACE_UX.md`, Seção 7, previa slot único "a menos
// que haja necessidade futura de múltiplos slots" — a necessidade apareceu: o
// jogo vai ser mostrado a várias pessoas no mesmo dispositivo, e cada uma
// precisa do seu progresso. A Seção 7 daquele documento deve ser atualizada.
//
// Uma chave de localStorage por perfil, mais uma chave separada guardando qual
// perfil está em uso. Este continua sendo o ÚNICO ponto do código que toca
// storage — nenhuma cena acessa por fora daqui.

const PREFIXO = 'herdeiro_da_chama_save';
const CHAVE_ATUAL = 'herdeiro_da_chama_perfil';
const VERSAO = 1;

export const TOTAL_PERFIS = 5;

// Fábrica, não constante.
//
// Um objeto literal compartilhado seria copiado com espalhamento, mas os
// ARRAYS dentro dele continuariam sendo os mesmos: cada fase concluída seria
// empilhada no molde do save vazio, e apagar o progresso não apagaria nada.
function vazio() {
  return {
    version: VERSAO,
    fasesConcluidas: [],
    cronicasVistas: [],
    atualizadoEm: null,
  };
}

function ler(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    // localStorage pode estar indisponível (aba privada, cota cheia). O jogo
    // continua funcionando, só não persiste.
    return null;
  }
}

function escrever(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // Falha ao salvar não pode interromper a partida em andamento.
  }
}

class SaveManager {
  constructor() {
    const guardado = Number(ler(CHAVE_ATUAL));
    this.perfil = guardado >= 1 && guardado <= TOTAL_PERFIS ? guardado : 1;
    this.dados = this.carregar(this.perfil);
  }

  chaveDe(n) {
    return `${PREFIXO}_${n}`;
  }

  carregar(n) {
    const bruto = ler(this.chaveDe(n));
    if (!bruto) return vazio();

    try {
      const dados = JSON.parse(bruto);
      // Save de versão desconhecida é descartado em silêncio em vez de quebrar
      // o jogo. Quando houver migração de verdade, ela entra aqui.
      if (dados.version !== VERSAO) return vazio();
      return { ...vazio(), ...dados };
    } catch {
      return vazio();
    }
  }

  salvar() {
    this.dados.atualizadoEm = Date.now();
    escrever(this.chaveDe(this.perfil), JSON.stringify(this.dados));
  }

  // --------------------------------------------------------------------
  // Perfis
  // --------------------------------------------------------------------
  /** Resumo de todos os perfis, para a tela de seleção. */
  listarPerfis() {
    return Array.from({ length: TOTAL_PERFIS }, (_, i) => {
      const n = i + 1;
      const dados = this.carregar(n);
      return {
        numero: n,
        usado: dados.fasesConcluidas.length > 0 || dados.cronicasVistas.length > 0,
        fasesConcluidas: dados.fasesConcluidas.length,
        atualizadoEm: dados.atualizadoEm,
      };
    });
  }

  usarPerfil(n) {
    this.perfil = n;
    this.dados = this.carregar(n);
    escrever(CHAVE_ATUAL, String(n));
  }

  apagarPerfil(n) {
    try {
      localStorage.removeItem(this.chaveDe(n));
    } catch {
      // idem
    }
    if (n === this.perfil) this.dados = vazio();
  }

  // --------------------------------------------------------------------
  // Progresso do perfil em uso
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
}

// Instância única por sessão de jogo, como os demais managers.
export default new SaveManager();
