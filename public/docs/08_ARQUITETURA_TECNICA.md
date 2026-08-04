# Herdeiro da Chama
# 08_ARQUITETURA_TECNICA.md

Versão 1.0

> "Código simples que funciona vence código elegante que ninguém entende sozinho."

---

# Objetivo

Este documento define a arquitetura técnica de **Herdeiro da Chama**: stack, estrutura de pastas, cenas do Phaser, managers, sistema de save e pipeline de deploy.

Ele é a "constituição" de engenharia — todo Vertical Slice de bioma implementa código dentro desta arquitetura, nunca cria um padrão novo de organização sem passar por aqui primeiro.

Diferente dos documentos anteriores, este fala de **como construir**, não de **o que construir** (isso já está nos docs 00–07).

---

# Filosofia de Arquitetura

Segue os pilares do `00_GAME_BIBLE.md`, traduzidos para engenharia:

- **Simplicidade vence.** Projeto de uma pessoa só (com apoio de IA) — nada de arquitetura "enterprise" com camadas demais. Cada sistema deve ser fácil de entender relendo o código seis meses depois.
- **Sem duplicação.** Toda regra que já existe em algum doc (dano, cooldown, categorias de inimigo) tem uma única fonte de verdade no código — nunca reimplementada diferente em cada bioma.
- **Vertical Slice = módulo isolado.** Cada bioma é uma cena (ou conjunto de cenas) que consome os mesmos managers e classes-base globais, mas não depende do código específico de outro bioma.
- **Toda decisão de arquitetura existe para servir os documentos de design — nunca o contrário.** Se uma mecânica documentada não couber bem na arquitetura, a arquitetura se ajusta, não a mecânica (a menos que isso volte pra discussão de design).

---

# 1. Alvo de Execução

**Decisão travada:** o jogo roda como um site estático publicado via **GitHub Pages**, com URL pública própria. Isso substitui a ideia inicial de artifact-only — motivo: sandbox de artifact tem limite de tamanho, sem `localStorage` real e não comporta o jogo completo com 9 biomas de assets.

Consequências diretas:

- Save usa `localStorage` do navegador normalmente (ver Seção 6) — sem API especial de storage.
- Assets (sprites, tiles, áudio) vivem como arquivos reais no repositório, carregados pelo `Phaser.Loader` normalmente — sem base64 embutido.
- O jogo cresce **dentro do mesmo repositório**, bioma por bioma, e a cada Vertical Slice aprovado o build publicado é atualizado.
- Cada slice ainda pode ser testado isoladamente antes de entrar no repositório principal (ex: uma cena/rota separada), mas o destino final de tudo é o mesmo projeto Git.

**Pendência operacional (não bloqueia a documentação):** o acesso ao repositório via token já foi validado nesta sessão de trabalho. O token nunca fica salvo entre sessões (por segurança — não é armazenado em memória, arquivo ou documento do projeto). Para qualquer upload/atualização futura no repositório, o token será informado diretamente no chat pelo Jorran no momento da necessidade.

---

# 2. Stack Técnica

| Camada | Escolha | Motivo |
|---|---|---|
| Engine | **Phaser 3** | Já definido desde a Game Bible |
| Linguagem | **JavaScript (ES Modules), sem TypeScript** | Prioriza simplicidade de manutenção solo — sem etapa de compilação/tipos para gerenciar. Decisão travada. |
| Bundler/Dev server | **Vite** | Setup mínimo, hot-reload rápido para iterar cada bioma, build de produção direto compatível com GitHub Pages (saída estática) |
| Hospedagem | **GitHub Pages** (branch `gh-pages` ou pasta `/docs`, gerado pelo build do Vite) | Gratuito, URL pública estável, sem backend necessário (jogo 100% client-side) |

---

# 3. Estrutura de Pastas

