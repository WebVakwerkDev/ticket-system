<template>
  <div class="space-y-5 animate-slide-up">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Dropdown v-model="filters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Status" showClear class="w-44" @change="loadProjects" />
        <Dropdown v-model="filters.priority" :options="priorityOptions" optionLabel="label" optionValue="value" placeholder="Prioriteit" showClear class="w-36" @change="loadProjects" />
        <span class="text-xs font-mono text-gray-400 ml-2">{{ projects.length }} resultaten</span>
      </div>
      <button class="btn-primary" @click="showCreate = true"><i class="pi pi-plus text-xs"></i> Nieuw project</button>
    </div>

    <div v-if="loading" class="card">
      <div v-for="i in 8" :key="i" class="flex items-center gap-4 px-5 py-3.5 border-b border-gray-200 last:border-0">
        <div class="skeleton h-4 w-48"></div><div class="skeleton h-5 w-20 rounded-md"></div><div class="skeleton h-5 w-16 rounded-md"></div>
        <div class="flex-1"></div><div class="skeleton h-4 w-24"></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden light-table">
      <DataTable :value="projects" stripedRows paginator :rows="20" sortField="created_at" :sortOrder="-1"
        @row-click="(e: any) => $router.push(`/projects/${e.data.id}`)">
        <Column field="name" header="Project" sortable>
          <template #body="{ data }">
            <div><span class="text-gray-900 font-medium">{{ data.name }}</span><p class="text-[11px] font-mono text-gray-400 mt-0.5">{{ data.slug }}</p></div>
          </template>
        </Column>
        <Column field="status" header="Status" sortable style="width: 170px">
          <template #body="{ data }"><span :class="statusColor(data.status)" class="badge">{{ data.status.replace(/_/g, ' ') }}</span></template>
        </Column>
        <Column field="priority" header="Prio" sortable style="width: 100px">
          <template #body="{ data }">
            <div class="flex items-center gap-1.5"><div class="w-1.5 h-1.5 rounded-full" :class="statusDot(data.priority)"></div><span class="text-xs font-mono text-gray-500">{{ data.priority }}</span></div>
          </template>
        </Column>
        <Column field="project_type" header="Type" sortable style="width: 140px">
          <template #body="{ data }"><span class="text-xs font-mono text-gray-500">{{ data.project_type.replace(/_/g, ' ') }}</span></template>
        </Column>
        <Column field="created_at" header="Aangemaakt" sortable style="width: 130px">
          <template #body="{ data }"><span class="text-xs font-mono text-gray-500">{{ formatDate(data.created_at) }}</span></template>
        </Column>
        <Column header="" style="width:60px">
          <template #body="{ data }">
            <button class="btn-icon text-red-600 hover:text-red-700" @click.stop="deleteProject(data)" title="Verwijderen"><i class="pi pi-trash text-xs"></i></button>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showCreate" header="Nieuw project" modal :style="{ width: '560px' }">
      <form @submit.prevent="createProject" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Projectnaam</label><input v-model="form.name" class="input" required /></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Klant</label><Dropdown v-model="form.client_id" :options="clientOptions" optionLabel="label" optionValue="value" placeholder="Selecteer" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Type</label><Dropdown v-model="form.project_type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Prioriteit</label><Dropdown v-model="form.priority" :options="priorityOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Status</label><Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
        </div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Beschrijving</label><textarea v-model="form.description" class="input min-h-[80px]" /></div>
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
import { projectsApi, clientsApi } from '@/api/services'
import { useFormatting } from '@/composables/useFormatting'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'

const { showError, showSuccess } = useErrorHandler()
const confirm = useConfirm()
const { formatDate, statusColor, statusDot } = useFormatting()
const projects = ref<any[]>([])
const clientOptions = ref<any[]>([])
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const filters = ref<any>({ status: null, priority: null })
const form = ref({ name: '', client_id: '', project_type: 'NEW_WEBSITE', priority: 'MEDIUM', status: 'LEAD', description: '' })

const statusOptions = [
  { label: 'Lead', value: 'LEAD' }, { label: 'Intake', value: 'INTAKE' },
  { label: 'In Progress', value: 'IN_PROGRESS' }, { label: 'Wachtend', value: 'WAITING_FOR_CLIENT' },
  { label: 'Review', value: 'REVIEW' }, { label: 'Afgerond', value: 'COMPLETED' },
  { label: 'Onderhoud', value: 'MAINTENANCE' }, { label: 'Gepauzeerd', value: 'PAUSED' },
]
const priorityOptions = [
  { label: 'Laag', value: 'LOW' }, { label: 'Gemiddeld', value: 'MEDIUM' },
  { label: 'Hoog', value: 'HIGH' }, { label: 'Urgent', value: 'URGENT' },
]
const typeOptions = [
  { label: 'Nieuwe Website', value: 'NEW_WEBSITE' }, { label: 'Redesign', value: 'REDESIGN' },
  { label: 'Onderhoud', value: 'MAINTENANCE' }, { label: 'Landing Page', value: 'LANDING_PAGE' },
  { label: 'Portfolio', value: 'PORTFOLIO' }, { label: 'Webshop', value: 'WEBSHOP' },
  { label: 'Overig', value: 'OTHER' },
]

onMounted(async () => { await Promise.all([loadProjects(), loadClients()]) })

async function loadProjects() {
  loading.value = true
  try { const params: any = {}; if (filters.value.status) params.status = filters.value.status; if (filters.value.priority) params.priority = filters.value.priority; const { data } = await projectsApi.list(params); projects.value = data } catch {}
  loading.value = false
}
async function loadClients() {
  try { const { data } = await clientsApi.list(); clientOptions.value = data.map((c: any) => ({ label: c.company_name, value: c.id })) } catch {}
}
function deleteProject(project: any) {
  confirm.require({
    message: `Project "${project.name}" verwijderen?`,
    header: 'Bevestiging',
    acceptLabel: 'Verwijderen',
    rejectLabel: 'Annuleren',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await projectsApi.delete(project.id)
        showSuccess('Project verwijderd')
        await loadProjects()
      } catch (err: any) { showError(err) }
    },
  })
}

async function createProject() {
  saving.value = true
  try {
    await projectsApi.create(form.value); showCreate.value = false
    form.value = { name: '', client_id: '', project_type: 'NEW_WEBSITE', priority: 'MEDIUM', status: 'LEAD', description: '' }
    showSuccess('Project aangemaakt'); await loadProjects()
  } catch (err: any) { showError(err) }
  saving.value = false
}
</script>
