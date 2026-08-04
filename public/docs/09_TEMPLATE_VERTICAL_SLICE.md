# Herdeiro da Chama
# 09_TEMPLATE_VERTICAL_SLICE.md

Versão 1.0

> "Cada bioma é um mini projeto completo — nada entra em produção sem passar por este molde."

---

# Objetivo

Este documento é o **molde oficial** que todo bioma preenche antes de entrar em produção (arte, código, assets).

Cada bioma vira um documento próprio, nomeado `VS_[número]_[NOME_DO_BIOMA].md`, seguindo exatamente esta estrutura — nenhuma seção pode ser pulada, e nenhuma seção nova pode ser adicionada sem atualizar este template primeiro.

Este documento **não substitui** os documentos macro (00–08). Ele é onde as regras gerais viram decisões concretas e específicas daquele bioma. Toda escolha feita aqui precisa respeitar o que já foi travado nos docs macro — se algo não couber, a discussão volta para o documento macro correspondente, nunca é resolvida "por fora" dentro do slice.

---

# Como usar este template

1. Copie esta estrutura para um novo arquivo `VS_[N]_[NOME].md`.
2. Preencha cada seção — nada de deixar placeholder em branco na versão final.
3. Sempre que uma seção referenciar um documento macro, a decisão aqui deve ser uma **aplicação** da regra macro, não uma reinvenção dela.
4. Ao final, revise o Checklist de Assets (Seção 10) e o Checklist de Produção (Seção 11) — só depois de tudo marcado o bioma está pronto para gerar assets e código.
5. Siga o fluxo de aprovação sequencial já usado nos docs macro: eu apresento a seção, você aprova ou ajusta, sigo para a próxima.

---

# 1. Identidade do Bioma

| Campo | Preencher |
|---|---|
| Nome do Bioma | |
| Número da Região (`02_CONTINENTE.md`) | |
| Emoção principal | (já definida no `02_CONTINENTE.md`) |
| Atmosfera | (já definida no `02_CONTINENTE.md`) |
| Paleta e iluminação | (puxar do `07_DIRECAO_ARTE_AUDIO.md`, Seção 2 e 3) |
| Marco visual dominante | (já definido no `02_CONTINENTE.md`) |

Esta seção não inventa nada novo — apenas centraliza, num só lugar, o que já está espalhado pelos docs macro para esse bioma específico.

---

# 2. Estrutura Narrativa

- **Introdução**: como o jogador chega/entende que está entrando neste bioma.
- **NPC principal**: quem é, o que ele sabe, o que ele revela (mesmo que parcialmente).
- **Revelação de lore**: qual pergunta da tabela de "Progressão Narrativa" (`02_CONTINENTE.md`) este bioma responde, e como isso é entregue (Crônica, diálogo, ambiente).
- **Crônicas deste bioma**: quantas, e resumo de uma frase do que cada uma revela (sem escrever o texto final aqui — isso é conteúdo de produção, não de arquitetura de documento).

Regra herdada da Lore: nenhuma revelação aqui pode contradizer `01_LORE.md` ou entregar mais do que a "Verdade Oculta" permite para este ponto da jornada.

---

# 3. Estrutura de Fases

Todo bioma segue o padrão do `02_CONTINENTE.md`: 3 fases principais + 1 fase de exploração. Preencher uma tabela como esta para cada fase:

| Fase | Tipo | Spawn | Checkpoint(s) | Saída | Elementos exclusivos desta fase |
|---|---|---|---|---|---|
| 1 | Principal | | | | |
| 2 | Principal | | | | |
| 3 | Principal | | | | |
| 4 | Exploração | | | | |

Toda fase segue a Estrutura Padrão de Cena do `03_GAMEPLAY_MACRO.md` (Seção 8). "Elementos exclusivos" só pode conter algo que não exista em nenhum outro documento macro — se for uma mecânica nova, ela **não entra aqui direto**; volta para revisão do Gameplay Macro primeiro.

---

# 4. Inimigos do Bioma

Todo inimigo deve se encaixar nas categorias e padrões do `04_BESTIARIO_MACRO.md`.

| Inimigo | Categoria | Padrão(ões) de ataque | Fase(s) onde aparece | O que ensina de novo |
|---|---|---|---|---|
| | Comum | | | |
| | Comum | | | |
| | Guardião de Área *(opcional)* | | | |

Regra herdada: nenhum inimigo Comum pode ser introduzido pela primeira vez na fase do Mini-Boss ou do Boss.

---

# 5. Mini-Boss

| Campo | Preencher |
|---|---|
| Nome | |
| Padrões de ataque (2, conforme `04_BESTIARIO_MACRO.md`) | |
| Fase de vida (opcional) | |
| Arena dedicada? | |
| Conexão temática com o bioma | |

---

# 6. Boss

| Campo | Preencher |
|---|---|
| Nome | |
| Padrões de ataque (3 ou mais) | |
| Fases de vida (mínimo 2 recomendado) | |
| Arena dedicada (obrigatória) | |
| Usa a habilidade de Brasa deste bioma? Como? | |
| Conexão com a revelação de lore deste bioma | |

---

# 7. Brasa Primordial e Habilidade

Puxar diretamente da tabela do `03_GAMEPLAY_MACRO.md` (Seção 5) — este bioma não inventa a habilidade aqui, apenas detalha a implementação dela.

| Campo | Preencher |
|---|---|
| Nome da habilidade | |
| Função de exploração (detalhe de aplicação neste bioma) | |
| Função de combate/defesa (detalhe de aplicação neste bioma) | |
| Cooldown (se houver, conforme `05_BALANCEAMENTO.md`) | |
| Onde e como o jogador a recebe (contexto narrativo do momento) | |

---

