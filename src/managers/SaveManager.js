// Único ponto do código que lê/escreve localStorage diretamente
// (08_ARQUITETURA_TECNICA.md, Seções 5 e 6).

const SAVE_KEY = 'herdeiro_da_chama_save';
const SAVE_VERSION = 1;

function defaultSave() {
  return {
    version: SAVE_VERSION,
    currentBiome: 'vila_inicial',
    checkpointId: null,
    brasasCollected: [],
    abilitiesUnlocked: [],
    healingItemsCarried: 0,
    mapRevealed: {},
    chroniclesSeen: [],
    settings: {
      musicVolume: 0.8,
      sfxVolume: 1.0,
    },
  };
}

class SaveManagerClass {
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      // TODO: lógica de migração quando SAVE_VERSION mudar.
      return parsed;
    } catch (err) {
      console.error('SaveManager: falha ao carregar save, usando padrão.', err);
      return defaultSave();
    }
  }

  save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('SaveManager: falha ao salvar.', err);
      return false;
    }
  }

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  clear() {
    localStorage.removeItem(SAVE_KEY);
  }
}

// Singleton por sessão de jogo (08_ARQUITETURA_TECNICA.md, Seção 5).
export const SaveManager = new SaveManagerClass();
