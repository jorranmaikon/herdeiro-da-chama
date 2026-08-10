"""
Pipeline de assets do Bosque Esmeralda (Região 1).

Módulo separado de `build_assets.py` de propósito: cada bioma é um Vertical
Slice isolado (`08_ARQUITETURA_TECNICA.md`). As funções utilitárias vêm de lá
por import — nada de recorte, despill ou bleed é reimplementado aqui.

Diferenças em relação ao pipeline da Vila, e o porquê de cada uma:

1. Todas as artes chegam com FUNDO MAGENTA, nunca branco. A Vila ainda tem
   assets da época do fundo branco; aqui o caminho é sempre o do croma.

2. O terreno vem como FOLHA 2x2 (topo, canto, lateral, preenchimento) em vez de
   uma faixa horizontal. Gerar as quatro peças juntas foi o que garantiu que
   compartilhassem a mesma terra — separadas, saíam com matizes diferentes.

3. `maior_componente` NÃO roda nas camadas de parallax. Ela existe para
   descartar o carimbo do gerador, mas descartaria junto os pixels soltos das
   pontas dos feixes de luz e das folhas da copa, que são arte legítima. Aqui o
   carimbo é apagado por detecção de cor, sem depender de coordenada.

4. `to_height` da Vila roda `despeckle_white` (limiar 190) depois de reduzir.
   Os feixes de luz do céu são justamente pixels claros e isolados: passariam
   por esse filtro e sumiriam. Por isso a redução das camadas de parallax usa
   `_reduzir`, que não despeckla.

Rode a partir da raiz do projeto:  python3 tools/build_assets_bosque.py
"""

import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from build_assets import (  # noqa: E402
    alpha_from_chroma, bleed_alpha, col_groups, despill, seam_fix,
)

UPLOADS = pathlib.Path("/mnt/user-data/uploads")
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "assets"
BIOMA = "bosque"

TILE = 64

SRC = {
    "tileset":     "9D90F6BB-AC12-4A1B-B7A6-3A408149F5E3.png",
    "plataforma":  "49288e6047610dbff00dd8245e254c57ac3635ec.png",
    "oneway":      "e2c0e2ab0ae53d91bb059b5d1b01912e2079f8ae.png",
    "espinhos":    "008ac8f35ab220fa3ff3e12fe502c77ccb41a42b.png",
    "bg_copa":     "3CE1B8A2-49F1-4256-B537-85851734AE08.png",
    "bg_floresta": "196ec52d5f0e3af9ea35bd6d2ecdcfc60ec6b90c.png",
    "bg_arvore":   "0DF6980D-F490-4128-A075-CABEBF13851F.png",
    "slime":       "davinci_especifica__o_t_cnica__folha_de_sprite_de_pixel_ar.png",
    "lobo":        "84c4fc713fd114938d2564e7e3fedcdfaeaae967.png",
    "morcego":     "96f37403eecd6bcab50476d9ffb7fefad4db385f.png",
}

# Alturas de exibição, em px de tela.
PLATFORM_HEIGHT = 64     # 1 tile — bloco de pedra, com massa visível
ONEWAY_HEIGHT = 30       # deliberadamente menos da metade da sólida
HAZARD_HEIGHT = 30       # perigo de chão, não chega ao joelho do personagem
PLATFORM_CAP_FRAC = 0.30  # fração da largura de cada ponta arredondada


# ----------------------------------------------------------------------
# Utilidades específicas deste bioma
# ----------------------------------------------------------------------
def _reduzir(rgba, altura):
    """Reduz preservando proporção, sem despeckle.

    A regra de ouro continua valendo: só reduz, nunca amplia.
    """
    im = Image.fromarray(rgba, "RGBA")
    if altura > im.height:
        raise ValueError(
            f"AMPLIACAO PROIBIDA ({im.height}px -> {altura}px). "
            "Gere a arte de origem maior em vez de ampliar aqui."
        )
    w = max(1, round(im.width * altura / im.height))
    return im.resize((w, altura), Image.LANCZOS)


