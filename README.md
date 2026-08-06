# Herdeiro da Chama

Jogo de plataforma 2D feito em Phaser 3, publicado no GitHub Pages.

**Jogar:** https://jorranmaikon.github.io/herdeiro-da-chama/

## Rodar localmente

```bash
npm install
npm run dev
```

## Estrutura

```
src/
├── config/gameConfig.js   # spec técnica (resolução, tile, física) — fonte única
├── entities/Player.js     # protagonista e suas mecânicas
├── managers/              # input, toque e áudio
└── scenes/
    ├── PreloadScene.js    # carrega os assets
    ├── MenuScene.js       # tela inicial
    ├── ContinenteScene.js # mapa do continente (9 regiões)
    ├── VilaMapaScene.js   # mapa do bioma (trilha de fases)
    └── biomes/Vila_0/     # um Vertical Slice por bioma
tools/build_assets.py      # gera public/assets a partir da arte original
```

## Regra de ouro dos assets

A arte original só é **reduzida**, uma única vez, em `tools/build_assets.py`, e
é desenhada no jogo em **escala 1.0**. Nunca reduzir e depois ampliar — ampliar
arte já reduzida destrói a qualidade e não recupera detalhe.

A célula do spritesheet tem o tamanho em que o personagem é exibido na tela.

## Documentação de design

Os documentos macro (00–09) definem lore, gameplay, balanceamento, interface e
arquitetura. Toda decisão de código deve respeitá-los.
