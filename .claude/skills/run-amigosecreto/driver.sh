#!/usr/bin/env bash
# Driver for running AmigoSecreto locally (frontend + backend) and smoke-testing it.
# Usage:
#   ./driver.sh start   — launch frontend (5173) + backend adapter (3001) in background
#   ./driver.sh smoke   — curl-based smoke test against the running backend
#   ./driver.sh stop    — kill both background processes
#   ./driver.sh status  — show whether each is up
#
# Run from anywhere; paths are resolved relative to this script's location.

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
BACKEND_DIR="$REPO_ROOT/backend"
PIDFILE_DIR="/tmp/amigosecreto-run-skill"
mkdir -p "$PIDFILE_DIR"

FRONTEND_LOG="$PIDFILE_DIR/frontend.log"
BACKEND_LOG="$PIDFILE_DIR/backend.log"
FRONTEND_PIDFILE="$PIDFILE_DIR/frontend.pid"
BACKEND_PIDFILE="$PIDFILE_DIR/backend.pid"

start() {
  echo "Starting backend (local-api-server, port 3001, using backend/.env)..."
  (cd "$BACKEND_DIR" && nohup npx tsx --env-file=.env "$SKILL_DIR/local-api-server.ts" > "$BACKEND_LOG" 2>&1 &)
  sleep 2
  pgrep -f "local-api-server.ts" | tail -1 > "$BACKEND_PIDFILE" || true

  echo "Starting frontend (vite, port 5173 — must match backend/.env APP_ORIGIN for CORS)..."
  (cd "$FRONTEND_DIR" && nohup npx vite --port 5173 > "$FRONTEND_LOG" 2>&1 &)
  sleep 2
  pgrep -f "vite --port 5173" | tail -1 > "$FRONTEND_PIDFILE" || true

  status
}

status() {
  if curl -s -o /dev/null -w '' http://localhost:3001/api/chat 2>/dev/null; then
    echo "backend  (localhost:3001): UP"
  else
    echo "backend  (localhost:3001): DOWN — see $BACKEND_LOG"
  fi
  if curl -s -o /dev/null -w '' http://localhost:5173/ 2>/dev/null; then
    echo "frontend (localhost:5173): UP"
  else
    echo "frontend (localhost:5173): DOWN — see $FRONTEND_LOG"
  fi
}

smoke() {
  echo "--- GET /api/chat without token (expect ok:false, Token invalido) ---"
  curl -s http://localhost:3001/api/chat
  echo
  echo "--- GET / on frontend (expect HTTP 200) ---"
  curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://localhost:5173/
}

stop() {
  # pkill kills the right targets here but the invocation itself can still
  # report a nonzero/odd exit (observed: 144) — that is not a failure signal
  # in this environment, so don't let it abort the script.
  pkill -f "local-api-server.ts" 2>/dev/null || true
  pkill -f "vite --port 5173" 2>/dev/null || true
  rm -f "$BACKEND_PIDFILE" "$FRONTEND_PIDFILE"
  echo "Stopped (best effort)."
}

case "${1:-}" in
  start) start ;;
  smoke) smoke ;;
  stop) stop ;;
  status) status ;;
  *) echo "Usage: $0 {start|smoke|stop|status}"; exit 1 ;;
esac
