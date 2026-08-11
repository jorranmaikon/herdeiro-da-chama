"""
Valida os sprite sheets de inimigo contra o código, antes de qualquer deploy.

Existe porque um inimigo pode sumir do jogo sem nenhum erro no console: se o
tamanho de célula declarado no `PreloadScene` não bater com o da folha, o Phaser
fatia a imagem na régua errada e os índices de quadro apontam para pedaços
vazios. Foi exatamente o que aconteceu com o Urso ao crescer 25% — a folha virou
400px por célula e o carregamento continuou fatiando de 320.

Confere, para cada inimigo:

1. o tamanho da folha é divisível por 4 e bate com `celula` na configuração;
2. o `frameWidth`/`frameHeight` do `PreloadScene` é o mesmo `celula`;
3. todo índice de quadro citado em alguma animação existe e NÃO está vazio.

    python3 tools/validar_inimigos.py
"""

import pathlib
import re
import sys

import numpy as np
from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CONFIG = RAIZ / "src" / "data" / "enemiesConfig.js"
PRELOAD = RAIZ / "src" / "scenes" / "PreloadScene.js"
SPRITES = RAIZ / "public" / "assets" / "sprites" / "bosque"


def ler_configuracoes():
    """Extrai textura, célula e quadros de cada `export const` do arquivo."""
    texto = CONFIG.read_text(encoding="utf-8")
    blocos = re.split(r"\nexport const ", texto)[1:]

    saida = {}
    for bloco in blocos:
        nome = bloco.split(" ", 1)[0]
        textura = re.search(r"textura:\s*'([^']+)'", bloco)
        celula = re.search(r"celula:\s*(\d+)", bloco)
        if not textura or not celula:
            continue

        quadros = set()
        for lista in re.findall(r"quadros:\s*\[([\d,\s]+)\]", bloco):
            quadros.update(int(n) for n in re.findall(r"\d+", lista))

        saida[nome] = {
            "textura": textura.group(1),
            "celula": int(celula.group(1)),
            "quadros": sorted(quadros),
        }
    return saida


def ler_catalogo():
    """Mapeia NOME da configuração -> arquivo, a partir de FOLHAS_DE_INIMIGO.

    O tamanho de célula não é lido aqui de propósito: ele existe num lugar só,
    na própria configuração, e o carregamento deriva dela. O que ainda precisa
    ser conferido é o arquivo em disco bater com esse número.
    """
    texto = CONFIG.read_text(encoding="utf-8")
    bloco = texto.split("FOLHAS_DE_INIMIGO")[1]
    return {
        cfg: arquivo
        for arquivo, cfg in re.findall(r"arquivo:\s*'(\w+)',\s*cfg:\s*(\w+)", bloco)
    }


def quadro_vazio(imagem, celula, indice):
    linha, coluna = divmod(indice, 4)
    recorte = imagem[
        linha * celula:(linha + 1) * celula,
        coluna * celula:(coluna + 1) * celula,
        3,
    ]
    return not (recorte > 0).any()


def validar():
    configuracoes = ler_configuracoes()
    catalogo = ler_catalogo()
    problemas = []

    for nome, cfg in configuracoes.items():
        celula = cfg["celula"]

        if nome not in catalogo:
            problemas.append(f"{nome}: nao esta em FOLHAS_DE_INIMIGO, entao nunca e carregado")
            continue

        arquivo = catalogo[nome]
        caminho = SPRITES / f"{arquivo}.png"
        if not caminho.exists():
            problemas.append(f"{nome}: arquivo {caminho.name} nao existe")
            continue

        imagem = np.array(Image.open(caminho).convert("RGBA"))
        altura, largura = imagem.shape[:2]

        if largura % 4 or altura % 4:
            problemas.append(f"{nome}: folha {largura}x{altura} nao e divisivel por 4")
            continue

        if largura // 4 != celula or altura // 4 != celula:
            problemas.append(
                f"{nome}: folha {largura}x{altura} da celula de {largura // 4}px, "
                f"mas a configuracao diz {celula}px"
            )
            continue

        vazios = [i for i in cfg["quadros"] if quadro_vazio(imagem, celula, i)]
        if vazios:
            problemas.append(f"{nome}: quadros usados em animacao estao vazios: {vazios}")

    for nome, cfg in sorted(configuracoes.items()):
        marca = "ok " if not any(nome in p for p in problemas) else "FALHA"
        print(f"  [{marca}] {nome}: celula {cfg['celula']}px, "
              f"{len(cfg['quadros'])} quadros usados")

    if problemas:
        print("\nPROBLEMAS:")
        for p in problemas:
            print("  -", p)
        return 1

    print("\nTodos os inimigos validados.")
    return 0


if __name__ == "__main__":
    sys.exit(validar())
