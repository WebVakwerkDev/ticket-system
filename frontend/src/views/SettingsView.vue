<template>
  <div class="space-y-8 animate-slide-up">
    <div class="card">
      <div class="px-5 py-4 border-b border-gray-200"><h2 class="text-sm font-medium text-gray-800">Bedrijfsinstellingen</h2></div>
      <form @submit.prevent="saveSettings" class="p-5 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Bedrijfsnaam</label><input v-model="settings.company_name" class="input" required /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">E-mailadres</label><input v-model="settings.email" type="email" class="input" required /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Telefoon</label><input v-model="settings.phone" class="input" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Website</label><input v-model="settings.website_url" class="input" /></div>
          <div class="col-span-2"><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Adres</label><textarea v-model="settings.address" class="input min-h-[60px]" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">KVK-nummer</label><input v-model="settings.kvk_number" class="input font-mono" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">BTW-nummer</label><input v-model="settings.vat_number" class="input font-mono" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">IBAN</label><input v-model="settings.iban" class="input font-mono" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">T.n.v.</label><input v-model="settings.account_holder_name" class="input" placeholder="Naam rekeninghouder" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Standaard BTW (%)</label><InputNumber v-model="settings.default_vat_rate" suffix="%" class="w-full" /></div>
          <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Betalingstermijn (dagen)</label><InputNumber v-model="settings.payment_term_days" class="w-full" /></div>
        </div>
        <div class="flex justify-end pt-3 border-t border-gray-200"><button type="submit" class="btn-primary" :disabled="savingSettings">Opslaan</button></div>
      </form>
    </div>

    <div class="card">
      <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between"><h2 class="text-sm font-medium text-gray-800">Gebruikers</h2><button class="btn-primary text-xs" @click="showUserDialog = true"><i class="pi pi-plus text-xs"></i> Nieuw</button></div>
      <div class="light-table">
        <DataTable :value="users" stripedRows>
          <Column field="name" header="Naam"><template #body="{ data }"><span class="text-gray-800">{{ data.name }}</span></template></Column>
          <Column field="email" header="E-mail"><template #body="{ data }"><span class="font-mono text-xs text-gray-500">{{ data.email }}</span></template></Column>
          <Column field="role" header="Rol" style="width:120px">
            <template #body="{ data }"><span class="badge" :class="data.role==='ADMIN'?'bg-purple-50 text-purple-600 border border-purple-200':data.role==='FINANCE'?'bg-green-50 text-green-600 border border-green-200':'bg-blue-50 text-blue-600 border border-blue-200'">{{ data.role }}</span></template>
          </Column>
          <Column field="is_active" header="Actief" style="width:70px"><template #body="{ data }"><div class="w-2 h-2 rounded-full" :class="data.is_active?'bg-green-400':'bg-red-400'"></div></template></Column>
          <Column header="" style="width:60px"><template #body="{ data }"><button v-if="data.id!==auth.user?.id" class="btn-icon text-red-600" @click="deleteUser(data)"><i class="pi pi-trash text-xs"></i></button></template></Column>
        </DataTable>
      </div>
    </div>

    <div class="card p-5">
      <h2 class="text-sm font-medium text-gray-800 mb-1">Database export</h2>
      <p class="text-xs text-gray-500 mb-4">Exporteer alle data als JSON. Vereist wachtwoordbevestiging.</p>
      <div class="flex gap-3 items-end">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Wachtwoord</label><input v-model="exportPassword" type="password" class="input w-56" /></div>
        <button class="btn-secondary" @click="exportDatabase" :disabled="!exportPassword"><i class="pi pi-download text-xs"></i> Exporteren</button>
      </div>
    </div>

    <Dialog v-model:visible="showUserDialog" header="Nieuwe gebruiker" modal :style="{ width: '440px' }">
      <form @submit.prevent="createUser" class="space-y-4">
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Naam</label><input v-model="userForm.name" class="input" required /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">E-mailadres</label><input v-model="userForm.email" type="email" class="input" required /></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Wachtwoord</label><input v-model="userForm.password" type="password" class="input" required /><p class="text-[10px] text-gray-400 mt-1 font-mono">Min 12 tekens · hoofdletter · kleine letter · cijfer · speciaal teken</p></div>
        <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Rol</label><Dropdown v-model="userForm.role" :options="roleOptions" optionLabel="label" optionValue="value" class="w-full" /></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button type="button" class="btn-secondary" @click="showUserDialog = false">Annuleren</button>
          <button type="submit" class="btn-primary" :disabled="savingUser">Aanmaken</button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { settingsApi, usersApi, exportApi } from '@/api/services'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'

const auth = useAuthStore()
const { showError, showSuccess } = useErrorHandler()
const confirm = useConfirm()
const settings = ref<any>({ company_name: '', email: '', phone: '', website_url: '', address: '', kvk_number: '', vat_number: '', iban: '', account_holder_name: '', default_vat_rate: 21, payment_term_days: 30, default_quote_valid_days: 30, default_price_label: 'Projectprijs' })
const users = ref<any[]>([])
const savingSettings = ref(false)
const showUserDialog = ref(false)
const savingUser = ref(false)
const exportPassword = ref('')
const userForm = ref({ name: '', email: '', password: '', role: 'EMPLOYEE' })
const roleOptions = [{ label: 'Admin', value: 'ADMIN' }, { label: 'Medewerker', value: 'EMPLOYEE' }, { label: 'Financieel', value: 'FINANCE' }]

onMounted(async () => {
  try { const { data } = await settingsApi.get(); if (data) Object.assign(settings.value, data) } catch {}
  try { const { data } = await usersApi.list(); users.value = data } catch {}
})

async function saveSettings() { savingSettings.value = true; try { await settingsApi.update(settings.value); showSuccess('Opgeslagen') } catch (err: any) { showError(err) }; savingSettings.value = false }

async function createUser() {
  savingUser.value = true
  try { await usersApi.create(userForm.value); showUserDialog.value = false; userForm.value = { name: '', email: '', password: '', role: 'EMPLOYEE' }; showSuccess('Aangemaakt'); const { data } = await usersApi.list(); users.value = data }
  catch (err: any) { showError(err) }
  savingUser.value = false
}

function deleteUser(user: any) { confirm.require({ message: `${user.name} deactiveren?`, header: 'Bevestiging', acceptLabel: 'Deactiveren', rejectLabel: 'Annuleren', acceptClass: 'p-button-danger', accept: async () => { await usersApi.delete(user.id); const { data } = await usersApi.list(); users.value = data; showSuccess('Gedeactiveerd') } }) }

async function exportDatabase() {
  try { const { data } = await exportApi.database(exportPassword.value); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `export-${new Date().toISOString().split('T')[0]}.json`; a.click(); window.URL.revokeObjectURL(url); exportPassword.value = ''; showSuccess('Gedownload') }
  catch (err: any) { showError(err, 'Export mislukt') }
}
</script>
