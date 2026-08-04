# Herdeiro da Chama
# 06_INTERFACE_UX.md

Versão 1.0

> "A interface nunca deve competir com o mundo. Ela serve o jogador, não o contrário."

---

# Objetivo

Este documento define todas as telas e elementos de interface do jogo: HUD durante a gameplay, sistema de mapa, menus, sistema de diálogo, apresentação de Crônicas e fluxo de save.

Ele existe para que nenhum bioma, ao entrar em Vertical Slice, precise inventar uma tela nova — toda interface do jogo nasce e é validada aqui.

---

# Filosofia de Interface

Segue os pilares do `00_GAME_BIBLE.md`: simplicidade vence, gameplay primeiro.

- A HUD deve ser mínima. Só mostra o que o jogador precisa saber no momento.
- Nenhum elemento de UI deve tampar uma área relevante da tela de jogo.
- Consistência entre biomas: a interface não muda de posição ou comportamento de uma região para outra (só a skin visual pode variar, se fizer sentido).
- Pixel art também vale para UI — nada de fontes ou ícones "genéricos" fora do estilo do jogo.

---

# 1. HUD Durante a Gameplay

Elementos visíveis permanentemente durante a exploração/combate:

- **Barra de vida**: fixa, unidades fixas (ver `05_BALANCEAMENTO.md` Seção 1 — vida máxima não muda, então a barra nunca precisa "crescer" visualmente, só esvaziar/encher).
- **Indicador de cooldown**: só aparece quando o jogador já possui uma habilidade com cooldown (hoje, apenas a Chama Reveladora — ver `03_GAMEPLAY_MACRO.md`). Ícone pequeno, canto da tela, com preenchimento circular ou similar indicando tempo restante.
- **Contador de itens de cura**: número simples mostrando quantos itens de cura o jogador carrega no momento.

Nada além disso fica fixo na tela. Sem barra de experiência, sem moeda (não existe economia, conforme `05_BALANCEAMENTO.md`).

---

# 2. Sistema de Mapa

Decisão fundamental de estrutura, definida como parte central da navegação do jogo. Dois níveis de mapa, ambos acessíveis pelo Menu de Pausa:

## 2.1 Mapa do Continente

- Mostra o continente inteiro de forma aberta, com a silhueta de todas as 9 regiões visível desde o início (reforça o pilar "o mundo deve parecer muito maior do que aquilo que o jogador consegue explorar", da Lore).
- Regiões ainda não visitadas aparecem de forma reconhecível na silhueta, mas sem detalhe (nome/ícone "?", sem revelar conteúdo).
- Regiões já visitadas mostram nome, ícone de status (Brasa coletada, boss derrotado) e ficam totalmente reveladas no mapa geral.
- A ordem de progressão continua linear (`02_CONTINENTE.md`), então o mapa do continente é mais informativo/atmosférico do que uma ferramenta de navegação livre — ele reforça a sensação de jornada rumo ao centro do mundo.

## 2.2 Mapa do Bioma

- Cada região possui seu próprio mapa interno, revelado conforme o jogador explora (padrão metroidvania — salas não visitadas ficam ocultas/em branco).
- Mostra: salas já visitadas, marcos relevantes (checkpoint, mini-boss, boss, Brasa), e indica salas com objetos que exigem uma habilidade que o jogador ainda não possui (reforça a regra do `03_GAMEPLAY_MACRO.md` Seção 6 de "plantar curiosidade").
- Não mostra a localização exata de itens colecionáveis — apenas a estrutura de salas, para não remover o prazer de explorar.

**Nota de produção:** o mapa do bioma exige que cada Vertical Slice produza sua própria arte/estrutura de mapa. Isso deve constar como item obrigatório no checklist do template de bioma (`09_TEMPLATE_VERTICAL_SLICE.md`, a criar).

---

# 3. Menu de Pausa

Acessado a qualquer momento fora de diálogo/Crônica. Contém:

