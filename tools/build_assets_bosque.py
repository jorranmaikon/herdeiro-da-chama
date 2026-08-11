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
    "goblin":      "aa88770641e89ac17862fcb33f67bba1a44e05a8.png",
    "urso":        "2FA393A4-0688-4816-B17B-0D2670C78654.png",
    "guardiao":    "04222942-01A1-4302-A8C9-F31EC5086D8F.png",
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
    # O morcego e pequeno: dois punhos. Com a moldura fora do calculo de
    # escala ele passou a ser medido pelo proprio corpo, e 104px o deixavam do
    # tamanho de um cachorro.
    "morcego": {"chave": "morcego", "celula": 128, "alt": 76, "ancora": "centro"},
    "goblin":  {"chave": "goblin", "celula": 160, "alt": 128, "ancora": "chao"},
    # O Urso é Mini-Boss: a escala é o que sinaliza a categoria antes de
    # qualquer barra de vida (07_DIRECAO_ARTE_AUDIO.md, Seção 5).
    # Mini-Boss: sete linhas de animacao em vez de quatro. A escala e o que
    # sinaliza a categoria antes de qualquer barra de vida.
    "urso":    {"chave": "urso", "celula": 400, "alt": 300, "ancora": "chao",
                "colunas": 4, "linhas": 7},
    # O Boss veio com linhas de tamanhos diferentes — 5 quadros em quase todas,
    # 6 em duas. Grade fixa não serve, então este usa fatiamento LIVRE.
    # A arte veio roxo/vinho, fora da paleta do bioma. O giro de matiz traz o
    # corpo para o marrom-esverdeado da floresta sem redesenhar nada — a forma
    # e o sombreado continuam sendo os do artista.
    "guardiao": {"chave": "guardiao", "celula": 512, "alt": 400, "ancora": "chao",
                 "livre": True, "colunas": 6, "linhas": 8,
                 "matiz": 0.28, "saturacao": 0.75},
}


# Quanto o recorte de um quadro pode invadir a célula vizinha, em fração do
# lado. A IA quase sempre deixa uma pata, um focinho ou a ponta de uma cauda
# passando da linha da grade; cortar rente perderia esse pedaço.
INVASAO = 0.16


def _remover_grade(folha, lado, colunas, linhas):
    """Apaga a grade desenhada na folha, quando ela existe.

    Algumas folhas trazem as linhas da grade em preto. Tentar reconhecê-las
    depois, como "mancha oca", saiu caro: um lobo correndo e um morcego de asas
    abertas também ocupam quase toda a célula preenchendo pouco dela, e quatro
    quadros foram descartados junto — daí o Lobo piscando.

    A grade é identificada pelo que ela é de fato: uma LINHA INTEIRA de pixels
    escuros e opacos, exatamente sobre a divisa das células. Nenhum personagem
    produz uma linha cheia atravessando a folha de ponta a ponta.
    """
    out = folha.copy()
    alt, larg = out.shape[:2]
    lum = out[:, :, :3].mean(axis=2)
    op = out[:, :, 3] > 0
    tolerancia = max(3, round(lado * 0.02))

    def linha_de_grade(valores_op, valores_lum):
        # Exigências apertadas de propósito. Com limiares frouxos, uma fileira
        # que atravessava o meio de um bicho escuro — o Urso é quase todo
        # verde-escuro — era lida como grade e apagada, e o sprite saía com
        # fatias vazadas no jogo.
        if valores_op.mean() < 0.92:
            return False
        escuros = valores_lum[valores_op]
        if escuros.size == 0 or escuros.mean() > 60:
            return False
        # Linha desenhada tem cor uniforme; pelo de animal, não.
        return float(escuros.std()) < 16

    for k in range(linhas + 1):
        base = k * lado
        for y in range(max(0, base - tolerancia), min(alt, base + tolerancia + 1)):
            if linha_de_grade(op[y], lum[y]):
                out[y, :, 3] = 0

    for k in range(colunas + 1):
        base = k * lado
        for x in range(max(0, base - tolerancia), min(larg, base + tolerancia + 1)):
            if linha_de_grade(op[:, x], lum[:, x]):
                out[:, x, 3] = 0

    return out


