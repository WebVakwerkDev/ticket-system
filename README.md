# WebVakwerk Ticket System

Intern systeem voor WebVakwerk om leads, projecten en tickets te beheren — van intake tot oplevering.

---

## Opstarten (Docker)

Dit is de enige manier om de applicatie te draaien in productie. Je hebt alleen Docker nodig.

### 1. Eerste keer instellen

**Kopieer het voorbeeld-envbestand en vul het in:**

```bash
cp .env.example .env
```

Open `.env` en stel minimaal in:

| Variabele | Beschrijving |
|---|---|
| `POSTGRES_PASSWORD` | Wachtwoord voor de database (kies iets sterks) |
| `REDIS_PASSWORD` | Wachtwoord voor Redis |
| `JWT_SECRET` | Minimaal 32 tekens, willekeurige string |
| `REFRESH_TOKEN_SECRET` | Minimaal 32 tekens, willekeurige string |
| `SEED_ADMIN_EMAIL` | E-mailadres van de eerste beheerder |
| `SEED_ADMIN_PASSWORD` | Wachtwoord van de eerste beheerder |

**Start de containers:**

```bash
docker compose up -d
```

Dit start automatisch:
- De database (PostgreSQL)
- Redis (voor rate limiting)
- De webapplicatie op poort 3000

**Maak de databasetabellen aan:**

```bash
# Voer dit eenmalig uit na de eerste start
docker compose run --rm migrate
```

Als je een foutmelding krijgt dat er geen migraties zijn, gebruik dan:

```bash
source .env
docker run --rm \
  --network webvakwerk-ticket_internal \
  -e DATABASE_URL="postgresql://app:${POSTGRES_PASSWORD}@db:5432/app" \
  --entrypoint node \
  webvakwerk-ticket-migrate:latest \
  /app/node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js \
  db push --schema=/app/packages/db/prisma/schema.prisma --skip-generate
```

**Vul de database met de eerste beheerder en voorbeelddata:**

```bash
source .env
docker exec \
  -e DATABASE_URL="postgresql://app:${POSTGRES_PASSWORD}@db:5432/app" \
  -e SEED_ADMIN_EMAIL="${SEED_ADMIN_EMAIL}" \
  -e SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD}" \
  -e SEED_ADMIN_NAME="${SEED_ADMIN_NAME:-Admin}" \
  webvakwerk-ticket-web-1 \
  node -e "
const { PrismaClient } = require('/app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');
const bcrypt = require('/app/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs');
const db = new PrismaClient();
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) { console.log('Beheerder bestaat al: ' + email); return; }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { email, name, passwordHash, role: 'SUPER_ADMIN' } });
  console.log('Beheerder aangemaakt: ' + user.email);
}
main().catch(console.error).finally(() => db.\$disconnect());
"
```

**Open de applicatie:**

```
http://localhost:3000
```

Log in met het e-mailadres en wachtwoord uit je `.env`.

---

### Dagelijks gebruik (al eerder opgestart)

```bash
# Starten
docker compose up -d

# Stoppen
docker compose down

# Status bekijken
docker compose ps

# Logs bekijken
docker compose logs -f web
```

---

### Updates uitrollen

```bash
# Stop de containers
docker compose down

# Bouw de nieuwe image
docker compose build

# Start opnieuw
docker compose up -d
```

---

## Verificatie

Controleer of alles werkt:

```bash
# Health check
curl http://localhost:3000/api/health
# Verwachte output: {"status":"ok","timestamp":"..."}

# Status van containers
docker compose ps
# Alle services moeten "(healthy)" tonen
```

---

## Technische details

| Onderdeel | Technologie |
|---|---|
| Frontend + Backend | Next.js 15 (App Router) |
| Database | PostgreSQL 16 |
| Cache / Rate limiting | Redis 7 |
| Authenticatie | JWT (15 min access token + 7 dagen refresh) |
| ORM | Prisma |
| Styling | Tailwind CSS + shadcn/ui |

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
apps/web/        — Next.js applicatie (routes, API, UI)
packages/db/     — Prisma schema
docker-compose.yml
.env             — Configuratie (nooit committen!)
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
