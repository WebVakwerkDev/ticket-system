# WebVakwerk Ticket System

Intern systeem voor WebVakwerk om leads, projecten en tickets te beheren — van intake tot oplevering.

---

## Opstarten

Het makkelijkste is via het `dev.sh` script. Je hebt alleen Docker nodig.

```bash
./dev.sh start
```

Hiermee starten automatisch: PostgreSQL, Redis en de webapplicatie op poort **3000**.

### Alle commando's

```bash
./dev.sh start          # Start alle containers
./dev.sh stop           # Stop containers (data bewaard)
./dev.sh restart        # Herstart alleen de web container
./dev.sh rebuild        # Bouw image opnieuw + herstart
./dev.sh logs           # Volg web logs live
./dev.sh logs db        # Volg database logs
./dev.sh status         # Containerstatus + health check
./dev.sh db             # Open psql shell
./dev.sh push-schema    # Sync Prisma schema zonder rebuild
./dev.sh down           # Verwijder containers (volumes bewaard)
```

---

## Eerste keer instellen

### 1. Omgevingsvariabelen

```bash
cp .env.example .env
```

Open `.env` en stel minimaal in:

| Variabele | Beschrijving |
|---|---|
| `POSTGRES_PASSWORD` | Wachtwoord voor de database |
| `REDIS_PASSWORD` | Wachtwoord voor Redis |
| `JWT_SECRET` | Minimaal 32 tekens, willekeurige string |
| `REFRESH_TOKEN_SECRET` | Minimaal 32 tekens, willekeurige string |
| `SEED_ADMIN_EMAIL` | E-mailadres van de eerste beheerder |
| `SEED_ADMIN_PASSWORD` | Wachtwoord van de eerste beheerder |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | 32-byte hex string (64 tekens) voor tokenversleuteling |

Genereer `GITHUB_TOKEN_ENCRYPTION_KEY` met:
```bash
openssl rand -hex 32
```

### 2. Starten

```bash
./dev.sh start
```

### 3. Inloggen

Ga naar **http://localhost:3000** en log in met het e-mailadres en wachtwoord uit `.env`.

---

## Updates uitrollen

```bash
git pull
./dev.sh rebuild
```

Als het schema is gewijzigd maar je niet wil rebuilden:

```bash
./dev.sh push-schema
./dev.sh restart
```

---

## GitHub integratie

Repositories koppel je via **Instellingen → GitHub Connections**. Per repository sla je een Personal Access Token (PAT) op:

**Benodigde permissies (fine-grained PAT):**
- Contents: read/write
- Pull requests: read/write
- Issues: read/write

Het token wordt gevalideerd tegen de GitHub API en versleuteld opgeslagen (AES-256-GCM).

---

## Technische details

| Onderdeel | Technologie |
|---|---|
| Frontend + Backend | Next.js 15 (App Router) |
| Database | PostgreSQL 16 |
| Cache / Rate limiting | Redis 7 |
| Authenticatie | JWT (15 min access token + 7 dagen refresh) |
| ORM | Prisma |
| Styling | Tailwind CSS |

### Rollen

| Rol | Toegang |
|---|---|
| `SUPER_ADMIN` | Alles |
| `ADMIN` | Alles behalve gebruikers verwijderen |
| `PROJECT_MANAGER` | Projecten, tickets, klanten, leads lezen |
| `DEVELOPER` | Toegewezen tickets, projecten lezen |
| `SALES` | Leads, klanten, projecten lezen |

### Projectstructuur

```
apps/web/           — Next.js applicatie (routes, API, UI)
packages/db/        — Prisma schema
docker-compose.yml
dev.sh              — Helper script
.env                — Configuratie (nooit committen!)
```

### API endpoints

Alle endpoints zitten onder `/api/v1/`:

| Method | Pad | Beschrijving |
|---|---|---|
| POST | `/auth/login` | Inloggen |
| POST | `/auth/logout` | Uitloggen |
| GET/POST | `/tickets` | Tickets |
| GET/POST | `/projects` | Projecten |
| GET/POST | `/leads` | Leads |
| GET/POST | `/clients` | Klanten |
| GET | `/dashboard` | Dashboard statistieken |
| GET | `/notifications` | Meldingen |
| GET/POST | `/api-keys` | API-sleutels beheren |
| GET/POST | `/github/connections` | GitHub repositories beheren |
| GET/POST | `/tickets/:id/agent-runs` | Agent runs starten en opvragen |
