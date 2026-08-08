"""
Pipeline de assets do Herdeiro da Chama.

REGRA DE OURO: a arte original só é REDUZIDA, uma única vez, e é exibida no jogo
em escala 1.0. Nunca reduzir e depois ampliar — foi isso que destruiu a qualidade
do personagem na primeira versão do projeto (411px -> 49px -> ampliado 2.6x).
A função `to_height` levanta erro se alguém tentar ampliar.

As imagens de origem chegam sempre como RGB, SEM canal alfa (a transparência é
achatada antes, virando preto). Por isso toda arte é gerada com FUNDO BRANCO e a
transparência é reconstruída aqui.

Rode a partir da raiz do projeto:  python3 tools/build_assets.py
"""

import pathlib
import numpy as np
from PIL import Image
from scipy import ndimage

UPLOADS = pathlib.Path("/mnt/user-data/uploads")
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "assets"

# --- Spec técnica (espelha src/config/gameConfig.js) ---
TILE = 64
PLAYER_HEIGHT = 128          # 2 tiles — altura do personagem NA TELA
PLAYER_CELL = 224            # célula do spritesheet = tamanho de exibição


# ----------------------------------------------------------------------
# Utilidades
# ----------------------------------------------------------------------
def alpha_from_white(rgb, thresh=40, enclosed_limit=None, defringe=True):
    """Fundo branco -> canal alfa.

    defringe: os pixels de anti-aliasing na borda ficam entre o branco e a cor
    do desenho. Não batem no limiar e sobrariam como um halo claro em volta do
    sprite — por isso a máscara de fundo é expandida 1px para comê-los.

    enclosed_limit: áreas brancas CERCADAS pelo desenho (ex: o vão entre as
    travessas de uma cerca) também viram transparência quando maiores que esse
    limite. Áreas menores são preservadas — são detalhes, como o brilho do olho.
    Passar None preserva TODOS os vãos internos.
    """
    ref = np.array((255, 255, 255), dtype=np.int16)
    dist = np.abs(rgb.astype(np.int16) - ref).max(axis=2)
    bg_like = dist <= thresh

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

    if defringe:
        bg = ndimage.binary_dilation(bg, iterations=1)

    return np.where(bg, 0, 255).astype(np.uint8)


def clean(path, enclosed_limit=200, drop_pale_shadow=False):
    """Remove o fundo branco de uma arte solta e recorta ao conteúdo.

    drop_pale_shadow: alguns geradores desenham uma elipse de sombra BEGE sob o
    objeto. Ela não é branca, então escapa do limiar acima e sobrava como uma
    mancha clara em volta do sprite. Aqui o recorte é feito por cor: sobra só o
    que é saturado (a arte) ou escuro (o contorno).
    """
    rgb = np.array(Image.open(path).convert("RGB"))
    alpha = alpha_from_white(rgb, enclosed_limit=enclosed_limit)

    if drop_pale_shadow:
        v = rgb.astype(int)
        sat = v.max(axis=2) - v.min(axis=2)
        lum = v.mean(axis=2)
        # A elipse é clara e quase acinzentada; a arte é verde/marrom saturada
        # ou escura no contorno. Só o que for claro E dessaturado cai fora.
        sombra = (lum > 145) & (sat < 48)
        alpha = np.where(sombra, 0, alpha)

    ys, xs = np.where(alpha > 0)
    rgba = np.dstack([rgb, alpha])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(rgba, "RGBA")


def to_height(im, h):
    """Reduz para a altura alvo preservando a proporção.

    Levanta erro em caso de ampliação — a regra de ouro é validada aqui, não
    confiada à disciplina de quem chama.
    """
    if h > im.height:
        raise ValueError(
            f"AMPLIACAO PROIBIDA ({im.height}px -> {h}px). "
            "Gere a arte de origem maior em vez de ampliar aqui."
        )
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


