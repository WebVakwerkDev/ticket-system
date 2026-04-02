<template>
  <div class="space-y-5 animate-slide-up">
    <!-- Upcoming deadlines -->
    <div v-if="upcomingTasks.length" class="card">
      <div class="px-5 py-4 border-b border-gray-200"><h2 class="text-sm font-medium text-gray-800">Opkomende deadlines</h2></div>
      <div class="divide-y divide-gray-100">
        <div v-for="task in upcomingTasks" :key="task.id" class="px-5 py-3 flex items-center gap-4">
          <button class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
            :class="task.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'"
            @click="toggleDone(task)">
            <i v-if="task.status === 'DONE'" class="pi pi-check text-white text-[10px]"></i>
          </button>
          <div class="flex-1 min-w-0">
            <span class="text-sm text-gray-800" :class="task.status === 'DONE' ? 'line-through text-gray-400' : ''">{{ task.title }}</span>
            <span v-if="task.project_name" class="text-xs text-gray-400 ml-2">{{ task.project_name }}</span>
          </div>
          <span class="text-xs font-mono shrink-0" :class="isOverdue(task.deadline) ? 'text-red-500 font-medium' : 'text-gray-500'">{{ formatDate(task.deadline) }}</span>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Alle statussen" showClear class="w-44" @change="loadTasks" />
        <Dropdown v-model="filterProject" :options="projectOptions" optionLabel="label" optionValue="value" placeholder="Alle projecten" showClear class="w-56" @change="loadTasks" />
        <span class="text-xs font-mono text-gray-400">{{ tasks.length }} taken</span>
      </div>
      <button class="btn-primary" @click="showCreate = true"><i class="pi pi-plus text-xs"></i> Nieuwe taak</button>
    </div>

    <!-- Task list -->
    <div class="card overflow-hidden">
      <div class="divide-y divide-gray-100">
        <div v-for="task in tasks" :key="task.id" class="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
          <button class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
            :class="task.status === 'DONE' ? 'bg-green-500 border-green-500' : task.status === 'IN_PROGRESS' ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-green-400'"
            @click="toggleDone(task)">
            <i v-if="task.status === 'DONE'" class="pi pi-check text-white text-[10px]"></i>
            <div v-else-if="task.status === 'IN_PROGRESS'" class="w-2 h-2 rounded-full bg-blue-400"></div>
          </button>
          <div class="flex-1 min-w-0">
            <span class="text-sm text-gray-800" :class="task.status === 'DONE' ? 'line-through text-gray-400' : ''">{{ task.title }}</span>
            <span v-if="task.project_name" class="text-xs text-gray-400 ml-2">{{ task.project_name }}</span>
            <p v-if="task.description" class="text-xs text-gray-400 mt-0.5 truncate">{{ task.description }}</p>
          </div>
          <span v-if="task.deadline" class="text-xs font-mono shrink-0" :class="isOverdue(task.deadline) && task.status !== 'DONE' ? 'text-red-500 font-medium' : 'text-gray-400'">{{ formatDate(task.deadline) }}</span>
          <Dropdown v-model="task.status" :options="statusChoices" optionLabel="label" optionValue="value" class="w-32 text-xs" @change="updateStatus(task)" />
          <button class="btn-icon text-red-600 hover:text-red-700" @click="deleteTask(task)"><i class="pi pi-trash text-xs"></i></button>
        </div>
        <p v-if="!tasks.length" class="text-center text-sm text-gray-400 py-12">Geen taken</p>
      </div>
    </div>

    <!-- Create dialog -->
    <Dialog v-model:visible="showCreate" header="Nieuwe taak" modal :style="{ width: '480px' }">
      <form @submit.prevent="createTask" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Titel</label><input v-model="form.title" class="input" required /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Omschrijving (optioneel)</label><textarea v-model="form.description" class="input min-h-[50px]" /></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Project (optioneel)</label><Dropdown v-model="form.project_id" :options="projectOptions" optionLabel="label" optionValue="value" placeholder="Geen project" showClear class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Deadline (optioneel)</label><Calendar v-model="form.deadline" dateFormat="dd-mm-yy" showClear class="w-full" /></div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showCreate = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving || !form.title.trim()">Aanmaken</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tasksApi } from '@/modules/tasks/api'
import { projectsApi } from '@/api/services'
import { useFormatting } from '@/composables/useFormatting'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'

const { showError, showSuccess } = useErrorHandler()
const confirm = useConfirm()
const { formatDate, toISODate } = useFormatting()

const tasks = ref<any[]>([])
const upcomingTasks = ref<any[]>([])
const projectOptions = ref<any[]>([])
const filterStatus = ref<string | null>(null)
const filterProject = ref<string | null>(null)
const showCreate = ref(false)
const saving = ref(false)
const form = ref<any>({ title: '', description: '', project_id: null, deadline: null })

const statusOptions = [
  { label: 'Te doen', value: 'TODO' },
  { label: 'Bezig', value: 'IN_PROGRESS' },
  { label: 'Klaar', value: 'DONE' },
]
const statusChoices = [
  { label: 'Te doen', value: 'TODO' },
  { label: 'Bezig', value: 'IN_PROGRESS' },
  { label: 'Klaar', value: 'DONE' },
]

onMounted(async () => {
  await Promise.all([loadTasks(), loadUpcoming(), loadProjects()])
})

async function loadProjects() {
  try {
    const { data } = await projectsApi.list()
    projectOptions.value = data.map((p: any) => ({ label: p.name, value: p.id }))
  } catch {}
}

async function loadTasks() {
  try {
    const params: any = {}
    if (filterStatus.value) params.status = filterStatus.value
    if (filterProject.value) params.project_id = filterProject.value
    const { data } = await tasksApi.list(params)
    tasks.value = data
  } catch {}
}

async function loadUpcoming() {
  try {
    const { data } = await tasksApi.list({ upcoming: true })
    upcomingTasks.value = data
  } catch {}
}

function isOverdue(deadline: string): boolean {
  return new Date(deadline) < new Date(new Date().toDateString())
}

async function createTask() {
  saving.value = true
  try {
    await tasksApi.create({
      ...form.value,
      deadline: form.value.deadline ? toISODate(form.value.deadline) : null,
    })
    showCreate.value = false
    showSuccess('Taak aangemaakt')
    form.value = { title: '', description: '', project_id: null, deadline: null }
    await Promise.all([loadTasks(), loadUpcoming()])
  } catch (err: any) { showError(err) }
  saving.value = false
}

async function toggleDone(task: any) {
  const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
  await tasksApi.update(task.id, { status: newStatus })
  await Promise.all([loadTasks(), loadUpcoming()])
}

async function updateStatus(task: any) {
  await tasksApi.update(task.id, { status: task.status })
  await loadUpcoming()
}

function deleteTask(task: any) {
  confirm.require({
    message: `"${task.title}" verwijderen?`,
    header: 'Bevestiging',
    acceptLabel: 'Verwijderen',
    rejectLabel: 'Annuleren',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await tasksApi.delete(task.id)
      showSuccess('Verwijderd')
      await Promise.all([loadTasks(), loadUpcoming()])
    },
  })
}
</script>
