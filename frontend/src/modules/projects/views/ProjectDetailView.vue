<template>
  <div v-if="loading" class="space-y-6">
    <div class="flex items-center gap-4"><div class="skeleton h-5 w-5 rounded"></div><div class="skeleton h-7 w-64"></div><div class="skeleton h-5 w-20 rounded-md"></div></div>
    <div class="skeleton h-20 w-full rounded-lg"></div>
    <div class="flex gap-6 border-b border-gray-200 pb-3"><div v-for="i in 6" :key="i" class="skeleton h-4 w-24"></div></div>
  </div>

  <div v-else-if="project" class="space-y-6 animate-slide-up">
    <!-- Header -->
    <div class="flex items-start gap-4">
      <button @click="$router.push('/projects')" class="btn-icon mt-0.5"><i class="pi pi-arrow-left text-sm"></i></button>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900">{{ project.name }}</h2>
          <span :class="statusColor(project.status)" class="badge">{{ project.status.replace(/_/g, ' ') }}</span>
          <div class="flex items-center gap-1.5"><div class="w-1.5 h-1.5 rounded-full" :class="statusDot(project.priority)"></div><span class="text-xs font-mono text-gray-500">{{ project.priority }}</span></div>
        </div>
        <p class="text-xs font-mono text-gray-500 mt-1">{{ project.client?.company_name }} · {{ project.project_type?.replace(/_/g, ' ') }} · <span class="text-gray-400">{{ project.slug }}</span></p>
      </div>
      <button class="btn-secondary" @click="showEditDialog = true"><i class="pi pi-pencil text-xs"></i> Bewerken</button>
    </div>

    <!-- Description -->
    <div v-if="project.description" class="card p-5">
      <h3 class="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Beschrijving</h3>
      <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ project.description }}</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-1">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          class="px-3 py-2 text-xs font-medium transition-colors rounded-t-md"
          :class="activeTab === tab.key ? 'text-green-600 bg-white border border-gray-200 border-b-white -mb-px' : 'text-gray-500 hover:text-gray-700'">
          {{ tab.label }} <span class="font-mono text-gray-400 ml-1">{{ tab.count }}</span>
        </button>
      </nav>
    </div>

    <!-- Tab: Communication -->
    <div v-if="activeTab === 'communication'" class="space-y-3">
      <div class="flex justify-end"><button class="btn-secondary text-xs" @click="showCommDialog = true"><i class="pi pi-plus text-xs"></i> Toevoegen</button></div>
      <div v-for="entry in communications" :key="entry.id" class="card p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span :class="statusColor(entry.type)" class="badge text-[10px]">{{ entry.type }}</span>
              <span class="text-sm font-medium text-gray-800">{{ entry.subject }}</span>
            </div>
            <p class="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{{ entry.content }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-4">
            <span class="text-[11px] font-mono text-gray-400">{{ formatDateTime(entry.occurred_at) }}</span>
            <button class="btn-icon text-red-600" @click="deleteCommunication(entry.id)"><i class="pi pi-trash text-xs"></i></button>
          </div>
        </div>
      </div>
      <p v-if="!communications.length" class="text-center text-sm text-gray-400 py-8">Geen communicatie</p>
    </div>

    <!-- Tab: Taken -->
    <div v-if="activeTab === 'tasks'" class="space-y-3">
      <div class="flex gap-2">
        <input v-model="newTaskTitle" placeholder="Nieuwe taak..." class="input flex-1" @keyup.enter="addTask" />
        <Calendar v-model="newTaskDeadline" dateFormat="dd-mm-yy" placeholder="Deadline" showClear class="w-40" />
        <button class="btn-primary" @click="addTask" :disabled="!newTaskTitle.trim()">Toevoegen</button>
      </div>
      <div v-for="task in projectTasks" :key="task.id" class="card p-4 flex items-center gap-3">
        <button class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
          :class="task.status === 'DONE' ? 'bg-green-500 border-green-500' : task.status === 'IN_PROGRESS' ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-green-400'"
          @click="toggleTaskDone(task)">
          <i v-if="task.status === 'DONE'" class="pi pi-check text-white text-[10px]"></i>
          <div v-else-if="task.status === 'IN_PROGRESS'" class="w-2 h-2 rounded-full bg-blue-400"></div>
        </button>
        <div class="flex-1 min-w-0">
          <span class="text-sm text-gray-800" :class="task.status === 'DONE' ? 'line-through text-gray-400' : ''">{{ task.title }}</span>
          <p v-if="task.description" class="text-xs text-gray-400 mt-0.5">{{ task.description }}</p>
        </div>
        <span v-if="task.deadline" class="text-xs font-mono shrink-0" :class="new Date(task.deadline) < new Date(new Date().toDateString()) && task.status !== 'DONE' ? 'text-red-500 font-medium' : 'text-gray-400'">{{ formatDate(task.deadline) }}</span>
        <button class="btn-icon text-red-600" @click="deleteProjectTask(task)"><i class="pi pi-trash text-xs"></i></button>
      </div>
      <p v-if="!projectTasks.length" class="text-center text-sm text-gray-400 py-8">Geen taken</p>
    </div>

    <!-- Tab: Notes -->
    <div v-if="activeTab === 'notes'" class="space-y-3">
      <div class="flex gap-2">
        <input v-model="newNote" placeholder="Notitie toevoegen..." class="input flex-1" @keyup.enter="addNote" />
        <button class="btn-primary" @click="addNote" :disabled="!newNote.trim()">Toevoegen</button>
      </div>
      <div v-for="note in notes" :key="note.id" class="card p-4 flex justify-between items-start">
        <div>
          <p class="text-sm text-gray-700">{{ note.content }}</p>
          <p class="text-[11px] font-mono text-gray-400 mt-1">{{ formatDateTime(note.created_at) }}</p>
        </div>
        <button class="btn-icon text-red-600" @click="deleteNote(note.id)"><i class="pi pi-trash text-xs"></i></button>
      </div>
      <p v-if="!notes.length" class="text-center text-sm text-gray-400 py-8">Geen notities</p>
    </div>

    <!-- Tab: Repositories -->
    <div v-if="activeTab === 'repositories'" class="space-y-3">
      <div class="flex justify-end"><button class="btn-secondary text-xs" @click="showRepoDialog = true"><i class="pi pi-plus text-xs"></i> Toevoegen</button></div>
      <div v-for="repo in repositories" :key="repo.id" class="card p-4 flex justify-between items-center">
        <div>
          <a :href="repo.repo_url" target="_blank" class="text-sm font-medium text-green-600 hover:text-green-700 transition-colors">{{ repo.repo_name }}</a>
          <p class="text-[11px] font-mono text-gray-400">{{ repo.default_branch }}</p>
        </div>
        <button class="btn-icon text-red-600" @click="deleteRepo(repo.id)"><i class="pi pi-trash text-xs"></i></button>
      </div>
      <p v-if="!repositories.length" class="text-center text-sm text-gray-400 py-8">Geen repositories</p>
    </div>

    <!-- Tab: Links -->
    <div v-if="activeTab === 'links'" class="space-y-3">
      <div class="flex justify-end"><button class="btn-secondary text-xs" @click="showLinkDialog = true"><i class="pi pi-plus text-xs"></i> Toevoegen</button></div>
      <div v-for="link in links" :key="link.id" class="card p-4 flex justify-between items-center">
        <div>
          <a :href="link.url" target="_blank" class="text-sm font-medium text-green-600 hover:text-green-700 transition-colors">{{ link.label }}</a>
          <p v-if="link.description" class="text-[11px] text-gray-500">{{ link.description }}</p>
        </div>
        <button class="btn-icon text-red-600" @click="deleteLink(link.id)"><i class="pi pi-trash text-xs"></i></button>
      </div>
      <p v-if="!links.length" class="text-center text-sm text-gray-400 py-8">Geen links</p>
    </div>

    <!-- Tab: Facturen -->
    <div v-if="activeTab === 'invoices'" class="space-y-3">
      <div class="flex justify-end">
        <button class="btn-secondary text-xs" @click="openInvoiceDialog"><i class="pi pi-plus text-xs"></i> Nieuwe factuur</button>
      </div>
      <div v-for="inv in invoices" :key="inv.id" class="card p-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="font-mono text-xs text-gray-700">{{ inv.invoice_number }}</span>
          <span class="text-xs text-gray-500">{{ formatDate(inv.issue_date) }}</span>
          <span :class="statusColor(inv.status)" class="badge text-[10px]">{{ inv.status }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-mono text-sm font-medium text-gray-800">{{ formatCurrency(inv.total_amount) }}</span>
          <button class="btn-icon" @click="downloadInvoicePdf(inv)" title="PDF"><i class="pi pi-file-pdf text-xs"></i></button>
          <button v-if="inv.status !== 'PAID'" class="btn-icon text-green-600" @click="markInvoicePaid(inv)" title="Betaald markeren"><i class="pi pi-check text-xs"></i></button>
          <button class="btn-icon text-red-600" @click="deleteInvoice(inv)" title="Verwijderen"><i class="pi pi-trash text-xs"></i></button>
        </div>
      </div>
      <p v-if="!invoices.length" class="text-center text-sm text-gray-400 py-8">Geen facturen voor dit project</p>
    </div>

    <!-- Tab: Offertes -->
    <div v-if="activeTab === 'proposals'" class="space-y-3">
      <div class="flex justify-end">
        <button class="btn-secondary text-xs" @click="openProposalDialog"><i class="pi pi-plus text-xs"></i> Nieuwe offerte</button>
      </div>
      <div v-for="prop in proposals" :key="prop.id" class="card p-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-gray-800">{{ prop.title }}</span>
          <span :class="statusColor(prop.status)" class="badge text-[10px]">{{ prop.status }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-mono text-sm font-medium text-gray-800">{{ formatCurrency(prop.amount) }}</span>
          <button class="btn-icon" @click="downloadProposalPdf(prop)" title="PDF"><i class="pi pi-file-pdf text-xs"></i></button>
          <button class="btn-icon text-red-600" @click="deleteProposal(prop)" title="Verwijderen"><i class="pi pi-trash text-xs"></i></button>
        </div>
      </div>
      <p v-if="!proposals.length" class="text-center text-sm text-gray-400 py-8">Geen offertes voor dit project</p>
    </div>

    <!-- Communication Dialog -->
    <Dialog v-model:visible="showCommDialog" header="Communicatie toevoegen" modal :style="{ width: '520px' }">
      <form @submit.prevent="addCommunication" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Type</label><Dropdown v-model="commForm.type" :options="commTypes" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Datum</label><Calendar v-model="commForm.occurred_at" showTime dateFormat="dd-mm-yy" class="w-full" /></div>
          <div class="col-span-2"><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Onderwerp</label><input v-model="commForm.subject" class="input" required /></div>
          <div class="col-span-2"><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Inhoud</label><textarea v-model="commForm.content" class="input min-h-[100px]" required /></div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showCommDialog = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Opslaan</button>
        </div>
      </form>
    </Dialog>

    <!-- Proposal Dialog -->
    <Dialog v-model:visible="showProposalDialog" header="Nieuwe offerte" modal :style="{ width: '520px' }">
      <form @submit.prevent="createProposal" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Titel</label><input v-model="proposalForm.title" class="input" required /></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Ontvanger naam</label><input v-model="proposalForm.recipient_name" class="input" required /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Ontvanger e-mail</label><input v-model="proposalForm.recipient_email" class="input" type="email" required /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bedrag</label><InputNumber v-model="proposalForm.amount" mode="currency" currency="EUR" locale="nl-NL" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Levertijd</label><input v-model="proposalForm.delivery_time" class="input" placeholder="Bijv. 4-6 weken" /></div>
        </div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Samenvatting</label><textarea v-model="proposalForm.summary" class="input min-h-[60px]" /></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showProposalDialog = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Aanmaken</button>
        </div>
      </form>
    </Dialog>

    <!-- Repository Dialog -->
    <Dialog v-model:visible="showRepoDialog" header="Repository toevoegen" modal :style="{ width: '440px' }">
      <form @submit.prevent="addRepo" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Naam</label><input v-model="repoForm.repo_name" class="input" placeholder="owner/repo" required /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">URL</label><input v-model="repoForm.repo_url" class="input" placeholder="https://github.com/..." required /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Default branch</label><input v-model="repoForm.default_branch" class="input" /></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showRepoDialog = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Toevoegen</button>
        </div>
      </form>
    </Dialog>

    <!-- Link Dialog -->
    <Dialog v-model:visible="showLinkDialog" header="Link toevoegen" modal :style="{ width: '440px' }">
      <form @submit.prevent="addLink" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Label</label><input v-model="linkForm.label" class="input" required /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">URL</label><input v-model="linkForm.url" class="input" placeholder="https://..." required /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Beschrijving</label><input v-model="linkForm.description" class="input" /></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showLinkDialog = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Toevoegen</button>
        </div>
      </form>
    </Dialog>

    <!-- Invoice Dialog -->
    <Dialog v-model:visible="showInvoiceDialog" header="Nieuwe factuur" modal :style="{ width: '720px' }" @hide="resetInvoiceForm">
      <form @submit.prevent="createInvoice" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Factuurdatum</label>
            <Calendar v-model="invoiceForm.issue_date" dateFormat="dd-mm-yy" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Vervaldatum</label>
            <Calendar v-model="invoiceForm.due_date" dateFormat="dd-mm-yy" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">BTW-tarief</label>
            <InputNumber v-model="invoiceForm.vat_rate" suffix="%" class="w-full" :min="0" :max="100" />
          </div>
        </div>

        <!-- Line items -->
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Regelitems</label>
          <table class="w-full text-sm mb-2">
            <thead>
              <tr class="text-xs text-gray-400 uppercase border-b border-gray-200">
                <th class="text-left pb-1 pr-2" style="width:45%">Omschrijving</th>
                <th class="text-right pb-1 px-2" style="width:15%">Aantal</th>
                <th class="text-right pb-1 px-2" style="width:20%">Tarief</th>
                <th class="text-right pb-1 px-2" style="width:15%">Bedrag</th>
                <th style="width:5%"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in invoiceLineItems" :key="i" class="border-b border-gray-100">
                <td class="py-1 pr-2"><input v-model="item.description" class="input py-1 px-2 text-sm" placeholder="Omschrijving" /></td>
                <td class="py-1 px-2"><input v-model.number="item.quantity" type="number" min="0" step="any" class="input py-1 px-2 text-sm text-right w-full" @input="recalcInvoiceItem(i)" /></td>
                <td class="py-1 px-2"><input v-model.number="item.unit_price" type="number" min="0" step="0.01" class="input py-1 px-2 text-sm text-right w-full" @input="recalcInvoiceItem(i)" /></td>
                <td class="py-1 px-2 text-right text-gray-700">{{ formatCurrency(item.total) }}</td>
                <td class="py-1 pl-1"><button type="button" class="btn-icon text-red-400" @click="invoiceLineItems.splice(i, 1)" :disabled="invoiceLineItems.length === 1"><i class="pi pi-trash text-xs"></i></button></td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="btn-secondary text-xs" @click="invoiceLineItems.push({ description: '', quantity: 1, unit_price: 0, total: 0 })">
            <i class="pi pi-plus text-xs"></i> Regel toevoegen
          </button>
          <p v-if="invoiceErrors.line_items" class="field-error">{{ invoiceErrors.line_items }}</p>
        </div>

        <!-- Totals preview -->
        <div class="flex justify-end text-sm text-gray-600 gap-6 pt-1">
          <span>Subtotaal: <strong>{{ formatCurrency(invoiceSubtotal) }}</strong></span>
          <span>BTW {{ invoiceForm.vat_rate }}%: <strong>{{ formatCurrency(invoiceVatAmount) }}</strong></span>
          <span class="text-gray-900 font-semibold">Totaal: {{ formatCurrency(invoiceTotalAmount) }}</span>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Notities</label>
          <textarea v-model="invoiceForm.notes" class="input min-h-[40px]" />
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showInvoiceDialog = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Aanmaken</button>
        </div>
      </form>
    </Dialog>

    <!-- Edit Project Dialog -->
    <Dialog v-model:visible="showEditDialog" header="Project bewerken" modal :style="{ width: '560px' }">
      <form @submit.prevent="updateProject" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Projectnaam</label><input v-model="editForm.name" class="input" /></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Status</label><Dropdown v-model="editForm.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Prioriteit</label><Dropdown v-model="editForm.priority" :options="priorityOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
        </div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Beschrijving</label><textarea v-model="editForm.description" class="input min-h-[80px]" /></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showEditDialog = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Opslaan</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectsApi, communicationApi, notesApi, repositoriesApi, linksApi, invoicesApi, proposalsApi, tasksApi } from '@/api/services'
import { useFormatting } from '@/composables/useFormatting'
import { useErrorHandler } from '@/composables/useErrorHandler'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'

const route = useRoute()
const router = useRouter()
const { showError, showSuccess } = useErrorHandler()
const { formatDate, formatDateTime, formatCurrency, statusColor, statusDot, downloadBlob, toISODate } = useFormatting()

const project = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const activeTab = ref('communication')

const communications = ref<any[]>([])
const notes = ref<any[]>([])
const repositories = ref<any[]>([])
const links = ref<any[]>([])
const invoices = ref<any[]>([])
const proposals = ref<any[]>([])
const projectTasks = ref<any[]>([])
const newNote = ref('')
const newTaskTitle = ref('')
const newTaskDeadline = ref<Date | null>(null)

const showCommDialog = ref(false)
const showRepoDialog = ref(false)
const showLinkDialog = ref(false)
const showEditDialog = ref(false)
const showInvoiceDialog = ref(false)
const showProposalDialog = ref(false)

const commForm = ref<any>({ type: 'EMAIL', subject: '', content: '', occurred_at: new Date() })
const repoForm = ref<any>({ repo_name: '', repo_url: '', default_branch: 'main' })
const proposalForm = ref<any>({ title: '', recipient_name: '', recipient_email: '', recipient_company: '', amount: 0, delivery_time: '', summary: '' })
const linkForm = ref<any>({ label: '', url: '', description: '' })
const editForm = ref<any>({})
interface InvoiceLineItem { description: string; quantity: number; unit_price: number; total: number }
const invoiceForm = ref<any>({ vat_rate: 21, issue_date: new Date(), due_date: new Date(Date.now() + 30 * 86400000), notes: '' })
const invoiceLineItems = ref<InvoiceLineItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }])
const invoiceErrors = ref<Record<string, string>>({})
const invoiceSubtotal = computed(() => invoiceLineItems.value.reduce((s, i) => s + i.total, 0))
const invoiceVatAmount = computed(() => Math.round(invoiceSubtotal.value * (invoiceForm.value.vat_rate / 100) * 100) / 100)
const invoiceTotalAmount = computed(() => invoiceSubtotal.value + invoiceVatAmount.value)

