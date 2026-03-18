#!/usr/bin/env bash
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${BLUE}▶${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

# ─── Helpers ──────────────────────────────────────────────────────────────────
check_deps() {
  for cmd in docker; do
    if ! command -v "$cmd" &>/dev/null; then
      error "$cmd is niet geïnstalleerd."
      exit 1
    fi
  done
  if ! docker compose version &>/dev/null; then
    error "Docker Compose (v2) is niet beschikbaar."
    exit 1
  fi
}

ensure_env() {
  if [[ ! -f .env ]]; then
    if [[ -f .env.example ]]; then
      warn ".env niet gevonden — wordt aangemaakt vanuit .env.example"
      cp .env.example .env
      warn "Pas .env aan voordat je de applicatie start."
    else
      error ".env en .env.example ontbreken allebei."
      exit 1
    fi
  fi
}

wait_healthy() {
  local service="$1"
  local max=30
  local i=0
  while [[ $i -lt $max ]]; do
    status=$(docker compose ps --format json "$service" 2>/dev/null \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',''))" 2>/dev/null || echo "")
    [[ "$status" == "healthy" ]] && return 0
    sleep 2
    (( i++ ))
  done
  return 1
}

# ─── Commands ─────────────────────────────────────────────────────────────────

cmd_start() {
  header "🚀  Applicatie starten"
  check_deps
  ensure_env

  info "Containers starten..."
  docker compose up -d

  info "Wachten tot web container healthy is..."
  if wait_healthy web; then
    success "Applicatie draait op http://localhost:3000"
  else
    warn "Container is nog niet healthy — check logs met: ./dev.sh logs"
  fi
}

cmd_stop() {
  header "⏹  Applicatie stoppen"
  check_deps
  docker compose stop
  success "Gestopt (data bewaard)"
}

cmd_down() {
  header "🗑  Containers verwijderen"
  check_deps
  docker compose down
  success "Containers verwijderd (volumes bewaard)"
}

cmd_restart() {
  header "🔄  Herstarten"
  check_deps
  docker compose restart web
  success "Web container herstart"
}

cmd_build() {
  header "🔨  Image bouwen"
  check_deps
  ensure_env
  info "Bouwen (dit kan even duren)..."
  docker compose build
  success "Build klaar"
}

cmd_rebuild() {
  header "🔨  Opnieuw bouwen en opstarten"
  check_deps
  ensure_env
  info "Bouwen..."
  docker compose build
  info "Opnieuw opstarten..."
  docker compose up -d
  success "Klaar — http://localhost:3000"
}

cmd_logs() {
  check_deps
  local service="${1:-web}"
  docker compose logs -f "$service"
}

cmd_status() {
  check_deps
  header "📊  Status"
  docker compose ps
  echo ""
  info "Health check:"
  curl -s http://localhost:3000/api/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('  status:', d.get('status','?'))" 2>/dev/null || warn "App reageert niet op localhost:3000"
}

cmd_db() {
  check_deps
  header "🗄  Database shell"
  local pw
  pw=$(grep POSTGRES_PASSWORD .env 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'")
  docker exec -it webvakwerk-ticket-db-1 psql -U app -d app
}

cmd_push_schema() {
  header "🔄  Schema synchroniseren met database"
  check_deps
  docker compose run --rm migrate
  success "Schema bijgewerkt"
}

cmd_help() {
  echo -e "${BOLD}WebVakwerk Ticket System — dev helper${RESET}"
  echo ""
  echo "Gebruik: ./dev.sh <commando>"
  echo ""
  echo "Commando's:"
  echo "  start          Start alle containers"
  echo "  stop           Stop containers (data bewaard)"
  echo "  restart        Herstart alleen de web container"
  echo "  down           Verwijder containers (volumes bewaard)"
  echo "  build          Bouw Docker image opnieuw"
  echo "  rebuild        Bouw + herstart in één stap"
  echo "  logs [service] Volg logs (standaard: web)"
  echo "  status         Toon containerstatus + health check"
  echo "  db             Open database shell (psql)"
  echo "  push-schema    Sync Prisma schema naar DB (zonder rebuild)"
  echo "  help           Toon dit overzicht"
}

# ─── Dispatch ─────────────────────────────────────────────────────────────────

cd "$(dirname "$0")"

case "${1:-help}" in
  start)        cmd_start ;;
  stop)         cmd_stop ;;
  restart)      cmd_restart ;;
  down)         cmd_down ;;
  build)        cmd_build ;;
  rebuild)      cmd_rebuild ;;
  logs)         cmd_logs "${2:-web}" ;;
  status)       cmd_status ;;
  db)           cmd_db ;;
  push-schema)  cmd_push_schema ;;
  help|--help)  cmd_help ;;
  *)
    error "Onbekend commando: $1"
    echo ""
    cmd_help
    exit 1
    ;;
esac
