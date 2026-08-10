"""
Gera a borda de grama que pende sobre a quina de um degrau.

Sem ela o terreno termina numa linha vertical perfeitamente reta, e o degrau lê
como um bloco colado por cima do cenário em vez de um pedaço de chão. O
problema não é a cor nem o contorno — é a regularidade da silhueta. Alguns
tufos de grama e raízes transbordando para fora quebram a reta e o corte
desaparece.

As cores são AMOSTRADAS dos tiles já prontos, nunca escolhidas à mão: qualquer
verde novo, por mais próximo que pareça, denunciaria a peça como sendo de outra
origem.

    python3 tools/gen_borda.py
"""

import pathlib

import numpy as np
from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent
TILES = RAIZ / "public" / "assets" / "tiles" / "bosque"
SAIDA = RAIZ / "public" / "assets" / "props" / "bosque"

ALTURA = 46   # comprimento da fatia de grama deitada sobre a quina


def montar():
    """Recorta uma fatia da grama do próprio tile e a deita sobre a quina.

    A primeira versão desenhava tufos do zero, com cores amostradas. Saiu um
    bloco verde de tufos retangulares — pior que o problema original, porque
    forma geométrica é justamente o que denuncia recorte.

    Aqui não se desenha nada: pega-se uma fatia da faixa de grama do tile de
    superfície, que já tem silhueta irregular de folha desenhada à mão, e
    gira-se 90 graus. As pontas passam a apontar para fora da quina, como
    grama pendendo sobre o vazio. Mesma arte, mesma paleta, mesma mão.
    """
    # As três variações empilhadas: uma franja só tem 8px de espessura e mal
    # se nota. Somadas, dão uma cortina densa o bastante para quebrar a
    # vertical, e ainda variam a silhueta entre si.
    variantes = [np.array(Image.open(TILES / f"tile_topo_{i}.png").convert("RGBA"))
                 for i in range(3)]
    topo = np.vstack(variantes)

    # Só a FRANJA interessa: as linhas do topo em que há pixel opaco E pixel
    # transparente na mesma altura. É exatamente onde a ponta das folhas
    # recorta o vazio — e é essa silhueta irregular que queremos deitar sobre
    # a quina.
    #
    # Pegar "onde há verde" trazia junto a terra logo abaixo da grama, e a
    # peça saía como um retângulo de terra flutuando.
    opaco = topo[:, :, 3] > 0
    franja = np.where(opaco.any(axis=1) & ~opaco.all(axis=1))[0]
    faixa = topo[franja, :]

    # Uma fatia central: as extremidades do tile são feitas para emendar com o
    # vizinho e têm silhueta mais reta.
    largura = min(ALTURA, faixa.shape[1] - 8)
    inicio = (faixa.shape[1] - largura) // 2
    fatia = faixa[:, inicio:inicio + largura]

    # Girar 90 graus deita a grama: o que era a ponta das folhas, voltada para
    # cima, passa a apontar para fora da quina.
    im = Image.fromarray(fatia, "RGBA").rotate(-90, expand=True)

    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / "borda_grama.png"
    im.save(destino)
    print(f"{destino.relative_to(RAIZ)}: {im.width}x{im.height}px")


if __name__ == "__main__":
    montar()