def _apagar_carimbo(rgba):
    """Apaga o brilho em estrela que o gerador aplica num canto.

    A versão da Vila depende de coordenada fixa, o que só funciona porque lá
    todas as artes tinham o mesmo tamanho. Aqui as origens têm tamanhos
    diferentes, então o carimbo é encontrado pelo que ele é: um borrão pequeno,
    quase branco e dessaturado, isolado do resto do desenho.
    """
    rgb = rgba[:, :, :3].astype(int)
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    marca = (lum > 198) & (sat < 55) & (rgba[:, :, 3] > 0)
    if not marca.any():
        return rgba

    marca = ndimage.binary_dilation(marca, iterations=2)
    lbl, n = ndimage.label(marca)
    out = rgba.copy()
    h, w = marca.shape
    for i in range(1, n + 1):
        blob = lbl == i
        area = blob.sum()
        # Manchas grandes são arte (um feixe de luz claro, por exemplo).
        if area > 0.02 * h * w:
            continue
        ys, xs = np.where(blob)
        for y, x in zip(ys, xs):
            y0, y1 = max(0, y - 6), min(h, y + 7)
            x0, x1 = max(0, x - 6), min(w, x + 7)
            viz = out[y0:y1, x0:x1]
            ok = (viz[:, :, 3] > 0) & (~marca[y0:y1, x0:x1])
            if ok.any():
                out[y, x, :3] = np.median(viz[:, :, :3][ok], axis=0)
    return out


def _depink(rgba):
    """Descarta o dithering rosado da borda dos feixes de luz.

    Onde a arte se desfaz em pixels esparsos, o gerador dithera contra o fundo:
    o pixel não fica magenta o bastante para o corte por distância, mas fica
    visivelmente rosa. Como nenhuma paleta do jogo tem rosa, todo pixel com
    vermelho E azul acima do verde é contaminação, não desenho.

    Só roda nas camadas de parallax: num sprite, `despill` basta, porque a
    borda é uma linha fina e não uma nuvem de pixels soltos.
    """
    out = rgba.copy()
    r, g, b = (out[:, :, i].astype(np.int16) for i in range(3))
    # A regra é sobre a MÉDIA de vermelho e azul contra o verde: exigir que os
    # dois canais subissem juntos deixava passar o dither em que só um deles
    # ficou contaminado, e sobravam pontos rosa nas pontas dos feixes.
    rosa = (out[:, :, 3] > 0) & ((r + b) / 2 > g + 6)
    out[:, :, 3] = np.where(rosa, 0, out[:, :, 3])
    return out


def _rgba_croma(path, isolar=False, depink=False):
    """Abre uma arte de fundo magenta e devolve RGBA já limpo, sem recortar."""
    rgb = np.array(Image.open(path).convert("RGB"))
    alpha = alpha_from_chroma(rgb)
    if isolar:
        lbl, n = ndimage.label(alpha > 0)
        if n > 1:
            tam = ndimage.sum(alpha > 0, lbl, range(1, n + 1))
            alpha = np.where(lbl == int(np.argmax(tam)) + 1, alpha, 0)
    rgba = despill(np.dstack([rgb, alpha.astype(np.uint8)]))
    if depink:
        rgba = _depink(rgba)
    return _apagar_carimbo(bleed_alpha(rgba))


