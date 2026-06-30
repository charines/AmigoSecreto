#!/usr/bin/env bash
# preflight.sh — Executa o Preflight Obrigatório do AmigoSecreto antes de codificar
# Uso:
#   ./preflight.sh                   → verifica tudo, build incluído
#   ./preflight.sh --no-build        → pula npm build (mais rápido)
#   ./preflight.sh --module <nome>   → mostra drift apenas do módulo informado
#   ./preflight.sh --sync            → executa sync Obsidian ao final
#
# Saída: relatório de itens ✓ / ✗ / ⚠ com instruções do que corrigir.

set -euo pipefail

# ── Configuração ───────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKIP_BUILD=false
SYNC_OBSIDIAN=false
MODULE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build)    SKIP_BUILD=true ;;
    --sync)        SYNC_OBSIDIAN=true ;;
    --module)      MODULE="${2:-}"; shift ;;
    *) ;;
  esac
  shift
done

# ── Cores ──────────────────────────────────────────────────────────
OK='\033[0;32m✓\033[0m'
FAIL='\033[0;31m✗\033[0m'
WARN='\033[1;33m⚠\033[0m'
INFO='\033[0;36mℹ\033[0m'
BOLD='\033[1m'
RESET='\033[0m'

ERRORS=0
pass() { echo -e "  ${OK}  $*"; }
fail() { echo -e "  ${FAIL}  $*"; ((ERRORS++)) || true; }
warn() { echo -e "  ${WARN}  $*"; }
info() { echo -e "  ${INFO}  $*"; }

# ── Módulos → arquivos de domínio (para drift check) ──────────────
declare -A MODULE_FILES
MODULE_FILES["portaria_auth"]="src/components/AdminAuth.jsx src/App.jsx api/admin_login.php api/admin_me.php api/admin_logout.php api/admin_register.php"
MODULE_FILES["orquestrador_grupo"]="src/components/AdminDashboard.jsx src/components/InvitePage.jsx src/components/JoinGroup.jsx api/groups_create.php api/groups_invite.php api/groups_list.php api/groups_detail.php api/groups_delete.php api/participants_delete.php api/participants_resend_invite.php"
MODULE_FILES["juiz_sorteio"]="src/components/RevealPage.jsx src/components/RevealStep.jsx src/lib/crypto.js src/utils/secretSanta.js api/groups_draw.php api/reveal.php api/reveal_confirm.php api/participants_resend_draw.php"
MODULE_FILES["chat_anonimo"]="src/components/ChatAnonimo.jsx api/chat_get.php api/chat_send.php"
MODULE_FILES["menu_inicial"]="src/App.jsx src/components/InvitePage.jsx src/components/JoinGroup.jsx src/components/AdminDashboard.jsx"
MODULE_FILES["dependencias_react"]="src/App.jsx src/main.jsx src/lib/api.js src/lib/crypto.js src/index.css"

# ── Header ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  PREFLIGHT · AmigoSecreto v1.5              ${RESET}"
echo -e "${BOLD}══════════════════════════════════════════════${RESET}"
echo ""

# ── PASSO 1 · Constituição ────────────────────────────────────────
echo -e "${BOLD}[1/6] Constituição${RESET}"
if [[ -f "$SCRIPT_DIR/agent.md" ]]; then
  pass "agent.md encontrado"
  VERSION=$(grep '^version:' "$SCRIPT_DIR/agent.md" | awk '{print $2}')
  UPDATED=$(grep '^last_updated:' "$SCRIPT_DIR/agent.md" | awk '{print $2}')
  info "  versão $VERSION · atualizado $UPDATED"
else
  fail "agent.md NÃO encontrado — não codifique sem ele"
fi
echo ""