function recalcInvoiceItem(i: number) {
  const item = invoiceLineItems.value[i]
  item.total = Math.round((item.quantity || 0) * (item.unit_price || 0) * 100) / 100
}

function resetInvoiceForm() {
  invoiceForm.value = { vat_rate: 21, issue_date: new Date(), due_date: new Date(Date.now() + 30 * 86400000), notes: '' }
  invoiceLineItems.value = [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  invoiceErrors.value = {}
}

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
const commTypes = [
  { label: 'E-mail', value: 'EMAIL' }, { label: 'Telefoon', value: 'CALL' },
  { label: 'Meeting', value: 'MEETING' }, { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'DM', value: 'DM' }, { label: 'Intern', value: 'INTERNAL' }, { label: 'Overig', value: 'OTHER' },
]

const tabs = computed(() => [
  { key: 'communication', label: 'Communicatie', count: communications.value.length },
  { key: 'tasks', label: 'Taken', count: projectTasks.value.length },
  { key: 'notes', label: 'Notities', count: notes.value.length },
  { key: 'repositories', label: 'Repos', count: repositories.value.length },
  { key: 'links', label: 'Links', count: links.value.length },
  { key: 'proposals', label: 'Offertes', count: proposals.value.length },
  { key: 'invoices', label: 'Facturen', count: invoices.value.length },
])

onMounted(async () => {
  const id = route.params.id as string
  try {
    const { data } = await projectsApi.get(id)
    project.value = data
    editForm.value = { name: data.name, status: data.status, priority: data.priority, description: data.description }
    await loadAllTabs(id)
  } catch (err: any) { showError(err, 'Project laden mislukt'); router.push('/projects') }
  loading.value = false
})

async function loadAllTabs(projectId: string) {
  const [comms, n, repos, lnks, invs, props, tks] = await Promise.all([
    communicationApi.list(projectId).catch(() => ({ data: [] })),
    notesApi.list(projectId).catch(() => ({ data: [] })),
    repositoriesApi.list(projectId).catch(() => ({ data: [] })),
    linksApi.list(projectId).catch(() => ({ data: [] })),
    invoicesApi.list({ project_id: projectId }).catch(() => ({ data: [] })),
    proposalsApi.listByProject(projectId).catch(() => ({ data: [] })),
    tasksApi.list({ project_id: projectId }).catch(() => ({ data: [] })),
  ])
  communications.value = comms.data
  notes.value = n.data
  repositories.value = repos.data
  links.value = lnks.data
  invoices.value = invs.data
  proposals.value = props.data
  projectTasks.value = tks.data
}

async function addCommunication() {
  saving.value = true
  try {
    await communicationApi.create(project.value.id, { ...commForm.value, occurred_at: commForm.value.occurred_at.toISOString() })
    showCommDialog.value = false; commForm.value = { type: 'EMAIL', subject: '', content: '', occurred_at: new Date() }
    const { data } = await communicationApi.list(project.value.id); communications.value = data
    showSuccess('Toegevoegd')
  } catch (err: any) { showError(err) }
  saving.value = false
}

async function deleteCommunication(id: string) {
  await communicationApi.delete(id)
  communications.value = communications.value.filter(c => c.id !== id)
}

async function addNote() {
  if (!newNote.value.trim()) return
  await notesApi.create(project.value.id, { content: newNote.value }); newNote.value = ''
  const { data } = await notesApi.list(project.value.id); notes.value = data
}
async function deleteNote(id: string) { await notesApi.delete(id); notes.value = notes.value.filter(n => n.id !== id) }

async function addRepo() {
  saving.value = true
  try {
    await repositoriesApi.create(project.value.id, repoForm.value)
    showRepoDialog.value = false; repoForm.value = { repo_name: '', repo_url: '', default_branch: 'main' }
    const { data } = await repositoriesApi.list(project.value.id); repositories.value = data
  } catch (err: any) { showError(err) }
  saving.value = false
}
async function deleteRepo(id: string) { await repositoriesApi.delete(id); repositories.value = repositories.value.filter(r => r.id !== id) }

async function addLink() {
  saving.value = true
  try {
    await linksApi.create(project.value.id, linkForm.value)
    showLinkDialog.value = false; linkForm.value = { label: '', url: '', description: '' }
    const { data } = await linksApi.list(project.value.id); links.value = data
  } catch (err: any) { showError(err) }
  saving.value = false
}
async function deleteLink(id: string) { await linksApi.delete(id); links.value = links.value.filter(l => l.id !== id) }

async function updateProject() {
  saving.value = true
  try {
    const { data } = await projectsApi.update(project.value.id, editForm.value)
    Object.assign(project.value, data); showEditDialog.value = false
    showSuccess('Bijgewerkt')
  } catch (err: any) { showError(err) }
  saving.value = false
}

async function downloadInvoicePdf(inv: any) {
  try { const { data } = await invoicesApi.downloadPdf(inv.id); downloadBlob(data, `factuur-${inv.invoice_number}.pdf`) }
  catch (err: any) { showError(err, 'PDF genereren mislukt') }
}

function openInvoiceDialog() {
  resetInvoiceForm()
  showInvoiceDialog.value = true
}

async function createInvoice() {
  invoiceErrors.value = {}
  const items = invoiceLineItems.value.filter(i => i.description.trim())
  if (!items.length) {
    invoiceErrors.value.line_items = 'Voeg minimaal één regelitem toe'
    return
  }
  saving.value = true
  try {
    await invoicesApi.create({
      client_id: project.value.client_id,
      project_id: project.value.id,
      vat_rate: invoiceForm.value.vat_rate,
      issue_date: toISODate(invoiceForm.value.issue_date),
      due_date: toISODate(invoiceForm.value.due_date),
      notes: invoiceForm.value.notes || undefined,
      line_items: items.map(i => ({ description: i.description, quantity: String(i.quantity), unit_price: String(i.unit_price), total: String(i.total) })),
    })
    showInvoiceDialog.value = false
    const { data } = await invoicesApi.list({ project_id: project.value.id })
    invoices.value = data
    showSuccess('Factuur aangemaakt')
  } catch (err: any) {
    if (err.response?.status === 422) {
      const detail = err.response.data?.detail
      if (Array.isArray(detail)) detail.forEach((e: any) => { invoiceErrors.value[e.loc?.slice(-1)[0]] = e.msg })
      else invoiceErrors.value.line_items = detail || 'Validatiefout'
    } else { showError(err) }
  }
  saving.value = false
}

async function markInvoicePaid(inv: any) {
  try {
    await invoicesApi.markPaid(inv.id)
    const { data } = await invoicesApi.list({ project_id: project.value.id })
    invoices.value = data
    showSuccess('Factuur betaald')
  } catch (err: any) { showError(err) }
}

async function deleteInvoice(inv: any) {
  try {
    await invoicesApi.delete(inv.id)
    invoices.value = invoices.value.filter(i => i.id !== inv.id)
    showSuccess('Factuur verwijderd')
  } catch (err: any) { showError(err) }
}

async function addTask() {
  if (!newTaskTitle.value.trim()) return
  try {
    await tasksApi.create({
      title: newTaskTitle.value,
      project_id: project.value.id,
      deadline: newTaskDeadline.value ? toISODate(newTaskDeadline.value) : null,
    })
    newTaskTitle.value = ''
    newTaskDeadline.value = null
    const { data } = await tasksApi.list({ project_id: project.value.id })
    projectTasks.value = data
  } catch (err: any) { showError(err) }
}

async function toggleTaskDone(task: any) {
  const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
  await tasksApi.update(task.id, { status: newStatus })
  const { data } = await tasksApi.list({ project_id: project.value.id })
  projectTasks.value = data
}

async function deleteProjectTask(task: any) {
  await tasksApi.delete(task.id)
  projectTasks.value = projectTasks.value.filter(t => t.id !== task.id)
}

function openProposalDialog() {
  const client = project.value?.client
  proposalForm.value = {
    title: '',
    recipient_name: client?.contact_name || '',
    recipient_email: client?.email || '',
    recipient_company: client?.company_name || '',
    amount: 0,
    delivery_time: '',
    summary: '',
    scope: '',
  }
  showProposalDialog.value = true
}

async function createProposal() {
  saving.value = true
  try {
    await proposalsApi.create({
      client_id: project.value.client_id,
      project_id: project.value.id,
      ...proposalForm.value,
    })
    showProposalDialog.value = false
    const { data } = await proposalsApi.listByProject(project.value.id)
    proposals.value = data
    showSuccess('Offerte aangemaakt')
  } catch (err: any) { showError(err) }
  saving.value = false
}

async function downloadProposalPdf(prop: any) {
  try { const { data } = await proposalsApi.downloadPdf(prop.id); downloadBlob(data, `offerte-${prop.title}.pdf`) }
  catch (err: any) { showError(err, 'PDF genereren mislukt') }
}

async function deleteProposal(prop: any) {
  try {
    await proposalsApi.delete(prop.id)
    proposals.value = proposals.value.filter(p => p.id !== prop.id)
    showSuccess('Offerte verwijderd')
  } catch (err: any) { showError(err) }
}
</script>
