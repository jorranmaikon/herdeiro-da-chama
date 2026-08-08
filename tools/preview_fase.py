"""
Monta uma imagem da fase inteira, para validar composição ANTES de codar.

Lê o mesmo layout que a cena do Phaser usa, então o que aparece aqui é o que
aparece no jogo. Serve para pegar prop sobreposto, edifício flutuando na borda
de um vão e cerca atravessando abismo — coisas que só se veem com tudo junto.

    python3 tools/preview_fase.py
"""

import pathlib
import re
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "public" / "assets"
OUT = ROOT / "tools" / "_preview"

TILE = 64
GAME_HEIGHT = 720
GROUND_INSET = 14

# Alturas do parallax, espelhando Fase1Scene.buildParallax().
# Medidas a partir da linha do chão.
# Espelham Fase1Scene.buildParallax(). Alterar em um lugar exige alterar no
# outro — a preview só vale se mostrar o mesmo que o jogo.
ARVORES_SKIRT = 280   # px de saia sólida abaixo da treeline
COLINAS_TOP = 300     # y do topo dos montes, acima da copa das árvores


def read_layout(arquivo="fase1Layout.js"):
    """Extrai os dados do layout direto do .js, para não duplicar valores."""
    src = (ROOT / "src" / "scenes" / "biomes" / "Vila_0" / arquivo).read_text()

    def num(name):
        return int(re.search(rf"{name}\s*=\s*(\d+)", src).group(1))

    def pairs(name):
        block = re.search(rf"{name}\s*=\s*\[(.*?)\n\];", src, re.S).group(1)
        out = []
        for m in re.findall(r"\[([\d]+),\s*([\d]+)(?:,\s*(\d+))?\]", block):
            out.append(tuple(int(v) for v in m if v != ""))
        return out

    def objs(name):
        block = re.search(rf"{name}\s*=\s*\[(.*?)\n\];", src, re.S).group(1)
        out = []
        for m in re.finditer(r"\{([^}]*)\}", block):
            body = m.group(1)
            key = re.search(r"key:\s*'([^']+)'", body)
            tx = re.search(r"tileX:\s*([\d.]+)", body)
            off = re.search(r"offsetY:\s*(-?[\d.]+)", body)
            pieces = re.search(r"pieces:\s*(\d+)", body)
            out.append({
                "key": key.group(1) if key else None,
                "tileX": float(tx.group(1)),
                "offsetY": float(off.group(1)) if off else 0.0,
                "pieces": int(pieces.group(1)) if pieces else 1,
            })
        return out

    return {
        "wide": num("TILES_WIDE"),
        "ground_row": num("GROUND_ROW"),
        "fill_rows": num("FILL_ROWS"),
        "segments": [(x[0], x[1]) for x in pairs("GROUND_SEGMENTS")],
        "platforms": pairs("PLATFORMS"),
        "checkpoints": [int(v) for v in re.findall(
            r"\d+", re.search(r"CHECKPOINTS\s*=\s*\[([^\]]*)\]", src).group(1))],
        "spawn": num("SPAWN_TILE"),
        "dummy": num("TRAINING_DUMMY_TILE") if "TRAINING_DUMMY_TILE" in src else None,
        "anciao": num("ANCIAO_TILE") if "ANCIAO_TILE" in src else None,
        "cura": float(re.search(r"ITEM_CURA_TILE\s*=\s*([\d.]+)", src).group(1))
        if "ITEM_CURA_TILE" in src else None,
        "bg": objs("BACKGROUND_PROPS"),
        "fg": objs("FOREGROUND_PROPS"),
        "fences": objs("FENCES"),
    }