# ── PASSO 2 · Módulos Mermaid ─────────────────────────────────────
echo -e "${BOLD}[2/6] Módulos Mermaid em docs/modules/${RESET}"
MODULES_DIR="$SCRIPT_DIR/docs/modules"
if [[ -d "$MODULES_DIR" ]]; then
  COUNT=$(ls "$MODULES_DIR"/*.md 2>/dev/null | wc -l)
  pass "$COUNT módulos disponíveis:"
  for f in "$MODULES_DIR"/*.md; do
    base=$(basename "$f" .md)
    echo "       • $base"
  done
else
  fail "docs/modules/ não encontrado"
fi
echo ""

# ── PASSO 3 · Drift Check ─────────────────────────────────────────
echo -e "${BOLD}[3/6] Drift Check (git log vs módulo Mermaid)${RESET}"

check_drift() {
  local mod="$1"
  local files="${MODULE_FILES[$mod]:-}"
  [[ -z "$files" ]] && return

  local doc_mtime
  doc_mtime=$(stat -c %Y "$MODULES_DIR/${mod}.md" 2>/dev/null || echo 0)

  local recent_commit
  # shellcheck disable=SC2086
  recent_commit=$(git -C "$SCRIPT_DIR" log --oneline -3 -- $files 2>/dev/null | head -1 || true)

  if [[ -z "$recent_commit" ]]; then
    info "  $mod: sem commits recentes nos arquivos mapeados"
  else
    local commit_hash
    commit_hash=$(echo "$recent_commit" | awk '{print $1}')
    local commit_time
    commit_time=$(git -C "$SCRIPT_DIR" log -1 --format=%ct "$commit_hash" 2>/dev/null || echo 0)

    if [[ "$commit_time" -gt "$doc_mtime" ]]; then
      warn "$mod: código mais novo que o diagrama → atualizar docs/modules/${mod}.md"
      echo "       Último commit: $recent_commit"
    else
      pass "$mod: diagrama sincronizado"
    fi
  fi
}

if [[ -n "$MODULE" ]]; then
  check_drift "$MODULE"
else
  for mod in "${!MODULE_FILES[@]}"; do
    check_drift "$mod"
  done | sort
fi
echo ""

# ── PASSO 4 · Skills ──────────────────────────────────────────────
echo -e "${BOLD}[4/6] Skills de IA${RESET}"
SKILLS_FILE="$MODULES_DIR/skills_catalog.md"
if [[ -f "$SKILLS_FILE" ]]; then
  pass "skills_catalog.md disponível"
  info "  Ativar skill adequada antes de gerar código (ver tabela no arquivo)"
  info "  007 obrigatória para: crypto.js · reveal.php · groups_draw.php · admin_login.php"
else
  warn "skills_catalog.md não encontrado em docs/modules/"
fi
echo ""

# ── PASSO 5 · Impacto de Segurança ───────────────────────────────
echo -e "${BOLD}[5/6] Impacto de Segurança${RESET}"
warn "Verifique manualmente se a task toca algum destes arquivos:"
echo "       crypto.js · reveal.php · groups_draw.php · admin_login.php · db.php"
echo "       → Se SIM: invocar skill 007 antes de qualquer código"
echo ""

# ── PASSO 6 · Build ───────────────────────────────────────────────
echo -e "${BOLD}[6/6] Build Limpo${RESET}"
if $SKIP_BUILD; then
  warn "Build ignorado (--no-build)"
else
  cd "$SCRIPT_DIR"
  if npm run build --silent 2>&1 | grep -q "built in"; then
    pass "npm run build: sucesso"
  else
    echo ""
    npm run build 2>&1 | tail -5
    fail "npm run build falhou — corrija antes de codificar"
  fi
fi
echo ""

# ── Sync Obsidian (opcional) ──────────────────────────────────────
if $SYNC_OBSIDIAN; then
  echo -e "${BOLD}[+] Sync Obsidian${RESET}"
  if [[ -x "$SCRIPT_DIR/sync_obsidian.sh" ]]; then
    bash "$SCRIPT_DIR/sync_obsidian.sh"
  else
    fail "sync_obsidian.sh não encontrado ou sem permissão de execução"
  fi
fi

# ── Resultado Final ───────────────────────────────────────────────
echo -e "${BOLD}══════════════════════════════════════════════${RESET}"
if [[ $ERRORS -eq 0 ]]; then
  echo -e "  ${OK} ${BOLD}Preflight OK — pode codificar${RESET}"
else
  echo -e "  ${FAIL} ${BOLD}$ERRORS erro(s) encontrado(s) — corrija antes de continuar${RESET}"
fi
echo -e "${BOLD}══════════════════════════════════════════════${RESET}"
echo ""

exit $ERRORS
