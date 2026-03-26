# Expense Categories & Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed-list `category` field to expenses, full edit capability in ExpensesView, and a per-category cost breakdown in the W&V tab.

**Architecture:** New `category` column (nullable VARCHAR) on the `expenses` table, validated server-side via Pydantic `Literal`. The finance `tax-summary` endpoint gains a `kosten_per_categorie` aggregation. Frontend gets an edit dialog and category filter in ExpensesView, and indented category rows in FinanceView's W&V tab.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic (SQLite in tests), Pydantic v2, Vue 3 Composition API, PrimeVue, Tailwind CSS.

---

## File Map

| File | Change |
|---|---|
| `backend/alembic/versions/008_add_expense_category.py` | CREATE — migration adding `category` column |
| `backend/app/models/expense.py` | MODIFY — add `category` mapped column |
| `backend/app/schemas/expense.py` | MODIFY — add `EXPENSE_CATEGORIES`, `ExpenseCategory` type, `category` field to all three schemas |
| `backend/app/routers/expenses.py` | MODIFY — pass `category` in `create_expense` |
| `backend/app/schemas/finance.py` | MODIFY — add `KostenCategorie`, add `kosten_per_categorie` to `TaxSummary` |
| `backend/app/routers/finance.py` | MODIFY — aggregate `kosten_per_categorie` in `get_tax_summary` |
| `backend/tests/test_expenses.py` | CREATE — tests for category CRUD and validation |
| `backend/tests/test_finance.py` | MODIFY — add test for `kosten_per_categorie` in tax summary |
| `frontend/src/views/ExpensesView.vue` | MODIFY — category column, filter, edit dialog |
| `frontend/src/views/FinanceView.vue` | MODIFY — per-category rows in W&V tab |

---

## Task 1: Alembic migration — add `category` column

**Files:**
- Create: `backend/alembic/versions/008_add_expense_category.py`

- [ ] **Step 1: Write the migration**

```python
# backend/alembic/versions/008_add_expense_category.py
"""Add category column to expenses

Revision ID: 008
Revises: 007
Create Date: 2026-03-26
"""
from alembic import op
import sqlalchemy as sa

revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('expenses', sa.Column('category', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('expenses', 'category')
```

- [ ] **Step 2: Apply the migration**

```bash
docker compose exec backend alembic upgrade head
```

Expected output ends with: `Running upgrade 007 -> 008`

- [ ] **Step 3: Commit**

```bash
git add backend/alembic/versions/008_add_expense_category.py
git commit -m "feat(db): add category column to expenses (migration 008)"
```

---

## Task 2: Backend model + schemas + router

**Files:**
- Modify: `backend/app/models/expense.py`
- Modify: `backend/app/schemas/expense.py`
- Modify: `backend/app/routers/expenses.py`

- [ ] **Step 1: Update the model**

In `backend/app/models/expense.py`, add after the `date` column:

```python
category: Mapped[str | None] = mapped_column(String(50), nullable=True)
```

Also add `String` to the existing `sqlalchemy` import if not already present (it is — `String` is already imported).

- [ ] **Step 2: Update the schemas**

Replace the entire content of `backend/app/schemas/expense.py`:

```python
from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import date as DateType, datetime
from typing import Optional, Literal

EXPENSE_CATEGORIES: list[str] = [
    "Software", "Hardware", "Reizen", "Marketing",
    "Kantoor", "Abonnementen", "Overig"
]

ExpenseCategory = Literal[
    "Software", "Hardware", "Reizen", "Marketing",
    "Kantoor", "Abonnementen", "Overig"
]


class ExpenseCreate(BaseModel):
    description: str
    invoice_number: Optional[str] = None
    amount_incl_vat: Decimal
    vat_rate: Decimal = Decimal("21")
    date: DateType
    category: Optional[ExpenseCategory] = "Overig"

    @field_validator("amount_incl_vat")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator("vat_rate")
    @classmethod
    def validate_vat_rate(cls, v: Decimal) -> Decimal:
        if v not in (Decimal("0"), Decimal("9"), Decimal("21")):
            raise ValueError("VAT rate must be 0, 9, or 21")
        return v


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    invoice_number: Optional[str] = None
    amount_incl_vat: Optional[Decimal] = None
    vat_rate: Optional[Decimal] = None
    date: Optional[DateType] = None
    category: Optional[ExpenseCategory] = None

    @field_validator("amount_incl_vat")
    @classmethod
    def validate_amount(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator("vat_rate")
    @classmethod
    def validate_vat_rate(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v not in (Decimal("0"), Decimal("9"), Decimal("21")):
            raise ValueError("VAT rate must be 0, 9, or 21")
        return v


class ExpenseResponse(BaseModel):
    id: str
    description: str
    invoice_number: Optional[str]
    amount_incl_vat: Decimal
    vat_rate: Decimal
    amount_excl_vat: Decimal
    vat_amount: Decimal
    date: DateType
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 3: Update `create_expense` in router**

In `backend/app/routers/expenses.py`, the `create_expense` function explicitly constructs the `Expense` object. Add `category=data.category` to the constructor call:

```python
expense = Expense(
    description=data.description,
    invoice_number=data.invoice_number,
    amount_incl_vat=data.amount_incl_vat,
    vat_rate=data.vat_rate,
    amount_excl_vat=amount_excl,
    vat_amount=vat_amount,
    date=data.date,
    category=data.category,
)
```

`update_expense` already uses `model_dump(exclude_unset=True)` + `setattr` loop — no change needed there.

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/expense.py backend/app/schemas/expense.py backend/app/routers/expenses.py
git commit -m "feat(expenses): add category field to model, schema, and router"
```

