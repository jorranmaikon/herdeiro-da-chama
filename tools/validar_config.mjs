// Confere que toda chave lida do `cfg` de um inimigo existe na configuração
// dele. Existe porque o Boss travou a cena por causa de uma unica chave que
// mudou de lugar: `raioImpacto` fica na raiz no Urso e aninhado em `mergulho`
// no Guardiao, e o efeito de poeira lia sempre da raiz. O valor vinha
// undefined, o tween recebia largura indefinida e derrubava o jogo.
//
//     node tools/validar_config.mjs
import fs from 'fs';
import path from 'path';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfgSrc = fs.readFileSync(path.join(raiz, 'src/data/enemiesConfig.js'), 'utf8');

// Chaves declaradas em cada configuração, incluindo as de objetos aninhados.
const configuracoes = {};
for (const bloco of cfgSrc.split('\nexport const ').slice(1)) {
  const nome = bloco.split(' ')[0];
  if (!/textura:/.test(bloco)) continue;
  configuracoes[nome] = new Set([...bloco.matchAll(/^\s{2,}(\w+):/gm)].map((m) => m[1]));
}

// Chaves lidas do cfg pelo codigo de jogo.
const arquivos = [
  'src/entities/enemies/Enemy.js',
  'src/entities/enemies/EnemyCommon.js',
  'src/entities/enemies/EnemyMiniBoss.js',
  'src/entities/enemies/EnemyBoss.js',
  'src/scenes/biomes/BosqueEsmeralda_1/BosqueSceneBase.js',
];

const lidas = new Set();
for (const arquivo of arquivos) {
  const texto = fs.readFileSync(path.join(raiz, arquivo), 'utf8');
  for (const m of texto.matchAll(/\bcfg\.(\w+)/g)) lidas.add(m[1]);
}

// Uma chave e considerada valida se QUALQUER configuracao a declara: cada
// inimigo usa um subconjunto dos comportamentos.
const declaradas = new Set();
Object.values(configuracoes).forEach((chaves) => chaves.forEach((c) => declaradas.add(c)));

const orfas = [...lidas].filter((c) => !declaradas.has(c)).sort();

Object.entries(configuracoes).forEach(([nome, chaves]) => {
  console.log(`  ${nome}: ${chaves.size} chaves`);
});

if (orfas.length) {
  console.log('\nPROBLEMAS:');
  orfas.forEach((c) => console.log(`  - codigo le cfg.${c}, que nenhuma configuracao declara`));
  process.exit(1);
}
console.log('\nToda chave lida do cfg existe em alguma configuracao.');