def col_groups(a, min_gap=20):
    """Agrupa colunas com conteúdo — separa objetos numa mesma folha de arte."""
    has = (a[:, :, 3] > 0).any(axis=0)
    groups, running = [], False
    for x in range(a.shape[1]):
        if has[x] and not running:
            start, running = x, True
        elif not has[x] and running:
            groups.append([start, x - 1])
            running = False
    if running:
        groups.append([start, a.shape[1] - 1])

    merged = [groups[0]]
    for s, e in groups[1:]:
        if s - merged[-1][1] <= min_gap:
            merged[-1][1] = e
        else:
            merged.append([s, e])
    return merged


def crop_group(a, x0, x1):
    sub = a[:, x0:x1 + 1]
    ys, xs = np.where(sub[:, :, 3] > 0)
    return Image.fromarray(sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")


def despeckle_white(rgba, thresh=200):
    """Apaga pixels quase-brancos SOLTOS no meio de uma arte opaca.

    São vãos minúsculos entre folhas que escapam do recorte de fundo (pequenos
    demais para o enclosed_limit) e aparecem como pontinhos brancos sobre a
    copa. Cada um recebe a cor mediana da vizinhança.
    """
    rgb = rgba[:, :, :3].astype(int)
    solto = (rgb.min(axis=2) > thresh) & (rgba[:, :, 3] > 0)
    if not solto.any():
        return rgba

    out = rgba.copy()
    ys, xs = np.where(solto)
    h, w = solto.shape
    for y, x in zip(ys, xs):
        y0, y1 = max(0, y - 3), min(h, y + 4)
        x0, x1 = max(0, x - 3), min(w, x + 4)
        viz = rgba[y0:y1, x0:x1]
        bom = (viz[:, :, 3] > 0) & (viz[:, :, :3].astype(int).min(axis=2) <= thresh)
        if bom.any():
            out[y, x, :3] = np.median(viz[:, :, :3][bom], axis=0).astype(np.uint8)
    return out


def seam_fix(a, fade=10):
    """Cross-fade horizontal nas bordas para um recorte fechar consigo mesmo.

    Usado nos tiles de chão: a fatia de terreno de origem é tileável como um
    todo, mas um recorte arbitrário de 64px dela não é.
    """
    a = a.astype(np.float32)
    w = a.shape[1]
    out = a.copy()
    for i in range(fade):
        t = i / (fade - 1) if fade > 1 else 1.0
        out[:, i] = a[:, i] * t + a[:, w - fade + i] * (1 - t)
    return np.clip(out, 0, 255).astype(np.uint8)


# ----------------------------------------------------------------------
# Arquivos de origem
# ----------------------------------------------------------------------
SRC = {
    "moinho":         "5eeaf215761f0ae1a7f968436af1d0d81c83cc8f.png",  # 3 variações
    "arvore":         "e08ea593ae41d2888aaf190a74f13c799bbee3cb.png",
    "casa_taipa":     "40e1e4be0773400a846e3469ada11c48c7a6ddae.png",
    "casa_madeira":   "c30a7e92e3fc805f5eb311ced843bc3b40a90301.png",
    "terreno":        "17c8393681e97a78b05cdab69848874b4beaf919.png",
    "plataforma":     "0a71cda675f2520336a1f8526375b4f3db24efb2.png",
    "cerca":          "314767a1fe66d1858716ce276dfeee1be0fa8b63.png",
    "poco":           "8a3b1400da2a915418e10ed5b2f7bfc77bb18ba4.png",
    "barril_caixa":   "f1b3dca4614667a5f8f71de2bb6446d3030c0793.png",
    "barraca":        "a77e62905e54a42864cab725d8d7424ba7c4b92c.png",
    "forja":          "e5d0a6dcd9fbf635f1cd1c921dd605d9a5773f79.png",  # bigorna + forja
    "arbusto":        "267b1064341e9d31db20b9ef2692f049435548dc.png",
    "alvo_treino":    "b4532bca517868052399311872e0fa69cbd47d2b.png",
    "retrato_anciao": "8d346ed9c927c96f6dbd96d083736bc81b33c651.png",
    "icones":         "9142f4b57d0622b390d94b9b5f12d33fb1762fa3.png",
    "cronica_01":     "059e23fb34a5471bf16ef2698cb9c76172cf6f4d.png",
    "cronica_02":     "279bf8ab41249c814bfaeaa346011de471da56a4.png",
}

# Altura de exibição de cada prop, em px. Derivada do TILE de 64 e da altura do
# personagem (128px = 2 tiles), para que a escala relativa faça sentido em tela.
SIMPLE_PROPS = {
    "arvore": 512,        # 8 tiles — marco visual, o mais alto da vila
    "casa_taipa": 256,    # 4 tiles
    "casa_madeira": 256,
    "barraca": 192,       # 3 tiles
    "poco": 160,
    "alvo_treino": 128,   # mesma altura do personagem
    "arbusto": 64,        # 1 tile
}
MOINHO_HEIGHT = 384       # 6 tiles — marco visual
CERCA_HEIGHT = 96


# ----------------------------------------------------------------------
# Props de cenário
# ----------------------------------------------------------------------
def build_props():
    # arbusto e poço vieram com a elipse de sombra bege do gerador
    PALE_SHADOW = {"arbusto", "poco"}
    for name, height in SIMPLE_PROPS.items():
        im = clean(UPLOADS / SRC[name], drop_pale_shadow=name in PALE_SHADOW)
        to_height(im, height).save(OUT / "props" / f"{name}.png")

    # Moinho: a folha traz 3 variações; a 1ª é a canônica (única com porta na
    # base de pedra e telhado cônico escuro, conforme aprovado).
    a = np.array(clean(UPLOADS / SRC["moinho"]))
    x0, x1 = col_groups(a)[0]
    to_height(crop_group(a, x0, x1), MOINHO_HEIGHT).save(OUT / "props" / "moinho.png")

    # Cerca: repete lado a lado, então a largura NÃO é recortada — as travessas
    # encostam de propósito nas bordas para a emenda fechar.
    # enclosed_limit=None preserva os vãos entre as travessas.
    rgb = np.array(Image.open(UPLOADS / SRC["cerca"]).convert("RGB"))
    alpha = alpha_from_white(rgb, enclosed_limit=None)
    ys, _ = np.where(alpha > 0)
    rgba = np.dstack([rgb, alpha])[ys.min():ys.max() + 1, :]
    to_height(Image.fromarray(rgba, "RGBA"), CERCA_HEIGHT).save(
        OUT / "props" / "cerca.png"
    )

    # Pares na mesma folha: ambos escalados pelo MESMO fator, senão a relação de
    # tamanho entre os dois objetos se perde (a bigorna sairia do tamanho da forja).
    _build_pair("barril_caixa", ["barril", "caixa"], ref=0, ref_height=96)
    _build_pair("forja", ["bigorna", "forja"], ref=1, ref_height=160)

    print(f"  {len(SIMPLE_PROPS) + 6} props de cenário")


def _build_pair(src_key, names, ref, ref_height):
    a = np.array(clean(UPLOADS / SRC[src_key]))
    crops = [crop_group(a, x0, x1) for x0, x1 in col_groups(a)]
    scale = ref_height / crops[ref].height
    for c, n in zip(crops, names):
        size = (max(1, round(c.width * scale)), max(1, round(c.height * scale)))
        c.resize(size, Image.LANCZOS).save(OUT / "props" / f"{n}.png")


# ----------------------------------------------------------------------
# Tiles de chão
# ----------------------------------------------------------------------
# Três variações de cada tile, recortadas de janelas distantes da mesma fatia de
# terreno. Com uma variação só, a mesma pedrinha reaparece a cada 64px e a
# repetição fica óbvia; alternando três, o chão parece contínuo.
TILE_WINDOWS = [120, 420, 720]


def build_tiles():
    rgb = np.array(Image.open(UPLOADS / SRC["terreno"]).convert("RGB"))
    nonwhite = np.abs(rgb.astype(int) - 255).max(axis=2) > 40
    top = int(np.argmax(nonwhite.sum(axis=1) > 50))
    crop = rgb[top:, :]

    # Normaliza para 4 tiles de altura. É REDUÇÃO (268 -> 256).
    im = Image.fromarray(crop).resize(
        (round(crop.shape[1] * TILE * 4 / crop.shape[0]), TILE * 4), Image.LANCZOS
    )
    a = np.array(im)

    for i, x in enumerate(TILE_WINDOWS):
        # topo = grama + primeira camada de terra
        topo = seam_fix(a[0:TILE, x:x + TILE])
        # A grama tem as pontas das folhas vazadas: o branco entre elas vira
        # transparência, senão aparece um bloco branco acima do chão.
        # Limiar mais generoso: com 225 sobrava uma franja clara serrilhada
        # acima das folhas, visivel contra o ceu.
        white = (topo.min(axis=2) > 198) & ((topo.max(axis=2) - topo.min(axis=2)) < 34)
        Image.fromarray(
            np.dstack([topo, np.where(white, 0, 255).astype(np.uint8)]), "RGBA"
        ).save(OUT / "tiles" / f"tile_topo_{i}.png")

        # fill = terra do meio, a faixa mais neutra
        fill = seam_fix(a[TILE * 2:TILE * 3, x:x + TILE])
        Image.fromarray(
            np.dstack([fill, np.full(fill.shape[:2], 255, np.uint8)]), "RGBA"
        ).save(OUT / "tiles" / f"tile_fill_{i}.png")

    # Plataforma suspensa: base acabada, repete na horizontal.
    rgb = np.array(Image.open(UPLOADS / SRC["plataforma"]).convert("RGB"))
    alpha = alpha_from_white(rgb, enclosed_limit=8)
    ys, xs = np.where(alpha > 0)
    rgba = np.dstack([rgb, alpha])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    to_height(Image.fromarray(rgba, "RGBA"), TILE * 2).save(
        OUT / "props" / "plataforma.png"
    )

    print(f"  {len(TILE_WINDOWS) * 2} tiles de {TILE}x{TILE}px + plataforma")


# ----------------------------------------------------------------------
# Parallax
# ----------------------------------------------------------------------
PARALLAX_SRC = {
    "bg_ceu":     "9574393c9ccc262c968e93eb3300ac1c8d63f3c8.png",
    "bg_colinas": "212ee489b1e389ccb3c044384f73d8857cc73848.png",
    "bg_arvores": "194566832edf06813289a9a410c2cf51eca24005.png",
}

# Altura do horizonte dentro da imagem do céu, em px de um canvas de 720.
HORIZON_Y = 560

# Quantos px de cor sólida acrescentar abaixo de cada camada. Sem isso, ao
# olhar por dentro de um vão do chão, via-se o céu por baixo das árvores e elas
# pareciam flutuar.
PARALLAX_SKIRT = {"bg_colinas": 200, "bg_arvores": 260}


def _clone_over_stamp(rgb, cy=270, cx=955, half=42, src_dx=-260):
    """Cobre o carimbo em estrela que o gerador aplica sempre no mesmo ponto.
    Clonagem de um bloco vizinho — inpainting por mediana borrava a copa."""
    out = rgb.copy()
    out[cy - half:cy + half, cx - half:cx + half] = \
        rgb[cy - half:cy + half, cx - half + src_dx:cx + half + src_dx]
    return out


def build_parallax():
    # Céu: opaco e do tamanho do canvas. Estende com a cor da própria banda
    # de topo e de base, em vez de ampliar a arte.
    rgb = _clone_over_stamp(
        np.array(Image.open(UPLOADS / PARALLAX_SRC["bg_ceu"]).convert("RGB"))
    )
    top = np.median(rgb[0:3], axis=(0, 1)).astype(np.uint8)
    bot = np.median(rgb[-3:], axis=(0, 1)).astype(np.uint8)
    out = np.zeros((720, rgb.shape[1], 3), np.uint8)
    y0 = HORIZON_Y - rgb.shape[0]
    out[:y0], out[y0:HORIZON_Y], out[HORIZON_Y:] = top, rgb, bot
    Image.fromarray(out).convert("RGBA").save(OUT / "bg" / "bg_ceu.png")

    for name in ["bg_colinas", "bg_arvores"]:
        rgb = _clone_over_stamp(
            np.array(Image.open(UPLOADS / PARALLAX_SRC[name]).convert("RGB"))
        )
        # enclosed_limit baixo: nas camadas de cenario todo vao branco cercado
        # pelo desenho e buraco de fundo (entre copas), nao detalhe a preservar.
        # Sem isso sobravam pontinhos brancos espalhados pela treeline.
        alpha = alpha_from_white(rgb, enclosed_limit=6)
        ys, _ = np.where(alpha > 0)
        rgba = np.dstack([rgb, alpha])[ys.min():ys.max() + 1, :]

        # "Saia" abaixo da camada, para ela nunca terminar no ar — sem isso,
        # ao olhar por dentro de um vão do chão via-se o céu e as árvores
        # pareciam flutuar.
        #
        # A saia é de cor ÚNICA, não do prolongamento de cada coluna: esticar
        # coluna a coluna transformava os troncos em listras verticais. Uma
        # faixa chapada lê como sombra sob a mata.
        skirt = PARALLAX_SKIRT[name]
        h, w, _ = rgba.shape
        base = rgba[max(0, h - 12):h]
        opaco = base[:, :, 3] > 200
        fill = (np.median(base[:, :, :3][opaco], axis=0).astype(int)
                if opaco.any() else np.array([60, 80, 55]))
        fill = np.clip(fill * 0.82, 0, 255).astype(np.uint8)  # um tom mais escuro

        ext = np.zeros((h + skirt, w, 4), np.uint8)
        ext[:h] = despeckle_white(rgba)
        ext[h:, :, :3] = fill
        ext[h:, :, 3] = 255
        # tapa também os vãos transparentes acima da linha de base
        for x in range(w):
            col = np.where(rgba[:, x, 3] > 200)[0]
            if len(col):
                ext[col.max():h, x, :3] = fill
                ext[col.max():h, x, 3] = 255
        Image.fromarray(ext, "RGBA").save(OUT / "bg" / f"{name}.png")

    print("  3 camadas de parallax (com saia de base)")


# ----------------------------------------------------------------------
# UI, NPCs e Crônicas
# ----------------------------------------------------------------------
ICON_NAMES = ["icone_checkpoint", "icone_npc", "icone_saida", "icone_bloqueado"]
ICON_SIZE = 48


def _fit(im, size, anchor_bottom=False):
    """Encaixa numa tela quadrada sem distorcer e sem ampliar."""
    s = size / max(im.size)
    r = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))),
                  Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    y = size - r.height if anchor_bottom else (size - r.height) // 2
    canvas.alpha_composite(r, ((size - r.width) // 2, y))
    return canvas


def build_ui_and_narrative():
    # Ícones: a folha veio com o nome escrito abaixo de cada um (o gerador
    # ignorou a proibição de texto). O corte descarta essa faixa.
    rgb = np.array(Image.open(UPLOADS / SRC["icones"]).convert("RGB"))
    icons = rgb[35:208, :]
    a = np.dstack([icons, alpha_from_white(icons, enclosed_limit=None)])
    for (x0, x1), name in zip(col_groups(a, min_gap=15), ICON_NAMES):
        _fit(crop_group(a, x0, x1), ICON_SIZE).save(
            OUT / "ui" / "icons" / f"{name}.png"
        )

    # Retrato ancorado na base: o busto encosta no rodapé da caixa de diálogo.
    _fit(clean(UPLOADS / SRC["retrato_anciao"], enclosed_limit=300), 256,
         anchor_bottom=True).save(OUT / "npcs" / "retrato_anciao.png")

    # Crônicas: ilustração de fundo inteiro, sem recorte nem transparência.
    for key, name in [("cronica_01", "cronica_vila_01"),
                      ("cronica_02", "cronica_vila_02")]:
        Image.open(UPLOADS / SRC[key]).convert("RGB").save(
            OUT / "cronicas" / f"{name}.png"
        )

    print(f"  {len(ICON_NAMES)} ícones, 1 retrato, 2 Crônicas")


if __name__ == "__main__":
    print("Gerando assets da Vila Inicial...")
    for sub in ["props", "tiles", "bg", "ui/icons", "npcs", "cronicas"]:
        (OUT / sub).mkdir(parents=True, exist_ok=True)
    build_props()
    build_tiles()
    build_parallax()
    build_ui_and_narrative()
    print("Pronto.")
    print()
    print("NOTA: o spritesheet do protagonista não é gerado aqui — as folhas de")
    print("origem são de sessões anteriores e não estão mais em UPLOADS.")
