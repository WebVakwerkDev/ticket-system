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
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Categorie</label>
            <Dropdown v-model="form.category" :options="CATEGORIES" class="w-full" />
          </div>
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
import { expensesApi } from '@/modules/expenses/api'
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
