// Teste de fumaça: sobe o jogo em modo headless, entra na cena do Boss, empurra
// o jogador contra ele e roda alguns segundos de simulação.
//
// Existe porque três bugs de cena chegaram ao ar sem erro visível: o que quebra
// aqui é exatamente o que quebraria no navegador, e aqui a exceção aparece.
import { JSDOM } from 'jsdom';
import { createCanvas, Image } from 'canvas';
import fs from 'fs';
import path from 'path';

const dom = new JSDOM('<!DOCTYPE html><body><div id="game"></div></body>', {
  pretendToBeVisual: true, url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.Image = Image;
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
global.cancelAnimationFrame = clearTimeout;
dom.window.HTMLCanvasElement.prototype.getContext = function (tipo) {
  return createCanvas(1280, 720).getContext(tipo === '2d' ? '2d' : '2d');
};

// XHR e fetch locais: o Phaser carrega os assets do disco.
const raiz = path.resolve('public');
class XHRLocal {
  open(m, url) { this.url = url; }
  send() {
    const arquivo = path.join(raiz, decodeURI(this.url.split('?')[0]).replace(/^\/+/, ''));
    try {
      const dados = fs.readFileSync(arquivo);
      this.status = 200;
      this.response = dados;
      this.responseText = dados.toString('binary');
    } catch { this.status = 404; }
    this.readyState = 4;
    this.onload?.({ target: this });
    this.onloadend?.({ target: this });
  }
  setRequestHeader() {} getAllResponseHeaders() { return ''; } abort() {}
  addEventListener(evt, fn) { this['on' + evt] = fn; }
  removeEventListener() {}
}
global.XMLHttpRequest = XHRLocal;
dom.window.XMLHttpRequest = XHRLocal;

const erros = [];
const erroOriginal = console.error;
console.error = (...args) => { erros.push(args.join(' ')); erroOriginal(...args); };
dom.window.addEventListener('error', (e) => erros.push('window.onerror: ' + e.message));
process.on('uncaughtException', (e) => { erros.push('EXCECAO: ' + e.stack); });

const Phaser = (await import('phaser')).default;
const { GUARDIAO } = await import('../src/data/enemiesConfig.js');
const EnemyBoss = (await import('../src/entities/enemies/EnemyBoss.js')).default;

// Cena mínima: só o suficiente para instanciar o chefe e rodar a lógica dele.
class Palco extends Phaser.Scene {
  constructor() { super('Palco'); }

  preload() {
    this.load.spritesheet(GUARDIAO.textura, 'assets/sprites/bosque/guardiao.png',
      { frameWidth: GUARDIAO.celula, frameHeight: GUARDIAO.celula });
    this.load.image('bosque_espinhos', 'assets/props/bosque/espinhos.png');
    this.load.image('folha_navalha', 'assets/props/bosque/folha_navalha.png');
  }

  groundTopAt() { return 584; }

  create() {
    this.projeteis = this.physics.add.group();
    this.chefe = new EnemyBoss(this, 2048, 584, GUARDIAO);

    const textura = this.textures.get(GUARDIAO.textura);
    console.log('quadros na textura:', textura.frameTotal - 1,
      '| esperado:', GUARDIAO.colunas * GUARDIAO.linhas);
    console.log('visivel:', this.chefe.visible, '| alpha:', this.chefe.alpha,
      '| quadro atual:', this.chefe.frame?.name);

    // Ganchos vazios: aqui interessa a lógica do chefe, não o efeito visual.
    ['aoChamarRaizes', 'aoLancarFolhas', 'aoGolpearComGalho', 'aoAfundar',
      'aoMoverSombra', 'aoImpactar', 'aoVirarFase'].forEach((g) => { this.chefe[g] = () => {}; });
    this.chefe.aoEmergir = () => 1800;

    this.jogador = this.physics.add.sprite(1900, 520, GUARDIAO.textura);
    this.jogador.body.setSize(46, 104);
    this.jogador.isDead = false;
    this.jogador.invulnerable = false;
    this.jogador.hurt = () => {};
    this.player = this.jogador;

    this.quadros = 0;
  }

  update(time) {
    this.quadros += 1;
    this.jogador.x += Math.sin(this.quadros / 20) * 6;
    this.chefe.atualizar(this.jogador, time);

    if (this.quadros === 240) this.chefe.levarDano(13);  // força a virada de fase
    if (this.quadros === 700) {
      console.log('fase alcancada:', this.chefe.fase,
        '| estado:', this.chefe.estado, '| padrao:', this.chefe.padraoAtual);
      this.game.destroy(true);
      setTimeout(() => {
        console.log(erros.length ? `\nFALHOU com ${erros.length} erro(s)` : '\nOK: 700 frames sem excecao');
        process.exit(erros.length ? 1 : 0);
      }, 100);
    }
  }
}

new Phaser.Game({
  type: Phaser.HEADLESS, width: 1280, height: 720, banner: false, audio: { noAudio: true },
  physics: { default: 'arcade', arcade: { gravity: { y: 2200 } } },
  scene: [Palco],
});