```
herdeiro-da-chama/
├── index.html
├── vite.config.js
├── src/
│   ├── main.js                  # bootstrap do jogo (Phaser.Game config)
│   ├── config/
│   │   └── gameConfig.js        # resolução, física, etc. (valores do 07_DIRECAO_ARTE_AUDIO)
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   ├── MainMenuScene.js
│   │   ├── PauseScene.js        # overlay, ver 06_INTERFACE_UX
│   │   ├── DialogueOverlay.js
│   │   ├── ChronicleScene.js
│   │   ├── MapScene.js          # Mapa do Continente + Mapa do Bioma
│   │   └── biomes/
│   │       ├── Vila_0/
│   │       ├── BosqueEsmeralda_1/
│   │       └── ...              # uma pasta por bioma, um Vertical Slice cada
│   ├── entities/
│   │   ├── Player.js
│   │   ├── enemies/
│   │   │   ├── Enemy.js         # classe-base com a FSM do 04_BESTIARIO_MACRO
│   │   │   ├── EnemyCommon.js
│   │   │   ├── EnemyMiniBoss.js
│   │   │   └── EnemyBoss.js
│   │   └── npcs/
│   │       └── NPC.js
│   ├── abilities/
│   │   ├── AbilityBase.js       # interface: explore() + combat() (ver 03_GAMEPLAY_MACRO Seção 5)
│   │   ├── Rolamento.js
│   │   ├── ChamaReveladora.js
│   │   └── ...                  # uma por Brasa, criada só quando o slice daquele bioma começa
│   ├── managers/
│   │   ├── SaveManager.js
│   │   ├── InputManager.js
│   │   ├── AudioManager.js
│   │   ├── AbilityManager.js
│   │   └── UIManager.js
│   └── data/
│       └── biomesConfig.js      # metadados de cada bioma (ordem, nome, Brasa, etc.)
├── public/
│   └── assets/
│       ├── sprites/
│       ├── tiles/
│       ├── audio/
│       └── ui/
└── .github/
    └── workflows/
        └── deploy.yml            # build automático + publish no Pages a cada push na main
```

Regra: nenhum bioma cria pasta ou padrão de organização fora deste esqueleto sem atualizar este documento primeiro.

---

# 4. Cenas do Phaser

| Cena | Função |
|---|---|
| `BootScene` | Configuração mínima antes de carregar qualquer asset |
| `PreloadScene` | Carrega assets globais (UI, fontes) + assets do bioma atual |
| `MainMenuScene` | Menu principal (`06_INTERFACE_UX.md`, Seção 6) |
| Cena de cada bioma | Gameplay em si — uma ou mais cenas por bioma, conforme o tamanho definido no Vertical Slice |
| `PauseScene` | Overlay de pausa, nunca substitui a cena de baixo (roda em paralelo, pausando a lógica) |
| `DialogueOverlay` | Overlay de diálogo (Seção 4 do `06_INTERFACE_UX.md`) |
| `ChronicleScene` | Tela dedicada de Crônicas (Seção 5 do `06_INTERFACE_UX.md`) |
| `MapScene` | Mapa do Continente / Mapa do Bioma, também como overlay |

Overlays (Pause, Dialogue, Map) usam o sistema de cenas paralelas do próprio Phaser (`scene.launch` + `scene.pause` da cena de baixo), evitando reload de assets a cada abertura de menu.

---

# 5. Managers (Globais, Singleton por Sessão de Jogo)

| Manager | Responsabilidade |
|---|---|
| `SaveManager` | Serializa/desserializa o estado do jogo em `localStorage` (ver Seção 6) |
| `InputManager` | Centraliza mapeamento de teclas/botão único de interação (`03_GAMEPLAY_MACRO.md`, Seção 6) |
| `AudioManager` | Toca trilha por bioma + SFX globais, controla volume via Configurações |
| `AbilityManager` | Sabe quais Brasas o jogador já tem, registra as instâncias de habilidade ativas, expõe `canUse(abilityName)` para o level design sinalizar bloqueios (`03_GAMEPLAY_MACRO.md`, Seção 6) |
| `UIManager` | Atualiza HUD (vida, cooldown, contador de cura) e dispara notificações rápidas (`06_INTERFACE_UX.md`, Seção 8) |

Regra: nenhuma cena acessa o estado de outra cena diretamente. Toda comunicação entre sistemas passa por um manager.