# 8. Mapa do Bioma

Conforme `06_INTERFACE_UX.md`, Seção 2.2 — obrigatório, não opcional.

- Estrutura geral de salas (rascunho — não precisa ser a arte final, mas a topologia).
- Marcos a exibir no mapa: checkpoint(s), mini-boss, boss, Brasa.
- Salas com objetos bloqueados por habilidade futura (plantando curiosidade, conforme `03_GAMEPLAY_MACRO.md`, Seção 6) — quais e com qual habilidade se resolvem.

---

# 9. Itens de Cura

Conforme `05_BALANCEAMENTO.md`, Seção 3.

| Fase | Quantidade de itens de cura (referência) |
|---|---|
| 1 | |
| 2 | |
| 3 | |
| 4 (exploração) | |

---

# 10. Checklist de Assets Obrigatórios

Esta seção não se preenche livremente — ela é **derivada diretamente** das Seções 1 a 9 já respondidas acima. A regra é simples: **se um elemento tem nome próprio em alguma seção anterior, ele precisa de asset. Se não tem, não é obrigatório.** Isso evita tanto esquecer algo quanto produzir asset "a mais" que nunca vai ser usado.

## Cenário e Ambientação
- [ ] Tileset do bioma (grid 16×16px, conforme `07_DIRECAO_ARTE_AUDIO.md` Seção 1)
- [ ] Camada(s) de background/parallax coerentes com a paleta da Seção 1
- [ ] Elemento(s) do marco visual dominante (Seção 1)

## Personagens e Criaturas
- [ ] Retrato do NPC principal para a caixa de diálogo (Seção 2)
- [ ] Sprite sheet de cada inimigo Comum listado na Seção 4 (idle, movimento, telegraph, hit, morte)
- [ ] Sprite sheet do Guardião de Área, se houver (Seção 4)
- [ ] Sprite sheet do Mini-Boss, incluindo frame de antecipação de cada padrão (Seção 5)
- [ ] Sprite sheet do Boss, incluindo variação visual por fase de vida, se houver (Seção 6)
- [ ] Animação da nova habilidade do protagonista, **somente se este bioma introduzir uma Brasa** (Seção 7)

## UI e Narrativa
- [ ] Ícones exclusivos do Mapa do Bioma: checkpoint(s), mini-boss, boss, Brasa, sala bloqueada (Seção 8)
- [ ] Ilustração de cada Crônica listada na Seção 2 (uma imagem por Crônica)

## Áudio — *adiado nesta fase do projeto (ver nota abaixo)*
- [ ] Trilha musical do bioma, incorporando o motivo da Grande Chama (`07_DIRECAO_ARTE_AUDIO.md` Seção 7)
- [ ] SFX exclusivo da nova habilidade, **somente se este bioma introduzir uma Brasa** (Seção 7 deste template)
- [ ] SFX de ataque/dano/morte de inimigos novos, apenas se o padrão de ataque for visualmente/sonoramente muito distinto dos já existentes — caso contrário reaproveita o SFX genérico já definido no `07_DIRECAO_ARTE_AUDIO.md` Seção 8

> **Nota de processo:** por decisão do projeto, áudio **não bloqueia** a conclusão de um bioma nem entra no Checklist de Produção (Seção 11) por enquanto. O objetivo agora é conseguir jogar a história inteira (visual + gameplay) sem esperar pela trilha/SFX. O bloco acima continua documentado para não se perder — ele volta a ser obrigatório numa fase posterior, quando o projeto decidir retomar produção de áudio (provavelmente depois que os biomas estiverem jogáveis).

Se ao preencher esta lista você perceber que falta um asset que não se encaixa em nenhum item acima, é sinal de que falta preencher algo nas Seções 1–9 (ou de que existe uma seção faltando neste template — nesse caso, paramos e revisamos o template antes de seguir).

---

# 11. Checklist de Produção

Nada avança para geração de asset ou código antes de todos os itens abaixo estarem preenchidos e aprovados:

- [ ] Seção 1 — Identidade do Bioma preenchida
- [ ] Seção 2 — Estrutura Narrativa aprovada (sem contradizer a Lore)
- [ ] Seção 3 — Todas as fases com spawn/checkpoint/saída definidos
- [ ] Seção 4 — Inimigos mapeados em categorias válidas do Bestiário Macro
- [ ] Seção 5 — Mini-Boss definido
- [ ] Seção 6 — Boss definido, conectado à revelação de lore
- [ ] Seção 7 — Habilidade de Brasa detalhada (sem contradizer o Gameplay Macro)
- [ ] Seção 8 — Estrutura do Mapa do Bioma esboçada
- [ ] Seção 9 — Itens de cura definidos por fase
- [ ] Seção 10 — Checklist de Assets Obrigatórios 100% conferido e produzido (blocos de Cenário, Personagens e UI/Narrativa — **bloco de Áudio fica fora desta trava por enquanto**, ver nota na Seção 10)
- [ ] Pasta técnica planejada em `src/scenes/biomes/[NomeBioma_N]/` (conforme `08_ARQUITETURA_TECNICA.md`, Seção 3)

---

# Regras do Template

Estas regras nunca devem ser quebradas sem revisão deste documento:

- Todo bioma usa exatamente esta estrutura — sem seções extras, sem seções puladas.
- Nenhuma decisão dentro de um Vertical Slice pode contradizer um documento macro (00–08).
- Mecânica nova, inimigo com padrão novo, ou tela de UI nova encontrados durante o preenchimento voltam para o documento macro correspondente antes de entrar no slice.
- O Checklist de Produção (Seção 11) precisa estar 100% marcado antes de qualquer asset ou linha de código ser produzida para aquele bioma.

---

## Status

**Aprovado — Versão 1.0**