def _recortar(rgba):
    ys, xs = np.where(rgba[:, :, 3] > 0)
    return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def _celulas_2x2(rgba, margem=0.04):
    """Separa as 4 células da folha de tileset.

    Os separadores são faixas de magenta que atravessam a folha inteira. Uma
    linha/coluna que é quase toda transparente é separador; o resto é célula.
    Buscar as duas maiores faixas transparentes é mais robusto que dividir a
    imagem ao meio, porque o gerador nunca centraliza a grade com precisão.
    """
    op = rgba[:, :, 3] > 0
    h, w = op.shape

    def cortes(perfil, total):
        vazio = perfil < 0.15 * total
        grupos, rodando = [], False
        for i, v in enumerate(vazio):
            if v and not rodando:
                inicio, rodando = i, True
            elif not v and rodando:
                grupos.append((inicio, i - 1))
                rodando = False
        if rodando:
            grupos.append((inicio, len(vazio) - 1))
        # descarta as bordas: interessa o separador do meio
        meio = [g for g in grupos
                if g[0] > margem * len(vazio) and g[1] < (1 - margem) * len(vazio)]
        if not meio:
            return len(vazio) // 2
        maior = max(meio, key=lambda g: g[1] - g[0])
        return (maior[0] + maior[1]) // 2

    cy = cortes(op.sum(axis=1), w)
    cx = cortes(op.sum(axis=0), h)
    return {
        "topo":  rgba[:cy, :cx],
        "canto": rgba[:cy, cx:],
        "lateral": rgba[cy:, :cx],
        "fill":  rgba[cy:, cx:],
    }


# O gerador desenha cada célula da folha como uma caixa com CONTORNO ESCURO em
# volta. Esse contorno não é arte: repetido lado a lado, vira uma listra vertical
# escura a cada 64px. É aparado antes de reduzir.
CELL_INSET = 0.035


def _tile_64(celula, opaco=False):
    """Normaliza uma célula da folha para um tile de 64x64px.

    A célula é recortada ao conteúdo opaco ANTES de reduzir, senão a margem
    magenta em volta empurra o desenho para dentro e o tile sai com folga.
    Em `canto` e `lateral` o magenta é parte da peça (o vazio ao lado do
    degrau), então ali só as bordas totalmente vazias são aparadas.
    """
    op = celula[:, :, 3] > 0
    linhas = np.where(op.any(axis=1))[0]
    colunas = np.where(op.any(axis=0))[0]
    if opaco:
        sub = celula[linhas.min():linhas.max() + 1, colunas.min():colunas.max() + 1]
    else:
        # preserva a coluna/linha vazia interna, apara só o excesso externo
        sub = celula[linhas.min():linhas.max() + 1, :]

    # apara o contorno da caixa: sempre nas laterais e embaixo; em cima só
    # quando a peça é opaca (no topo e no canto, a borda de cima é a grama)
    dy = max(1, round(sub.shape[0] * CELL_INSET))
    dx = max(1, round(sub.shape[1] * CELL_INSET))
    sub = sub[(dy if opaco else 0):sub.shape[0] - dy, dx:sub.shape[1] - dx]

    sub = _aparar_contorno_escuro(sub)
    sub = _aparar_colunas_vazadas(sub)
    im = Image.fromarray(sub, "RGBA").resize((TILE, TILE), Image.LANCZOS)
    return np.array(im)