def _extrair_quadro(folha, lado, linha, coluna, margem):
    """Extrai UM personagem da folha, inteiro e sem texto.

    Recortar a célula na régua não funciona por dois motivos:

    1. O desenho transborda para a célula vizinha, e cortar na linha da grade
       decepa pata, focinho ou cauda.
    2. Algumas folhas vêm com rótulo escrito em cada célula ("A1", "B2"), que
       é desenho tanto quanto o personagem e sobreviveria a qualquer corte
       geométrico.

    Então o recorte é por CONTEÚDO: olha-se uma janela maior que a célula,
    separam-se as manchas opacas, e fica só aquela cujo centro cai dentro da
    célula — o personagem daquele quadro. Manchas pequenas demais são rótulo
    ou respingo e são descartadas; manchas centradas na célula vizinha
    pertencem ao quadro de lá.
    """
    folga = round(lado * INVASAO)
    y0, y1 = linha * lado, (linha + 1) * lado
    x0, x1 = coluna * lado, (coluna + 1) * lado

    jy0, jy1 = max(0, y0 - folga), min(folha.shape[0], y1 + folga)
    jx0, jx1 = max(0, x0 - folga), min(folha.shape[1], x1 + folga)
    janela = folha[jy0:jy1, jx0:jx1]

    lbl, n = ndimage.label(janela[:, :, 3] > 0)
    if n == 0:
        return None

    # Centro da célula dentro das coordenadas da janela.
    centro_y = (y0 + y1) / 2 - jy0
    centro_x = (x0 + x1) / 2 - jx0
    limite_y = lado / 2
    limite_x = lado / 2
    area_minima = 0.004 * lado * lado

    manchas = ndimage.find_objects(lbl)
    escolhida = None
    melhor = None
    for i, fatia in enumerate(manchas, start=1):
        if fatia is None:
            continue
        area = int((lbl[fatia] == i).sum())
        if area < area_minima:
            continue  # rótulo escrito, respingo, carimbo

        cy = (fatia[0].start + fatia[0].stop) / 2
        cx = (fatia[1].start + fatia[1].stop) / 2
        if abs(cy - centro_y) > limite_y or abs(cx - centro_x) > limite_x:
            continue  # pertence ao quadro vizinho

        # Entre as candidatas, a maior é o personagem.
        if melhor is None or area > melhor:
            melhor, escolhida = area, i

    if escolhida is None:
        return None

    recorte = janela.copy()
    recorte[:, :, 3] = np.where(lbl == escolhida, recorte[:, :, 3], 0)

    # Segunda passada do carimbo, agora POR QUADRO. Quando a estrela do gerador
    # cai em cima do personagem ela vira parte da mesma mancha e sobrevive ao
    # recorte por conteúdo; e medida contra a folha inteira ela é pequena
    # demais para o limiar de área disparar.
    return _apagar_carimbo(_recortar(recorte))


def _so_maior_mancha(cel):
    """Mantém apenas a maior mancha opaca da célula.

    Cada célula tem exatamente uma criatura. Tudo que estiver solto ao lado
    dela é o carimbo do gerador — que aqui sobrevive ao corte por cor, porque
    é uma estrela clara sobre magenta e não encosta no desenho.

    Não dá para rodar isso na folha inteira: as 16 células juntas são 16
    manchas, e a maior comeria as outras 15.
    """
    lbl, n = ndimage.label(cel[:, :, 3] > 0)
    if n <= 1:
        return cel
    tam = ndimage.sum(cel[:, :, 3] > 0, lbl, range(1, n + 1))
    maior = int(np.argmax(tam)) + 1
    out = cel.copy()
    out[:, :, 3] = np.where(lbl == maior, out[:, :, 3], 0)
    return out


