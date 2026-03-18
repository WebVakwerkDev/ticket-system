#!/usr/bin/env bash
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

info()    { echo -e "  ${BLUE}▶${RESET} $*"; }
success() { echo -e "  ${GREEN}✓${RESET} $*"; }
warn()    { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
error()   { echo -e "  ${RED}✗${RESET} $*" >&2; }
step()    { echo -e "\n${CYAN}──${RESET} $*"; }
header()  { echo -e "\n${BOLD}$*${RESET}\n"; }
divider() { echo -e "${DIM}────────────────────────────────────────────${RESET}"; }

confirm() {
  echo -e "  ${YELLOW}?${RESET}  $* [j/N] \c"
  read -r antwoord
  [[ "$antwoord" =~ ^[jJyY]$ ]]
}

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
      warn ".env niet gevonden — aanmaken vanuit .env.example"
      cp .env.example .env
      echo ""
      warn "Pas .env aan voor je verder gaat (wachtwoorden, secrets, etc.)."
      warn "Open het bestand: nano .env"
      echo ""
      exit 0
    else
      error ".env ontbreekt en er is geen .env.example beschikbaar."
      exit 1
    fi
  fi
}

wait_healthy() {
  local service="$1"
  local max=40
  local i=0
  echo -ne "  ${BLUE}▶${RESET} Wachten op $service"
  while [[ $i -lt $max ]]; do
    local status
    status=$(docker compose ps --format json "$service" 2>/dev/null \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',''))" 2>/dev/null || echo "")
    if [[ "$status" == "healthy" ]]; then
      echo " ${GREEN}✓${RESET}"
      return 0
    fi
    echo -ne "."
    sleep 2
    (( i++ ))
  done
  echo " ${YELLOW}timeout${RESET}"
  return 1
}

is_first_run() {
  # First run = geen bestaande database volume
  ! docker volume ls --format '{{.Name}}' | grep -q "webvakwerk-ticket_pgdata"
}

# ─── Commands ─────────────────────────────────────────────────────────────────

# Eerste keer opstarten — legt alles uit en doet de volledige setup
cmd_setup() {
  header "🛠   Eerste keer instellen"
  check_deps

  divider
  echo -e "  Dit script installeert en start het WebVakwerk Ticket System."
  echo -e "  Je hebt alleen ${BOLD}Docker${RESET} nodig — er wordt niks op je systeem geïnstalleerd."
  divider

  # Stap 1: .env controleren
  step "Stap 1 — Omgevingsvariabelen"
  if [[ ! -f .env ]]; then
    if [[ -f .env.example ]]; then
      cp .env.example .env
      success ".env aangemaakt vanuit .env.example"
      warn "Controleer .env en pas de wachtwoorden en secrets aan."
      warn "Open het bestand: nano .env"
      echo ""
      if ! confirm "Heb je .env al ingevuld en wil je doorgaan?"; then
        info "Geannuleerd. Pas .env aan en voer './dev.sh setup' opnieuw uit."
        exit 0
      fi
    else
      error ".env en .env.example ontbreken allebei."
      exit 1
    fi
  else
    success ".env gevonden"
  fi

  # Stap 2: image bouwen
  step "Stap 2 — Docker image bouwen"
  info "Dit kan de eerste keer 3–5 minuten duren..."
  docker compose build
  success "Image gebouwd"

  # Stap 3: starten
  step "Stap 3 — Containers starten en database inrichten"
  docker compose up -d
  wait_healthy web || { warn "Web container nog niet healthy. Controleer: ./dev.sh logs"; }

  docker compose logs migrate 2>/dev/null | grep -E "sync|error|Error" | sed 's/^migrate-1  | /  /' || true

  # Klaar
  echo ""
  divider
  success "Installatie voltooid!"
  echo ""
  echo -e "  ${BOLD}Open de applicatie:${RESET}  http://localhost:3000"
  echo -e "  ${BOLD}Inloggen met:${RESET}        het e-mailadres en wachtwoord uit .env"
  echo ""
  echo -e "  Volgende keer opstarten:  ${CYAN}./dev.sh start${RESET}"
  echo -e "  Stoppen:                  ${CYAN}./dev.sh stop${RESET}"
  divider
}

# Normaal starten (data bewaard)
cmd_start() {
  header "🚀  Applicatie starten"
  check_deps
  ensure_env

  if is_first_run; then
    warn "Geen database gevonden. Gebruik './dev.sh setup' voor de eerste keer."
    echo ""
    if confirm "Toch doorgaan met automatische setup?"; then
      cmd_setup
      return
    fi
    exit 0
  fi

  docker compose up -d

  if wait_healthy web; then
    success "Applicatie draait op http://localhost:3000"
  else
    warn "Nog niet healthy — controleer: ./dev.sh logs"
  fi
}

# Update: nieuwe code ophalen, image bouwen, data bewaren
cmd_update() {
  header "🔄  Update uitrollen (data blijft bewaard)"
  check_deps
  ensure_env

  divider
  echo -e "  Dit doet het volgende:"
  echo -e "   1. Nieuwe code ophalen (git pull)"
  echo -e "   2. Docker image opnieuw bouwen"
  echo -e "   3. Database schema bijwerken"
  echo -e "   4. Applicatie herstarten"
  echo -e "   ${GREEN}✓${RESET}  Alle data blijft bewaard"
  divider
  echo ""

  if ! confirm "Doorgaan met de update?"; then
    info "Geannuleerd."
    exit 0
  fi

  step "Code ophalen"
  git pull
  success "Code bijgewerkt"

  step "Image bouwen"
  docker compose build
  success "Image gebouwd"

  step "Containers herstarten"
  docker compose up -d

  if wait_healthy web; then
    success "Update voltooid — http://localhost:3000"
  else
    warn "Web container reageert nog niet. Controleer: ./dev.sh logs"
  fi
}

# Stoppen
cmd_stop() {
  header "⏹   Stoppen"
  check_deps
  docker compose stop
  success "Gestopt — alle data is bewaard"
}

# Herstarten (alleen web)
cmd_restart() {
  header "🔄  Web container herstarten"
  check_deps
  docker compose restart web
  wait_healthy web && success "Herstart voltooid" || warn "Controleer: ./dev.sh logs"
}

# Volledig opruimen — containers + volumes (DATA KWIJT)
cmd_reset() {
  header "⚠️   Volledige reset"
  check_deps

  divider
  echo -e "  ${RED}${BOLD}LET OP: dit verwijdert ALLE data!${RESET}"
  echo -e "  • Database (alle records, gebruikers, projecten, tickets)"
  echo -e "  • Redis cache"
  echo -e "  • Geüploade bestanden"
  echo -e "  • Docker containers en volumes"
  divider
  echo ""

  if ! confirm "${RED}Weet je het zeker? Dit kan niet ongedaan worden gemaakt.${RESET}"; then
    info "Geannuleerd — er is niets verwijderd."
    exit 0
  fi

  if ! confirm "Laatste controle: echt alles verwijderen?"; then
    info "Geannuleerd."
    exit 0
  fi

  docker compose down -v
  success "Reset voltooid — alles is verwijderd"
  echo ""
  info "Gebruik './dev.sh setup' om opnieuw in te stellen."
}

# Logs bekijken
cmd_logs() {
  check_deps
  local service="${1:-web}"
  info "Logs van '$service' (Ctrl+C om te stoppen)..."
  docker compose logs -f "$service"
}

# Status overzicht
cmd_status() {
  check_deps
  header "📊  Status"
  docker compose ps
  echo ""
  divider
  local health
  health=$(curl -s http://localhost:3000/api/health 2>/dev/null)
  if [[ -n "$health" ]]; then
    local status
    status=$(echo "$health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
    if [[ "$status" == "ok" ]]; then
      success "App reageert: ${GREEN}ok${RESET} — http://localhost:3000"
    else
      warn "App reageert maar status is: $status"
    fi
  else
    warn "App reageert niet op localhost:3000"
  fi
  divider
}

# Database shell
cmd_db() {
  check_deps
  header "🗄   Database shell (psql)"
  info "Typ '\\q' om te sluiten, '\\dt' voor tabeloverzicht"
  echo ""
  docker exec -it webvakwerk-ticket-db-1 psql -U app -d app
}

# Schema synchroniseren
cmd_push_schema() {
  header "🔄  Schema synchroniseren"
  check_deps
  docker compose run --rm migrate
  success "Schema bijgewerkt"
}

# Help
cmd_help() {
  echo ""
  echo -e "${BOLD}WebVakwerk Ticket System${RESET}"
  divider
  echo ""
  echo -e "  ${BOLD}Gebruik:${RESET}  ./dev.sh <commando>"
  echo ""
  echo -e "  ${BOLD}Eerste keer:${RESET}"
  echo -e "    ${CYAN}setup${RESET}           Volledige installatie (bouw + start + database)"
  echo ""
  echo -e "  ${BOLD}Dagelijks gebruik:${RESET}"
  echo -e "    ${CYAN}start${RESET}           Start de applicatie (data bewaard)"
  echo -e "    ${CYAN}stop${RESET}            Stop de applicatie (data bewaard)"
  echo -e "    ${CYAN}restart${RESET}         Herstart alleen de web container"
  echo -e "    ${CYAN}status${RESET}          Toon status en health check"
  echo -e "    ${CYAN}logs${RESET} [service]  Volg logs live  (standaard: web)"
  echo ""
  echo -e "  ${BOLD}Updates:${RESET}"
  echo -e "    ${CYAN}update${RESET}          git pull + rebuild + herstart (data bewaard)"
  echo ""
  echo -e "  ${BOLD}Geavanceerd:${RESET}"
  echo -e "    ${CYAN}db${RESET}              Open database shell (psql)"
  echo -e "    ${CYAN}push-schema${RESET}     Sync Prisma schema naar DB zonder rebuild"
  echo -e "    ${CYAN}reset${RESET}           ${RED}Verwijder ALLES inclusief data${RESET} (vraagt bevestiging)"
  echo ""
  divider
  echo ""
  echo -e "  ${DIM}Voorbeelden:${RESET}"
  echo -e "    ${DIM}./dev.sh logs db       — database logs bekijken${RESET}"
  echo -e "    ${DIM}./dev.sh logs migrate  — schema-migratie logs${RESET}"
  echo ""
}

# ─── Dispatch ─────────────────────────────────────────────────────────────────
cd "$(dirname "$0")"

case "${1:-help}" in
  setup)        cmd_setup ;;
  start)        cmd_start ;;
  stop)         cmd_stop ;;
  restart)      cmd_restart ;;
  update)       cmd_update ;;
  reset)        cmd_reset ;;
  logs)         cmd_logs "${2:-web}" ;;
  status)       cmd_status ;;
  db)           cmd_db ;;
  push-schema)  cmd_push_schema ;;
  help|--help)  cmd_help ;;
  *)
    error "Onbekend commando: $1"
    cmd_help
    exit 1
    ;;
esac