---

## Task 3: Finance schema + router — `kosten_per_categorie`

**Files:**
- Modify: `backend/app/schemas/finance.py`
- Modify: `backend/app/routers/finance.py`

- [ ] **Step 1: Add `KostenCategorie` to finance schemas**

In `backend/app/schemas/finance.py`, add this class before `TaxSummary`:

```python
class KostenCategorie(BaseModel):
    categorie: str
    bedrag: Decimal
    aantal: int
```

Then add to `TaxSummary` (after `settings: TaxYearSettingsResponse`):

```python
kosten_per_categorie: list[KostenCategorie] = []
```

Also add the import at the top of the file (it's already a `from pydantic import BaseModel` file — just add the class).

- [ ] **Step 2: Update `get_tax_summary` in finance router**

In `backend/app/routers/finance.py`, update the import at the top to include `KostenCategorie`:

```python
from app.schemas.finance import (
    FinanceOverview, VatBreakdown, QuarterVatSummary, MonthlyReport, YearlyReport,
    TaxYearSettingsResponse, TaxYearSettingsUpdate, TaxSummary, IBSchijf,
    KostenCategorie,
)
```

`func` is already imported at the top of `finance.py` — do NOT add any new sqlalchemy imports.

Inside `get_tax_summary`, after the `kosten` query (around line 208), add:

```python
# Kosten per categorie
cat_result = await db.execute(
    select(
        func.coalesce(Expense.category, "Overig").label("categorie"),
        func.sum(Expense.amount_excl_vat).label("bedrag"),
        func.count().label("aantal"),
    )
    .where(extract("year", Expense.date) == year)
    .group_by(func.coalesce(Expense.category, "Overig"))
)
kosten_per_categorie = [
    KostenCategorie(categorie=r.categorie, bedrag=r.bedrag or Decimal("0"), aantal=r.aantal)
    for r in cat_result.all()
]
```

Then add `kosten_per_categorie=kosten_per_categorie` to the `TaxSummary(...)` return call at the bottom of the function.

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/finance.py backend/app/routers/finance.py
git commit -m "feat(finance): add kosten_per_categorie breakdown to tax summary"
```

---

## Task 4: Backend tests

**Files:**
- Create: `backend/tests/test_expenses.py`
- Modify: `backend/tests/test_finance.py`

- [ ] **Step 1: Write failing tests for expenses with category**

Note: The project uses `asyncio_mode = "auto"` in `pytest.ini`, so async test methods work without explicit `@pytest.mark.asyncio` decorators — consistent with all other test files.

Create `backend/tests/test_expenses.py`:

```python
import pytest
from tests.conftest import auth_header


class TestExpenses:
    async def test_create_expense_default_category(self, client, admin_token):
        response = await client.post(
            "/api/v1/expenses",
            json={"description": "Adobe CC", "amount_incl_vat": "121.00", "vat_rate": "21", "date": "2026-01-15"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == "Overig"

    async def test_create_expense_with_category(self, client, admin_token):
        response = await client.post(
            "/api/v1/expenses",
            json={"description": "MacBook", "amount_incl_vat": "2420.00", "vat_rate": "21", "date": "2026-02-01", "category": "Hardware"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 201
        assert response.json()["category"] == "Hardware"

    async def test_create_expense_invalid_category(self, client, admin_token):
        response = await client.post(
            "/api/v1/expenses",
            json={"description": "Test", "amount_incl_vat": "100.00", "vat_rate": "21", "date": "2026-01-01", "category": "Onzin"},
            headers=auth_header(admin_token),
        )
        assert response.status_code == 422

    async def test_update_expense_category(self, client, admin_token):
        # Create
        create_resp = await client.post(
            "/api/v1/expenses",
            json={"description": "Treinkaartje", "amount_incl_vat": "24.20", "vat_rate": "21", "date": "2026-03-01"},
            headers=auth_header(admin_token),
        )
        expense_id = create_resp.json()["id"]

        # Update category
        update_resp = await client.put(
            f"/api/v1/expenses/{expense_id}",
            json={"category": "Reizen"},
            headers=auth_header(admin_token),
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["category"] == "Reizen"

    async def test_expense_response_includes_category(self, client, admin_token):
        await client.post(
            "/api/v1/expenses",
            json={"description": "Slack", "amount_incl_vat": "9.68", "vat_rate": "21", "date": "2026-01-10", "category": "Abonnementen"},
            headers=auth_header(admin_token),
        )
        list_resp = await client.get("/api/v1/expenses", headers=auth_header(admin_token))
        assert list_resp.status_code == 200
        categories = [e["category"] for e in list_resp.json()]
        assert "Abonnementen" in categories
```

- [ ] **Step 2: Add `kosten_per_categorie` test to test_finance.py**

Append to the `TestFinance` class in `backend/tests/test_finance.py`:

```python
    async def test_tax_summary_kosten_per_categorie_empty(self, client, admin_token):
        """With no expenses, kosten_per_categorie should be an empty list."""
        response = await client.get("/api/v1/finance/tax-summary/2050", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert "kosten_per_categorie" in data
        assert isinstance(data["kosten_per_categorie"], list)
```

- [ ] **Step 3: Build Docker and run tests**

```bash
docker compose build backend && docker compose up -d backend
docker compose exec backend pytest tests/test_expenses.py tests/test_finance.py -v
```

Expected: all tests pass (the new expense tests and updated finance test).

- [ ] **Step 4: Run full suite**

```bash
docker compose exec backend pytest tests/ -q
```

Expected: all tests pass (142+ passed).

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_expenses.py backend/tests/test_finance.py
git commit -m "test(expenses): add category CRUD and validation tests"
```

---

## Task 5: Frontend — ExpensesView

**Files:**
- Modify: `frontend/src/views/ExpensesView.vue`

Replace the entire file with the following. Key changes vs original:
- `CATEGORIES` constant (matches backend list)
- `categoryFilter` ref + `filteredExpenses` computed
- `editTarget` ref for edit mode
- Edit (pencil) button per row
- `openEdit(expense)` function
- `updateExpense()` function
- Category column in table (colored chip)
- Category field in dialog (Dropdown, required)
- Pre-fill all fields in edit mode
- Dialog header changes between "Nieuwe uitgave" / "Uitgave bewerken"

```vue
<template>
  <div class="space-y-5 animate-slide-up">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-gray-400">{{ filteredExpenses.length }} uitgaven</span>
        <select v-model="categoryFilter" class="input text-xs py-1 h-8 w-44">
          <option value="">Alle categorieën</option>
          <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <button class="btn-primary" @click="openCreate"><i class="pi pi-plus text-xs"></i> Nieuwe uitgave</button>
    </div>

    <div class="card overflow-hidden light-table">
      <DataTable :value="filteredExpenses" stripedRows paginator :rows="20" sortField="date" :sortOrder="-1">
        <Column field="date" header="Datum" sortable style="width:120px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ formatDate(data.date) }}</span></template>
        </Column>
        <Column field="description" header="Aanschaf" sortable>
          <template #body="{ data }"><span class="text-gray-700">{{ data.description }}</span></template>
        </Column>
        <Column field="category" header="Categorie" sortable style="width:140px">
          <template #body="{ data }">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-medium" :class="categoryChip(data.category)">
              {{ data.category || 'Overig' }}
            </span>
          </template>
        </Column>
        <Column field="invoice_number" header="Factuurnr." sortable style="width:130px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ data.invoice_number || '—' }}</span></template>
        </Column>
        <Column field="amount_incl_vat" header="Incl. BTW" sortable style="width:110px">
          <template #body="{ data }"><span class="font-mono text-sm font-medium text-gray-800">{{ formatCurrency(data.amount_incl_vat) }}</span></template>
        </Column>
        <Column field="vat_rate" header="BTW %" sortable style="width:70px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ data.vat_rate }}%</span></template>
        </Column>
        <Column field="amount_excl_vat" header="Excl. BTW" sortable style="width:110px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ formatCurrency(data.amount_excl_vat) }}</span></template>
        </Column>
        <Column header="" style="width:80px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <button class="btn-icon" @click.stop="openEdit(data)" title="Bewerken"><i class="pi pi-pencil text-xs"></i></button>
              <button class="btn-icon text-red-600 hover:text-red-700" @click.stop="deleteExpense(data)" title="Verwijderen"><i class="pi pi-trash text-xs"></i></button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showDialog" :header="editTarget ? 'Uitgave bewerken' : 'Nieuwe uitgave'" modal :style="{ width: '500px' }">
      <form @submit.prevent="editTarget ? updateExpense() : createExpense()" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Aanschaf</label><input v-model="form.description" class="input" required placeholder="Bijv. Adobe Creative Cloud" /></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Categorie</label>
            <Dropdown v-model="form.category" :options="CATEGORIES" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Datum</label><Calendar v-model="form.date" dateFormat="dd-mm-yy" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Factuurnummer</label><input v-model="form.invoice_number" class="input font-mono" placeholder="Optioneel" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">BTW-tarief</label><Dropdown v-model="form.vat_rate" :options="vatOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div class="col-span-2"><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bedrag incl. BTW</label><InputNumber v-model="form.amount_incl_vat" mode="currency" currency="EUR" locale="nl-NL" class="w-full" /></div>
        </div>
        <div v-if="form.amount_incl_vat > 0" class="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
          <div class="flex justify-between"><span class="text-gray-500">Excl. BTW</span><span class="font-mono text-gray-700">{{ formatCurrency(previewExcl) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">BTW ({{ form.vat_rate }}%)</span><span class="font-mono text-gray-700">{{ formatCurrency(previewVat) }}</span></div>
          <div class="flex justify-between font-medium border-t border-gray-200 pt-1"><span class="text-gray-700">Incl. BTW</span><span class="font-mono text-gray-800">{{ formatCurrency(form.amount_incl_vat) }}</span></div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showDialog = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving || !form.description || !form.amount_incl_vat">Opslaan</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { expensesApi } from '@/api/services'
import { useFormatting } from '@/composables/useFormatting'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'

const { showError, showSuccess } = useErrorHandler()
const confirm = useConfirm()
const { formatDate, formatCurrency, toISODate } = useFormatting()

const CATEGORIES = ['Software', 'Hardware', 'Reizen', 'Marketing', 'Kantoor', 'Abonnementen', 'Overig']

const CHIP_COLORS: Record<string, string> = {
  Software:     'bg-blue-100 text-blue-700',
  Hardware:     'bg-purple-100 text-purple-700',
  Reizen:       'bg-green-100 text-green-700',
  Marketing:    'bg-pink-100 text-pink-700',
  Kantoor:      'bg-yellow-100 text-yellow-700',
  Abonnementen: 'bg-cyan-100 text-cyan-700',
  Overig:       'bg-gray-100 text-gray-600',
}

function categoryChip(cat: string | null) {
  return CHIP_COLORS[cat || 'Overig'] ?? CHIP_COLORS['Overig']
}

const expenses = ref<any[]>([])
const categoryFilter = ref('')
const showDialog = ref(false)
const editTarget = ref<any>(null)
const saving = ref(false)

const vatOptions = [
  { label: '21%', value: 21 },
  { label: '9%', value: 9 },
  { label: '0%', value: 0 },
]

const blankForm = () => ({ description: '', invoice_number: '', date: new Date(), amount_incl_vat: 0, vat_rate: 21, category: 'Overig' })
const form = ref<any>(blankForm())

const filteredExpenses = computed(() =>
  categoryFilter.value ? expenses.value.filter(e => (e.category || 'Overig') === categoryFilter.value) : expenses.value
)

const previewExcl = computed(() => {
  const incl = form.value.amount_incl_vat || 0
  const rate = form.value.vat_rate || 0
  if (rate === 0) return incl
  return Math.round((incl / (1 + rate / 100)) * 100) / 100
})
const previewVat = computed(() => (form.value.amount_incl_vat || 0) - previewExcl.value)

onMounted(loadExpenses)

async function loadExpenses() {
  try {
    const { data } = await expensesApi.list()
    expenses.value = data
  } catch {}
}

function openCreate() {
  editTarget.value = null
  form.value = blankForm()
  showDialog.value = true
}

function openEdit(expense: any) {
  editTarget.value = expense
  form.value = {
    description: expense.description,
    invoice_number: expense.invoice_number || '',
    date: new Date(expense.date),
    amount_incl_vat: parseFloat(expense.amount_incl_vat),
    vat_rate: parseFloat(expense.vat_rate),
    category: expense.category || 'Overig',
  }
  showDialog.value = true
}

async function createExpense() {
  saving.value = true
  try {
    await expensesApi.create({ ...form.value, date: toISODate(form.value.date) })
    showDialog.value = false
    showSuccess('Uitgave toegevoegd')
    await loadExpenses()
  } catch (err: any) { showError(err) }
  saving.value = false
}

async function updateExpense() {
  saving.value = true
  try {
    await expensesApi.update(editTarget.value.id, { ...form.value, date: toISODate(form.value.date) })
    showDialog.value = false
    showSuccess('Uitgave bijgewerkt')
    await loadExpenses()
  } catch (err: any) { showError(err) }
  saving.value = false
}

function deleteExpense(expense: any) {
  confirm.require({
    message: `"${expense.description}" verwijderen?`,
    header: 'Bevestiging',
    acceptLabel: 'Verwijderen',
    rejectLabel: 'Annuleren',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await expensesApi.delete(expense.id)
      showSuccess('Verwijderd')
      await loadExpenses()
    },
  })
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/ExpensesView.vue
git commit -m "feat(frontend): expense categories, filter, and edit dialog"
```

---

## Task 6: Frontend — FinanceView W&V tab breakdown

**Files:**
- Modify: `frontend/src/views/FinanceView.vue`

- [ ] **Step 1: Replace the `− Zakelijke kosten` WvRow in the W&V tab**

Find this section in the W&V `<TabPanel>` (around line 143-145):

```html
<wv-row label="Omzet (excl. BTW)" :value="taxSummary.omzet" />
<wv-row label="− Zakelijke kosten (excl. BTW)" :value="-pf(taxSummary.kosten)" sub />
<wv-row label="= Brutowinst" :value="taxSummary.brutowinst" bold />
```

Replace the `− Zakelijke kosten` line with:

```html
<wv-row label="− Zakelijke kosten (excl. BTW)" :value="-pf(taxSummary.kosten)" sub />
<template v-if="taxSummary.kosten_per_categorie?.length">
  <div v-for="k in taxSummary.kosten_per_categorie" :key="k.categorie"
    class="px-5 py-2 flex justify-between items-center bg-gray-50/60 border-t border-gray-50">
    <span class="text-[11px] text-gray-400 pl-4">{{ k.categorie }} <span class="text-gray-300">({{ k.aantal }}×)</span></span>
    <span class="font-mono text-xs text-gray-500">{{ fc(k.bedrag) }}</span>
  </div>
</template>
```

So the full block becomes:

```html
<wv-row label="Omzet (excl. BTW)" :value="taxSummary.omzet" />
<wv-row label="− Zakelijke kosten (excl. BTW)" :value="-pf(taxSummary.kosten)" sub />
<template v-if="taxSummary.kosten_per_categorie?.length">
  <div v-for="k in taxSummary.kosten_per_categorie" :key="k.categorie"
    class="px-5 py-2 flex justify-between items-center bg-gray-50/60 border-t border-gray-50">
    <span class="text-[11px] text-gray-400 pl-4">{{ k.categorie }} <span class="text-gray-300">({{ k.aantal }}×)</span></span>
    <span class="font-mono text-xs text-gray-500">{{ fc(k.bedrag) }}</span>
  </div>
</template>
<wv-row label="= Brutowinst" :value="taxSummary.brutowinst" bold />
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/FinanceView.vue
git commit -m "feat(finance): show per-category cost breakdown in W&V tab"
```

---

## Task 7: Docker rebuild + full test run + push

- [ ] **Step 1: Rebuild Docker with all changes**

```bash
docker compose build backend && docker compose up -d backend
```

Wait for container to start (~5s).

- [ ] **Step 2: Run full backend test suite**

```bash
docker compose exec backend pytest tests/ -q
```

Expected: all tests pass (145+ passed, 0 failed).

- [ ] **Step 3: Push to dev**

```bash
git push origin dev
```

- [ ] **Step 4: Verify in browser**

1. Go to Uitgaven — check category column, filter works, edit pre-fills form correctly
2. Go to Finance → W&V tab — check category breakdown appears under kosten row when expenses exist