def build_inimigos():
    for nome, cfg in INIMIGOS.items():
        _fatiar_inimigo(nome, cfg)


def _girar_matiz(rgba, delta, saturacao):
    """Gira o matiz de todos os pixels opacos e reduz a saturação.

    Serve para trazer uma arte que veio fora da paleta de volta ao bioma sem
    perder a forma nem o sombreado. Não é retoque: é uma transformação uniforme,
    então o desenho continua sendo o do artista — só a cor muda.
    """
    if not delta:
        return rgba

    dados = rgba.astype(float)
    rgb = dados[:, :, :3] / 255.0
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    maximo = rgb.max(axis=2)
    minimo = rgb.min(axis=2)
    amplitude = maximo - minimo

    matiz = np.zeros_like(maximo)
    tem_cor = amplitude > 1e-6
    sel = (maximo == r) & tem_cor
    matiz[sel] = ((g - b)[sel] / amplitude[sel]) % 6
    sel = (maximo == g) & tem_cor
    matiz[sel] = ((b - r)[sel] / amplitude[sel]) + 2
    sel = (maximo == b) & tem_cor
    matiz[sel] = ((r - g)[sel] / amplitude[sel]) + 4

    matiz = (matiz / 6.0 + delta) % 1.0
    sat = np.where(maximo > 0, amplitude / np.maximum(maximo, 1e-6), 0) * saturacao
    val = maximo

    setor = np.floor(matiz * 6)
    fracao = matiz * 6 - setor
    p_ = val * (1 - sat)
    q_ = val * (1 - fracao * sat)
    t_ = val * (1 - (1 - fracao) * sat)
    setor = setor.astype(int) % 6

    saida = np.zeros_like(rgb)
    combinacoes = [(val, t_, p_), (q_, val, p_), (p_, val, t_),
                   (p_, q_, val), (t_, p_, val), (val, p_, q_)]
    for indice, canais in enumerate(combinacoes):
        sel = setor == indice
        saida[sel] = np.stack(canais, axis=-1)[sel]

    dados[:, :, :3] = np.clip(saida * 255, 0, 255)
    return dados.astype(np.uint8)


