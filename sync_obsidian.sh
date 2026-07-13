#!/usr/bin/env bash
# sync_obsidian.sh — Sincroniza docs do AmigoSecreto → Obsidian vault
# Uso: ./sync_obsidian.sh [--dry-run]
# Convencão de nomes no vault: path/to/file.md → path__to__file.md (plano)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT="${HOME}/Obsidian/Memorias/AmigoSecreto/docs"
DRY_RUN=false
COPIED=0
SKIPPED=0

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# ── Cores ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

log_copy()  { echo -e "${GREEN}  ✓ COPY${RESET}  $1 → $2"; }
log_skip()  { echo -e "${YELLOW}  · SKIP${RESET}  $1 (sem mudanças)"; }
log_dry()   { echo -e "${CYAN}  ~ DRY ${RESET}  $1 → $2"; }

# ── Função de sync de arquivo ──────────────────────────────────────
sync_file() {
  local src="$1"
  local vault_name="$2"
  local dest="$VAULT/$vault_name"

  if [[ ! -f "$src" ]]; then
    echo "  ⚠ MISSING  $src"
    return
  fi

  if $DRY_RUN; then
    log_dry "$src" "$vault_name"
    ((COPIED++)) || true
    return
  fi

  # Só copia se o conteúdo for diferente
  if [[ -f "$dest" ]] && cmp -s "$src" "$dest"; then
    log_skip "$vault_name"
    ((SKIPPED++)) || true
  else
    cp "$src" "$dest"
    log_copy "$(realpath --relative-to="$PROJECT_ROOT" "$src")" "$vault_name"
    ((COPIED++)) || true
  fi
}

# ── Início ──────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo -e "${CYAN}  AmigoSecreto → Obsidian Sync${RESET}"
$DRY_RUN && echo -e "${YELLOW}  [DRY-RUN — nenhum arquivo será gravado]${RESET}"
echo -e "${CYAN}  Vault: $VAULT${RESET}"
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo ""

mkdir -p "$VAULT"

# ── Constituição ───────────────────────────────────────────────────
sync_file "$PROJECT_ROOT/agent.md"                           "agent.md"

# ── Documentação central ───────────────────────────────────────────
sync_file "$PROJECT_ROOT/docs/docs_for_llm.md"              "docs__docs_for_llm.md"

# ── Módulos ────────────────────────────────────────────────────────
MODULES_DIR="$PROJECT_ROOT/docs/modules"
for src_file in "$MODULES_DIR"/*.md; do
  [[ -f "$src_file" ]] || continue
  base="$(basename "$src_file")"
  sync_file "$src_file" "docs__modules__$base"
done

# ── Atualiza data no 00_INDEX.md ──────────────────────────────────
if ! $DRY_RUN; then
  INDEX="$VAULT/00_INDEX.md"
  if [[ -f "$INDEX" ]]; then
    TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"
    sed -i "s/^Sincronizado automaticamente em: .*/Sincronizado automaticamente em: $TIMESTAMP/" "$INDEX" 2>/dev/null || true
    # Se a linha não existir no formato esperado, atualiza qualquer linha com "Atualizado em:"
    sed -i "s/^Atualizado em: .*/Atualizado em: $TIMESTAMP/" "$INDEX" 2>/dev/null || true
  fi
fi

# ── Resumo ─────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
if $DRY_RUN; then
  echo -e "  ${CYAN}DRY-RUN:${RESET} $COPIED arquivo(s) seriam copiados"
else
  echo -e "  ${GREEN}✓ Sync concluído${RESET}"
  echo -e "  Copiados : $COPIED"
  echo -e "  Sem mudança: $SKIPPED"
fi
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo ""
