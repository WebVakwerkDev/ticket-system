# Expense Categories & Editing — Design Spec

**Date:** 2026-03-26
**Status:** Approved

## Goal

Add category classification to expenses and full edit capability, enabling a clear cost breakdown per category in the W&V tab. Keep the UI simple and fast to use.

## Categories

Fixed list enforced both client-side and server-side. Two declarations in `backend/app/schemas/expense.py`:

```python
# Runtime constant — used to populate API responses and could be exposed via endpoint
EXPENSE_CATEGORIES: list[str] = [
    "Software", "Hardware", "Reizen", "Marketing",
    "Kantoor", "Abonnementen", "Overig"
]

# Type alias — used in Pydantic schema fields for validation
ExpenseCategory = Literal[
    "Software", "Hardware", "Reizen", "Marketing",
    "Kantoor", "Abonnementen", "Overig"
]
```

The frontend dropdown is hardcoded in Vue using the same list — no extra API endpoint needed. No custom categories — fixed list keeps the UI simple and prevents data inconsistencies.

## Backend Changes

### Model — `backend/app/models/expense.py`
Add `category: Mapped[str | None]` column (`VARCHAR(50)`, nullable). Existing rows remain NULL; server-side logic treats NULL as "Overig".

### Alembic migration — `backend/alembic/versions/008_add_expense_category.py`
Single `ALTER TABLE expenses ADD COLUMN category VARCHAR(50)` migration.

### Schemas — `backend/app/schemas/expense.py`
Add `category: Literal["Software","Hardware","Reizen","Marketing","Kantoor","Abonnementen","Overig"] | None = "Overig"` to `ExpenseCreate`, `ExpenseUpdate`, and `ExpenseResponse`. Pydantic rejects values outside the fixed list automatically.

### Schema — `backend/app/schemas/finance.py`
Add new model:
```python
class KostenCategorie(BaseModel):
    categorie: str
    bedrag: Decimal
    aantal: int
```

Add to `TaxSummary`:
```python
kosten_per_categorie: list[KostenCategorie] = []
```
Optional with default `[]` so existing API consumers and tests don't break.

### Router — `backend/app/routers/expenses.py`
No logic changes needed. Because `ExpenseCreate`/`ExpenseUpdate` already use `model_dump(exclude_unset=True)` with a generic `setattr` loop, adding `category` to the schemas is sufficient — it flows through automatically.

### Finance router — `backend/app/routers/finance.py`
In `get_tax_summary()`, after computing `kosten`, add a grouping query:
```python
rows = await db.execute(
    select(
        func.coalesce(Expense.category, "Overig").label("categorie"),
        func.sum(Expense.amount_excl_vat).label("bedrag"),
        func.count().label("aantal"),
    )
    .where(extract("year", Expense.date) == year)
    .group_by(func.coalesce(Expense.category, "Overig"))
)
kosten_per_categorie = [
    KostenCategorie(categorie=r.categorie, bedrag=r.bedrag, aantal=r.aantal)
    for r in rows.all()
]
```
NULL categories are bucketed into "Overig" via `COALESCE`. Return `kosten_per_categorie` in the `TaxSummary` response.

## Frontend Changes

### ExpensesView.vue

**Table:**
- Add `Categorie` column with a small colored chip/badge per category
- Add edit (pencil) button per row alongside the existing delete button

**Dialoog (shared for create + edit):**
- Add `Categorie` dropdown (required, defaults to "Overig")
- When editing: pre-fill all fields including category
- Same component instance; `editTarget` ref determines create vs. edit mode

**Filter:**
- Category `<select>` above the table ("Alle categorieën" + each category)
- `computed` filter on the local `expenses` array — no extra API call

### FinanceView.vue — W&V tab

Replace the single `− Zakelijke kosten` `WvRow` with:
- One summary row showing the total (same as now)
- When `taxSummary.kosten_per_categorie.length > 0`: indented sub-rows per category, showing name + amount

Purely presentational. No calculation change. No empty-state clutter when no categories are present.

## Data Flow

```
Expense.category (DB, NULL → "Overig" in queries)
  → ExpenseResponse.category (API)
  → ExpensesView table + filter
  → TaxSummary.kosten_per_categorie (aggregated in finance router)
  → FinanceView W&V breakdown rows
```

## What is NOT in scope

- Custom/user-defined categories
- Category on invoices or time entries
- Charts or graphs
- Bulk category assignment

## UX Constraints

- Category dropdown defaults to "Overig" — existing create flow is never slower
- Edit dialog is the same component as create — no extra screens
- W&V breakdown only renders when `kosten_per_categorie` is non-empty
- Category filter defaults to "Alle categorieën"