def _aparar_contorno_escuro(sub, max_tiras=14):
    """Descasca as bordas escuras que sobraram da caixa da folha.

    O gerador desenha cada célula como uma caixa com contorno. O recorte por
    porcentagem (CELL_INSET) tira a maior parte, mas a espessura do contorno
    varia de célula para célula — e o que sobra vira um risco preto na quina de
    cada degrau, denunciando que o tile foi recortado.

    Aqui a borda é medida em vez de estimada: uma tira de 1px é descartada
    enquanto for sensivelmente mais escura que o miolo da peça.
    """
    def luz(faixa_px):
        opaco = faixa_px[:, :, 3] > 0
        if not opaco.any():
            return None
        return faixa_px[:, :, :3][opaco].mean()

    miolo = sub[sub.shape[0] // 4: -sub.shape[0] // 4,
                sub.shape[1] // 4: -sub.shape[1] // 4]
    ref = luz(miolo)
    if ref is None:
        return sub

    limite = ref * 0.72
    for _ in range(max_tiras):
        cortou = False
        # O topo fica de fora: nas peças de superfície ele é a grama, que é
        # legitimamente mais escura na base das folhas.
        for lado in ('baixo', 'esq', 'dir'):
            if sub.shape[0] < 8 or sub.shape[1] < 8:
                break
            tira = {'baixo': sub[-1:, :], 'esq': sub[:, :1], 'dir': sub[:, -1:]}[lado]
            valor = luz(tira)
            if valor is not None and valor < limite:
                sub = {'baixo': sub[:-1, :], 'esq': sub[:, 1:],
                       'dir': sub[:, :-1]}[lado]
                cortou = True
        if not cortou:
            break
    return sub


def _aparar_colunas_vazadas(sub, faixa=0.4):
    """Remove colunas transparentes nas laterais da peça de terreno.

    A metade de baixo do tile é terra maciça: qualquer coluna vazada ali é
    resto do separador magenta da folha, não desenho. Deixá-la produz uma
    fresta vertical a cada 64px quando o chão repete — foi exatamente o que
    apareceu no primeiro teste de repetição.
    """
    y0 = int(sub.shape[0] * (1 - faixa))
    cheia = (sub[y0:, :, 3] > 0).all(axis=0)
    if not cheia.any():
        return sub
    xs = np.where(cheia)[0]
    return sub[:, xs.min():xs.max() + 1]


def _variacoes(tile, n=3):
    """Gera variações deslocando o tile na horizontal.

    Com uma variação só, a mesma pedrinha reaparece a cada 64px e a repetição
    fica óbvia. Como o tile é tileável na horizontal, deslocar produz variações
    válidas sem precisar de arte nova — o `seam_fix` garante que a emenda feche
    antes do deslocamento.
    """
    base = seam_fix(tile, fade=6)
    return [np.roll(base, round(i * TILE / n), axis=1) for i in range(n)]


# ----------------------------------------------------------------------
# Terreno
# ----------------------------------------------------------------------
def build_terreno():
    folha = _rgba_croma(UPLOADS / SRC["tileset"])
    cel = _celulas_2x2(folha)
    destino = OUT / "tiles" / BIOMA
    destino.mkdir(parents=True, exist_ok=True)

    topo = _tile_64(cel["topo"])
    fill = _tile_64(cel["fill"], opaco=True)
    for i, (t, f) in enumerate(zip(_variacoes(topo), _variacoes(fill))):
        Image.fromarray(t, "RGBA").save(destino / f"tile_topo_{i}.png")
        Image.fromarray(f, "RGBA").save(destino / f"tile_fill_{i}.png")

    # Canto e lateral não ganham variação: aparecem uma vez por degrau, nunca
    # repetidos lado a lado, então não há padrão a quebrar.
    Image.fromarray(_tile_64(cel["canto"]), "RGBA").save(destino / "tile_canto.png")
    Image.fromarray(_tile_64(cel["lateral"]), "RGBA").save(
        destino / "tile_lateral.png")

    print(f"  terreno: {3 * 2} tiles + canto + lateral")


# ----------------------------------------------------------------------
# Plataformas e perigo
# ----------------------------------------------------------------------
def build_plataformas():
    destino = OUT / "props" / BIOMA
    destino.mkdir(parents=True, exist_ok=True)

    # Sólida: a arte traz as 3 peças separadas por magenta. Todas reduzidas
    # pelo MESMO fator, senão as pontas não encaixam na altura do meio.
    a = _rgba_croma(UPLOADS / SRC["plataforma"])
    grupos = col_groups(a, min_gap=20)
    if len(grupos) != 3:
        raise ValueError(f"esperava 3 peças na plataforma, achei {len(grupos)}")

    pecas = [_recortar(a[:, x0:x1 + 1]) for x0, x1 in grupos]
    # O MIOLO é a única peça que repete, e vem com o contorno escuro da própria
    # arte nas duas laterais. Repetido, esse contorno vira uma barra vertical a
    # cada emenda. As pontas mantêm o contorno: nelas ele é a borda real da
    # plataforma.
    miolo = pecas[1]
    corte = max(1, round(miolo.shape[1] * 0.045))
    pecas[1] = seam_fix(miolo[:, corte:miolo.shape[1] - corte], fade=6)
    # A altura é FORÇADA igual nas três: arredondar cada peça pela sua própria
    # proporção devolvia 63/64/63px e a plataforma montada saía com degrau de
    # 1px entre a ponta e o miolo. Só a largura acompanha a proporção.
    escala = PLATFORM_HEIGHT / max(p.shape[0] for p in pecas)
    for peca, nome in zip(pecas, ["plataforma_esq", "plataforma_meio",
                                  "plataforma_dir"]):
        w = max(1, round(peca.shape[1] * escala))
        Image.fromarray(peca, "RGBA").resize(
            (w, PLATFORM_HEIGHT), Image.LANCZOS).save(destino / f"{nome}.png")

    # Atravessável: tira única, repetida pela cena. A largura NÃO é recortada —
    # o galho encosta de propósito nas bordas para a emenda fechar.
    ow = _rgba_croma(UPLOADS / SRC["oneway"])
    linhas = np.where((ow[:, :, 3] > 0).any(axis=1))[0]
    ow = ow[linhas.min():linhas.max() + 1, :]
    _reduzir(seam_fix(ow, fade=8), ONEWAY_HEIGHT).save(
        destino / "plataforma_oneway.png")

    # Espinhos: mesma lógica de tira repetível.
    esp = _rgba_croma(UPLOADS / SRC["espinhos"])
    linhas = np.where((esp[:, :, 3] > 0).any(axis=1))[0]
    colunas = np.where((esp[:, :, 3] > 0).any(axis=0))[0]
    esp = esp[linhas.min():linhas.max() + 1, colunas.min():colunas.max() + 1]
    _reduzir(esp, HAZARD_HEIGHT).save(destino / "espinhos.png")

    print("  plataformas: sólida (3 peças) + atravessável + espinhos")


# ----------------------------------------------------------------------
# Parallax
# ----------------------------------------------------------------------
# Altura de exibição de cada camada. Nenhuma é ampliada: quando a arte de
# origem é menor que 720, a camada fica na altura nativa e a cena a ancora
# pela base.
# A camada de troncos é deliberadamente mais baixa que a tela: ela emoldura o
# rodapé do cenário. Ocupando os 720px inteiros, tapava o céu e a Árvore
# Gigante, e o marco visual do bioma sumia atrás do primeiro plano.
# A Árvore Gigante NÃO é mais camada de parallax. Ela virou um elemento de
# enquadramento, usado em pontos específicos (mirante da Fase 1, aproximação da
# Fase 4, arena do Boss). Como fundo permanente ela poluía a tela e brigava com
# o primeiro plano — e o fundo do bioma pede contraste baixo, não um marco em
# cada quadro.
PARALLAX_HEIGHT = {"bg_copa": 360, "bg_floresta": 720, "bg_arvore": 700}


def build_parallax():
    destino = OUT / "bg" / BIOMA
    destino.mkdir(parents=True, exist_ok=True)

    for chave, altura in PARALLAX_HEIGHT.items():
        if chave == "bg_floresta":
            # Camada opaca, sem croma: preenche o quadro inteiro.
            rgba = np.array(Image.open(UPLOADS / SRC[chave]).convert("RGBA"))
            rgba = _apagar_carimbo(rgba)
            _reduzir(rgba, min(altura, rgba.shape[0])).save(
                destino / f"{chave}.png")
            continue

        # isolar=False: descartar componentes soltos comeria as folhas da copa.
        rgba = _rgba_croma(UPLOADS / SRC[chave], isolar=False, depink=True)

        if chave == "bg_arvore":
            rgba = _recortar(rgba)
        else:
            linhas = np.where((rgba[:, :, 3] > 0).any(axis=1))[0]
            rgba = seam_fix(rgba[linhas.min():linhas.max() + 1, :], fade=10)

        _reduzir(rgba, min(altura, rgba.shape[0])).save(destino / f"{chave}.png")

    print(f"  parallax: {len(PARALLAX_HEIGHT)} camadas")


# ----------------------------------------------------------------------
# Inimigos
# ----------------------------------------------------------------------
# [célula final em px, altura do maior quadro, âncora]
#
# "chao" apoia o quadro numa linha de base; "centro" centraliza verticalmente.
# Um inimigo voador não tem pé: ancorá-lo pela base o faria subir e descer
# conforme a envergadura da asa muda de quadro para quadro.
INIMIGOS = {
    "slime":   {"chave": "slime", "celula": 128, "alt": 104, "ancora": "chao"},
    "lobo":    {"chave": "lobo", "celula": 192, "alt": 116, "ancora": "chao"},
    "morcego": {"chave": "morcego", "celula": 128, "alt": 104, "ancora": "centro"},
}


def build_inimigos():
    for nome, cfg in INIMIGOS.items():
        _fatiar_inimigo(nome, cfg)


def _fatiar_inimigo(nome, cfg):
    """Fatia uma folha 4x4 de inimigo e normaliza os quadros.

    Dois cuidados que a folha crua não tem:

    1. Cada célula vem com uma moldura preta desenhada. Ela é aparada antes do
       recorte, senão vira um retângulo escuro em volta do inimigo.
    2. Os quadros têm tamanhos diferentes entre si. Todos são reduzidos pelo
       MESMO fator e apoiados na mesma linha de base — reduzir cada um pela
       própria altura faria o Slime crescer e encolher durante a animação, e
       ancorar pelo centro o faria flutuar.
    """
    folha = _rgba_croma(UPLOADS / SRC[cfg["chave"]], isolar=False)
    lado = folha.shape[0] // 4

    # Apara a moldura de cada célula: 4% de cada lado cobre a espessura da
    # linha com folga, sem encostar no desenho.
    margem = round(lado * 0.04)

    recortes = []
    for linha in range(4):
        for coluna in range(4):
            cel = folha[linha * lado + margem:(linha + 1) * lado - margem,
                        coluna * lado + margem:(coluna + 1) * lado - margem]
            cel = _aparar_contorno_escuro(cel)
            op = cel[:, :, 3] > 0
            recortes.append(_recortar(cel) if op.any() else None)

    altura_maxima = max(r.shape[0] for r in recortes if r is not None)
    escala = cfg["alt"] / altura_maxima
    celula = cfg["celula"]

    destino = OUT / "sprites" / BIOMA
    destino.mkdir(parents=True, exist_ok=True)
    folha_final = Image.new("RGBA", (celula * 4, celula * 4), (0, 0, 0, 0))

    for i, recorte in enumerate(recortes):
        if recorte is None:
            continue
        h = max(1, round(recorte.shape[0] * escala))
        w = max(1, round(recorte.shape[1] * escala))
        im = Image.fromarray(recorte, "RGBA").resize((w, h), Image.LANCZOS)
        topo = (celula - 6 - h) if cfg["ancora"] == "chao" else (celula - h) // 2
        folha_final.alpha_composite(
            im,
            ((i % 4) * celula + (celula - w) // 2, (i // 4) * celula + topo),
        )

    folha_final.save(destino / f"{nome}.png")
    print(f"  {nome}: 4x4 células de {celula}px")


if __name__ == "__main__":
    print("Gerando assets do Bosque Esmeralda...")
    build_terreno()
    build_plataformas()
    build_parallax()
    build_inimigos()
    print("Pronto.")
