<template>
  <div class="space-y-5 animate-slide-up">
    <div class="flex items-center justify-between">
      <span class="text-xs font-mono text-gray-400">{{ expenses.length }} uitgaven</span>
      <button class="btn-primary" @click="showCreate = true"><i class="pi pi-plus text-xs"></i> Nieuwe uitgave</button>
    </div>

    <div class="card overflow-hidden light-table">
      <DataTable :value="expenses" stripedRows paginator :rows="20" sortField="date" :sortOrder="-1">
        <Column field="date" header="Datum" sortable style="width:120px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ formatDate(data.date) }}</span></template>
        </Column>
        <Column field="description" header="Aanschaf" sortable>
          <template #body="{ data }"><span class="text-gray-700">{{ data.description }}</span></template>
        </Column>
        <Column field="invoice_number" header="Factuurnr." sortable style="width:140px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ data.invoice_number || '—' }}</span></template>
        </Column>
        <Column field="amount_incl_vat" header="Incl. BTW" sortable style="width:120px">
          <template #body="{ data }"><span class="font-mono text-sm font-medium text-gray-800">{{ formatCurrency(data.amount_incl_vat) }}</span></template>
        </Column>
        <Column field="vat_rate" header="BTW %" sortable style="width:80px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ data.vat_rate }}%</span></template>
        </Column>
        <Column field="vat_amount" header="BTW" sortable style="width:100px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ formatCurrency(data.vat_amount) }}</span></template>
        </Column>
        <Column field="amount_excl_vat" header="Excl. BTW" sortable style="width:120px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ formatCurrency(data.amount_excl_vat) }}</span></template>
        </Column>
        <Column header="" style="width:60px">
          <template #body="{ data }">
            <button class="btn-icon text-red-600 hover:text-red-700" @click.stop="deleteExpense(data)" title="Verwijderen"><i class="pi pi-trash text-xs"></i></button>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showCreate" header="Nieuwe uitgave" modal :style="{ width: '500px' }">
      <form @submit.prevent="createExpense" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Aanschaf</label><input v-model="form.description" class="input" required placeholder="Bijv. Adobe Creative Cloud" /></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Factuurnummer</label><input v-model="form.invoice_number" class="input font-mono" placeholder="Optioneel" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Datum</label><Calendar v-model="form.date" dateFormat="dd-mm-yy" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bedrag incl. BTW</label><InputNumber v-model="form.amount_incl_vat" mode="currency" currency="EUR" locale="nl-NL" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">BTW-tarief</label><Dropdown v-model="form.vat_rate" :options="vatOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
        </div>
        <!-- Preview -->
        <div v-if="form.amount_incl_vat > 0" class="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
          <div class="flex justify-between"><span class="text-gray-500">Excl. BTW</span><span class="font-mono text-gray-700">{{ formatCurrency(previewExcl) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">BTW ({{ form.vat_rate }}%)</span><span class="font-mono text-gray-700">{{ formatCurrency(previewVat) }}</span></div>
          <div class="flex justify-between font-medium border-t border-gray-200 pt-1"><span class="text-gray-700">Incl. BTW</span><span class="font-mono text-gray-800">{{ formatCurrency(form.amount_incl_vat) }}</span></div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showCreate = false">Annuleren</button>
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

const expenses = ref<any[]>([])
const showCreate = ref(false)
const saving = ref(false)
const vatOptions = [
  { label: '21%', value: 21 },
  { label: '9%', value: 9 },
  { label: '0%', value: 0 },
]
const form = ref<any>({ description: '', invoice_number: '', date: new Date(), amount_incl_vat: 0, vat_rate: 21 })

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

async function createExpense() {
  saving.value = true
  try {
    await expensesApi.create({ ...form.value, date: toISODate(form.value.date) })
    showCreate.value = false
    showSuccess('Uitgave toegevoegd')
    await loadExpenses()
    form.value = { description: '', invoice_number: '', date: new Date(), amount_incl_vat: 0, vat_rate: 21 }
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
