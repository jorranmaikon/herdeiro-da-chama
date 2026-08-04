# Herdeiro da Chama
# VS_00_VILA_INICIAL.md

Versão 1.0

> Vertical Slice da Região 0 — preenchido conforme `09_TEMPLATE_VERTICAL_SLICE.md`.

---

# 1. Identidade do Bioma

| Campo | Valor |
|---|---|
| Nome do Bioma | Vila Inicial |
| Número da Região | 0 |
| Emoção principal | Segurança / conforto |
| Atmosfera | Segurança, conforto, lar |
| Paleta e iluminação | Tons quentes, terrosos, luz de fim de tarde (`07_DIRECAO_ARTE_AUDIO.md`, Seção 2) |
| Marco visual dominante | Um moinho antigo e uma grande árvore central |

---

# 2. Estrutura Narrativa

- **Introdução**: o jogador acorda/inicia sua rotina comum na vila — sem qualquer indício de ameaça. O objetivo é estabelecer "normalidade" antes de plantar o primeiro sinal estranho, conforme `01_LORE.md` ("Ele leva uma vida comum... Sua jornada começa quando acontecimentos estranhos passam a ocorrer próximos de sua vila").
- **NPC principal proposto: o Ancião.** Ele é quem percebe os pequenos sinais estranhos e quem, ao final da fase de exploração, aponta o caminho para fora da vila (rumo ao Bosque Esmeralda). Ele nunca menciona Guardiões, Brasas ou Chama diretamente — apenas desconfiança vaga ("os animais andam agitados", "ouvi um som que não ouvia há anos"). Isso respeita a regra da Lore de que o mistério nunca é entregue de forma direta.
- **NPCs secundários** (falam, mas não guiam a narrativa): Ferreiro (treina o ataque básico) e Caçador (ensina a interagir com o mundo/objetos). Camponeses genéricos são ambientação, sem diálogo obrigatório.
- **Revelação de lore**: esta região não responde nenhuma pergunta da tabela de "Progressão Narrativa" (`02_CONTINENTE.md`, que começa no Bosque) — ela apenas planta a semente do mistério, sem revelar nada ainda.
- **Crônicas deste bioma: proponho zero.** A primeira Crônica do jogo acontece no Bosque Esmeralda (Região 1, "primeira referência aos Guardiões", conforme `02_CONTINENTE.md`). Antes disso, não há nada de lore profunda pra revelar — trazer uma Crônica aqui arriscaria antecipar tom/mistério cedo demais. Se você preferir uma Crônica puramente atmosférica (ex: uma lenda folclórica sem peso narrativo real), me avise e eu ajusto.

---

# 3. Estrutura de Fases

Região 0 é tutorial pura — sem combate real (conforme `02_CONTINENTE.md` e `05_BALANCEAMENTO.md`, que já define esta região como "Tutorial, sem combate"). As 4 fases padrão viram 4 lições práticas dos controles básicos (`03_GAMEPLAY_MACRO.md`, Seção 1):

| Fase | Tipo | Spawn | Checkpoint(s) | Saída | Elementos exclusivos desta fase |
|---|---|---|---|---|---|
| 1 | Principal | Casa do protagonista | Nenhum (fase curta) | Praça central | Ensina Movimento + Pulo (obstáculos simples: cerca baixa, vão curto) |
| 2 | Principal | Praça central | Nenhum | Casa do Caçador | Ensina Interação (falar com NPCs, abrir porta, pegar item simples) |
| 3 | Principal | Frente da casa do Ferreiro | Nenhum | Saída da forja | Ensina Ataque básico contra um **boneco de treino** (objeto estático, não é inimigo — não entra no Bestiário Macro) |
| 4 | Exploração | Praça central (livre) | Ponto de descanso da vila (primeiro checkpoint real do jogo) | Estrada rumo ao Bosque Esmeralda | Exploração livre da vila; conversa final com o Ancião libera a saída |

---

# 4. Inimigos do Bioma

