<template>
  <div class="space-y-5 animate-slide-up">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value"
          placeholder="Status" showClear class="w-40" @change="loadInvoices" />
        <span class="text-xs font-mono text-gray-400">{{ invoices.length }} facturen</span>
      </div>
      <button class="btn-primary" @click="openCreate"><i class="pi pi-plus text-xs"></i> Nieuwe factuur</button>
    </div>

    <div v-if="loading" class="card">
      <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-5 py-3.5 border-b border-gray-200 last:border-0">
        <div class="skeleton h-4 w-24"></div><div class="skeleton h-4 w-32"></div><div class="skeleton h-4 w-20"></div>
        <div class="flex-1"></div><div class="skeleton h-5 w-16 rounded-md"></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden light-table">
      <DataTable :value="invoices" stripedRows paginator :rows="20" sortField="created_at" :sortOrder="-1">
        <Column field="invoice_number" header="Nummer" sortable style="width:130px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-700">{{ data.invoice_number }}</span></template>
        </Column>
        <Column header="Klant" sortable>
          <template #body="{ data }"><span class="text-gray-700">{{ clientMap[data.client_id] || '—' }}</span></template>
        </Column>
        <Column field="issue_date" header="Datum" sortable style="width:120px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ formatDate(data.issue_date) }}</span></template>
        </Column>
        <Column field="total_amount" header="Totaal" sortable style="width:130px">
          <template #body="{ data }"><span class="font-mono text-sm font-medium text-gray-800">{{ formatCurrency(data.total_amount) }}</span></template>
        </Column>
        <Column field="status" header="Status" sortable style="width:110px">
          <template #body="{ data }"><span :class="statusColor(data.status)" class="badge">{{ data.status }}</span></template>
        </Column>
        <Column header="" style="width:140px">
          <template #body="{ data }">
            <div class="flex gap-1 justify-end">
              <button class="btn-icon" @click.stop="downloadPdf(data)" title="PDF"><i class="pi pi-file-pdf text-xs"></i></button>
              <button v-if="data.status !== 'PAID'" class="btn-icon text-green-600 hover:text-green-700" @click.stop="markPaid(data)" title="Betaald"><i class="pi pi-check text-xs"></i></button>
              <button class="btn-icon text-red-600 hover:text-red-700" @click.stop="deleteInvoice(data)" title="Verwijderen"><i class="pi pi-trash text-xs"></i></button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create Dialog -->
    <Dialog v-model:visible="showCreate" header="Nieuwe factuur" modal :style="{ width: '720px' }">
      <form @submit.prevent="createInvoice" class="space-y-4">

        <!-- Client + Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Klant</label>
            <Dropdown v-model="form.client_id" :options="clientOptions" optionLabel="label" optionValue="value"
              placeholder="Selecteer klant" class="w-full" :class="{ 'p-invalid': errors.client_id }" />
            <p v-if="errors.client_id" class="field-error">{{ errors.client_id }}</p>
          </div>
          <div>
            <label class="form-label">BTW-tarief</label>
            <InputNumber v-model="form.vat_rate" suffix="%" class="w-full" :min="0" :max="100"
              :class="{ 'p-invalid': errors.vat_rate }" />
            <p v-if="errors.vat_rate" class="field-error">{{ errors.vat_rate }}</p>
          </div>
          <div>
            <label class="form-label">Factuurdatum</label>
            <Calendar v-model="form.issue_date" dateFormat="dd-mm-yy" class="w-full"
              :class="{ 'p-invalid': errors.issue_date }" />
            <p v-if="errors.issue_date" class="field-error">{{ errors.issue_date }}</p>
          </div>
          <div>
            <label class="form-label">Vervaldatum</label>
            <Calendar v-model="form.due_date" dateFormat="dd-mm-yy" class="w-full"
              :class="{ 'p-invalid': errors.due_date }" />
            <p v-if="errors.due_date" class="field-error">{{ errors.due_date }}</p>
          </div>
        </div>

        <!-- Line Items -->
        <div>
          <label class="form-label">Regelitems</label>
          <p v-if="errors.line_items" class="field-error mb-2">{{ errors.line_items }}</p>

          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b-2 border-gray-800">
                <th class="text-left py-1.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/2">Omschrijving</th>
                <th class="text-right py-1.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Aantal</th>
                <th class="text-right py-1.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Tarief (€)</th>
                <th class="text-right py-1.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Bedrag (€)</th>
                <th class="w-8"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in lineItems" :key="i" class="border-b border-gray-100">
                <td class="py-1 px-1">
                  <input v-model="item.description" class="input text-sm w-full"
                    :class="{ 'border-red-400': errors[`item_${i}_description`] }"
                    placeholder="Omschrijving"
                    @input="delete errors[`item_${i}_description`]" />
                  <p v-if="errors[`item_${i}_description`]" class="field-error">{{ errors[`item_${i}_description`] }}</p>
                </td>
                <td class="py-1 px-1">
                  <input v-model.number="item.quantity" type="number" min="0.01" step="0.01"
                    class="input text-sm text-right w-full"
                    :class="{ 'border-red-400': errors[`item_${i}_quantity`] }"
                    @input="recalcItem(i); delete errors[`item_${i}_quantity`]" />
                  <p v-if="errors[`item_${i}_quantity`]" class="field-error">{{ errors[`item_${i}_quantity`] }}</p>
                </td>
                <td class="py-1 px-1">
                  <input v-model.number="item.unit_price" type="number" min="0" step="0.01"
                    class="input text-sm text-right w-full"
                    :class="{ 'border-red-400': errors[`item_${i}_unit_price`] }"
                    @input="recalcItem(i); delete errors[`item_${i}_unit_price`]" />
                  <p v-if="errors[`item_${i}_unit_price`]" class="field-error">{{ errors[`item_${i}_unit_price`] }}</p>
                </td>
                <td class="py-1 px-2 text-right font-mono text-gray-700">{{ formatCurrency(item.total) }}</td>
                <td class="py-1 px-1 text-center">
                  <button type="button" class="btn-icon text-red-400 hover:text-red-600"
                    @click="removeLine(i)" :disabled="lineItems.length === 1" title="Verwijderen">
                    <i class="pi pi-times text-xs"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <button type="button" class="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium" @click="addLine">
            <i class="pi pi-plus text-xs mr-1"></i>Regel toevoegen
          </button>
        </div>

        <!-- Summary -->
        <div class="flex justify-end">
          <table class="text-sm border-collapse">
            <tr>
              <td class="py-0.5 pr-8 text-gray-500">Subtotaal</td>
              <td class="py-0.5 text-right font-mono text-gray-700">{{ formatCurrency(subtotal) }}</td>
            </tr>
            <tr>
              <td class="py-0.5 pr-8 text-gray-500">BTW {{ form.vat_rate }}%</td>
              <td class="py-0.5 text-right font-mono text-gray-700">{{ formatCurrency(vatAmount) }}</td>
            </tr>
            <tr class="border-t-2 border-gray-800">
              <td class="pt-1.5 pr-8 font-semibold text-gray-800">Totaal</td>
              <td class="pt-1.5 text-right font-mono font-semibold text-gray-900">{{ formatCurrency(totalAmount) }}</td>
            </tr>
          </table>
        </div>

        <!-- Notes -->
        <div>
          <label class="form-label">Notities (optioneel)</label>
          <textarea v-model="form.notes" class="input min-h-[60px]" />
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="closeCreate">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Aanmaken</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { invoicesApi } from '@/modules/invoices/api'
import { clientsApi } from '@/api/services'
import { useFormatting } from '@/composables/useFormatting'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface InvoiceForm {
  client_id: string
  vat_rate: number
  issue_date: Date
  due_date: Date
  notes: string
}

