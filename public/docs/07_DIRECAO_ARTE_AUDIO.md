# Herdeiro da Chama
# 07_DIRECAO_ARTE_AUDIO.md

Versão 1.0

> "Cada bioma deve ser reconhecível só pela paleta, mesmo sem HUD na tela."

---

# Objetivo

Este documento define as diretrizes técnicas e estéticas de arte (pixel art) e áudio (trilha e SFX) de **Herdeiro da Chama**.

Ele existe para que, quando chegar a hora de gerar ilustrações, conceitos e sprites (fluxo definido no `00_GAME_BIBLE.md`: Lore → Documentação → Prompts → Conceitos → Ilustrações → Sprites → Programação), exista uma referência técnica única — evitando que cada bioma saia com proporção, resolução ou estilo diferente.

Este documento não substitui os prompts de geração de cada asset — ele define os **limites e regras** que todo prompt precisa respeitar.

---

# Filosofia de Arte

Segue os pilares do `00_GAME_BIBLE.md`: mundo antigo, magia rara, identidade visual reconhecível por bioma.

- Pixel art consistente do início ao fim — nenhum bioma muda de técnica visual, só de paleta/ambientação.
- O jogador deve reconhecer em que região está apenas pela cor dominante da tela, mesmo sem UI.
- Ruínas, símbolos e marcos antigos aparecem em todo bioma — reforça que o mundo existe há muito mais tempo que a jornada do jogador (regra da Lore).
- Magia é rara — por isso, todo efeito visual mágico (habilidades de Brasa, criaturas corrompidas, Crônicas) deve se destacar visualmente do resto do cenário, nunca se misturar ao ambiente comum.

---

# 1. Especificação Técnica de Pixel Art

Resolução base do jogo — regra travada, toda produção de sprite, tile e cenário respeita isso:

| Item | Referência | Observação |
|---|---|---|
| Resolução de câmera/canvas | 384×216 (múltiplo exato de 16:9, escala limpa para 1920×1080) | Padrão comum em pixel art 2D moderno (ex: jogos estilo Hollow Knight/Celeste) |
| Tamanho do personagem (protagonista) | ~32×48px | Espaço suficiente para detalhe de animação sem pesar produção |
| Grid de tile | 16×16px | Facilita level design modular no Phaser (Tilemap) |

---

# 2. Paleta e Atmosfera por Bioma

Baseado nas emoções e atmosferas já definidas no `02_CONTINENTE.md` — este documento apenas traduz isso em direção de cor, sem inventar nova identidade:

| Região | Emoção (já definida) | Direção de paleta sugerida |
|---|---|---|
| Vila Inicial | Segurança / conforto | Tons quentes, terrosos, luz de fim de tarde |
| Bosque Esmeralda | Descoberta | Verdes vibrantes, luz filtrada, dourado |
| Floresta Sombria | Incerteza | Verde acinzentado, névoa azulada, baixo contraste |
| Montanhas de Ferro | Superação | Cinza metálico, laranja de forja, contraste forte |
| Pântano Maldito | Desconforto | Verde-oliva escuro, roxo doentio, pouca luz |
| Reino Esquecido | Fascínio | Azul acinzentado, dourado desbotado, pedra fria |
| Picos Congelados | Solidão | Branco/azul gelo, alto contraste, vazio |
| Terras Cinzentas | Grandeza | Cinza/vermelho de cinzas, céu carregado |
| Vulcão da Origem | Revelação | Preto, laranja/vermelho intenso da lava, dourado da Chama |

Regra: a cor da **Grande Chama/Brasas** (dourado/laranja incandescente) nunca é usada em nenhum outro contexto do jogo — é uma cor "reservada", para que o jogador associe instantaneamente esse tom a algo relacionado à Chama, mesmo sem texto.

---

# 3. Iluminação

- Cada bioma tem uma fonte de luz dominante coerente com sua atmosfera (ex: luz solar filtrada no Bosque, luz de lava no Vulcão, luz fria e difusa nos Picos).
- Efeitos de luz mágica (habilidades de Brasa, criaturas corrompidas) sempre usam um brilho/glow sutil que não existe no resto do cenário — reforça "magia rara" do Game Bible.
- Telegraphs de ataque de inimigos (`04_BESTIARIO_MACRO.md`, Seção 3) devem ter contraste de cor claro em relação ao fundo do bioma, garantindo legibilidade mesmo em cenários escuros (Floresta Sombria, Pântano).

