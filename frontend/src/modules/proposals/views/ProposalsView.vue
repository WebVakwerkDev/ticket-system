<template>
  <div class="space-y-5 animate-slide-up">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input v-model="search" class="input pl-9 w-64" placeholder="Zoek op titel of bedrijf..." />
        </div>
        <span class="text-xs font-mono text-gray-400">{{ filteredProposals.length }} offertes</span>
      </div>
      <button class="btn-primary" @click="showCreate = true"><i class="pi pi-plus text-xs"></i> Nieuwe offerte</button>
    </div>

    <div v-if="!filteredProposals.length && !loading" class="card p-12 text-center">
      <i class="pi pi-file-edit text-3xl text-gray-300 mb-3"></i>
      <p class="text-sm text-gray-500">Nog geen offertes</p>
    </div>

    <div v-else class="card overflow-hidden light-table">
      <DataTable :value="filteredProposals" stripedRows paginator :rows="20" sortField="created_at" :sortOrder="-1">
        <Column field="title" header="Titel" sortable><template #body="{ data }"><span class="text-gray-800 font-medium">{{ data.title }}</span></template></Column>
        <Column field="recipient_company" header="Bedrijf" sortable><template #body="{ data }"><span class="text-gray-500">{{ data.recipient_company || '—' }}</span></template></Column>
        <Column field="amount" header="Bedrag" sortable style="width:130px"><template #body="{ data }"><span class="font-mono text-sm font-medium text-gray-800">{{ formatCurrency(data.amount) }}</span></template></Column>
        <Column field="status" header="Status" sortable style="width:100px"><template #body="{ data }"><span :class="statusColor(data.status)" class="badge">{{ proposalStatusLabels[data.status] || data.status }}</span></template></Column>
        <Column field="created_at" header="Datum" sortable style="width:120px"><template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ formatDate(data.created_at) }}</span></template></Column>
        <Column header="" style="width:100px">
          <template #body="{ data }">
            <div class="flex gap-1 justify-end">
              <button class="btn-icon" @click.stop="downloadPdf(data)"><i class="pi pi-file-pdf text-xs"></i></button>
              <button class="btn-icon text-red-600" @click.stop="deleteProposal(data)"><i class="pi pi-trash text-xs"></i></button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showCreate" header="Nieuwe offerte" modal :style="{ width: '560px' }">
      <form @submit.prevent="createProposal" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Titel <span class="text-red-400">*</span></label><input v-model="form.title" class="input" required /></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Klant</label><Dropdown v-model="form.client_id" :options="clientOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bedrag</label><InputNumber v-model="form.amount" mode="currency" currency="EUR" locale="nl-NL" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Ontvanger naam <span class="text-red-400">*</span></label><input v-model="form.recipient_name" class="input" required /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Ontvanger e-mail <span class="text-red-400">*</span></label><input v-model="form.recipient_email" type="email" class="input" required /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bedrijfsnaam</label><input v-model="form.recipient_company" class="input" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Levertijd</label><input v-model="form.delivery_time" class="input" placeholder="bijv. 4-6 weken" /></div>
        </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Prijslabel</label>
            <input v-model="form.price_label" class="input" list="price-label-suggestions" placeholder="Bijv. Projectprijs, Abonnementsprijs..." />
            <datalist id="price-label-suggestions">
              <option value="Projectprijs" />
              <option value="Abonnementsprijs" />
              <option value="Maatwerktarief" />
            </datalist>
          </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showCreate = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Aanmaken</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { proposalsApi, clientsApi } from '@/api/services'
import { useFormatting } from '@/composables/useFormatting'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'

const { showError, showSuccess } = useErrorHandler()
const confirm = useConfirm()
const { formatDate, formatCurrency, statusColor, downloadBlob } = useFormatting()
const proposalStatusLabels: Record<string, string> = {
  DRAFT: 'Concept',
  SENT: 'Verzonden',
  ACCEPTED: 'Geaccepteerd',
  REJECTED: 'Afgewezen',
  EXPIRED: 'Verlopen',
}

const proposals = ref<any[]>([])
const clientOptions = ref<any[]>([])
const search = ref('')
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const form = ref<any>({
  title: '',
  client_id: '',
  amount: 0,
  recipient_name: '',
  recipient_email: '',
  recipient_company: '',
  delivery_time: '',
  price_label: 'Projectprijs',
})

const filteredProposals = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return proposals.value
  return proposals.value.filter(p =>
    (p.title || '').toLowerCase().includes(q) ||
    (p.recipient_company || '').toLowerCase().includes(q)
  )
})

onMounted(async () => {
  await Promise.all([loadProposals(), loadClients()])
  loading.value = false
})

async function loadProposals() {
  try {
    const { data } = await proposalsApi.list()
    proposals.value = data
  } catch (err: any) { showError(err) }
}

async function loadClients() {
  try {
    const { data } = await clientsApi.list()
    clientOptions.value = data.map((c: any) => ({ label: c.company_name, value: c.id }))
  } catch (err: any) { showError(err) }
}

async function createProposal() {
  saving.value = true
  try { await proposalsApi.create(form.value); showCreate.value = false; form.value = { title: '', client_id: '', amount: 0, recipient_name: '', recipient_email: '', recipient_company: '', delivery_time: '', price_label: 'Projectprijs' }; showSuccess('Offerte aangemaakt') }
  catch (err: any) { showError(err) }
  saving.value = false
}
async function downloadPdf(p: any) {
  try { const { data } = await proposalsApi.downloadPdf(p.id); downloadBlob(data, `offerte-${p.title}.pdf`) }
  catch (err: any) { showError(err, 'PDF genereren mislukt') }
}
function deleteProposal(p: any) {
  confirm.require({ message: `"${p.title}" verwijderen?`, header: 'Bevestiging', acceptLabel: 'Verwijderen', rejectLabel: 'Annuleren', acceptClass: 'p-button-danger',
    accept: async () => { await proposalsApi.delete(p.id); proposals.value = proposals.value.filter(x => x.id !== p.id); showSuccess('Verwijderd') } })
}
</script>
