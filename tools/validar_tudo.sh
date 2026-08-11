#!/usr/bin/env bash
# Suite de validação. Roda antes de qualquer deploy.
#
# Existe porque três bugs seguidos chegaram ao ar sem erro no console: sprite
# fatiado no tamanho errado, inimigo posicionado sobre um vão e save
# compartilhando arrays entre perfis. Nenhum deles aparece num `vite build`.
set -e
cd "$(dirname "$0")/.."

echo "== Sprite sheets de inimigo =="
python3 tools/validar_inimigos.py

echo
echo "== Chaves de configuracao de inimigo =="
node tools/validar_config.mjs

echo
echo "== Layouts de fase =="
node tools/validar_layouts.mjs

echo
echo "== Build de producao =="
npx vite build >/dev/null
rm -rf dist
echo "  ok"