---

# 4. Diretrizes de Sprites — Protagonista

Conjunto mínimo de animações necessárias (referência para toda produção de sprite):

- Idle
- Correr
- Pular / Cair
- Ataque básico
- Receber dano (hit reaction)
- Morte
- Uma animação por habilidade de Brasa (Rolamento, Chama Reveladora, Punho de Ferro, Véu Venenoso, Escudo do Guardião, Ancoragem de Gelo, Asas de Cinzas — 7 conjuntos adicionais, produzidos apenas quando aquele Vertical Slice for iniciado)

---

# 5. Diretrizes de Sprites — Inimigos

- Silhueta clara: cada inimigo deve ser reconhecível pela forma, mesmo sem cor (importante para leitura rápida em combate).
- Diferenciação de categoria por escala visual: Comum < Guardião de Área < Mini-Boss < Boss (reforça a hierarquia de ameaça só pelo tamanho, sem precisar de barra de vida grande — bate com a HUD mínima do `06_INTERFACE_UX.md`).
- Toda animação de "Golpe Telegrafado" (`04_BESTIARIO_MACRO.md`) precisa de um frame de antecipação claramente diferente do frame de idle — não pode ser sutil.

---

# 6. Direção de UI

- Fonte pixelada, única em todo o jogo (títulos e texto de diálogo podem variar peso/tamanho, nunca a família).
- Ícones do Mapa (`06_INTERFACE_UX.md`, Seção 2) seguem a mesma técnica de pixel art dos sprites, nunca ícones vetoriais genéricos.
- Barra de vida, ícone de cooldown e contador de cura (HUD, Seção 1 do `06_INTERFACE_UX.md`) usam a paleta neutra do jogo (não a paleta do bioma), para permanecerem legíveis em qualquer cenário.

---

# 7. Áudio — Trilha Sonora

- Cada bioma possui tema musical próprio, coerente com sua atmosfera (ver tabela da Seção 2).

- Existe um pequeno motivo musical recorrente (3–5 notas) representando a Grande Chama/Guardiões, que reaparece de forma sutil e variada na trilha de cada bioma — mesmo recurso usado em Zelda (tema do Hyrule) ou Dark Souls (motivos recorrentes de facção). Reforça o mistério da Lore sem depender de texto.
- O motivo deve aparecer com clareza total apenas na trilha do Vulcão da Origem (região final), coerente com a regra da Lore de que a verdade só se revela por completo no fim.

---

# 8. Áudio — Efeitos Sonoros (SFX)

Conjunto mínimo necessário, comum a todo o jogo (independente de bioma):

- Passos (varia por tipo de piso, se for viável)
- Pulo / aterrissagem
- Ataque básico (acerto e erro)
- Dano recebido pelo jogador
- Morte do jogador
- Coleta de item de cura
- Coleta de Brasa (som único, mais grandioso — só toca 8 vezes no jogo inteiro, merece destaque)
- Abertura de menu / mapa / diálogo
- Um SFX exclusivo por habilidade de Brasa (produzido junto com o Vertical Slice daquele bioma)

---

# Regras de Direção de Arte e Áudio

Estas regras nunca devem ser quebradas sem revisão deste documento:

- Toda produção de asset respeita a resolução/grid definidos na Seção 1.
- A cor dourada/laranja da Chama nunca é usada fora de contextos relacionados a ela.
- Todo inimigo precisa ser legível por silhueta, independente de cor.
- Categoria de inimigo (Comum/Guardião/Mini-Boss/Boss) é sinalizada visualmente por escala, não apenas por barra de vida.
- UI usa paleta neutra própria, nunca a paleta do bioma atual.
- Nenhum asset entra em produção sem estar coberto por este documento ou pelo Vertical Slice do bioma correspondente.

---

## Status

**Aprovado — Versão 1.0**