def _montar_livre(nome, cfg, folha, colunas, linhas):
    """Monta a folha final a partir de quadros de tamanhos irregulares.

    Todos são reduzidos pelo MESMO fator e apoiados na mesma linha de base —
    reduzir cada um pela própria altura faria o personagem crescer e encolher
    durante a animação, e ancorar pelo centro o faria flutuar.

    A grade de saída é regular mesmo quando a de entrada não é: linhas com
    menos quadros deixam células vazias no fim, que as animações simplesmente
    não citam.
    """
    folha = _girar_matiz(folha, cfg.get("matiz", 0), cfg.get("saturacao", 1))
    grupos = _quadros_livres(folha)
    celula = cfg["celula"]

    altura_maxima = max(q.shape[0] for linha in grupos for q in linha)
    escala = cfg["alt"] / altura_maxima

    destino = OUT / "sprites" / BIOMA
    destino.mkdir(parents=True, exist_ok=True)
    final = Image.new("RGBA", (celula * colunas, celula * linhas), (0, 0, 0, 0))

    for y, linha in enumerate(grupos[:linhas]):
        for x, quadro in enumerate(linha[:colunas]):
            h = max(1, round(quadro.shape[0] * escala))
            w = max(1, round(quadro.shape[1] * escala))
            im = Image.fromarray(quadro, "RGBA").resize((w, h), Image.LANCZOS)
            final.alpha_composite(
                im, (x * celula + (celula - w) // 2, y * celula + celula - 6 - h))

    final.save(destino / f"{nome}.png")
    contagem = ", ".join(str(len(l)) for l in grupos)
    print(f"  {nome}: fatiamento livre, {len(grupos)} linhas ({contagem}) "
          f"-> grade {colunas}x{linhas} de {celula}px")


def _quadros_livres(folha, tolerancia=120, area_minima=0.0004):
    """Separa os quadros por CONTEÚDO, sem assumir grade regular.

    Um gerador não entrega colunas alinhadas de forma confiável: a folha do
    Boss veio com 5 quadros em seis linhas e 6 em duas. Cortar na régua
    partiria personagens ao meio.

    Aqui cada mancha opaca é um quadro. As manchas são agrupadas em linhas pelo
    centro vertical e ordenadas da esquerda para a direita dentro de cada
    linha — que é exatamente a ordem de leitura da animação.
    """
    lbl, n = ndimage.label(folha[:, :, 3] > 0)
    if n == 0:
        return []

    limite = area_minima * folha.shape[0] * folha.shape[1]
    caixas = []
    for i, fatia in enumerate(ndimage.find_objects(lbl), start=1):
        if fatia is None:
            continue
        if int((lbl[fatia] == i).sum()) < limite:
            continue  # respingo ou carimbo
        caixas.append((fatia, i))

    caixas.sort(key=lambda c: (c[0][0].start + c[0][0].stop) / 2)

    linhas, atual = [], [caixas[0]]
    for caixa in caixas[1:]:
        centro = (caixa[0][0].start + caixa[0][0].stop) / 2
        anterior = (atual[-1][0][0].start + atual[-1][0][0].stop) / 2
        if abs(centro - anterior) < tolerancia:
            atual.append(caixa)
        else:
            linhas.append(atual)
            atual = [caixa]
    linhas.append(atual)

    saida = []
    for linha in linhas:
        linha.sort(key=lambda c: c[0][1].start)
        quadros = []
        for fatia, rotulo in linha:
            recorte = folha[fatia].copy()
            recorte[:, :, 3] = np.where(lbl[fatia] == rotulo, recorte[:, :, 3], 0)
            quadros.append(_apagar_carimbo(_recortar(recorte)))
        saida.append(quadros)
    return saida


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
    colunas = cfg.get("colunas", 4)
    linhas = cfg.get("linhas", 4)

    folha = _rgba_croma(UPLOADS / SRC[cfg["chave"]], isolar=False)

    if cfg.get("livre"):
        return _montar_livre(nome, cfg, folha, colunas, linhas)

    lado = folha.shape[1] // colunas
    folha = _remover_grade(folha, lado, colunas, linhas)

    # Apara a moldura de cada célula.
    #
    # 2%, não 4%: com folga maior, o quadro alto do salto do Slime — que quase
    # encosta no topo da sua célula — perdia o topo do corpo.
    margem = round(lado * 0.02)

    recortes = [_extrair_quadro(folha, lado, linha, coluna, margem)
                for linha in range(linhas) for coluna in range(colunas)]

    altura_maxima = max(r.shape[0] for r in recortes if r is not None)
    escala = cfg["alt"] / altura_maxima
    celula = cfg["celula"]

    destino = OUT / "sprites" / BIOMA
    destino.mkdir(parents=True, exist_ok=True)
    folha_final = Image.new("RGBA", (celula * colunas, celula * linhas), (0, 0, 0, 0))

    for i, recorte in enumerate(recortes):
        if recorte is None:
            continue
        h = max(1, round(recorte.shape[0] * escala))
        w = max(1, round(recorte.shape[1] * escala))
        im = Image.fromarray(recorte, "RGBA").resize((w, h), Image.LANCZOS)
        topo = (celula - 6 - h) if cfg["ancora"] == "chao" else (celula - h) // 2
        folha_final.alpha_composite(
            im,
            ((i % colunas) * celula + (celula - w) // 2,
             (i // colunas) * celula + topo),
        )

    folha_final.save(destino / f"{nome}.png")
    print(f"  {nome}: {colunas}x{linhas} células de {celula}px")


if __name__ == "__main__":
    print("Gerando assets do Bosque Esmeralda...")
    build_terreno()
    build_plataformas()
    build_parallax()
    build_inimigos()
    print("Pronto.")
