# ZZP Boekhouding: Uren, Uitgaven & BTW-aangifte

## Doel

Drie ontbrekende ZZP-boekhoudfeatures toevoegen aan het bestaande systeem:
1. **Urenregistratie** per project (richting 1.225 uur/jaar voor zelfstandigenaftrek)
2. **Zakelijke uitgaven** als algemene boekhoudlijst (niet projectgebonden)
3. **BTW-kwartaaloverzicht** uitbreiden met inkoop-BTW voor kwartaalaangifte

## 1. Urenregistratie

### Database model: `TimeEntry` (tabel `time_entries`)

| Kolom | Type | Nullable | Omschrijving |
|-------|------|----------|--------------|
| id | String(36) PK | nee | UUID |
| user_id | String(36) FK users.id | nee | Wie |
| project_id | String(36) FK project_workspaces.id | nee | Welk project |
| date | Date | nee | Werkdatum |
| hours | Numeric(5,2) | nee | Aantal uren (bijv. 7.5) |
| description | Text | ja | Wat gedaan |
| created_at / updated_at | DateTime(tz) | nee | Timestamps |

### API endpoints

- `GET /api/v1/time-entries?start_date=&end_date=&project_id=` — lijst met filters
- `POST /api/v1/time-entries` — nieuwe entry
- `PUT /api/v1/time-entries/{id}` — wijzig
- `DELETE /api/v1/time-entries/{id}` — verwijder
- `GET /api/v1/time-entries/summary?year=` — jaartotaal + per maand + per project

### Frontend

- Nieuwe pagina **"Uren"** in navigatie
- Lijstweergave met datum, project, uren, omschrijving
- Snel invoerformulier: project kiezen, datum, uren, omschrijving
- Filters op datum en project
- Bovenaan: totaal uren dit jaar + voortgangsindicator richting 1.225
- Dashboard widget: uren dit jaar / 1.225

## 2. Zakelijke Uitgaven

### Database model: `Expense` (tabel `expenses`)

| Kolom | Type | Nullable | Omschrijving |
|-------|------|----------|--------------|
| id | String(36) PK | nee | UUID |
| description | String(500) | nee | Aanschafnaam |
| invoice_number | String(100) | ja | Factuurnummer ter identificatie |
| amount_incl_vat | Numeric(10,2) | nee | Bedrag inclusief BTW |
| vat_rate | Numeric(5,2) | nee | BTW-tarief (21, 9, 0) |
| amount_excl_vat | Numeric(10,2) | nee | Berekend: incl / (1 + tarief/100) |
| vat_amount | Numeric(10,2) | nee | Berekend: incl - excl |
| date | Date | nee | Aankoopdatum |
| created_at / updated_at | DateTime(tz) | nee | Timestamps |

### API endpoints

- `GET /api/v1/expenses?start_date=&end_date=&year=&quarter=` — lijst met filters
- `POST /api/v1/expenses` — nieuwe uitgave (server berekent excl + vat_amount)
- `PUT /api/v1/expenses/{id}` — wijzig
- `DELETE /api/v1/expenses/{id}` — verwijder

### Frontend

- Nieuwe pagina **"Uitgaven"** in navigatie
- Tabel met alle uitgaven (datum, aanschafnaam, factuurnummer, bedrag incl, BTW, bedrag excl)
- Invoerformulier: aanschafnaam, factuurnummer, bedrag incl BTW, BTW-tarief dropdown (21%/9%/0%)
- Automatische preview van berekende BTW en bedrag excl BTW

## 3. BTW-kwartaaloverzicht (uitbreiding)

### Uitbreiding bestaande finance router

Bestaand endpoint `GET /api/v1/finance/overview` uitbreiden met:
- **Ontvangen BTW** per kwartaal (al aanwezig, uit betaalde facturen)
- **Betaalde BTW** per kwartaal (nieuw, uit expenses)
- **Af te dragen BTW** = ontvangen - betaald

### Frontend uitbreiding FinanceView

Het bestaande BTW-kwartaaloverzicht uitbreiden:
- Per kwartaal drie kolommen: Ontvangen BTW | Betaalde BTW (inkoop) | Af te dragen
- Totaalrij voor het hele jaar

## Architectuur

Volgt bestaande patronen:
- Backend: FastAPI router + Pydantic schemas + SQLAlchemy model
- Frontend: Vue 3 view met PrimeVue componenten
- Alembic migratie voor nieuwe tabellen
- RBAC: ADMIN en FINANCE rollen hebben toegang

## Buiten scope

- Bonnetjes/bijlagen uploaden
- Automatische bankimport
- Volledige boekhoudsoftware-integratie
- Categorieen voor uitgaven (kan later)
