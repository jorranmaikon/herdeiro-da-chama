"""
Pipeline de assets do Herdeiro da Chama.

REGRA DE OURO: a arte original só é REDUZIDA, uma única vez, e é exibida no jogo
em escala 1.0. Nunca reduzir e depois ampliar — foi isso que destruiu a qualidade
do personagem na primeira versão do projeto (411px -> 49px -> ampliado 2.6x).

Rode a partir da raiz do projeto:  python3 tools/build_assets.py
"""

import pathlib
import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

UPLOADS = pathlib.Path("/mnt/user-data/uploads")
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "assets"

# --- Spec técnica (espelha src/config/gameConfig.js) ---
TILE = 64
PLAYER_HEIGHT = 128          # 2 tiles — altura do personagem NA TELA
PLAYER_CELL = 224            # célula do spritesheet = tamanho de exibição
# 224 e não 160: os quadros de Ataque (rastro da espada) e Morte (corpo
# deitado) vazavam até 43px para a célula vizinha, fazendo aparecer pedaço de
# um quadro dentro de outro. A célula precisa comportar o quadro MAIS LARGO.
NPC_HEIGHT = 140             # NPC adulto, um pouco maior que o protagonista
NPC_CELL = 176


# ----------------------------------------------------------------------
# Utilidades
# ----------------------------------------------------------------------
def alpha_from_background(rgb, dark_bg=True, thresh=15, enclosed_limit=None):
    """Remove o fundo mantendo cores iguais ao fundo que estejam DENTRO do
    personagem (camisa escura, olhos claros, contorno). Só o que está conectado
    à borda da imagem é considerado fundo.

    enclosed_limit: se informado, áreas de cor-de-fundo CERCADAS pelo desenho
    (ex: o vão entre o braço e o corpo na corrida) também são removidas quando
    maiores que esse limite. Áreas menores são preservadas — são detalhes do
    desenho, como o brilho do olho.
    """
    if dark_bg:
        bg_like = np.all(rgb <= thresh, axis=2)
    else:
        bg_like = np.all(rgb >= 255 - thresh, axis=2)

    lbl, n = ndimage.label(bg_like)
    edges = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    edges.discard(0)
    bg = np.isin(lbl, list(edges))

    if enclosed_limit is not None:
        for i in range(1, n + 1):
            if i in edges:
                continue
            if (lbl == i).sum() > enclosed_limit:
                bg |= lbl == i

    return np.where(bg, 0, 255).astype(np.uint8)


def split_frames(path, dark_bg=True, gap=15, pad=4, enclosed_limit=None):
    """Separa os quadros de uma folha de animação em imagens RGBA recortadas."""
    rgb = np.array(Image.open(path).convert("RGB"))
    alpha = alpha_from_background(rgb, dark_bg, enclosed_limit=enclosed_limit)
    rgba = np.dstack([rgb, alpha])

    col_has = (alpha > 0).any(axis=0)
    groups, running = [], False
    for x in range(rgba.shape[1]):
        if col_has[x] and not running:
            start, running = x, True
        elif not col_has[x] and running:
            groups.append([start, x - 1])
            running = False
    if running:
        groups.append([start, rgba.shape[1] - 1])

    # une grupos colados (pedaços soltos do mesmo quadro)
    merged = [groups[0]]
    for s, e in groups[1:]:
        if s - merged[-1][1] <= gap:
            merged[-1][1] = e
        else:
            merged.append([s, e])

    frames = []
    for x0, x1 in merged:
        sub = rgba[:, x0:x1 + 1]
        ys, xs = np.where(sub[:, :, 3] > 0)
        y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, sub.shape[0])
        cx0, cx1 = max(xs.min() - pad, 0), min(xs.max() + pad, sub.shape[1])
        frames.append(sub[y0:y1, cx0:cx1])
    return frames


def head_metrics(frame_rgba):
    """Largura e centro horizontal da cabeça. É a métrica mais estável entre
    poses diferentes, usada pra igualar a escala das animações entre si."""
    m = frame_rgba[:, :, 3] > 0
    ys, xs = np.where(m)
    h = ys.max() - ys.min() + 1
    band = m[ys.min():ys.min() + max(1, int(h * 0.22))]
    widths, centers = [], []
    for row in band:
        nz = row.nonzero()[0]
        if len(nz):
            widths.append(nz.max() - nz.min() + 1)
            centers.append((nz.max() + nz.min()) / 2)
    return (
        int(np.percentile(widths, 90)) if widths else 1,
        float(np.median(centers)) if centers else frame_rgba.shape[1] / 2,
    )


