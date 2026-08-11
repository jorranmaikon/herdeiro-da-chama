// Valida os layouts de fase: nada de checkpoint, item, perigo, inimigo ou
// saida posicionado sobre um vao. Um voador pode ficar sobre o vazio; quem
// anda no chao, nao.
//
//     node tools/validar_layouts.mjs
import * as f1 from '../src/scenes/biomes/BosqueEsmeralda_1/fase1Layout.js';
import * as f2 from '../src/scenes/biomes/BosqueEsmeralda_1/fase2Layout.js';
import * as f3 from '../src/scenes/biomes/BosqueEsmeralda_1/fase3Layout.js';

for (const [nome, L] of [['Fase 1', f1], ['Fase 2', f2], ['Fase 3', f3]]) {
  const segs = [...L.GROUND_SEGMENTS].sort((a, b) => a[0] - b[0]);
  const dentro = (t) => segs.find(([s, c]) => t >= s && t < s + c);
  const problemas = [];

  const check = (rotulo, tiles) => tiles.forEach((t) => {
    if (!dentro(t)) problemas.push(`${rotulo} no tile ${t} esta sobre um VAO`);
  });

  check('checkpoint', L.CHECKPOINTS);
  check('slime', L.SLIMES);
  check('lobo', L.LOBOS || []);
  check('goblin', L.GOBLINS || []);
  if (L.URSO_TILE !== undefined) check('urso', [L.URSO_TILE]);
  check('lobo', L.LOBOS || []);
  check('goblin', L.GOBLINS || []);
  if (L.URSO_TILE !== undefined) check('urso', [L.URSO_TILE]);

  check('spawn', [L.SPAWN_TILE]);
  check('saida', [L.EXIT_TILE]);
  if (L.FENDA_TILE !== undefined) check('fenda', [L.FENDA_TILE, L.FENDA_TILE + 1]);
  (L.HAZARDS || []).forEach(([s, c]) => {
    for (let i = 0; i < c; i++) if (!dentro(s + i)) problemas.push(`perigo cobre o vao no tile ${s + i}`);
    const seg = dentro(s);
    if (seg && (s === seg[0] || s + c === seg[0] + seg[1])) problemas.push(`perigo em ${s} encosta na borda do vao`);
  });
  // itens de cura: precisam estar sobre uma plataforma ou sobre o chao
  (L.HEALING_ITEMS || []).forEach(([t, row]) => {
    const seg = dentro(t);
    const plat = L.PLATFORMS.find(([s, c, r]) => t >= s && t < s + c && r === row + 1);
    const noChao = seg && seg[2] === row + 1;
    if (!plat && !noChao) problemas.push(`item de cura no tile ${t} (linha ${row}) nao tem apoio embaixo`);
  });

  console.log(`\n${nome}: ${problemas.length ? problemas.length + ' problema(s)' : 'ok'}`);
  problemas.forEach((p) => console.log('  -', p));
}
