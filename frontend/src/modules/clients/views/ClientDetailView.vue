<template>
  <div v-if="loading" class="space-y-6">
    <div class="flex items-center gap-4"><div class="skeleton h-5 w-5 rounded"></div><div class="skeleton h-6 w-48"></div></div>
    <div class="grid grid-cols-3 gap-4"><div v-for="i in 3" :key="i" class="card p-5"><div class="skeleton h-4 w-20 mb-3"></div><div class="skeleton h-4 w-full"></div></div></div>
  </div>

  <div v-else-if="client" class="space-y-6 animate-slide-up">
    <div class="flex items-center gap-4">
      <button @click="$router.push('/clients')" class="btn-icon"><i class="pi pi-arrow-left text-sm"></i></button>
      <div class="flex-1">
        <h2 class="text-lg font-semibold text-gray-900">{{ client.company_name }}</h2>
        <p class="text-xs font-mono text-gray-500">{{ client.contact_name }} · {{ client.email }}</p>
      </div>
      <button v-if="auth.hasRole('ADMIN','EMPLOYEE')" class="btn-secondary" @click="openEdit"><i class="pi pi-pencil text-xs"></i> Bewerken</button>
      <button v-if="auth.isAdmin" class="btn-danger" @click="deleteClient"><i class="pi pi-trash text-xs"></i></button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card p-5">
        <h3 class="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Contact</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Telefoon</span><span class="font-mono text-xs text-gray-700">{{ client.phone || '—' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Adres</span><span class="text-gray-700 text-right text-xs">{{ client.address || '—' }}</span></div>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Projecten <span class="text-gray-400">({{ client.projects?.length || 0 }})</span></h3>
        <div class="space-y-2">
          <router-link v-for="p in client.projects" :key="p.id" :to="`/projects/${p.id}`"
            class="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 transition-colors">
            <div class="w-1.5 h-1.5 rounded-full shrink-0" :class="statusDot(p.status)"></div>
            <span class="truncate">{{ p.name }}</span>
          </router-link>
          <p v-if="!client.projects?.length" class="text-xs text-gray-400">Geen projecten</p>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Facturen <span class="text-gray-400">({{ client.invoices?.length || 0 }})</span></h3>
        <div class="space-y-2">
          <div v-for="inv in client.invoices" :key="inv.id" class="flex items-center justify-between text-sm">
            <span class="font-mono text-xs text-gray-500">{{ inv.invoice_number }}</span>
            <span :class="statusColor(inv.status)" class="badge text-[10px]">{{ inv.status }}</span>
          </div>
          <p v-if="!client.invoices?.length" class="text-xs text-gray-400">Geen facturen</p>
        </div>
      </div>
    </div>

    <Dialog v-model:visible="showEdit" header="Klant bewerken" modal :style="{ width: '480px' }">
      <form @submit.prevent="updateClient" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bedrijfsnaam</label><input v-model="editForm.company_name" class="input" /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Contactpersoon</label><input v-model="editForm.contact_name" class="input" /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">E-mailadres</label><input v-model="editForm.email" type="email" class="input" /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Telefoon</label><input v-model="editForm.phone" class="input" /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Adres</label><textarea v-model="editForm.address" class="input min-h-[60px]" /></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showEdit = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="saving">Opslaan</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { clientsApi } from '@/modules/clients/api'
import { useFormatting } from '@/composables/useFormatting'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { showError, showSuccess } = useErrorHandler()
const confirm = useConfirm()
const { statusColor, statusDot } = useFormatting()

const client = ref<any>(null)
const loading = ref(true)
const showEdit = ref(false)
const saving = ref(false)
const editForm = ref<any>({})

onMounted(async () => {
  try { const { data } = await clientsApi.get(route.params.id as string); client.value = data }
  catch (err: any) { showError(err, 'Klant laden mislukt'); router.push('/clients') }
  loading.value = false
})

function openEdit() {
  editForm.value = { company_name: client.value.company_name, contact_name: client.value.contact_name, email: client.value.email, phone: client.value.phone, address: client.value.address }
  showEdit.value = true
}

async function updateClient() {
  saving.value = true
  try {
    const { data } = await clientsApi.update(client.value.id, editForm.value)
    Object.assign(client.value, data); showEdit.value = false
    showSuccess('Klant bijgewerkt')
  } catch (err: any) { showError(err) }
  saving.value = false
}

function deleteClient() {
  confirm.require({
    message: 'Weet je zeker dat je deze klant wilt verwijderen?', header: 'Bevestiging',
    acceptLabel: 'Verwijderen', rejectLabel: 'Annuleren', acceptClass: 'p-button-danger',
    accept: async () => {
      try { await clientsApi.delete(client.value.id); showSuccess('Verwijderd'); router.push('/clients') }
      catch (err: any) { showError(err) }
    },
  })
}
</script>