# ----------------------------------------------------------------------
# Protagonista
# ----------------------------------------------------------------------
# Folhas de animação com FUNDO BRANCO.
#
# Importante: as versões com fundo preto NÃO servem. O contorno do personagem é
# quase preto, então o preenchimento a partir da borda vazava por dentro do
# contorno e comia pedaços dele (258px removidos em 157 pontos, deixando o
# sprite carcomido). Com fundo branco isso não acontece — o personagem quase
# não tem branco puro encostando na silhueta.
PLAYER_SHEETS = {
    "Idle": "c23925cc662510a804c74337e083d7c1f36c9192.png",
    "Correr": "d4ef6eaa760d065d90b16563d41056161a6505d8.png",
    "Pular": "a9557080f995b0a5c83c82a81692c4d2c123e9f3.png",
    "Ataque": "0b662ddf6661d4ca6fecc516127b16cc3dfc672c.png",
    "Morte": "2d704eb375a24ec274c2b74d2758246ee8ac7691.png",
}
PLAYER_ORDER = ["Idle", "Correr", "Pular", "Ataque", "Morte"]


def build_player():
    # enclosed_limit remove o vão entre braço e corpo (aparecia branco no jogo)
    # sem apagar detalhes pequenos como o brilho do olho.
    raw = {
        name: split_frames(UPLOADS / f, dark_bg=False, enclosed_limit=120)
        for name, f in PLAYER_SHEETS.items()
    }

    # 1) escala relativa: iguala a cabeça de todas as animações à do Idle
    idle_head = np.median([head_metrics(f)[0] for f in raw["Idle"]])
    rel = {}
    for name, frames in raw.items():
        heads = [head_metrics(f)[0] for f in frames]
        # na Morte os quadros deitados não dão medida confiável de cabeça
        sample = heads[:2] if name == "Morte" else heads
        rel[name] = idle_head / np.median(sample)

    # 2) escala absoluta: Idle em pé passa a ter PLAYER_HEIGHT px
    idle_h = np.median([f.shape[0] for f in raw["Idle"]])
    base = PLAYER_HEIGHT / idle_h

    sheet = Image.new("RGBA", (PLAYER_CELL * 4, PLAYER_CELL * len(PLAYER_ORDER)), (0, 0, 0, 0))
    for row, name in enumerate(PLAYER_ORDER):
        scale = rel[name] * base
        for col in range(4):
            frames = raw[name]
            frame = frames[col] if col < len(frames) else frames[-1]
            _, head_cx = head_metrics(frame)
            im = Image.fromarray(frame, "RGBA")
            im = im.resize(
                (max(1, round(im.width * scale)), max(1, round(im.height * scale))),
                Image.LANCZOS,
            )
            # centraliza pela CABEÇA (não pela caixa): a espada esticada no ataque
            # não empurra o corpo pro lado
            local_x = round(PLAYER_CELL / 2 - head_cx * scale)
            # trava: se o quadro ainda assim ultrapassar a célula, ele é puxado
            # para dentro em vez de invadir a célula vizinha
            local_x = max(0, min(local_x, PLAYER_CELL - im.width))
            x = col * PLAYER_CELL + local_x
            y = row * PLAYER_CELL + (PLAYER_CELL - im.height)  # pés na base
            sheet.alpha_composite(im, (x, y))

    sheet.save(OUT / "sprites" / "protagonista.png")
    print(f"  protagonista.png {sheet.size} | célula {PLAYER_CELL} | altura ~{PLAYER_HEIGHT}px")


