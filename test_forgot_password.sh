#!/usr/bin/env bash
# test_forgot_password.sh — Testa o fluxo completo de Forgot Password
# Uso:
#   ./test_forgot_password.sh                    → usa email padrão do .env
#   ./test_forgot_password.sh --email x@y.com   → usa email informado
#   ./test_forgot_password.sh --token <TOKEN>    → testa reset com token
#   ./test_forgot_password.sh --migrate          → roda migrate_v5 no servidor

set -euo pipefail

API="https://api.secretsanta.mercadocompleto.com.br"
EMAIL=""
TOKEN=""
MIGRATE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --email)   EMAIL="${2:-}"; shift ;;
    --token)   TOKEN="${2:-}"; shift ;;
    --migrate) MIGRATE=true ;;
    *) ;;
  esac
  shift
done

# ── Cores ──────────────────────────────────────────────────────────
OK='\033[0;32m✓\033[0m'; FAIL='\033[0;31m✗\033[0m'
BOLD='\033[1m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RESET='\033[0m'

pass() { echo -e "  ${OK}  $*"; }
fail() { echo -e "  ${FAIL}  $*"; }
info() { echo -e "  ${CYAN}ℹ${RESET}  $*"; }
sep()  { echo -e "${CYAN}──────────────────────────────────────${RESET}"; }

echo ""
echo -e "${BOLD}══════════════════════════════════════${RESET}"
echo -e "${BOLD}  TESTE: Forgot Password · AmigoSecreto${RESET}"
echo -e "${BOLD}  API: ${API}${RESET}"
echo -e "${BOLD}══════════════════════════════════════${RESET}"
echo ""

# ── ETAPA 0: Migration ─────────────────────────────────────────────
if $MIGRATE; then
  sep
  echo -e "${BOLD}[ETAPA 0] Executando migrate_v5.php no servidor${RESET}"
  MIGRATE_RESP=$(curl -s "${API}/migrate_v5.php")
  echo "  Resposta: $MIGRATE_RESP"
  if echo "$MIGRATE_RESP" | grep -q "concluida\|sucesso\|Aviso"; then
    pass "Migração executada (verifique a resposta acima)"
  else
    fail "Resposta inesperada — verifique manualmente"
  fi
  echo ""
fi

# ── ETAPA 1: Solicitar link de reset ──────────────────────────────
if [[ -z "$TOKEN" ]]; then
  sep
  echo -e "${BOLD}[ETAPA 1] POST /admin_forgot_password.php${RESET}"

  if [[ -z "$EMAIL" ]]; then
    # usa o email SMTP do .env como fallback de teste (é um admin cadastrado)
    EMAIL=$(grep SMTP_FROM /home/dsktop-cwmlq04/projects/AmigoSecreto/.env 2>/dev/null \
      | head -1 | cut -d= -f2 | tr -d '"' | tr -d ' ') || true
    [[ -z "$EMAIL" ]] && EMAIL="charles@inmade.com.br"
    info "Email não informado. Usando: ${EMAIL}"
    info "Use --email seu@email.com para testar com outro endereço"
  fi

  echo ""
  RESP=$(curl -s -X POST "${API}/admin_forgot_password.php" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${EMAIL}\"}")

  echo "  Payload: {\"email\": \"${EMAIL}\"}"
  echo "  Resposta: $RESP"
  echo ""

  OK_VAL=$(echo "$RESP" | grep -o '"ok":true' || true)
  MSG_VAL=$(echo "$RESP" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 || true)

  if [[ -n "$OK_VAL" ]]; then
    pass "Endpoint respondeu {ok: true}"
    [[ -n "$MSG_VAL" ]] && info "Mensagem: $MSG_VAL"
    echo ""
    echo -e "${YELLOW}  → Próximo passo:${RESET}"
    echo "    1. Verifique a caixa de entrada de: ${EMAIL}"
    echo "    2. Verifique também o spam"
    echo "    3. Copie o token da URL no e-mail (?token=XXXXX)"
    echo "    4. Execute: ./test_forgot_password.sh --token <TOKEN>"
  else
    fail "Resposta inesperada — verifique abaixo"
    echo "  Raw: $RESP"
  fi
  echo ""
  exit 0
fi

# ── ETAPA 2: Redefinir senha com token ────────────────────────────
sep
echo -e "${BOLD}[ETAPA 2] POST /admin_reset_password.php${RESET}"
NEW_PASS="Teste@1234"

RESP=$(curl -s -X POST "${API}/admin_reset_password.php" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"${TOKEN}\", \"password\": \"${NEW_PASS}\"}")

echo "  Token : ${TOKEN:0:20}... (truncado)"
echo "  Nova senha de teste: ${NEW_PASS}"
echo "  Resposta: $RESP"
echo ""

OK_VAL=$(echo "$RESP" | grep -o '"ok":true' || true)
ERR_VAL=$(echo "$RESP" | grep -o '"error":"[^"]*"' | cut -d'"' -f4 || true)

if [[ -n "$OK_VAL" ]]; then
  pass "Senha redefinida com sucesso!"
  echo ""
  echo -e "${YELLOW}  → Próximo passo:${RESET}"
  echo "    1. Acesse: https://secretsanta.mercadocompleto.com.br"
  echo "    2. Login com email + nova senha: ${NEW_PASS}"
  echo "    3. Após confirmar, troque para uma senha definitiva"
elif [[ -n "$ERR_VAL" ]]; then
  fail "Erro: ${ERR_VAL}"
  if echo "$ERR_VAL" | grep -q "invalido\|expirado"; then
    info "Token inválido ou expirado (1h). Solicite um novo link."
    info "Execute: ./test_forgot_password.sh --email SEU@EMAIL.COM"
  fi
else
  fail "Resposta inesperada: $RESP"
fi

echo ""
echo -e "${BOLD}══════════════════════════════════════${RESET}"
echo ""
