# Herdeiro da Chama
# 05_BALANCEAMENTO.md

Versão 1.0

> "A dificuldade deve vir de domínio, não de números inflados."

---

# Objetivo

Este documento define as referências de balanceamento que valem para o jogo inteiro: vida do jogador, dano de inimigos, cura, curva de dificuldade entre biomas e penalidade de morte.

Os valores aqui são **referências de design relativas** (percentuais, proporções), não números finais de implementação — esses serão ajustados em playtest durante cada Vertical Slice, sempre respeitando as proporções definidas aqui.

---

# Filosofia de Balanceamento

Segue a filosofia do `04_BESTIARIO_MACRO.md`: dificuldade vem de padrão de ataque e leitura do jogador, não de vida ou dano inflados.

- Um inimigo Comum nunca deve ameaçar matar o jogador sozinho — o risco vem de grupos e de erro repetido.
- A curva de dificuldade sobe pela **complexidade dos padrões**, não pela quantidade de dano por acerto.
- Morrer deve ensinar algo (padrão mal lido), nunca parecer injusto (dano não telegrafado, hitbox generosa demais penalizando o jogador).

---

# 1. Vida do Jogador

- O jogador possui um número fixo de "unidades de vida" (referência de design: entre 4 e 6 unidades, a definir no primeiro Vertical Slice — Vila Inicial — onde isso será testado na prática).
- Cada unidade representa uma fatia igual de vida — sem diferença de "peso" entre uma unidade e outra.
- **Vida máxima não aumenta ao longo do jogo.** Não existem colecionáveis de expansão de vida (sem "corações extras"). A dificuldade é administrada inteiramente pelos inimigos e pela curva de padrões (ver Seção 4), nunca por buff de vida do jogador. Isso simplifica a HUD (barra de vida sempre com o mesmo tamanho) e a progressão (foco total nas habilidades de Brasa como forma de o jogador ficar "mais forte").

---

# 2. Dano de Inimigos (por categoria)

Dano expresso em proporção da vida máxima do jogador, não em número fixo:

| Categoria | Dano por acerto (referência) |
|---|---|
| Comum | ~1 unidade de vida |
| Guardião de Área | ~1 unidade de vida (mas ataques mais frequentes/agressivos) |
| Mini-Boss | ~1 a 1,5 unidade de vida |
| Boss | ~1,5 a 2 unidades de vida |

Nenhum inimigo Comum deve causar dano acima de 1 unidade — isso é regra travada, para manter a promessa de "hurtbox generosa, punição justa" do `03_GAMEPLAY_MACRO.md`.

---

# 3. Cura

Conforme já definido no `03_GAMEPLAY_MACRO.md`: nunca automática/passiva.

- **Pontos de descanso**: cura total, mas fixos no mapa (mesma função de fogueira/banco — parar o jogo, respawn de inimigos comuns ao redor, cura completa).
- **Itens consumíveis de cura**: cura parcial (referência: 1 unidade de vida por item), encontrados de forma **limitada dentro de cada fase** — sem sistema de economia, sem compra, sem craft. O item é um recurso de exploração: quanto mais o jogador explora a fase, mais chance de encontrar cura extra antes de um Mini-Boss ou Boss. Isso reforça o pilar "exploração recompensa" da Game Bible.
- A quantidade exata de itens por fase é decidida no Vertical Slice de cada bioma (varia conforme extensão e dificuldade da fase), sempre respeitando a régua da Seção 4.

---

# 4. Curva de Dificuldade entre Biomas

Cada região aumenta a dificuldade de forma gradual, seguindo a ordem definida no `02_CONTINENTE.md`. Referência de multiplicador relativo de "dificuldade de padrão" (não é dano, é complexidade/quantidade de padrões combinados):

| Região | Multiplicador de dificuldade (referência) |
|---|---|
| 0 — Vila Inicial | Tutorial, sem combate |
| 1 — Bosque Esmeralda | Base (1x) |
| 2 — Floresta Sombria | 1.2x |
| 3 — Montanhas de Ferro | 1.4x |
| 4 — Pântano Maldito | 1.6x |
| 5 — Reino Esquecido | 1.8x |
| 6 — Picos Congelados | 2x |
| 7 — Terras Cinzentas | 2.3x |
| 8 — Vulcão da Origem | 2.6x+ |

Esse multiplicador se traduz em: mais padrões combinados por inimigo, grupos maiores, telegraphs mais curtos (exige reação mais rápida) — nunca em dano bruto fora da tabela da Seção 2.

---

# 5. Cooldowns de Habilidades (referência)

| Habilidade | Cooldown (referência de design) |
|---|---|
| Chama Reveladora (dano em área) | ~8 a 12 segundos |
| Demais habilidades de Brasa | Sem cooldown — limitadas por uso situacional (ex: Ancoragem de Gelo só funciona em gelo) |

O valor exato da Chama Reveladora será validado no Vertical Slice da Floresta Sombria (Região 2), onde ela é obtida.

---

# 6. Morte e Checkpoint

- Morte não causa perda permanente de item ou progresso coletado (sem penalidade tipo "perder almas" de Souls) — bate com o pilar de simplicidade e com o público-alvo (exploração, não punição extrema).
- Jogador retorna ao último checkpoint/ponto de descanso ativado.
- Inimigos Comuns da sala voltam a aparecer após morte (reforça o Bestiário Macro, Seção 7); Mini-Boss e Boss não reiniciam vida parcial — sempre recomeçam a luta do zero.

---

# Regras de Balanceamento

Estas regras nunca devem ser quebradas sem revisão deste documento:

- Dano de inimigo Comum nunca excede 1 unidade de vida do jogador.
- Dificuldade sobe por complexidade de padrão, nunca só por número de vida/dano.
- Cura nunca é automática ou passiva.
- Morte nunca causa perda permanente de progresso ou itens.
- Todo valor numérico aqui é referência — validado e ajustado durante o Vertical Slice correspondente, nunca implementado "no escuro".

---

## Status

**Aprovado — Versão 1.0**
