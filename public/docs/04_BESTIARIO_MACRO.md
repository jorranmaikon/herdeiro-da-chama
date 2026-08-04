# Herdeiro da Chama
# 04_BESTIARIO_MACRO.md

Versão 1.0

> "Cada inimigo deve ensinar algo ao jogador antes de desafiá-lo."

---

# Objetivo

Este documento define as regras **gerais** de inimigos de Herdeiro da Chama: categorias, estrutura de IA, padrões de ataque e como inimigos se relacionam com o sistema de combate e com as habilidades das Brasas.

Ele não lista os inimigos de cada bioma — isso já está esboçado no `02_CONTINENTE.md` e será detalhado no Vertical Slice de cada região.

Este documento é a "constituição" que todo inimigo, de qualquer bioma, precisa respeitar.

---

# Filosofia de Design

Segue os pilares do `00_GAME_BIBLE.md`: gameplay primeiro, simplicidade vence.

- Um inimigo novo só se justifica se ensinar ou testar algo que os anteriores não testam.
- Todo inimigo deve ser legível: o jogador precisa entender visualmente o que ele faz antes de ser punido por isso (telegraph antes de dano).
- Inimigos não existem para serem "esponjas de vida". Encontros ficam mais difíceis por padrão de ataque e combinação, não por vida inflada.
- Como o projeto é feito por uma única pessoa, a IA de inimigo deve ser a mais simples possível que ainda pareça viva — sem pathfinding complexo, sem múltiplas camadas de decisão.

---

# 1. Categorias de Inimigo

| Categoria | Função | Frequência por bioma |
|---|---|---|
| **Comum** | Compõe o fluxo normal de combate, ensina um padrão de ataque simples | Vários por fase |
| **Guardião de Área** *(opcional por bioma)* | Inimigo comum mais forte que protege um ponto específico (baú, atalho, sala secreta) | 0–2 por bioma |
| **Mini-Boss** | Encerra uma sub-seção do bioma, combina padrões já vistos com uma variação nova | 1 por bioma |
| **Boss** | Encerra o bioma, exige domínio de tudo aprendido até ali (incluindo a habilidade de Brasa mais recente, quando fizer sentido) | 1 por bioma |

Regra geral: um bioma nunca deve introduzir um inimigo Comum totalmente novo na fase do Mini-Boss ou do Boss. Todo padrão usado no chefe deve já ter sido visto antes, em versão mais simples.

---

# 2. Estrutura Padrão de IA

Todo inimigo, independente da categoria, opera com uma máquina de estados simples:

```
Idle/Patrulha → Alerta → Perseguição/Preparação → Ataque → Recuperação → (volta ao início ou Morte)
```

- **Idle/Patrulha**: comportamento padrão quando o jogador não foi detectado (parado ou em rota fixa).
- **Alerta**: reação ao detectar o jogador (raio de detecção fixo por inimigo, sem "visão" complexa — ex: linha reta ou distância simples).
- **Perseguição/Preparação**: aproxima-se do jogador ou telegrafa o próximo ataque.
- **Ataque**: executa o padrão de dano (ver Seção 3).
- **Recuperação**: breve janela de vulnerabilidade após atacar — é a "abertura" que o jogador deve aprender a explorar.

Mini-bosses e bosses usam a mesma máquina de estados, apenas com mais de um padrão de ataque alternando entre si (ver Seção 5).

---

# 3. Padrões de Ataque Genéricos

Todo inimigo do jogo deve se encaixar em pelo menos um destes padrões-base (podem ser combinados em bosses):

| Padrão | Descrição |
|---|---|
| **Contato** | Dano ao encostar no jogador, sem telegraph — usado só em inimigos muito fracos/lentos |
| **Golpe Telegrafado** | Pausa breve e sinal visual antes do dano (ex: recuar antes de investir) |
| **Projétil** | Dispara algo a distância, com tempo de reação suficiente para desviar |
| **Área** | Dano numa zona marcada no chão/ar antes de ativar (telegraph obrigatório) |

Regra: **todo padrão de dano que não seja "Contato" precisa ter telegraph visual claro.** Isso respeita a regra do `03_GAMEPLAY_MACRO.md` de hurtbox generosa e i-frames — o jogo pune reação ruim, não falta de informação.

---

# 4. Vida e Dano

- Valores exatos de vida/dano por inimigo pertencem ao futuro `05_BALANCEAMENTO.md` — este documento define apenas a regra estrutural.
- Vida de inimigos Comuns deve permitir morte em poucos golpes do ataque básico (o combate deve ser ágil, não atritado).
- Mini-bosses e Bosses têm fases de vida (ex: trocam de padrão em certos limiares), não apenas "mais HP".
- Dano recebido pelo jogador varia por inimigo/padrão, nunca por tipo de arma do jogador (já definido no Gameplay Macro).

---

# 5. Mini-Boss vs Boss

| Aspecto | Mini-Boss | Boss |
|---|---|---|
| Nº de padrões de ataque | 2 | 3 ou mais |
| Fases de vida | Não obrigatório | Recomendado (ao menos 2 fases) |
| Arena dedicada | Opcional | Obrigatória |
| Uso da Brasa mais recente | Opcional | Recomendado quando fizer sentido |
| Relação com a Lore | Reforça o tema do bioma | Deve conectar-se à revelação de lore daquele bioma (ver `02_CONTINENTE.md`) |

---

# 6. Relação com as Habilidades de Brasa

Conforme o jogador ganha habilidades (`03_GAMEPLAY_MACRO.md`, Seção 5), o bestiário pode usar isso a favor do design — sem tornar habilidades anteriores obsoletas:

- Um inimigo pode ter uma **fraqueza** a uma habilidade específica (ex: inimigo blindado que só abre guarda com o Punho de Ferro), mas nunca deve ser **impossível** de enfrentar sem ela — apenas mais difícil ou mais lento.
- Novas habilidades podem abrir **novas opções táticas** contra inimigos já conhecidos (ex: Escudo do Guardião permite lidar melhor com Golpe Telegrafado de inimigos antigos), reforçando que nenhuma habilidade perde relevância.
- Inimigos exclusivos de um bioma não devem exigir a habilidade daquele MESMO bioma para serem derrotados — o jogador ainda não a possui até vencer o boss.

---

# 7. Spawn e Encontros

- Inimigos Comuns podem aparecer em grupo, mas o design deve evitar que dois padrões "Área" ativem ao mesmo tempo sem espaço de reação.
- Arenas de Mini-Boss e Boss são fechadas (sem fuga) e sinalizadas visualmente antes da entrada.
- Nenhum inimigo reaparece infinitamente numa mesma sala após ser derrotado, exceto se documentado explicitamente no Vertical Slice do bioma (ex: sala de desafio opcional).

---

# Regras do Bestiário

Estas regras nunca devem ser quebradas sem revisão deste documento:

- Todo inimigo deve se encaixar numa das 4 categorias da Seção 1.
- Todo padrão de ataque que não seja Contato precisa de telegraph visual.
- Nenhum inimigo é "esponja de vida" — dificuldade vem de padrão, não de HP inflado.
- Nenhuma habilidade de Brasa é obrigatória para vencer um inimigo — no máximo, facilita.
- Todo Boss deve refletir a revelação de lore do seu bioma.
- Novos inimigos só entram em um bioma se estiverem documentados no Vertical Slice correspondente.

---

## Status

**Validado — Versão 1.0**