# ----------------------------------------------------------------------
# Tiles
# ----------------------------------------------------------------------
def build_tiles():
    src = np.array(Image.open(UPLOADS / "9846876dc4896aabf845c7727b10641f3cd2b843.png").convert("RGB"))
    sat = src.max(axis=2).astype(int) - src.min(axis=2).astype(int)

    band = sat[153:402, :]
    colsat = (band > 40).sum(axis=0)
    runs, running = [], False
    for x in range(len(colsat)):
        if colsat[x] > 100 and not running:
            start, running = x, True
        elif colsat[x] <= 100 and running:
            runs.append((start, x - 1))
            running = False

    names = ["tile_grama", "tile_terra", None, "tile_transicao"]
    pad = 3
    for (x0, x1), name in zip(runs, names):
        if name is None:
            continue
        tile = src[153 + pad:402 - pad, x0 + pad:x1 - pad + 1]
        a = np.array(Image.fromarray(tile).resize((TILE, TILE), Image.LANCZOS))
        # grama e transição têm o topo vazado: o céu aparece entre as folhas
        if name in ("tile_grama", "tile_transicao"):
            white = (a.min(axis=2) > 225) & ((a.max(axis=2) - a.min(axis=2)) < 25)
            rgba = np.dstack([a, np.where(white, 0, 255).astype(np.uint8)])
        else:
            rgba = np.dstack([a, np.full(a.shape[:2], 255, np.uint8)])
        Image.fromarray(rgba, "RGBA").save(OUT / "tiles" / f"{name}.png")

    cam = np.array(Image.open(UPLOADS / "dcd54fca0664271a15c7fc95f963b288daf670fc.png").convert("RGB"))
    s = cam.max(axis=2).astype(int) - cam.min(axis=2).astype(int)
    ys, xs = np.where(s > 30)
    crop = cam[ys.min() + 3:ys.max() - 2, xs.min() + 3:xs.max() - 2]
    Image.fromarray(crop).resize((TILE, TILE), Image.LANCZOS).convert("RGBA").save(
        OUT / "tiles" / "tile_caminho.png"
    )
    print(f"  4 tiles de {TILE}x{TILE}px")


