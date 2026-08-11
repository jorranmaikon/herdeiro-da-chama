import Phaser from 'phaser';

// Erro em tempo de execucao mata o loop do Phaser e o jogo simplesmente
// congela — com a musica tocando, porque o audio roda fora do loop. Isso ja
// custou horas de diagnostico as cegas. Agora a mensagem aparece na tela.
function mostrarErroNaTela(mensagem) {
  let caixa = document.getElementById('erro-runtime');
  if (!caixa) {
    caixa = document.createElement('pre');
    caixa.id = 'erro-runtime';
    caixa.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;'
      + 'margin:0;padding:10px;max-height:45vh;overflow:auto;'
      + 'background:#2a0f0fee;color:#ffd7d7;font:12px/1.4 monospace;'
      + 'white-space:pre-wrap;border-top:2px solid #d88';
    caixa.onclick = () => caixa.remove();
    document.body.appendChild(caixa);
  }
  caixa.textContent = `${mensagem}\n\n(toque para fechar)`;
}

window.addEventListener('error', (evento) => {
  mostrarErroNaTela(`${evento.message}\n${evento.error?.stack || ''}`);
});
window.addEventListener('unhandledrejection', (evento) => {
  mostrarErroNaTela(`Promessa rejeitada: ${evento.reason?.stack || evento.reason}`);
});
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from './config/gameConfig.js';
import AudioManager from './managers/AudioManager.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import ContinenteScene from './scenes/ContinenteScene.js';
import PerfisScene from './scenes/PerfisScene.js';
import BosqueMapaScene from './scenes/BosqueMapaScene.js';
import VilaMapaScene from './scenes/VilaMapaScene.js';
import Fase1Scene from './scenes/biomes/Vila_0/Fase1Scene.js';
import Fase2Scene from './scenes/biomes/Vila_0/Fase2Scene.js';
import BosqueFase1Scene from './scenes/biomes/BosqueEsmeralda_1/BosqueFase1Scene.js';
import BosqueBossScene from './scenes/biomes/BosqueEsmeralda_1/BosqueBossScene.js';
import BosqueFase3Scene from './scenes/biomes/BosqueEsmeralda_1/BosqueFase3Scene.js';
import BosqueFase2Scene from './scenes/biomes/BosqueEsmeralda_1/BosqueFase2Scene.js';
import ChronicleScene from './scenes/ChronicleScene.js';
import DialogueOverlay from './scenes/DialogueOverlay.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  // HTML5 Audio em vez de WebAudio: no iOS o WebAudio é silenciado pela chave
  // física de mudo do aparelho, mesmo com o volume no máximo.
  audio: { disableWebAudio: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: GRAVITY }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    PreloadScene,
    MenuScene,
    PerfisScene,
    ChronicleScene,
    ContinenteScene,
    VilaMapaScene,
    BosqueMapaScene,
    Fase1Scene,
    Fase2Scene,
    BosqueFase1Scene,
    BosqueFase2Scene,
    BosqueFase3Scene,
    BosqueBossScene,
    DialogueOverlay,
  ],
});

// Manager de trilha global: vive no jogo, não na cena, pra música atravessar
// transições sem reiniciar.
game.audio = new AudioManager(game);

// Destrava o áudio no primeiro gesto em QUALQUER lugar da página.
//
// Navegador nenhum deixa um site começar a tocar som sozinho antes de o
// usuário interagir — é política do browser e não há contorno por código. O
// que dá para fazer é reagir ao primeiro gesto, seja ele qual for: um toque,
// um arrastar, uma tecla, uma rolagem. Assim, na prática, a música entra no
// instante em que a pessoa encosta na tela, sem precisar procurar botão de som.
const EVENTOS_GESTO = [
  'pointerup', 'touchend', 'mousedown', 'keydown',
];

const destravarAudio = () => {
  const cena = game.scene.getScenes(true)[0];
  if (!cena) return;

  // Libera as tags aproveitando ESTE gesto — no iOS não basta retomar o
  // contexto, cada elemento precisa receber play() dentro de uma interação
  // real.
  game.audio.desbloquear(cena);
  game.audio.retry(cena);

  // Uma vez liberado, os listeners saem. Mantê-los ativos fazia o
  // desbloqueio rodar a cada toque de gameplay e travava o jogo.
  if (game.audio.desbloqueado) {
    EVENTOS_GESTO.forEach((e) =>
      document.removeEventListener(e, destravarAudio),
    );
  }
};

EVENTOS_GESTO.forEach((e) =>
  document.addEventListener(e, destravarAudio, { passive: true }),
);

// O navegador suspende o áudio ao trocar de aba. Ao voltar, retoma.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') destravarAudio();
});
