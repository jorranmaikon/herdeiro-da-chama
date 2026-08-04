# Herdeiro da Chama
# 02_CONTINENTE.md

Versão 1.0

> "O continente deve parecer existir muito antes da aventura começar."

---

# Objetivo

Este documento define a geografia, a estrutura e a progressão do continente onde acontece **Herdeiro da Chama**.

Seu objetivo é orientar a criação de:

- Mapa do jogo
- Level Design
- Biomas
- NPCs
- Bosses
- Backgrounds
- Trilha narrativa

---

# Filosofia

O continente não é apenas um conjunto de fases.

É uma jornada rumo ao coração do mundo.

Conforme o jogador avança, ele se aproxima da origem de toda a história.

Cada novo bioma revela um fragmento do passado e apresenta um desafio maior que o anterior.

---

# Estrutura do Continente

O continente foi moldado ao redor da Grande Chama.

No passado, todas as grandes estradas levavam à antiga capital dos Guardiões.

Após a Grande Ruína, essas rotas foram destruídas.

Os atuais reinos surgiram isolados, sem conhecer a verdadeira história.

O centro do continente permanece inacessível para quase todos.

Ali encontra-se o Vulcão da Origem.

Sob ele repousa a antiga cidade dos Guardiões.

---

# Topologia do Continente

Define a disposição espacial das 9 regiões entre si — a base geográfica para o Mapa do Continente (`06_INTERFACE_UX.md`, Seção 2.1).

**Formato: espiral orgânico, da borda ao centro.** O Vulcão da Origem ocupa o centro geográfico do continente (coerente com "todas as grandes estradas levavam à antiga capital"). A Vila Inicial fica na borda. As demais regiões se encadeiam entre as duas, formando um caminho serpenteante — não uma linha reta — que aproxima o jogador do centro conforme avança.

```
                    [Vulcão da Origem] (centro geográfico)
                          ↑
              [Terras Cinzentas]
                    ↑
         [Picos Congelados]
               ↑
      [Reino Esquecido]
            ↑
   [Pântano Maldito]
         ↑
[Montanhas de Ferro]
      ↑
[Floresta Sombria]
    ↑
[Bosque Esmeralda]
  ↑
[Vila Inicial] (borda, ponto de partida)
```

Isso reforça visualmente, sem depender de texto, a frase-chave da Lore: a jornada é literalmente um caminho rumo ao coração do mundo. A ordem de progressão continua sendo a definida na Seção "Estrutura da Campanha" — esta topologia não a altera, apenas dá a ela uma forma espacial concreta para a arte do mapa.

Regra: nenhuma região pode ser reposicionada nesta espiral sem revisão deste documento — a arte do Mapa do Continente (`07_DIRECAO_ARTE_AUDIO.md`) depende diretamente desta topologia.

---

# Estrutura da Campanha

```text
Vila Inicial

↓

Bosque Esmeralda

↓

Floresta Sombria

↓

Montanhas de Ferro

↓

Pântano Maldito

↓

Reino Esquecido

↓

Picos Congelados

↓

Terras Cinzentas

↓

Vulcão da Origem
```

Esta ordem é definitiva.

---

# Estrutura Padrão dos Biomas

Todo bioma deve possuir:

- Introdução
- 3 fases principais
- 1 fase de exploração
- Mini-boss
- Boss
- Brasa Primordial
- NPC principal
- Marco visual
- Pequena revelação da lore

---

# Região 0 — Vila Inicial

## Objetivo Narrativo

Apresentar o protagonista e mostrar um mundo aparentemente tranquilo.

## Objetivo de Gameplay

Ensinar os controles básicos.

- Movimento
- Pulo
- Ataque
- Interação

## Atmosfera

Segurança.

Conforto.

Lar.

## Marco Visual

Um moinho antigo e uma grande árvore central.

## Habitantes

Camponeses.

Ferreiro.

Caçador.

Ancião.

## Inimigos

Nenhum.

(Apenas treino.)

## Boss

Nenhum.

## Lore

O jogador percebe apenas pequenos sinais de que algo estranho está acontecendo.

---

# Região 1 — Bosque Esmeralda

## Emoção

Descoberta.

## Atmosfera

Natureza viva.

Árvores enormes.

Luz atravessando as folhas.

Ruínas cobertas por musgo.

## Habitantes

Caçadores.

Viajantes.

## Criaturas

Slimes.

Lobos.

Morcegos.

Goblin Explorador.

## Mini-Boss

Urso Corrompido.

## Boss

Guardião da Floresta.

Uma criatura ancestral corrompida.

## Marco Visual

Uma árvore gigantesca visível de qualquer ponto do bosque.

## Brasa

Primeira Brasa Primordial.

## Lore

Primeira referência aos Guardiões.

---

# Região 2 — Floresta Sombria

## Emoção

Incerteza.

## Atmosfera

