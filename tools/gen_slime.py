"""
Gera o sprite sheet do Slime (inimigo Comum do Bosque Esmeralda).

ARTE PROVISÓRIA, desenhada por código. Existe para destravar a implementação da
Fase 1 — a arte definitiva sai do prompt em PROMPTS_INIMIGOS_BOSQUE.md e entra
no lugar sem exigir mudança nenhuma no código: mesmo nome de arquivo, mesma
grade, mesmas dimensões de célula.

A folha é desenhada num grid LÓGICO de 32x32 por quadro e ampliada por vizinho
mais próximo. Isso é o oposto da regra de ouro do build_assets.py — e é
proposital: aqui não há arte de origem em alta resolução sendo degradada, o
pixel lógico É a unidade de desenho. Ampliar por NEAREST a partir dele preserva
a borda dura do pixel art em vez de destruí-la.

    python3 tools/gen_slime.py
"""

import pathlib
from PIL import Image, ImageDraw

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "public" / "assets" / "sprites" / "bosque"

LOGICO = 32          # resolução lógica de uma célula
ESCALA = 4           # 32 * 4 = 128px por célula em tela
COLUNAS, LINHAS = 4, 4

# Paleta: mesma família de verde do terreno do bioma, um pouco mais saturada,
# para o Slime se destacar do chão sem sair da paleta (07, Seção 2).
CONTORNO = (24, 40, 22)
CORPO = (86, 138, 66)
CORPO_CLARO = (122, 172, 94)
CORPO_ESCURO = (58, 100, 48)
BRILHO = (196, 224, 168)
OLHO = (20, 30, 18)
DETRITO = (108, 82, 50)
FLASH = (232, 244, 214)


def gota(d, cx, base, largura, altura, cor, contorno=True):
    """Desenha uma gota assentada: mais larga na base que no topo.

    Três elipses empilhadas em vez de uma só. Uma elipse pura lê como bola;
    a base achatada é o que faz o corpo parecer apoiado no chão e com peso.
    """
    topo = base - altura
    d.ellipse([cx - largura / 2, topo, cx + largura / 2, base], fill=cor)
    d.ellipse([cx - largura / 2, base - altura * 0.45, cx + largura / 2, base],
              fill=cor)
    if contorno:
        d.ellipse([cx - largura / 2, topo, cx + largura / 2, base],
                  outline=CONTORNO)
        d.ellipse([cx - largura / 2, base - altura * 0.45, cx + largura / 2, base],
                  outline=CONTORNO)


def corpo(d, cx, base, largura, altura, tom=None, olhos=True, detritos=True):
    cor = tom or CORPO
    gota(d, cx, base, largura, altura, cor)

    if tom is None:
        # Sombra na base e brilho no alto: dois tons, sem gradiente.
        d.ellipse([cx - largura / 2 + 1, base - altura * 0.30,
                   cx + largura / 2 - 1, base - 1], fill=CORPO_ESCURO)
        d.ellipse([cx - largura * 0.36, base - altura * 0.94,
                   cx - largura * 0.02, base - altura * 0.62], fill=CORPO_CLARO)
        # Reflexo fixo no alto — comunica que ele é úmido.
        d.ellipse([cx - largura * 0.30, base - altura * 0.88,
                   cx - largura * 0.12, base - altura * 0.74], fill=BRILHO)

    if detritos:
        # Folhas e gravetos em suspensão: ele absorveu o chão da floresta.
        # Poucos e baixos, longe dos olhos — espalhados na altura do rosto,
        # a linha de detritos lia como uma boca.
        for dx, dy, w, h in ((-0.28, 0.18, 2, 1), (-0.06, 0.26, 1, 2)):
            x = cx + largura * dx
            y = base - altura * dy
            d.rectangle([x, y, x + w, y + h], fill=DETRITO)

    if olhos:
        # Dois olhos escuros simples, sem brilho e sem expressão. Voltados
        # para a direita: a cena espelha o sprite quando ele anda para a
        # esquerda, então uma direção só basta.
        #
        # Desenhados DEPOIS do brilho e com 2x3 px: com 1px de largura eles
        # sumiam contra o corpo e o Slime ficava sem leitura de frente.
        oy = base - altura * 0.60
        for ox in (0.06, 0.28):
            x = cx + largura * ox
            d.rectangle([x, oy, x + 1, oy + 2], fill=OLHO)


def quadro(desenhar):
    im = Image.new("RGBA", (LOGICO, LOGICO), (0, 0, 0, 0))
    desenhar(ImageDraw.Draw(im))
    return im


def quadros_parado():
    """Respiração lenta: comprime e relaxa sem sair do lugar."""
    for larg, alt in ((19, 13), (20, 12), (19, 13), (18, 14)):
        yield quadro(lambda d, w=larg, h=alt: corpo(d, 16, 29, w, h))


def quadros_pulo():
    """Agacha, estica no ar, arredonda no ápice, espalha ao aterrissar."""
    yield quadro(lambda d: corpo(d, 16, 29, 22, 9))          # agachado
    yield quadro(lambda d: corpo(d, 16, 26, 15, 18))         # esticado
    yield quadro(lambda d: corpo(d, 16, 22, 18, 15))         # no ar
    yield quadro(lambda d: corpo(d, 16, 29, 23, 10))         # aterrissando


def quadros_dano():
    """Recua e deforma. Um quadro em tom claro marca o impacto."""
    yield quadro(lambda d: corpo(d, 14, 29, 21, 11, tom=FLASH, detritos=False))
    yield quadro(lambda d: corpo(d, 13, 29, 22, 10))
    yield quadro(lambda d: corpo(d, 15, 29, 19, 13))
    yield quadro(lambda d: corpo(d, 16, 29, 19, 13))


def quadros_morte():
    """Desmancha achatando até virar poça. O último quadro é quase nada."""
    yield quadro(lambda d: corpo(d, 16, 29, 21, 11))
    yield quadro(lambda d: corpo(d, 16, 29, 24, 7, olhos=False))
    yield quadro(lambda d: corpo(d, 16, 29, 26, 4, olhos=False, detritos=False))
    yield quadro(lambda d: gota(d, 16, 29, 22, 2, CORPO_ESCURO))


def montar():
    SAIDA.mkdir(parents=True, exist_ok=True)
    celula = LOGICO * ESCALA
    folha = Image.new("RGBA", (celula * COLUNAS, celula * LINHAS), (0, 0, 0, 0))

    linhas = [quadros_parado(), quadros_pulo(), quadros_dano(), quadros_morte()]
    for y, geradora in enumerate(linhas):
        for x, im in enumerate(geradora):
            ampliada = im.resize((celula, celula), Image.NEAREST)
            folha.alpha_composite(ampliada, (x * celula, y * celula))

    destino = SAIDA / "slime.png"
    folha.save(destino)
    print(f"{destino.relative_to(RAIZ)}: {folha.width}x{folha.height}px "
          f"({COLUNAS}x{LINHAS} células de {celula}px)")


if __name__ == "__main__":
    montar()
