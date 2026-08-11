"""
Gera a folha-navalha, projétil do Guardião da Floresta.

Arte por código pelo mesmo motivo da pedra do Goblin: é um objeto de 26px que
gira no ar, e um prompt inteiro renderia menos detalhe do que cabe nesses
pixels. As cores saem da copa do próprio bioma, para não entrar um verde novo
na paleta.

    python3 tools/gen_folha.py
"""

import pathlib

import numpy as np
from PIL import Image, ImageDraw

RAIZ = pathlib.Path(__file__).resolve().parent.parent
BG = RAIZ / "public" / "assets" / "bg" / "bosque"
SAIDA = RAIZ / "public" / "assets" / "props" / "bosque"

LARGURA, ALTURA = 30, 14


def amostrar():
    """Verdes da copa: o escuro da massa e o claro das folhas que pegam luz."""
    a = np.array(Image.open(BG / "bg_copa.png").convert("RGBA"))
    rgb = a[:, :, :3].astype(int)
    verde = ((rgb[:, :, 1] > rgb[:, :, 0] + 10)
             & (rgb[:, :, 1] > rgb[:, :, 2] + 10)
             & (a[:, :, 3] > 0))
    px = rgb[verde]
    return (
        tuple(int(v) for v in np.percentile(px, 60, axis=0)),
        tuple(int(v) for v in np.percentile(px, 20, axis=0)),
    )


def montar():
    claro, escuro = amostrar()

    im = Image.new("RGBA", (LARGURA, ALTURA), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # Lâmina afilada nas duas pontas: a silhueta precisa dizer "corta" mesmo a
    # 26px, e uma folha arredondada leria como fruta.
    d.polygon([(0, 7), (9, 1), (21, 0), (29, 6), (20, 12), (8, 13)], fill=escuro)
    d.polygon([(4, 7), (11, 3), (20, 3), (25, 6), (18, 10), (10, 10)], fill=claro)
    d.line([(3, 7), (26, 6)], fill=escuro)

    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / "folha_navalha.png"
    im.save(destino)
    print(f"{destino.relative_to(RAIZ)}: {LARGURA}x{ALTURA}px")


if __name__ == "__main__":
    montar()