Pouca luz.

Névoa.

Árvores mortas.

Silêncio.

## Habitantes

Pouquíssimos.

Um eremita.

## Criaturas

Aranhas.

Corvos.

Goblin Guerreiro.

Plantas Corrompidas.

## Mini-Boss

Aranha Anciã.

## Boss

Senhora dos Espinhos.

## Marco Visual

Uma torre destruída emergindo da névoa.

## Brasa

Segunda Brasa Primordial.

## Lore

Primeira Crônica importante.

---

# Região 3 — Montanhas de Ferro

## Emoção

Superação.

## Atmosfera

Penhascos.

Pontes.

Minas abandonadas.

Fortificações.

## Habitantes

Anões.

Mineiros.

## Criaturas

Morcegos.

Golems.

Orcs.

## Mini-Boss

Capitão Orc.

## Boss

O Rei da Forja.

## Marco Visual

Uma ponte colossal suspensa.

## Brasa

Terceira Brasa Primordial.

## Lore

Primeiras referências à antiga cidade.

---

# Região 4 — Pântano Maldito

## Emoção

Desconforto.

## Atmosfera

Água escura.

Veneno.

Ruínas afundadas.

## Habitantes

Nenhum assentamento.

## Criaturas

Sapos gigantes.

Zumbis.

Insetos.

## Mini-Boss

Hidra do Pântano.

## Boss

O Devorador do Lodo.

## Marco Visual

Um templo parcialmente submerso.

## Brasa

Quarta Brasa Primordial.

## Lore

O jogador descobre que ali ocorreu uma grande batalha.

---

# Região 5 — Reino Esquecido

## Emoção

Fascínio.

## Atmosfera

Castelos.

Bibliotecas destruídas.

Praças vazias.

## Habitantes

Sobreviventes isolados.

## Criaturas

Cavaleiros Corrompidos.

Armaduras Vivas.

Magos.

## Mini-Boss

Capitão da Guarda.

## Boss

O Último Rei.

## Marco Visual

Castelo em ruínas.

## Brasa

Quinta Brasa Primordial.

## Lore

Grande revelação sobre os Guardiões.

---

# Região 6 — Picos Congelados

## Emoção

Solidão.

## Atmosfera

Neve.

Tempestades.

Ruínas preservadas pelo gelo.

## Habitantes

Monge solitário.

## Criaturas

Lobos.

Yeti.

Elementais de Gelo.

## Mini-Boss

Gigante Congelado.

## Boss

A Sentinela de Gelo.

## Marco Visual

Uma gigantesca estátua congelada de um Guardião.

## Brasa

Sexta Brasa Primordial.

## Lore

O jogador descobre como começou a Grande Ruína.

---

# Região 7 — Terras Cinzentas

## Emoção

Grandeza.

## Atmosfera

Terra queimada.

Montanhas rachadas.

Cinzas.

Esqueletos colossais.

## Habitantes

Nenhum.

## Criaturas

Dragões menores.

Gárgulas.

Bestas antigas.

## Mini-Boss

Wyvern Ancestral.

## Boss

Dragão Ancião.

## Marco Visual

O esqueleto de um dragão colossal atravessando um vale inteiro.

## Brasa

Sétima Brasa Primordial.

## Lore

O jogador entende que está chegando ao coração do continente.

---

# Região Final — Vulcão da Origem

## Emoção

Revelação.

## Atmosfera

Lava.

Ruínas.

Templos.

Pontes quebradas.

Grandes salões soterrados.

## Habitantes

Nenhum.

## Criaturas

Guardiões Corrompidos.

Criaturas Primordiais.

## Mini-Boss

O Último Guardião.

## Boss Final

A entidade conhecida apenas como:

- A Sombra
- O Sem Nome
- O Profanador

## Marco Visual

A antiga capital dos Guardiões emergindo entre rios de lava.

## Brasa

Última Brasa Primordial.

## Lore

Toda a verdade é revelada.

---

# Progressão Narrativa

Cada região responde uma pergunta.

Bosque
> O que está acontecendo?

Floresta
> Quem foram os Guardiões?

Montanhas
> O que eram as Brasas?

Pântano
> Como começou a guerra?

Reino
> Quem destruiu a cidade?

Picos
> Por que os Guardiões se sacrificaram?

Terras Cinzentas
> O que realmente existe no centro do continente?

Vulcão
> Quem é o Herdeiro da Chama?

---

# Regras do Continente

- Cada região deve possuir identidade visual própria.
- O jogador deve reconhecer imediatamente onde está.
- Sempre existe um marco visual dominante.
- Cada região revela uma parte da história.
- A dificuldade aumenta de forma gradual.
- As Brasas Primordiais representam o encerramento de cada grande capítulo.
- O continente deve parecer muito maior do que a área explorável.

---

## Status

**Aprovado — Versão 1.0**