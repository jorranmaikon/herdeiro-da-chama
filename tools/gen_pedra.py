"""
Gera a pedra arremessada pelo Goblin Explorador.

Arte por código: é um objeto de 20px que gira no ar, e desenhar isso por
prompt custaria uma geração inteira para menos detalhe do que cabe num
punhado de pixels. As cores são amostradas das pedrinhas do próprio tile de
terreno, para não introduzir um cinza novo na paleta do bioma.

    python3 tools/gen_pedra.py
"""

import pathlib

import numpy as np
from PIL import Image, ImageDraw

RAIZ = pathlib.Path(__file__).resolve().parent.parent
TILES = RAIZ / "public" / "assets" / "tiles" / "bosque"
SAIDA = RAIZ / "public" / "assets" / "props" / "bosque"

LADO = 20


def amostrar():
    """Cinza das pedrinhas do tile de terreno: dessaturado e mais claro que a terra."""
    a = np.array(Image.open(TILES / "tile_fill_0.png").convert("RGBA"))
    rgb = a[:, :, :3].astype(int)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    cinza = (sat < 26) & (a[:, :, 3] > 0) & (rgb.mean(axis=2) > 70)
    px = rgb[cinza] if cinza.any() else rgb.reshape(-1, 3)
    return (
        tuple(int(v) for v in np.percentile(px, 70, axis=0)),
        tuple(int(v) for v in np.percentile(px, 35, axis=0)),
        tuple(int(v) for v in np.percentile(px, 10, axis=0)),
    )


def montar():
    claro, medio, escuro = amostrar()

    im = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # Silhueta irregular, não um círculo: uma pedra redonda demais lê como
    # projétil mágico, e magia é rara neste mundo.
    d.polygon([(4, 2), (13, 1), (18, 7), (17, 14), (10, 18), (3, 15), (1, 8)],
              fill=medio, outline=escuro)
    d.polygon([(6, 4), (12, 3), (15, 7), (11, 9), (6, 8)], fill=claro)
    d.point([(5, 12), (12, 13), (9, 15)], fill=escuro)

    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / "pedra.png"
    im.save(destino)
    print(f"{destino.relative_to(RAIZ)}: {LADO}x{LADO}px")


if __name__ == "__main__":
    montar()