---

# 6. Sistema de Save

Chave única no `localStorage`, versionada para permitir migração futura sem quebrar saves antigos:

```json
{
  "version": 1,
  "currentBiome": "bosque_esmeralda",
  "checkpointId": "checkpoint_02",
  "brasasCollected": ["bosque_esmeralda"],
  "abilitiesUnlocked": ["rolamento"],
  "healingItemsCarried": 2,
  "mapRevealed": {
    "bosque_esmeralda": ["room_01", "room_02"]
  },
  "chroniclesSeen": ["cronica_bosque_01"],
  "settings": {
    "musicVolume": 0.8,
    "sfxVolume": 1.0
  }
}
```

- Salva automaticamente ao ativar um ponto de descanso (`05_BALANCEAMENTO.md`, Seção 6).
- `SaveManager` é o único ponto do código que lê/escreve `localStorage` diretamente — nenhuma cena ou manager acessa storage por fora dele.
- Um único slot (`herdeiro_da_chama_save`), conforme `06_INTERFACE_UX.md` Seção 7.

---

# 7. Padrão de Código — Habilidades de Brasa

Toda habilidade implementa a mesma interface básica, garantindo consistência com a regra de dupla função do `03_GAMEPLAY_MACRO.md`:

```js
class AbilityBase {
  onExplore(player, context) {}  // comportamento em exploração (pode ser vazio, ex: Escudo do Guardião)
  onCombat(player, context) {}   // comportamento em combate/defesa
  getCooldown() { return 0; }    // 0 = sem cooldown (padrão de todas, exceto Chama Reveladora)
}
```

Cada habilidade concreta (`Rolamento.js`, `ChamaReveladora.js`, etc.) estende essa base. O `AbilityManager` decide qual método chamar conforme o contexto do input do jogador — nunca a cena do bioma implementa lógica de habilidade diretamente.

---

# 8. Padrão de Código — Inimigos

A classe-base `Enemy.js` implementa a máquina de estados genérica do `04_BESTIARIO_MACRO.md` (Seção 2):

```
IDLE → ALERT → CHASE_OR_PREPARE → ATTACK → RECOVER → (IDLE ou DEAD)
```

- `EnemyCommon`, `EnemyMiniBoss` e `EnemyBoss` estendem `Enemy` apenas para ajustar parâmetros (padrões de ataque disponíveis, fases de vida) — a máquina de estados em si nunca é duplicada por categoria.
- Cada inimigo específico de um bioma (ex: "Urso Corrompido") é uma configuração de dados (sprite, vida, padrões de ataque escolhidos) aplicada sobre uma dessas três classes — não uma classe nova do zero, a menos que um padrão de ataque genuinamente novo seja necessário (e nesse caso, ele entra no Bestiário Macro antes, não direto no bioma).

---

# 9. Pipeline de Deploy

1. Desenvolvimento local com `vite dev` (hot-reload).
2. Ao aprovar um Vertical Slice, build de produção via `vite build`.
3. Push para a branch principal do repositório GitHub.
4. GitHub Actions (`.github/workflows/deploy.yml`) builda automaticamente e publica no GitHub Pages.
5. URL pública fica sempre atualizada com o estado mais recente do jogo aprovado.

Nenhum deploy acontece com um bioma pela metade — o pipeline publica sempre a partir da branch principal, e a branch principal só recebe merge de Vertical Slice já validado por você.

---

# Regras de Arquitetura

Estas regras nunca devem ser quebradas sem revisão deste documento:

- Nenhum bioma cria manager, padrão de pasta ou sistema global próprio — tudo passa pelos managers já definidos aqui.
- `SaveManager` é o único ponto de acesso a `localStorage`.
- Toda habilidade de Brasa estende `AbilityBase`. Todo inimigo estende `Enemy` (via uma das três subclasses de categoria).
- Nenhuma cena acessa estado de outra cena diretamente — comunicação sempre via manager.
- Deploy só acontece a partir de Vertical Slice validado — nunca de código "pela metade".

---

## Status

**Aprovado — Versão 1.0**
