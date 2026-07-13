#!/usr/bin/env bash
# scripts/snapshot.sh — gera um snapshot COMPLETO do projeto em /tmp/,
# útil para colar em outra conversa/análise externa.
# snapshot-version: 2.0.0
#
# Filosofia: em vez de allowlist de extensões (que sempre esquece alguma),
# inclui TODO arquivo de texto detectado pelo conteúdo (grep -I).
# Binários, segredos e ruído são marcados na saída, mas nunca despejados —
# assim a visão do sistema é completa: sabe-se o que existe e o que foi omitido.
#
# Uso: ./snapshot.sh [diretório]   (padrão: diretório atual)
set -euo pipefail

ALVO="${1:-.}"
cd "$ALVO"

PROJETO="$(basename "$(pwd)")"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT="/tmp/snapshot_${PROJETO}_${TIMESTAMP}.txt"

# Limite por arquivo; maiores que isso são truncados (evita snapshot gigante)
MAX_BYTES=$((200 * 1024))

# Pastas sempre excluídas (build artifacts, dependências, caches)
EXCLUIR_PASTAS=(
  "node_modules" ".git" "dist" "build" "vendor"
  "__pycache__" "coverage" ".next" ".cache" ".vite"
)

# Arquivos excluídos por segurança/ruído (aparecem na saída como [EXCLUÍDO])
EXCLUIR_ARQUIVOS=(
  ".env" ".env.*" "*.pem" "*.key" "id_rsa*" "*.p12" "*.pfx"
  "package-lock.json" "composer.lock" "yarn.lock" "pnpm-lock.yaml"
  "*.min.js" "*.min.css" "*.map"
)

# Exceções: sempre incluídos, mesmo casando com padrão de exclusão acima
INCLUIR_SEMPRE=( ".env.example" )

# Monta os argumentos -path .../nome -prune do find para as pastas excluídas
prune_args=()
for pasta in "${EXCLUIR_PASTAS[@]}"; do
  prune_args+=(-path "*/${pasta}" -prune -o)
done

incluir_sempre() {
  local nome="$1"
  for padrao in "${INCLUIR_SEMPRE[@]}"; do
    # shellcheck disable=SC2053
    [[ "$nome" == $padrao ]] && return 0
  done
  return 1
}

excluir_arquivo() {
  local nome="$1"
  for padrao in "${EXCLUIR_ARQUIVOS[@]}"; do
    # shellcheck disable=SC2053
    [[ "$nome" == $padrao ]] && return 0
  done
  return 1
}

# Detecta arquivo de texto pelo CONTEÚDO (não pelo nome):
# grep -I ignora binários; arquivo vazio conta como texto.
eh_texto() {
  [[ ! -s "$1" ]] && return 0
  grep -Iq . "$1" 2>/dev/null
}

{
  echo "# Snapshot: ${PROJETO}"
  echo "# Gerado em: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "# Raiz: $(pwd)"
  echo

  echo "## Árvore de diretórios"
  echo
  find . "${prune_args[@]}" -print 2>/dev/null | sort
  echo

  echo "## Conteúdo dos arquivos"
  echo

  find . "${prune_args[@]}" -type f -print0 2>/dev/null \
    | sort -z \
    | while IFS= read -r -d '' arquivo; do
        nome="$(basename "$arquivo")"

        if ! incluir_sempre "$nome" && excluir_arquivo "$nome"; then
          echo "--- ${arquivo} --- [EXCLUÍDO: segurança/ruído]"
          echo
          continue
        fi

        if ! eh_texto "$arquivo"; then
          echo "--- ${arquivo} --- [BINÁRIO: $(du -h "$arquivo" | cut -f1) — omitido]"
          echo
          continue
        fi

        tamanho="$(stat -c%s "$arquivo")"
        if (( tamanho > MAX_BYTES )); then
          echo "--- ${arquivo} --- [TRUNCADO: ${tamanho} bytes, exibindo os primeiros ${MAX_BYTES}]"
          head -c "$MAX_BYTES" "$arquivo"
          echo
          echo "[... conteúdo truncado ...]"
        else
          echo "--- ${arquivo} ---"
          cat "$arquivo"
        fi
        echo
      done
} > "$OUTPUT"

echo "Snapshot gerado: ${OUTPUT}"
echo "Tamanho: $(du -h "$OUTPUT" | cut -f1)"
echo "Linhas: $(wc -l < "$OUTPUT")"
