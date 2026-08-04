// Toca trilha por bioma + SFX globais, controla volume via Configurações
// (08_ARQUITETURA_TECNICA.md, Seção 5).
// Produção de áudio adiada nesta fase do projeto (09_TEMPLATE_VERTICAL_SLICE.md,
// Seção 10) — manager já existe pra não exigir refatoração quando o áudio chegar.

class AudioManagerClass {
  playMusic(key) {
    // TODO: implementar quando houver trilha produzida.
  }

  playSfx(key) {
    // TODO: implementar quando houver SFX produzido.
  }

  setMusicVolume(value) {}
  setSfxVolume(value) {}
}

export const AudioManager = new AudioManagerClass();