// ─── State ───────────────────────────────────────────────────────────────────

const { showError, showSuccess } = useErrorHandler()
const confirm = useConfirm()
const { formatDate, formatCurrency, statusColor, downloadBlob, toISODate } = useFormatting()

const invoices = ref<any[]>([])
const clientOptions = ref<any[]>([])
const clientMap = ref<Record<string, string>>({})
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const filters = ref<{ status: string | null }>({ status: null })

const statusOptions = [
  { label: 'Concept', value: 'DRAFT' },
  { label: 'Verzonden', value: 'SENT' },
  { label: 'Betaald', value: 'PAID' },
  { label: 'Achterstallig', value: 'OVERDUE' },
]

function makeDefaultForm(): InvoiceForm {
  const now = new Date()
  return {
    client_id: '',
    vat_rate: 21,
    issue_date: now,
    due_date: new Date(now.getTime() + 30 * 86400000),
    notes: '',
  }
}

const form = ref<InvoiceForm>(makeDefaultForm())
const lineItems = ref<LineItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }])

// ─── Computed ─────────────────────────────────────────────────────────────────

const subtotal = computed(() =>
  lineItems.value.reduce((sum, item) => sum + item.total, 0)
)

const vatAmount = computed(() =>
  Math.round(subtotal.value * (form.value.vat_rate / 100) * 100) / 100
)

const totalAmount = computed(() => subtotal.value + vatAmount.value)

// ─── Line item helpers ────────────────────────────────────────────────────────

function recalcItem(i: number): void {
  const item = lineItems.value[i]
  item.total = Math.round(item.quantity * item.unit_price * 100) / 100
}