# ----------------------------------------------------------------------
# Parallax
# ----------------------------------------------------------------------
def make_seamless(im, fade=48):
    """Emenda invisível: corta nas colunas de menor densidade (vãos entre árvores)
    e aplica um cross-fade curto. Não usa espelhamento — ele criava um eixo de
    simetria visível."""
    a = np.array(im)
    h, w, _ = a.shape
    density = (a[:h // 2, :, 3] > 200).sum(axis=0)
    L = int(w * 0.02) + int(np.argmin(density[int(w * 0.02):int(w * 0.22)]))
    R = int(w * 0.78) + int(np.argmin(density[int(w * 0.78):int(w * 0.98)]))

    cut = a[:, L:R].astype(np.float32)
    cw = cut.shape[1]
    out = cut[:, :cw - fade].copy()
    tail = cut[:, cw - fade:]
    for i in range(fade):
        t = i / (fade - 1)
        A, B = out[:, i], tail[:, i]
        aA, aB = A[:, 3] / 255.0, B[:, 3] / 255.0
        alpha = aA * t + aB * (1 - t)
        rgb = A[:, :3] * aA[:, None] * t + B[:, :3] * aB[:, None] * (1 - t)
        out[:, i, :3] = np.clip(rgb / np.maximum(alpha, 1e-5)[:, None], 0, 255)
        out[:, i, 3] = np.clip(alpha * 255, 0, 255)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


PARALLAX = [
    # (arquivo original, nome, extensão da base em px)
    ("4935253e7b846c7ba6d03ff93949aff5fc68dc5e.png", "bg_ceu", 70),
    ("fc380d90aaee1d900b46ba4db77217307f55830c.png", "bg_colinas", 130),
    ("d53f91bb7dcee8c1ffcc147d3c664b87a5c1e7d2.png", "bg_arvores", 40),
]


def build_parallax():
    for fname, name, extend in PARALLAX:
        # As imagens de origem vêm com fundo BRANCO — sem remover, o céu do
        # jogo virava um bloco branco gigante.
        rgb = np.array(Image.open(UPLOADS / fname).convert("RGB"))
        # enclosed_limit baixo: nas camadas de cenário todo vão branco é fundo
        # (ex: buracos entre os galhos), não existe detalhe branco a preservar.
        alpha = alpha_from_background(rgb, dark_bg=False, thresh=25, enclosed_limit=8)

        # RECORTA ao conteúdo. As imagens originais têm margem branca enorme em
        # volta; sem recortar, a camada fica com centenas de px vazios no topo e
        # o preenchimento da base transforma tudo num bloco sólido gigante.
        ys, xs = np.where(alpha > 0)
        rgba = np.dstack([rgb, alpha])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

        im = Image.fromarray(rgba, "RGBA")
        im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
        a = np.array(im)

        # tapa o vão transparente abaixo da camada com a cor dominante da base,
        # senão sobra "buraco" no cenário
        tail = a[-14:]
        opaque = tail[:, :, 3] > 200
        fill = (
            np.median(tail[:, :, :3][opaque], axis=0).astype(np.uint8)
            if opaque.any()
            else np.array([60, 50, 35], np.uint8)
        )

        out = np.zeros((a.shape[0] + extend, a.shape[1], 4), np.uint8)
        out[: a.shape[0]] = a
        out[a.shape[0]:, :, :3] = fill
        out[a.shape[0]:, :, 3] = 255
        for x in range(a.shape[1]):
            col = np.where(a[:, x, 3] > 200)[0]
            if len(col):
                out[col.max():a.shape[0], x, :3] = fill
                out[col.max():a.shape[0], x, 3] = 255

        make_seamless(Image.fromarray(out, "RGBA")).save(OUT / "bg" / f"{name}.png")
    print("  3 camadas de parallax (emenda invisível)")


# ----------------------------------------------------------------------
# Props, UI e áudio
# ----------------------------------------------------------------------
def clean_white(path, thresh=200, erode=1):
    rgb = np.array(Image.open(path).convert("RGB"))
    white = np.all(rgb >= thresh, axis=2)
    lbl, n = ndimage.label(white)
    edges = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    edges.discard(0)
    bg = np.isin(lbl, list(edges))
    if erode:
        bg = ndimage.binary_dilation(bg, iterations=erode)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    ys, xs = np.where(alpha > 0)
    rgba = np.dstack([rgb, alpha])
    return Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")


def build_props():
    # árvore e moinho vêm na mesma folha
    marco = clean_white(UPLOADS / "3eb292f80a9c7b929c6923f9c4e17dbfc7dedefd.png")
    a = np.array(marco)
    col_has = (a[:, :, 3] > 0).any(axis=0)
    groups, running = [], False
    for x in range(a.shape[1]):
        if col_has[x] and not running:
            start, running = x, True
        elif not col_has[x] and running:
            groups.append((start, x - 1))
            running = False
    if running:
        groups.append((start, a.shape[1] - 1))

    for (x0, x1), (name, height) in zip(groups, [("arvore", 340), ("moinho", 300)]):
        sub = a[:, x0:x1 + 1]
        ys, xs = np.where(sub[:, :, 3] > 0)
        crop = Image.fromarray(sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")
        s = height / crop.height
        crop.resize((round(crop.width * s), height), Image.LANCZOS).save(
            OUT / "props" / f"{name}.png"
        )

    # cercas: 3 peças na mesma folha
    cerca = clean_white(UPLOADS / "78e5cd15b5bd8bc36e916fbac4c3d08950ce0c91.png")
    a = np.array(cerca)
    col_has = (a[:, :, 3] > 0).any(axis=0)
    groups, running = [], False
    for x in range(a.shape[1]):
        if col_has[x] and not running:
            start, running = x, True
        elif not col_has[x] and running:
            groups.append((start, x - 1))
            running = False
    if running:
        groups.append((start, a.shape[1] - 1))

    for (x0, x1), name in zip(groups, ["cerca", "cerca_poste_esq", "cerca_poste_dir"]):
        sub = a[:, x0:x1 + 1]
        ys, xs = np.where(sub[:, :, 3] > 0)
        crop = Image.fromarray(sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")
        s = 72 / crop.height
        crop.resize((round(crop.width * s), 72), Image.LANCZOS).save(
            OUT / "props" / f"{name}.png"
        )
    print("  árvore, moinho e 3 peças de cerca")


def build_ui():
    Image.open(UPLOADS / "cfa7bff786d5fea99da8695da729daf4affc078f.png").convert("RGB").resize(
        (1280, 720), Image.LANCZOS
    ).save(OUT / "ui" / "capa_menu.png")
    Image.open(UPLOADS / "845dcbae6e0fb80a1902fc95b8dc5fcd579d983b.png").convert("RGB").save(
        OUT / "ui" / "mapa_continente.png"
    )
    print("  capa do menu e mapa do continente")


if __name__ == "__main__":
    print("Gerando assets...")
    build_player()
    build_tiles()
    build_parallax()
    build_props()
    build_ui()
    print("Pronto. (o áudio é copiado à parte, já comprimido)")
