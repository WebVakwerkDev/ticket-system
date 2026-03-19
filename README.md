# Agency OS

Interne managementapp voor klanten, projecten, logboeknotities, offertes, facturen en documentatie.

## Stack

- **Next.js 15** (App Router, Server Actions)
- **TypeScript**
- **Prisma 6** + PostgreSQL 16
- **Tailwind CSS 3**
- **NextAuth.js v4** (credentials, JWT)
- **BullMQ** + Redis (achtergrond jobs)
- **Docker Compose** voor deployment

## Snel starten

### 1. Environment instellen

```bash
cp .env.example .env
```

Open `.env` en vul de waarden in. Minimaal nodig:

| Variabele | Wat | Voorbeeld |
|-----------|-----|-----------|
| `POSTGRES_PASSWORD` | Database wachtwoord | `openssl rand -base64 32` |
| `REDIS_PASSWORD` | Redis wachtwoord | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Auth signing key (min 32 chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL van de app | `http://localhost:3000` |
| `INTERNAL_API_KEY` | Bearer key voor interne API | `openssl rand -base64 32` |
| `SEED_ADMIN_EMAIL` | Admin login email | `admin@jouwbedrijf.nl` |
| `SEED_ADMIN_PASSWORD` | Admin login wachtwoord | kies iets sterk |

**Let op:** de `DATABASE_URL` en `REDIS_URL` gebruiken `db` en `redis` als hostname (Docker service names). Als je buiten Docker werkt, gebruik `localhost`.

### 2. Opstarten met Docker

```bash
docker compose up --build
```

Dit start:
- **web** — Next.js app op `http://localhost:3000`
- **worker** — Achtergrond job processor
- **db** — PostgreSQL (bereikbaar op `localhost:5432` in dev)
- **redis** — Redis (bereikbaar op `localhost:6379` in dev)

Database migraties en de initiële seed draaien automatisch via de eenmalige `migrate` container.

### 3. Database handmatig seeden (optioneel)

```bash
docker compose exec web npm run db:seed
```

Dit maakt testdata aan voor klanten, projecten, communicatie, facturen en gebruikers.

### 4. Inloggen

Ga naar `http://localhost:3000/login` en log in met:

| Rol | Email | Wachtwoord |
|-----|-------|------------|
| Admin | `admin@agency.nl` | `admin123!` |
| Developer | `dev@agency.nl` | `employee123!` |
| Finance | `finance@agency.nl` | `finance123!` |

(Of de credentials die je in `.env` hebt ingesteld als `SEED_ADMIN_*`)

## Lokaal ontwikkelen zonder Docker

Als je liever zonder Docker ontwikkelt (bijv. voor snellere hot reload):

```bash
# Zorg dat PostgreSQL en Redis lokaal draaien, of start alleen die via Docker:
docker compose up db redis

# Pas DATABASE_URL en REDIS_URL aan in .env naar localhost
# DATABASE_URL=postgresql://app:WACHTWOORD@localhost:5432/app
# REDIS_URL=redis://:WACHTWOORD@localhost:6379

# Dependencies installeren
npm install

# Prisma client genereren + migraties draaien
npx prisma generate
npx prisma migrate dev

# Seeden
npm run db:seed

# App starten
npm run dev

# Worker starten (apart terminal venster)
npm run worker:dev
```

## Productie (VPS)

```bash
# Zonder de override file (geen ports exposed voor db/redis, nginx actief)
docker compose -f docker-compose.yml --profile prod up -d --build
```

De nginx reverse proxy draait dan op poort 80/443. Configureer SSL in `docker/nginx/nginx.conf` (instructies staan als comments in dat bestand).

## Beschikbare npm scripts

| Script | Wat |
|--------|-----|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run worker` | Start achtergrond worker |
| `npm run worker:dev` | Worker met auto-reload |
| `npm run db:generate` | Prisma client genereren |
| `npm run db:migrate` | Migratie aanmaken (dev) |
| `npm run db:push` | Schema pushen zonder migratie |
| `npm run db:seed` | Database seeden |
| `npm run db:studio` | Prisma Studio (database GUI) |
| `npm run db:reset` | Database resetten + opnieuw migreren |

## Project structuur

```
src/
├── actions/           Server actions (alle CRUD operaties)
│   ├── clients.ts
│   ├── projects.ts
│   ├── communication.ts
│   ├── invoices.ts
│   ├── repositories.ts
│   ├── agent-runs.ts
│   ├── proposals.ts
│   ├── docs.ts
│   └── users.ts
├── app/
│   ├── (auth)/login/  Login pagina
│   ├── (dashboard)/   Alle dashboard pagina's
│   │   ├── page.tsx           Dashboard
│   │   ├── clients/           Klanten (lijst, detail, nieuw, bewerk)
│   │   ├── projects/          Projecten (lijst, nieuw, workspace met tabs)
│   │   ├── finance/           Facturen en financiële overzichten
│   │   ├── docs/              Algemene interne documentatie
│   │   └── settings/          Gebruikersbeheer (admin only)
│   └── api/
│       ├── auth/              NextAuth endpoints
│       └── health/            Health check voor Docker
├── components/
│   ├── layout/        Sidebar, header
│   ├── ui/            Badge en andere basis componenten
│   ├── projects/      Project tabs, status badges
│   ├── proposals/     Offerteconcepten per project
│   ├── docs/          Algemene en klant-specifieke documentatie
│   ├── communication/ Communicatie formulier en lijst
│   ├── repositories/  Repository formulier
│   └── timeline/      Audit log timeline
├── lib/
│   ├── auth.ts        NextAuth configuratie + helpers
│   ├── db.ts          Prisma client singleton
│   ├── env.ts         Centrale env validatie
│   ├── logger.ts      Veilige applicatielogging
│   ├── utils.ts       Formatting, slug generatie, etc.
│   ├── audit.ts       Audit log helper
│   ├── queue.ts       BullMQ queue client
│   └── validations/   Zod schema's per entiteit
├── worker/
│   ├── index.ts       Worker entry point
│   └── jobs/          Job handlers (briefing, invoice reminder, github sync)
└── middleware.ts      Auth middleware (redirect naar /login)

prisma/
├── schema.prisma      Database schema
└── seed.ts            Test data

docker/
└── nginx/
    └── nginx.conf     Reverse proxy configuratie

scripts/
├── migrate-and-seed.sh  Runtime migratie + eenmalige seed
└── seed-db.sh          Database seed script
```

## Docker services

| Service | Image | Poort (dev) | Poort (prod) |
|---------|-------|-------------|--------------|
| web | Custom (Dockerfile) | 3000 | intern |
| worker | Custom (Dockerfile.worker) | — | — |
| db | postgres:16-alpine | 5432 | intern |
| redis | redis:7-alpine | 6379 | intern |
| nginx | nginx:1.27-alpine | — | 80, 443 |

"Intern" = alleen bereikbaar binnen het Docker netwerk, niet van buitenaf.

## Gebruikersrollen

| Rol | Rechten |
|-----|---------|
| **ADMIN** | Alles + gebruikersbeheer + instellingen |
| **EMPLOYEE** | Projecten, klanten, communicatie en docs |
| **FINANCE** | Facturen, BTW overzicht, klanten |

## Handige commando's

```bash
# Logs bekijken
docker compose logs -f web
docker compose logs -f worker

# Database backup
docker compose exec db pg_dump -U app app > backup.sql

# Database restore
docker compose exec -T db psql -U app app < backup.sql

# Prisma Studio (database GUI) — draai lokaal, niet in Docker
npx prisma studio

# Eén service herstarten
docker compose restart web
docker compose restart worker

# Alles stoppen
docker compose down

# Alles stoppen + volumes verwijderen (database wissen!)
docker compose down -v
```