function addLine(): void {
  lineItems.value.push({ description: '', quantity: 1, unit_price: 0, total: 0 })
}

function removeLine(i: number): void {
  if (lineItems.value.length > 1) lineItems.value.splice(i, 1)
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(): boolean {
  const e: Record<string, string> = {}

  if (!form.value.client_id) e.client_id = 'Selecteer een klant'
  if (!form.value.issue_date) e.issue_date = 'Factuurdatum is verplicht'
  if (!form.value.due_date) {
    e.due_date = 'Vervaldatum is verplicht'
  } else if (form.value.issue_date && form.value.due_date < form.value.issue_date) {
    e.due_date = 'Vervaldatum moet na factuurdatum liggen'
  }
  if (form.value.vat_rate < 0 || form.value.vat_rate > 100) {
    e.vat_rate = 'BTW-tarief moet tussen 0 en 100 liggen'
  }
  if (lineItems.value.length === 0) {
    e.line_items = 'Voeg minimaal één regel toe'
  } else {
    lineItems.value.forEach((item, i) => {
      if (!item.description.trim()) e[`item_${i}_description`] = 'Omschrijving is verplicht'
      if (item.quantity <= 0) e[`item_${i}_quantity`] = 'Aantal moet groter dan 0 zijn'
      if (item.unit_price < 0) e[`item_${i}_unit_price`] = 'Tarief mag niet negatief zijn'
    })
  }

  errors.value = e
  return Object.keys(e).length === 0
}

// ─── Dialog helpers ───────────────────────────────────────────────────────────

function openCreate(): void {
  showCreate.value = true
}

function closeCreate(): void {
  showCreate.value = false
  resetForm()
}

function resetForm(): void {
  form.value = makeDefaultForm()
  lineItems.value = [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  errors.value = {}
}

// ─── API actions ──────────────────────────────────────────────────────────────

onMounted(async () => { await Promise.all([loadInvoices(), loadClients()]) })

async function loadClients(): Promise<void> {
  try {
    const { data } = await clientsApi.list()
    clientOptions.value = data.map((c: any) => ({ label: c.company_name, value: c.id }))
    clientMap.value = Object.fromEntries(data.map((c: any) => [c.id, c.company_name]))
  } catch (err: any) { showError(err) }
}

async function loadInvoices(): Promise<void> {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filters.value.status) params.status = filters.value.status
    const { data } = await invoicesApi.list(params)
    invoices.value = data
  } catch (err: any) { showError(err) }
  loading.value = false
}

async function createInvoice(): Promise<void> {
  if (!validate()) return

  saving.value = true
  try {
    await invoicesApi.create({
      client_id: form.value.client_id,
      issue_date: toISODate(form.value.issue_date),
      due_date: toISODate(form.value.due_date),
      vat_rate: form.value.vat_rate,
      notes: form.value.notes || null,
      subtotal: 0,
      line_items: lineItems.value.map(item => ({
        description: item.description,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
        total: String(item.total),
      })),
    })
    closeCreate()
    showSuccess('Factuur aangemaakt')
    await loadInvoices()
  } catch (err: any) {
    if (err?.response?.status === 422) {
      const detail = err.response.data?.detail
      if (Array.isArray(detail)) {
        const mapped: Record<string, string> = {}
        detail.forEach((d: any) => {
          const field = d.loc?.[d.loc.length - 1]
          if (field) mapped[String(field)] = d.msg
        })
        if (Object.keys(mapped).length > 0) {
          errors.value = { ...errors.value, ...mapped }
          saving.value = false
          return
        }
      }
    }
    showError(err)
  }
  saving.value = false
}

async function markPaid(inv: any): Promise<void> {
  try {
    await invoicesApi.markPaid(inv.id)
    showSuccess('Betaald')
    await loadInvoices()
  } catch (err: any) { showError(err) }
}

async function downloadPdf(inv: any): Promise<void> {
  try {
    const { data } = await invoicesApi.downloadPdf(inv.id)
    downloadBlob(data, `factuur-${inv.invoice_number}.pdf`)
  } catch (err: any) { showError(err, 'PDF genereren mislukt') }
}

function deleteInvoice(inv: any): void {
  confirm.require({
    message: `Factuur ${inv.invoice_number} verwijderen?`,
    header: 'Bevestiging',
    acceptLabel: 'Verwijderen',
    rejectLabel: 'Annuleren',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await invoicesApi.delete(inv.id)
        showSuccess('Verwijderd')
        await loadInvoices()
      } catch (err: any) { showError(err) }
    },
  })
}
</script>

<style scoped>
.form-label {
  @apply block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider;
}
.field-error {
  @apply text-xs text-red-500 mt-1;
}
</style>