def build(L):
    W = L["wide"] * TILE
    GY = L["ground_row"] * TILE
    canvas = Image.new("RGBA", (W, GAME_HEIGHT), (246, 192, 126, 255))

    def strip(img, bottom):
        for x in range(0, W, img.width):
            canvas.alpha_composite(img, (x, bottom - img.height))

    ceu = Image.open(ASSETS / "bg" / "bg_ceu.png").convert("RGBA")
    colinas = Image.open(ASSETS / "bg" / "bg_colinas.png")
    arvores = Image.open(ASSETS / "bg" / "bg_arvores.png")

    strip(ceu, GAME_HEIGHT)
    # A treeline termina EXATAMENTE na linha do chão (a saia continua abaixo,
    # tapando o que se veria por dentro de um vão). Sem isso ela parecia
    # flutuar acima do solo.
    # As colinas precisam assomar ACIMA da treeline, senão desaparecem; e
    # precisam parar bem antes do topo, senão cobrem o gradiente do céu.
    strip(colinas, COLINAS_TOP + colinas.height)
    strip(arvores, GY + ARVORES_SKIRT)

    for p in L["bg"]:
        im = Image.open(ASSETS / "props" / f"{p['key']}.png")
        canvas.alpha_composite(
            im, (int(p["tileX"] * TILE - im.width / 2),
                 int(GY + GROUND_INSET + p["offsetY"] - im.height)))

    topos = [Image.open(ASSETS / "tiles" / f"tile_topo_{i}.png") for i in range(3)]
    fills = [Image.open(ASSETS / "tiles" / f"tile_fill_{i}.png") for i in range(3)]
    for start, count in L["segments"]:
        for i in range(count):
            tx = start + i
            canvas.alpha_composite(topos[tx % 3], (tx * TILE, GY))
            for r in range(1, L["fill_rows"] + 1):
                canvas.alpha_composite(fills[(tx + r) % 3], (tx * TILE, GY + r * TILE))

    # Marcos de checkpoint, com a arte do marco de pedra.
    marco = Image.open(ASSETS / "props" / "checkpoint.png")
    for tileX in L["checkpoints"]:
        canvas.alpha_composite(marco, (int(tileX * TILE - marco.width / 2),
                                       GY + GROUND_INSET - marco.height))

    # Mesma montagem em três peças da cena: pontas arredondadas fixas e o
    # miolo repetindo entre elas.
    p_esq = Image.open(ASSETS / "props" / "plataforma_esq.png")
    p_meio = Image.open(ASSETS / "props" / "plataforma_meio.png")
    p_dir = Image.open(ASSETS / "props" / "plataforma_dir.png")
    for start, count, height in L["platforms"]:
        y = GY - height * TILE
        x0, end = start * TILE, (start + count) * TILE
        canvas.alpha_composite(p_esq, (x0, y))
        x = x0 + p_esq.width
        limite = end - p_dir.width
        while x < limite:
            w = min(p_meio.width, limite - x)
            canvas.alpha_composite(p_meio.crop((0, 0, w, p_meio.height)), (x, y))
            x += w
        canvas.alpha_composite(p_dir, (end - p_dir.width, y))

    cerca = Image.open(ASSETS / "props" / "cerca.png")
    for f in L["fences"]:
        seg = next((s for s in L["segments"]
                    if s[0] <= f["tileX"] < s[0] + s[1]), None)
        if not seg:
            continue
        limit = (seg[0] + seg[1]) * TILE
        want = min(cerca.width * f["pieces"], limit - f["tileX"] * TILE)
        x, end = int(f["tileX"] * TILE), int(f["tileX"] * TILE + want)
        while x < end:
            w = min(cerca.width, end - x)
            canvas.alpha_composite(cerca.crop((0, 0, w, cerca.height)),
                                   (x, GY + GROUND_INSET - cerca.height))
            x += w

    for p in L["fg"]:
        im = Image.open(ASSETS / "props" / f"{p['key']}.png")
        canvas.alpha_composite(
            im, (int(p["tileX"] * TILE - im.width / 2),
                 GY + GROUND_INSET - im.height))

    if L["dummy"] is not None:
        dummy = Image.open(ASSETS / "props" / "alvo_treino.png")
        canvas.alpha_composite(dummy, (int(L["dummy"] * TILE - dummy.width / 2),
                                       GY + GROUND_INSET - dummy.height))

    if L["anciao"] is not None:
        anciao = Image.open(ASSETS / "npcs" / "anciao.png")
        canvas.alpha_composite(anciao, (int(L["anciao"] * TILE - anciao.width / 2),
                                        GY + GROUND_INSET - anciao.height))

    if L["cura"] is not None:
        cura = Image.open(ASSETS / "props" / "item_cura.png")
        canvas.alpha_composite(cura, (int(L["cura"] * TILE - cura.width / 2),
                                      GY + GROUND_INSET - cura.height))

    player = Image.open(ASSETS / "sprites" / "protagonista.png").crop((0, 0, 224, 224))
    canvas.alpha_composite(player, (L["spawn"] * TILE - 112, GY + GROUND_INSET - 224))

    return canvas.convert("RGB")


if __name__ == "__main__":
    import sys
    OUT.mkdir(exist_ok=True)
    fases = sys.argv[1:] or ["1", "2"]
    for n in fases:
        arquivo = f"fase{n}Layout.js"
        if not (ROOT / "src" / "scenes" / "biomes" / "Vila_0" / arquivo).exists():
            continue
        L = read_layout(arquivo)
        img = build(L)
        img.save(OUT / f"fase{n}_completa.png")
        img.resize((img.width // 5, img.height // 5), Image.LANCZOS).save(
            OUT / f"fase{n}_geral.png")
        print(f"Fase {n}: {img.width}x{img.height}px  ({L['wide']} tiles)")
