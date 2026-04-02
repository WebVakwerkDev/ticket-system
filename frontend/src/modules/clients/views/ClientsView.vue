<template>
  <div class="space-y-5 animate-slide-up">
    <div class="flex items-center justify-between">
      <p class="text-xs font-mono text-gray-500">{{ clients.length }} klanten</p>
      <button v-if="auth.hasRole('ADMIN','EMPLOYEE')" class="btn-primary" @click="showCreate = true">
        <i class="pi pi-plus text-xs"></i> Nieuwe klant
      </button>
    </div>

    <div v-if="loading" class="card">
      <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-5 py-3.5 border-b border-gray-200 last:border-0">
        <div class="skeleton h-4 w-40"></div><div class="skeleton h-4 w-32"></div><div class="skeleton h-4 w-44"></div>
        <div class="flex-1"></div><div class="skeleton h-5 w-8 rounded-md"></div>
      </div>
    </div>

    <div v-else class="card overflow-hidden light-table">
      <DataTable :value="clients" stripedRows paginator :rows="20" :rowsPerPageOptions="[10,20,50]"
        sortField="company_name" :sortOrder="1"
        @row-click="(e: any) => $router.push(`/clients/${e.data.id}`)">
        <Column field="company_name" header="Bedrijf" sortable>
          <template #body="{ data }"><span class="text-gray-900 font-medium">{{ data.company_name }}</span></template>
        </Column>
        <Column field="contact_name" header="Contact" sortable />
        <Column field="email" header="E-mail" sortable>
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ data.email }}</span></template>
        </Column>
        <Column field="phone" header="Telefoon">
          <template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ data.phone || '—' }}</span></template>
        </Column>
        <Column field="project_count" header="Projecten" sortable style="width: 100px">
          <template #body="{ data }">
            <span class="font-mono text-xs" :class="data.project_count > 0 ? 'text-green-600' : 'text-gray-400'">{{ data.project_count }}</span>
          </template>
        </Column>
        <Column header="" style="width:60px">
          <template #body="{ data }">
            <button class="btn-icon text-red-600 hover:text-red-700" @click.stop="deleteClient(data)" title="Verwijderen"><i class="pi pi-trash text-xs"></i></button>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showCreate" header="Nieuwe klant" modal :style="{ width: '480px' }">
      <form @submit.prevent="createClient" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bedrijfsnaam</label>
          <input v-model="form.company_name" class="input" required />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Contactpersoon</label>
          <input v-model="form.contact_name" class="input" required />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">E-mailadres</label>
          <input v-model="form.email" type="email" class="input" required />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Telefoon</label>
          <input v-model="form.phone" class="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Straat + huisnummer</label>
          <input v-model="form.street" class="input" placeholder="Hoofdstraat 1" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Postcode</label>
            <input v-model="form.postal_code" class="input font-mono" placeholder="1234 AB" maxlength="7" @input="form.postal_code = form.postal_code?.toUpperCase()" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Plaats</label>
            <input v-model="form.city" class="input" placeholder="Amsterdam" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showCreate = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Opslaan</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { clientsApi } from '@/modules/clients/api'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'

const auth = useAuthStore()
const { showError, showSuccess } = useErrorHandler()
const confirm = useConfirm()
const clients = ref<any[]>([])
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const form = ref({ company_name: '', contact_name: '', email: '', phone: '', street: '', postal_code: '', city: '' })

onMounted(loadClients)

async function loadClients() {
  loading.value = true
  try { const { data } = await clientsApi.list(); clients.value = data }
  catch (err: any) { showError(err, 'Klanten laden mislukt') }
  loading.value = false
}

function deleteClient(client: any) {
  confirm.require({
    message: `"${client.company_name}" verwijderen?`,
    header: 'Bevestiging',
    acceptLabel: 'Verwijderen',
    rejectLabel: 'Annuleren',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await clientsApi.delete(client.id)
        showSuccess('Klant verwijderd')
        await loadClients()
      } catch (err: any) { showError(err) }
    },
  })
}

async function createClient() {
  saving.value = true
  try {
    await clientsApi.create(form.value)
    showCreate.value = false
    form.value = { company_name: '', contact_name: '', email: '', phone: '', street: '', postal_code: '', city: '' }
    showSuccess('Klant aangemaakt')
    await loadClients()
  } catch (err: any) { showError(err) }
  saving.value = false
}
</script>
