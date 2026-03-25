<template>
  <div class="space-y-5 animate-slide-up">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Status" showClear class="w-40" @change="loadInvoices" />
        <span class="text-xs font-mono text-gray-400">{{ invoices.length }} facturen</span>
      </div>
      <button class="btn-primary" @click="showCreate = true"><i class="pi pi-plus text-xs"></i> Nieuwe factuur</button>
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

    <Dialog v-model:visible="showCreate" header="Nieuwe factuur" modal :style="{ width: '560px' }">
      <form @submit.prevent="createInvoice" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Klant</label><Dropdown v-model="form.client_id" :options="clientOptions" optionLabel="label" optionValue="value" placeholder="Selecteer" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Subtotaal (excl. BTW)</label><InputNumber v-model="form.subtotal" mode="currency" currency="EUR" locale="nl-NL" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Factuurdatum</label><Calendar v-model="form.issue_date" dateFormat="dd-mm-yy" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Vervaldatum</label><Calendar v-model="form.due_date" dateFormat="dd-mm-yy" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">BTW-tarief</label><InputNumber v-model="form.vat_rate" suffix="%" class="w-full" :min="0" :max="100" /></div>
        </div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Omschrijving</label><textarea v-model="form.description" class="input min-h-[60px]" required /></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showCreate = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Aanmaken</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invoicesApi, clientsApi } from '@/api/services'
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
const { formatDate, formatCurrency, statusColor, downloadBlob, toISODate } = useFormatting()

const invoices = ref<any[]>([])
const clientOptions = ref<any[]>([])
const clientMap = ref<Record<string, string>>({})
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const filters = ref<any>({ status: null })
const today = new Date()
const defaultDue = new Date(today.getTime() + 30 * 86400000)
const form = ref<any>({ client_id: '', subtotal: 0, vat_rate: 21, issue_date: today, due_date: defaultDue, description: '' })
const statusOptions = [{ label: 'Concept', value: 'DRAFT' }, { label: 'Verzonden', value: 'SENT' }, { label: 'Betaald', value: 'PAID' }, { label: 'Achterstallig', value: 'OVERDUE' }]

onMounted(async () => { await Promise.all([loadInvoices(), loadClients()]) })

async function loadClients() {
  try {
    const { data } = await clientsApi.list()
    clientOptions.value = data.map((c: any) => ({ label: c.company_name, value: c.id }))
    clientMap.value = Object.fromEntries(data.map((c: any) => [c.id, c.company_name]))
  } catch (err: any) { showError(err) }
}

async function loadInvoices() {
  loading.value = true
  try {
    const params: any = {}
    if (filters.value.status) params.status = filters.value.status
    const { data } = await invoicesApi.list(params)
    invoices.value = data
  } catch (err: any) { showError(err) }
  loading.value = false
}

async function createInvoice() {
  saving.value = true
  try {
    await invoicesApi.create({
      ...form.value,
      issue_date: toISODate(form.value.issue_date),
      due_date: toISODate(form.value.due_date),
    })
    showCreate.value = false
    showSuccess('Factuur aangemaakt')
    await loadInvoices()
  } catch (err: any) { showError(err) }
  saving.value = false
}

async function markPaid(inv: any) {
  try {
    await invoicesApi.markPaid(inv.id)
    showSuccess('Betaald')
    await loadInvoices()
  } catch (err: any) { showError(err) }
}

async function downloadPdf(inv: any) {
  try {
    const { data } = await invoicesApi.downloadPdf(inv.id)
    downloadBlob(data, `factuur-${inv.invoice_number}.pdf`)
  } catch (err: any) { showError(err, 'PDF genereren mislukt') }
}

function deleteInvoice(inv: any) {
  confirm.require({
    message: `Factuur ${inv.invoice_number} verwijderen?`,
    header: 'Bevestiging',
    acceptLabel: 'Verwijderen',
    rejectLabel: 'Annuleren',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await invoicesApi.delete(inv.id)
      showSuccess('Verwijderd')
      await loadInvoices()
    },
  })
}
</script>