**Não se aplica.** Conforme `02_CONTINENTE.md` (Região 0: "Inimigos: Nenhum — Apenas treino") e `05_BALANCEAMENTO.md` (Região 0 = Tutorial, sem combate). O boneco de treino da Fase 3 é um objeto interativo estático, não uma entidade do Bestiário Macro.

---

# 5. Mini-Boss

**Não se aplica** — mesma justificativa da Seção 4.

---

# 6. Boss

**Não se aplica** — mesma justificativa da Seção 4.

---

# 7. Brasa Primordial e Habilidade

**Não se aplica.** A primeira Brasa (Rolamento) é obtida apenas na Região 1 — Bosque Esmeralda, conforme `03_GAMEPLAY_MACRO.md`, Seção 5. A Vila Inicial não introduz nenhuma habilidade.

---

# 8. Mapa do Bioma

Área única, pequena, sem necessidade de revelação estilo metroidvania (a vila é curta o bastante para não precisar de "fog" no mapa) — mas ainda assim obrigatório produzir, conforme `06_INTERFACE_UX.md`, Seção 2.2:

- **Topologia**: Casa do protagonista → Praça Central (hub) → ramifica para Casa do Caçador, Forja do Ferreiro, e Moinho (marco visual, decorativo/opcional de explorar) → Estrada de saída (Bosque Esmeralda).
- **Marcos no mapa**: Praça Central (ponto de descanso/checkpoint), Casa do Ferreiro (treino), Casa do Caçador, Moinho, Saída.
- **Salas bloqueadas por habilidade futura**: nenhuma — não faria sentido plantar bloqueio de Brasa antes do jogador saber que Brasas existem.

---

# 9. Itens de Cura

**Não se aplica.** Sem combate, não há dano — logo, não há necessidade de itens de cura nesta região, conforme a lógica do `05_BALANCEAMENTO.md` (cura existe para administrar risco de combate).

---

# 10. Checklist de Assets Obrigatórios

## Cenário e Ambientação
- [ ] Tileset da Vila (grid 16×16px)
- [ ] Background/parallax com paleta terrosa e luz de fim de tarde
- [ ] Moinho antigo (marco visual dominante)
- [ ] Grande árvore central
- [ ] Boneco de treino (objeto interativo da Fase 3)

## Personagens
- [ ] Retrato do Ancião (NPC principal)
- [ ] Retrato do Ferreiro
- [ ] Retrato do Caçador
- [ ] Sprite do protagonista (idle, correr, pular, ataque básico, interagir — conjunto base, conforme `07_DIRECAO_ARTE_AUDIO.md`, Seção 4)
- [ ] Camponeses genéricos (sprite simples de ambientação, sem animação de diálogo obrigatória)

## UI e Narrativa
- [ ] Ícones do Mapa do Bioma: ponto de descanso, casa do ferreiro, casa do caçador, moinho, saída
- [ ] Nenhuma ilustração de Crônica necessária (Seção 2 — zero Crônicas nesta região)

## Áudio — *adiado nesta fase do projeto, conforme `09_TEMPLATE_VERTICAL_SLICE.md`*
- [ ] Trilha da Vila (tema calmo, com o motivo da Grande Chama ainda **não** perceptível — reforça que a região é "antes de tudo começar")
- [ ] SFX genéricos (passos, pulo, ataque, interação) — reaproveitados do padrão global

---

# 11. Checklist de Produção

- [x] Seção 1 — Identidade do Bioma preenchida
- [x] Seção 2 — Estrutura Narrativa aprovada
- [x] Seção 3 — Fases definidas
- [x] Seção 4 — Inimigos (N/A, justificado)
- [x] Seção 5 — Mini-Boss (N/A, justificado)
- [x] Seção 6 — Boss (N/A, justificado)
- [x] Seção 7 — Habilidade de Brasa (N/A, justificado)
- [x] Seção 8 — Mapa do Bioma esboçado
- [x] Seção 9 — Itens de cura (N/A, justificado)
- [ ] Seção 10 — Checklist de Assets conferido
- [ ] Pasta técnica planejada em `src/scenes/biomes/Vila_0/`

---

## Status

**Aprovado — Versão 1.0**