- **Mapa**: acesso ao Mapa do Continente e ao Mapa do Bioma atual (ver Seção 2).
- **Habilidades**: lista das habilidades de Brasa já obtidas, com pequena descrição de uso (reforça ao jogador o que ele pode fazer, já que não há tutorial repetido).
- **Brasas Coletadas**: indicador visual de progresso (quantas das 7 Brasas + a final já foram obtidas), sem revelar localização das que faltam.
- **Códex de Crônicas**: lista das Crônicas já vistas, permitindo reabri-las (ver Seção 5).
- **Configurações**: áudio, controles, idioma (se aplicável).
- **Sair para o Menu Principal**.

---

# 4. Sistema de Diálogo

Já esboçado no `00_GAME_BIBLE.md`, detalhado aqui:

- Caixa de diálogo única, fixa na parte inferior da tela.
- Retrato do NPC à esquerda (ou lado oposto ao protagonista, se os dois estiverem em cena).
- Retrato do protagonista aparece apenas quando ele tem uma fala relevante (não em toda interação).
- Texto aparece gradualmente (efeito "typewriter").
- Botão de acelerar texto (input segurado ou repetido revela o texto instantaneamente).
- Botão de avançar para a próxima frase.
- Diálogos sempre curtos — sem blocos de texto extensos, conforme regra da Game Bible.
- Diálogo pausa o gameplay (sem inimigos atacando durante uma conversa).

---

# 5. Apresentação de Crônicas e Códex

Já esboçado no `00_GAME_BIBLE.md`, detalhado aqui:

- Tela dedicada, substitui a HUD normal por completo.
- Imagem ilustrada estática como base.
- Zoom lento e pequenos movimentos de câmera sobre a imagem (efeito Ken Burns).
- Fade de entrada e saída.
- Texto narrado aparecendo em sincronia com a imagem (mesmo estilo typewriter do diálogo, mas sem retrato).
- Botão para avançar/pular, disponível a qualquer momento (o jogador nunca é obrigado a esperar se já leu antes).

**Códex**: toda Crônica vista fica salva e pode ser reaberta a qualquer momento pelo Menu de Pausa (Seção 3). O Códex é uma lista simples (título + pequeno ícone/thumbnail), sem exigir nenhuma tela adicional complexa. Reforça o pilar de que "o jogador monta a história como um quebra-cabeça" (Lore) — ele pode revisitar pistas sem depender de memória.

---

# 6. Menu Principal

- Novo Jogo
- Continuar (se houver save existente)
- Configurações
- Sair

Estética alinhada ao tom do jogo (não é um menu genérico) — arte específica fica a cargo da Direção de Arte (`07_DIRECAO_ARTE_AUDIO.md`, ainda a criar).

---

# 7. Save

- Save automático ao ativar um ponto de descanso/checkpoint (conforme `05_BALANCEAMENTO.md` Seção 6).
- Sem save manual em qualquer ponto do mapa — mantém coerência com o sistema de checkpoint já definido.
- Progresso do Mapa (salas reveladas) e do Códex (Crônicas vistas) é salvo junto do save principal, sem sistema separado.
- Um único slot de save por perfil, a menos que haja necessidade futura de múltiplos slots (não há indicação disso em nenhum documento até aqui).

---

# 8. Notificações Rápidas

Pequenos avisos não-intrusivos, sem pausar o jogo:

- **Brasa coletada**: notificação simples com nome da Brasa.
- **Habilidade desbloqueada**: notificação com nome da habilidade (o detalhe de uso fica no Menu de Pausa, Seção 3).
- **Nova área do mapa revelada**: feedback mínimo, sem popup grande.
- **Item de cura coletado**: feedback mínimo (não precisa de notificação de tela cheia, só um pequeno efeito visual/sonoro).

---

# Regras de Interface

Estas regras nunca devem ser quebradas sem revisão deste documento:

- A HUD nunca cobre áreas relevantes de gameplay.
- Nenhuma tela de menu, mapa ou diálogo permite dano ao jogador enquanto aberta.
- Todo bioma, sem exceção, precisa produzir seu próprio Mapa de Bioma — é item obrigatório de Vertical Slice, não opcional.
- O Mapa do Continente nunca revela conteúdo de uma região antes do jogador visitá-la, apenas sua existência/silhueta.
- Toda nova tela de interface introduzida em um bioma precisa antes ser aprovada e documentada aqui.
- A estética de UI segue a mesma direção de arte do restante do jogo — nunca um estilo genérico "fora do universo".

---

## Status

**Aprovado — Versão 1.0**
