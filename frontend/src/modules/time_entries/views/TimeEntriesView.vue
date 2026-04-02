<template>
  <div class="space-y-5 animate-slide-up">
    <!-- Summary bar -->
    <div class="grid grid-cols-2 gap-4">
      <div class="card px-5 py-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Uren dit jaar</div>
        <div class="text-2xl font-semibold text-gray-800 font-mono">{{ summary.total_hours }}</div>
      </div>
      <div class="card px-5 py-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Uren deze maand</div>
        <div class="text-2xl font-semibold text-gray-800 font-mono">{{ currentMonthHours }}</div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Dropdown v-model="filterProject" :options="projectOptions" optionLabel="label" optionValue="value" placeholder="Alle projecten" showClear class="w-56" @change="loadEntries" />
        <span class="text-xs font-mono text-gray-400">{{ entries.length }} registraties</span>
      </div>
      <button class="btn-primary" @click="showCreate = true"><i class="pi pi-plus text-xs"></i> Uren toevoegen</button>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden light-table">
      <DataTable :value="entries" stripedRows paginator :rows="20" sortField="date" :sortOrder="-1">
        <Column field="date" header="Datum" sortable style="width:120px">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ formatDate(data.date) }}</span></template>
        </Column>
        <Column field="project_name" header="Project" sortable>
          <template #body="{ data }"><span class="text-gray-700">{{ data.project_name || '—' }}</span></template>
        </Column>
        <Column field="hours" header="Uren" sortable style="width:100px">
          <template #body="{ data }"><span class="font-mono text-sm font-medium text-gray-800">{{ data.hours }}</span></template>
        </Column>
        <Column field="description" header="Omschrijving">
          <template #body="{ data }"><span class="text-xs text-gray-500">{{ data.description || '—' }}</span></template>
        </Column>
        <Column header="" style="width:60px">
          <template #body="{ data }">
            <button class="btn-icon text-red-600 hover:text-red-700" @click.stop="deleteEntry(data)" title="Verwijderen"><i class="pi pi-trash text-xs"></i></button>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create dialog -->
    <Dialog v-model:visible="showCreate" header="Uren registreren" modal :style="{ width: '480px' }">
      <form @submit.prevent="createEntry" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Project</label><Dropdown v-model="form.project_id" :options="projectOptions" optionLabel="label" optionValue="value" placeholder="Selecteer project" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Datum</label><Calendar v-model="form.date" dateFormat="dd-mm-yy" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Uren</label><InputNumber v-model="form.hours" :minFractionDigits="1" :maxFractionDigits="2" :min="0.25" :max="24" :step="0.25" class="w-full" /></div>
        </div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Omschrijving (optioneel)</label><textarea v-model="form.description" class="input min-h-[50px]" /></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showCreate = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving || !form.project_id">Opslaan</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { timeEntriesApi } from '@/modules/time_entries/api'
import { projectsApi } from '@/api/services'
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
const { formatDate, toISODate } = useFormatting()

const entries = ref<any[]>([])
const projectOptions = ref<any[]>([])
const filterProject = ref<string | null>(null)
const showCreate = ref(false)
const saving = ref(false)
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const summary = ref<any>({ total_hours: 0, monthly: [], by_project: [] })

const form = ref<any>({ project_id: '', date: new Date(), hours: 8, description: '' })

const currentMonthHours = computed(() => {
  const entry = summary.value.monthly?.find((m: any) => m.month === currentMonth)
  return entry?.hours || 0
})

onMounted(async () => {
  await Promise.all([loadEntries(), loadProjects(), loadSummary()])
})

async function loadProjects() {
  try {
    const { data } = await projectsApi.list()
    projectOptions.value = data.map((p: any) => ({ label: p.name, value: p.id }))
  } catch (err: any) { showError(err) }
}

async function loadEntries() {
  try {
    const params: any = {}
    if (filterProject.value) params.project_id = filterProject.value
    const { data } = await timeEntriesApi.list(params)
    entries.value = data
  } catch (err: any) { showError(err) }
}

async function loadSummary() {
  try {
    const { data } = await timeEntriesApi.summary(currentYear)
    summary.value = data
  } catch (err: any) { showError(err) }
}

async function createEntry() {
  saving.value = true
  try {
    await timeEntriesApi.create({ ...form.value, date: toISODate(form.value.date) })
    showCreate.value = false
    showSuccess('Uren geregistreerd')
    await Promise.all([loadEntries(), loadSummary()])
    form.value = { project_id: '', date: new Date(), hours: 8, description: '' }
  } catch (err: any) { showError(err) }
  saving.value = false
}

function deleteEntry(entry: any) {
  confirm.require({
    message: 'Deze urenregistratie verwijderen?',
    header: 'Bevestiging',
    acceptLabel: 'Verwijderen',
    rejectLabel: 'Annuleren',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await timeEntriesApi.delete(entry.id)
      showSuccess('Verwijderd')
      await Promise.all([loadEntries(), loadSummary()])
    },
  })
}
</script>
