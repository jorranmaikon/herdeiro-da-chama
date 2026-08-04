# Herdeiro da Chama
# 03_GAMEPLAY_MACRO.md

Versão 1.0

> "Toda mecânica precisa ser divertida antes de ser complexa."

---

# Objetivo

Este documento define as regras macro de gameplay de **Herdeiro da Chama**.

Ele é a base mecânica que todo bioma deve respeitar antes de entrar em desenvolvimento como Vertical Slice.

Nenhum bioma pode introduzir uma mecânica de movimento, combate ou progressão que não esteja prevista aqui sem passar antes por este documento.

Este documento não define arquitetura de código. Define comportamento e regras de design.

---

# 1. Controles Básicos

Ensinados na Vila Inicial (Região 0), disponíveis desde o início do jogo:

- Mover (esquerda / direita)
- Pular
- Ataque básico (corpo a corpo)
- Interagir (NPCs, objetos, alavancas, portas)

Nenhuma habilidade de Brasa deve substituir esses comandos. Elas sempre se somam ao conjunto básico.

---

# 2. Física do Personagem

Valores abaixo são referência inicial de design, sujeitos a ajuste fino em playtest — não são específicos de implementação.

- Movimento horizontal com aceleração leve (não é "instant stop/start")
- Pulo com curva de gravidade ajustável (subida mais rápida, queda mais pesada — sensação "responsiva")
- **Coyote time**: pequena janela após sair da borda em que o pulo ainda é aceito
- **Jump buffer**: input de pulo pressionado pouco antes de aterrissar ainda é executado
- Sem pulo duplo nativo (a menos que uma Brasa conceda algo equivalente)

---

# 3. Combate Base

- Ataque corpo a corpo padrão: hitbox curta à frente do personagem, dano fixo, sem carregamento
- Hurtbox do jogador sempre menor que o sprite visual, para evitar frustração
- **I-frames** após levar dano (breve invencibilidade, com piscar visual)
- Knockback leve ao acertar e ao ser atingido
- Sem combo system complexo na base — combos avançados só se surgirem naturalmente das habilidades de Brasa

---

# 4. Sistema de Vida

- Jogador possui pontos de vida limitados (número exato definido em documento de balanceamento futuro)
- Dano varia por tipo de inimigo, não por tipo de ataque do jogador
- Morte leva a um checkpoint definido pela fase (ver Seção 8)
- Cura, se existir, deve vir de itens ou pontos de descanso — nunca automática/passiva, para manter tensão

---

# 5. Progressão por Brasas Primordiais

Cada Brasa concede uma habilidade nova. Toda habilidade deve ter **dupla função**: abrir caminhos na exploração **e** ter uso direto em combate ou defesa. Nenhuma habilidade é puramente cosmética ou puramente narrativa.

| # | Brasa (Região) | Habilidade | Exploração | Combate / Defesa |
|---|---|---|---|---|
| 1 | Bosque Esmeralda | **Rolamento** | Passar sob obstáculos baixos, atravessar rapidamente vãos curtos | Esquiva com i-frames estendidos durante o movimento |
| 2 | Floresta Sombria | **Chama Reveladora** | Revela caminhos, símbolos e passagens ocultas na névoa | Explosão de luz que dana/mata inimigos próximos fracos; possui **cooldown** |
| 3 | Montanhas de Ferro | **Punho de Ferro** | Quebra paredes rachadas e minérios bloqueando caminho | Golpe pesado com knockback alto, quebra guarda de inimigos blindados |
| 4 | Pântano Maldito | **Véu Venenoso** | Nado e resistência a áreas de veneno/água tóxica | Contra-ataque que aplica veneno (dano ao longo do tempo) no inimigo |
| 5 | Reino Esquecido | **Escudo do Guardião** | Sem uso direto de exploração — habilidade focada em combate | Bloqueia/reflete ataques frontais, abre janela de contra-golpe |
| 6 | Picos Congelados | **Ancoragem de Gelo** | Escalada em superfícies de gelo, acesso vertical | Prende inimigo no lugar ou puxa o inimigo para perto |
| 7 | Terras Cinzentas | **Asas de Cinzas** | Voo curto / planeio para travessias longas | Ataque em mergulho (dive attack) vindo de cima |

Observações:

- A Brasa 5 (**Escudo do Guardião**) é a exceção deliberada da tabela: é uma habilidade puramente defensiva/combativa, sem função de exploração. Isso é aceitável porque a regra da Game Bible é "aplicação prática durante todo o resto do jogo" — e defesa em combate é prática constante, mesmo sem abrir caminhos novos.
- A Brasa 2 (**Chama Reveladora**) é a única habilidade com **cooldown** explícito, por acumular duas funções fortes (revelação + dano em área). Isso evita que se torne uma habilidade dominante demais cedo demais.
- Nenhuma habilidade é retirada do jogador depois de obtida. Todas permanecem ativas e relevantes até o final.

---

# 6. Interação com NPCs e Objetos

- Botão único de interação, contextual (o que faz depende do que está à frente do jogador)
- NPCs abrem a caixa de diálogo padrão (ver Game Bible)
- Objetos interativos (alavancas, baús, portas) usam o mesmo botão, sem menus intermediários
- Objetos que exigem uma Brasa específica devem sinalizar visualmente que estão bloqueados, mesmo antes do jogador possuir a habilidade (plantando a curiosidade do jogador)

---

# 7. Câmera

- Câmera segue o jogador com suavização (não é 1:1 rígido)
- Limites de câmera definidos por cena/sala, nunca mostrando fora dos limites do bioma
- Transições entre cenas: fade curto, sem cortes bruscos
- Pequeno look-ahead na direção do movimento, para dar visibilidade do que vem a seguir

---

# 8. Estrutura Padrão de Cena

Toda fase, independente do bioma, deve conter:

- Ponto de spawn definido
- Ao menos um checkpoint intermediário em fases longas
- Saída clara (visual e funcionalmente distinta de becos sem saída)
- Zonas de colisão consistentes com o tileset do bioma
- Nenhum elemento de gameplay exclusivo de uma fase sem estar documentado no MD daquele bioma (Vertical Slice)

---

# Regras de Gameplay

Estas regras nunca devem ser quebradas sem revisão deste documento:

- Nenhuma habilidade de Brasa substitui os controles básicos.
- Toda habilidade de Brasa deve ter função de exploração e/ou combate — nunca é só estética.
- Nenhuma habilidade é perdida ao longo do jogo.
- O jogador nunca recebe uma habilidade sem antes concluir o bioma correspondente.
- Nenhum bioma pode inventar uma mecânica nova fora deste documento sem atualização aprovada aqui primeiro.

---

## Status

**Aprovado — Versão 1.0**
