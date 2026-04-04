<template>
  <div class="space-y-5 animate-slide-up">
    <!-- Year selector -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button class="btn-icon" @click="changeYear(-1)"><i class="pi pi-chevron-left text-xs"></i></button>
        <span class="text-sm font-semibold text-gray-800 w-12 text-center">{{ selectedYear }}</span>
        <button class="btn-icon" @click="changeYear(1)" :disabled="selectedYear >= currentYear"><i class="pi pi-chevron-right text-xs"></i></button>
      </div>
      <div class="flex gap-1">
        <button v-for="y in yearOptions" :key="y" @click="selectedYear = y; loadAll()"
          class="px-3 py-1 text-xs rounded font-mono transition-colors"
          :class="y === selectedYear ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
          {{ y }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="activeTab" class="finance-tabs">

      <!-- ── Overzicht ── -->
      <TabPanel header="Overzicht">
        <div v-if="loadingOverview" class="grid grid-cols-5 gap-4 pt-4">
          <div v-for="i in 5" :key="i" class="card p-6"><div class="skeleton h-3 w-20 mb-3"></div><div class="skeleton h-8 w-32"></div></div>
        </div>
        <div v-else class="space-y-5 pt-4">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="card-glow p-5"><p class="kpi-label">Omzet (betaald)</p><p class="kpi-value text-green-600">{{ fc(overview?.total_revenue) }}</p></div>
            <div class="card-glow p-5"><p class="kpi-label">Openstaand</p><p class="kpi-value text-blue-600">{{ fc(overview?.open_amount) }}</p></div>
            <div class="card-glow p-5"><p class="kpi-label">Achterstallig</p><p class="kpi-value" :class="pf(overview?.overdue_amount) > 0 ? 'text-red-600' : 'text-gray-500'">{{ fc(overview?.overdue_amount) }}</p></div>
            <div class="card-glow p-5"><p class="kpi-label">Kosten (excl. BTW)</p><p class="kpi-value text-orange-600">{{ fc(overview?.total_expenses) }}</p></div>
            <div class="card-glow p-5"><p class="kpi-label">Brutowinst</p><p class="kpi-value" :class="pf(overview?.profit) >= 0 ? 'text-green-600' : 'text-red-600'">{{ fc(overview?.profit) }}</p></div>
          </div>

          <!-- Reservering samenvatting -->
          <div v-if="taxSummary" class="card p-5 border-l-4 border-amber-400">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Aanbevolen reservering {{ selectedYear }}</p>
                <p class="text-2xl font-semibold font-mono text-amber-600">{{ fc(taxSummary.totaal_te_reserveren) }}</p>
                <p class="text-xs text-gray-500 mt-1">IB {{ fc(taxSummary.ib_totaal) }} + Zvw {{ fc(taxSummary.zvw_premie) }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500 mb-1">Belastbare winst</p>
                <p class="text-lg font-semibold font-mono text-gray-800">{{ fc(taxSummary.belastbare_winst) }}</p>
                <button class="text-xs text-blue-600 hover:underline mt-1" @click="activeTab = 3">→ Bekijk berekening</button>
              </div>
            </div>
          </div>

          <!-- Rapporten -->
          <div class="card p-5">
            <h2 class="text-sm font-medium text-gray-800 mb-4">Rapporten</h2>
            <div class="flex flex-wrap items-end gap-4">
              <div><label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Maand</label><Dropdown v-model="reportMonth" :options="monthOptions" optionLabel="label" optionValue="value" class="w-36" /></div>
              <button class="btn-secondary" @click="downloadMonthly"><i class="pi pi-file-pdf text-xs"></i> Maand PDF</button>
              <button class="btn-secondary" @click="downloadYearly"><i class="pi pi-file-pdf text-xs"></i> Jaar PDF</button>
              <button class="btn-ghost" @click="downloadYearlyCsv"><i class="pi pi-download text-xs"></i> Jaar CSV</button>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ── BTW ── -->
      <TabPanel header="BTW">
        <div class="space-y-5 pt-4">
          <div class="card overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-sm font-medium text-gray-800">BTW-aangifte per kwartaal {{ selectedYear }}</h2>
              <span class="text-[10px] font-mono text-gray-400">Q1 30 apr · Q2 31 jul · Q3 31 okt · Q4 31 jan</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left px-5 py-3 text-gray-500 font-medium uppercase tracking-wider"></th>
                    <th v-for="(q, i) in quarters" :key="q.key" class="text-right px-5 py-3 font-medium uppercase tracking-wider"
                      :class="currentQuarter === i + 1 && selectedYear === currentYear ? 'text-blue-600' : 'text-gray-500'">
                      {{ q.key }}<span v-if="currentQuarter === i + 1 && selectedYear === currentYear" class="ml-1 text-[9px] text-blue-400">●</span>
                    </th>
                    <th class="text-right px-5 py-3 text-gray-500 font-medium uppercase tracking-wider">Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-gray-100">
                    <td class="px-5 py-3 text-gray-600">Ontvangen BTW</td>
                    <td v-for="q in quarters" :key="q.key" class="text-right px-5 py-3 font-mono text-gray-700">{{ fc(overview?.vat_by_quarter?.[q.key]?.received_vat || 0) }}</td>
                    <td class="text-right px-5 py-3 font-mono font-medium text-gray-800">{{ fc(totalReceivedVat) }}</td>
                  </tr>
                  <tr class="border-b border-gray-100">
                    <td class="px-5 py-3 text-gray-600">Betaalde BTW (inkoop)</td>
                    <td v-for="q in quarters" :key="q.key" class="text-right px-5 py-3 font-mono text-gray-700">{{ fc(overview?.vat_by_quarter?.[q.key]?.paid_vat || 0) }}</td>
                    <td class="text-right px-5 py-3 font-mono font-medium text-gray-800">{{ fc(totalPaidVat) }}</td>
                  </tr>
                  <tr class="bg-gray-50 font-medium">
                    <td class="px-5 py-3 text-gray-800">Af te dragen</td>
                    <td v-for="q in quarters" :key="q.key" class="text-right px-5 py-3 font-mono"
                      :class="pf(overview?.vat_by_quarter?.[q.key]?.vat_due || 0) >= 0 ? 'text-gray-800' : 'text-green-600'">
                      {{ fc(overview?.vat_by_quarter?.[q.key]?.vat_due || 0) }}
                    </td>
                    <td class="text-right px-5 py-3 font-mono font-semibold" :class="totalVatDue >= 0 ? 'text-gray-800' : 'text-green-600'">{{ fc(totalVatDue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Per kwartaal detail -->
          <div class="grid grid-cols-2 gap-4">
            <div v-for="q in quarters" :key="q.key" class="card p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold text-gray-800 uppercase tracking-wider">{{ q.key }}</span>
                <span class="text-[10px] font-mono text-gray-400">Deadline: {{ q.deadline }}</span>
              </div>
              <div v-if="overview?.vat_by_quarter?.[q.key]?.breakdown?.length" class="space-y-1">
                <div v-for="b in overview.vat_by_quarter[q.key].breakdown" :key="b.vat_rate" class="flex justify-between text-xs">
                  <span class="text-gray-500">BTW {{ b.vat_rate }}% over {{ fc(b.subtotal) }}</span>
                  <span class="font-mono text-gray-700">{{ fc(b.vat_amount) }}</span>
                </div>
              </div>
              <div v-else class="text-xs text-gray-400 italic">Geen facturen</div>
              <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs font-medium">
                <span class="text-gray-600">Af te dragen</span>
                <span class="font-mono" :class="pf(overview?.vat_by_quarter?.[q.key]?.vat_due || 0) >= 0 ? 'text-gray-800' : 'text-green-600'">
                  {{ fc(overview?.vat_by_quarter?.[q.key]?.vat_due || 0) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ── Winst & Verlies ── -->
      <TabPanel header="Winst & Verlies">
        <div class="space-y-4 pt-4">
          <div v-if="!taxSummary && loadingOverview" class="card p-8 text-center text-sm text-gray-400">Laden...</div>
          <div v-else-if="taxSummary" class="card overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200">
              <h2 class="text-sm font-medium text-gray-800">Winst & Verlies {{ selectedYear }}</h2>
            </div>
            <div class="divide-y divide-gray-100">
              <wv-row label="Omzet (excl. BTW)" :value="taxSummary.omzet" />
              <wv-row label="− Zakelijke kosten (excl. BTW)" :value="-pf(taxSummary.kosten)" sub />
              <template v-if="taxSummary.kosten_per_categorie?.length">
                <div v-for="k in taxSummary.kosten_per_categorie" :key="k.categorie"
                  class="px-5 py-2 flex justify-between items-center bg-gray-50/60 border-t border-gray-50">
                  <span class="text-[11px] text-gray-400 pl-4">{{ k.categorie }} <span class="text-gray-300">({{ k.aantal }}×)</span></span>
                  <span class="font-mono text-xs text-gray-500">{{ fc(k.bedrag) }}</span>
                </div>
              </template>
              <wv-row label="= Brutowinst" :value="taxSummary.brutowinst" bold />
              <wv-row label="− Zelfstandigenaftrek" :value="-pf(taxSummary.zelfstandigenaftrek)" sub
                tooltip="Fiscale aftrekpost voor ondernemers die voldoen aan het urencriterium (1.225 uur per jaar). Verlaagt de belastbare winst." />
              <wv-row v-if="taxSummary.startersaftrek_enabled" label="− Startersaftrek" :value="-pf(taxSummary.startersaftrek)" sub
                tooltip="Extra aftrekpost voor startende ondernemers, maximaal 3 jaar. Bovenop de zelfstandigenaftrek." />
              <wv-row label="= Winst na aftrek" :value="taxSummary.winst_na_aftrek" bold />
              <wv-row :label="`− MKB-winstvrijstelling (${taxSummary.mkb_vrijstelling_rate}%)`" :value="-pf(taxSummary.mkb_vrijstelling)" sub
                tooltip="Percentage van de winst na ondernemersaftrek dat vrijgesteld is van IB. Automatisch van toepassing voor alle IB-ondernemers." />
              <div class="px-5 py-4 bg-gray-900 flex justify-between items-center">
                <span class="text-xs font-semibold text-white uppercase tracking-wider">= Belastbare winst</span>
                <span class="font-mono font-bold text-white text-lg">{{ fc(taxSummary.belastbare_winst) }}</span>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ── Belasting ── -->
      <TabPanel header="Belasting">
        <div class="space-y-5 pt-4">
          <div v-if="!taxSummary && loadingOverview" class="card p-8 text-center text-sm text-gray-400">Laden...</div>
          <template v-else-if="taxSummary">

            <!-- IB -->
            <div class="card overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-200">
                <h2 class="text-sm font-medium text-gray-800">Inkomstenbelasting (schatting)</h2>
              </div>
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-gray-100 bg-gray-50">
                    <th class="text-left px-5 py-3 text-gray-500 font-medium uppercase tracking-wider">Schijf</th>
                    <th class="text-right px-5 py-3 text-gray-500 font-medium uppercase tracking-wider">Inkomen</th>
                    <th class="text-right px-5 py-3 text-gray-500 font-medium uppercase tracking-wider">Tarief</th>
                    <th class="text-right px-5 py-3 text-gray-500 font-medium uppercase tracking-wider">Belasting</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in taxSummary.ib_schijven" :key="s.label" class="border-b border-gray-100">
                    <td class="px-5 py-3 text-gray-600">{{ s.label }}</td>
                    <td class="text-right px-5 py-3 font-mono text-gray-700">{{ fc(s.inkomen_in_schijf) }}</td>
                    <td class="text-right px-5 py-3 font-mono text-gray-700">{{ s.rate }}%</td>
                    <td class="text-right px-5 py-3 font-mono text-gray-800">{{ fc(s.belasting) }}</td>
                  </tr>
                  <tr class="bg-gray-50 font-semibold">
                    <td class="px-5 py-3 text-gray-800" colspan="3">Totaal IB</td>
                    <td class="text-right px-5 py-3 font-mono text-gray-900">{{ fc(taxSummary.ib_totaal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Zvw -->
            <div class="card p-5">
              <div class="flex items-center gap-2 mb-3">
                <h2 class="text-sm font-medium text-gray-800">Zvw-premie</h2>
                <span class="info-btn" title="Zorgverzekeringswet-premie: betaal je als zzp'er zelf over je belastbare winst, tot een maximum inkomen.">i</span>
              </div>
              <div class="flex justify-between text-xs text-gray-600 mb-1">
                <span>Grondslag (max {{ fc(taxSummary.settings.zvw_max_inkomen) }})</span>
                <span class="font-mono">{{ fc(taxSummary.zvw_grondslag) }}</span>
              </div>
              <div class="flex justify-between text-xs text-gray-600 mb-3">
                <span>Tarief</span>
                <span class="font-mono">{{ taxSummary.zvw_rate }}%</span>
              </div>
              <div class="flex justify-between text-sm font-semibold text-gray-800 pt-3 border-t border-gray-200">
                <span>Zvw-premie</span>
                <span class="font-mono">{{ fc(taxSummary.zvw_premie) }}</span>
              </div>
            </div>

            <!-- Reservering -->
            <div class="card p-5 bg-amber-50 border border-amber-200">
              <p class="text-xs font-medium text-amber-700 uppercase tracking-wider mb-3">Aanbevolen reservering</p>
              <div class="flex justify-between text-xs text-amber-700 mb-1">
                <span>Inkomstenbelasting</span><span class="font-mono">{{ fc(taxSummary.ib_totaal) }}</span>
              </div>
              <div class="flex justify-between text-xs text-amber-700 mb-3">
                <span>Zvw-premie</span><span class="font-mono">{{ fc(taxSummary.zvw_premie) }}</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-amber-800 pt-3 border-t border-amber-300">
                <span>Totaal reserveren</span><span class="font-mono text-lg">{{ fc(taxSummary.totaal_te_reserveren) }}</span>
              </div>
              <p class="text-[10px] text-amber-600 mt-2">* Dit is een schatting op basis van ingevoerde gegevens. Raadpleeg een belastingadviseur voor de definitieve aangifte.</p>
            </div>

            <!-- Belastingparameters -->
            <div class="card overflow-hidden">
              <button class="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors" @click="showSettings = !showSettings">
                <h2 class="text-sm font-medium text-gray-800">Belastingparameters {{ selectedYear }}</h2>
                <i class="pi text-gray-400 text-xs" :class="showSettings ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
              </button>
              <div v-if="showSettings" class="p-5 border-t border-gray-200 space-y-5">
                <!-- Aftrekposten -->
                <div>
                  <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Aftrekposten</p>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="settings-label flex items-center gap-1">
                        Zelfstandigenaftrek
                        <span class="info-btn" title="Jaarlijkse aftrekpost voor IB-ondernemers die voldoen aan het urencriterium (≥1.225 uur). Bedrag is wettelijk bepaald per jaar.">i</span>
                      </label>
                      <InputNumber v-model="settingsForm.zelfstandigenaftrek" mode="currency" currency="EUR" locale="nl-NL" class="w-full" />
                    </div>
                    <div>
                      <label class="settings-label flex items-center gap-1">
                        MKB-winstvrijstelling %
                        <span class="info-btn" title="Percentage van de winst na ondernemersaftrek dat vrijgesteld is van IB. Automatisch van toepassing voor alle IB-ondernemers.">i</span>
                      </label>
                      <InputNumber v-model="settingsForm.mkb_vrijstelling_rate" suffix="%" :min="0" :max="100" :maxFractionDigits="2" class="w-full" />
                    </div>
                    <div class="col-span-2">
                      <div class="flex items-center gap-3 mb-2">
                        <label class="settings-label flex items-center gap-1 mb-0">
                          Startersaftrek
                          <span class="info-btn" title="Extra aftrekpost bovenop de zelfstandigenaftrek. Geldig maximaal 3 jaar bij een nieuwe onderneming.">i</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" v-model="settingsForm.startersaftrek_enabled" class="rounded" />
                          <span class="text-xs text-gray-500">Van toepassing dit jaar</span>
                        </label>
                      </div>
                      <InputNumber v-model="settingsForm.startersaftrek" mode="currency" currency="EUR" locale="nl-NL" class="w-56" :disabled="!settingsForm.startersaftrek_enabled" />
                    </div>
                  </div>
                </div>

                <!-- Zvw -->
                <div class="pt-4 border-t border-gray-100">
                  <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Zvw</p>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="settings-label flex items-center gap-1">
                        Zvw-tarief
                        <span class="info-btn" title="Premiepercentage zorgverzekeringswet voor zzp'ers. Vastgesteld door de overheid per jaar.">i</span>
                      </label>
                      <InputNumber v-model="settingsForm.zvw_rate" suffix="%" :min="0" :max="20" :maxFractionDigits="2" class="w-full" />
                    </div>
                    <div>
                      <label class="settings-label flex items-center gap-1">
                        Max. bijdrage-inkomen Zvw
                        <span class="info-btn" title="Het maximale inkomen waarover Zvw-premie wordt berekend. Boven dit bedrag geldt een lager percentage.">i</span>
                      </label>
                      <InputNumber v-model="settingsForm.zvw_max_inkomen" mode="currency" currency="EUR" locale="nl-NL" class="w-full" />
                    </div>
                  </div>
                </div>

                <!-- IB schijven -->
                <div class="pt-4 border-t border-gray-100">
                  <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Inkomstenbelasting schijven</p>
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="settings-label flex items-center gap-1">
                        Schijf 1 tarief
                        <span class="info-btn" title="Tarief over inkomen t/m de grens van schijf 1. Laagste IB-schijf.">i</span>
                      </label>
                      <InputNumber v-model="settingsForm.ib_rate_1" suffix="%" :min="0" :max="100" :maxFractionDigits="2" class="w-full" />
                    </div>
                    <div>
                      <label class="settings-label flex items-center gap-1">
                        Schijf 2 tarief
                        <span class="info-btn" title="Tarief over inkomen tussen grens schijf 1 en grens schijf 2.">i</span>
                      </label>
                      <InputNumber v-model="settingsForm.ib_rate_2" suffix="%" :min="0" :max="100" :maxFractionDigits="2" class="w-full" />
                    </div>
                    <div>
                      <label class="settings-label flex items-center gap-1">
                        Schijf 3 tarief
                        <span class="info-btn" title="Tarief over inkomen boven de grens van schijf 2. Hoogste IB-schijf.">i</span>
                      </label>
                      <InputNumber v-model="settingsForm.ib_rate_3" suffix="%" :min="0" :max="100" :maxFractionDigits="2" class="w-full" />
                    </div>
                    <div>
                      <label class="settings-label">Grens schijf 1 (€)</label>
                      <InputNumber v-model="settingsForm.ib_bracket_1" mode="currency" currency="EUR" locale="nl-NL" class="w-full" />
                    </div>
                    <div>
                      <label class="settings-label">Grens schijf 2 (€)</label>
                      <InputNumber v-model="settingsForm.ib_bracket_2" mode="currency" currency="EUR" locale="nl-NL" class="w-full" />
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
                  <button class="btn-secondary" @click="resetSettings">Annuleren</button>
                  <button class="btn-primary" @click="saveSettings" :disabled="savingSettings">Opslaan</button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { financeApi } from '@/api/services'
import { useFormatting } from '@/composables/useFormatting'
import { useErrorHandler } from '@/composables/useErrorHandler'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'

const { showError, showSuccess } = useErrorHandler()
const { formatCurrency, downloadBlob } = useFormatting()

const fc = (v: any) => formatCurrency(v)
const pf = (v: any) => parseFloat(v || 0)

const currentYear = new Date().getFullYear()
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
const selectedYear = ref(currentYear)
const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear; y >= currentYear - 4; y--) years.push(y)
  return years
})

const activeTab = ref(0)
const overview = ref<any>(null)
const taxSummary = ref<any>(null)
const loadingOverview = ref(true)
const showSettings = ref(false)
const savingSettings = ref(false)

const reportMonth = ref(new Date().getMonth() + 1)
const monthOptions = [{label:'Jan',value:1},{label:'Feb',value:2},{label:'Mrt',value:3},{label:'Apr',value:4},{label:'Mei',value:5},{label:'Jun',value:6},{label:'Jul',value:7},{label:'Aug',value:8},{label:'Sep',value:9},{label:'Okt',value:10},{label:'Nov',value:11},{label:'Dec',value:12}]

const quarters = [
  { key: 'Q1', deadline: '30 apr' },
  { key: 'Q2', deadline: '31 jul' },
  { key: 'Q3', deadline: '31 okt' },
  { key: 'Q4', deadline: '31 jan' },
]

const settingsForm = ref<any>({})

const totalReceivedVat = computed(() => quarters.reduce((s, q) => s + pf(overview.value?.vat_by_quarter?.[q.key]?.received_vat || 0), 0))
const totalPaidVat = computed(() => quarters.reduce((s, q) => s + pf(overview.value?.vat_by_quarter?.[q.key]?.paid_vat || 0), 0))
const totalVatDue = computed(() => totalReceivedVat.value - totalPaidVat.value)

function changeYear(delta: number) {
  selectedYear.value += delta
  loadAll()
}

async function loadAll() {
  loadingOverview.value = true
  try {
    const [overviewRes, summaryRes] = await Promise.all([
      financeApi.overview(selectedYear.value),
      financeApi.taxSummary(selectedYear.value),
    ])
    overview.value = overviewRes.data
    taxSummary.value = summaryRes.data
    settingsForm.value = { ...summaryRes.data.settings }
  } catch (err: any) { showError(err) }
  loadingOverview.value = false
}

function resetSettings() {
  if (taxSummary.value) settingsForm.value = { ...taxSummary.value.settings }
  showSettings.value = false
}

async function saveSettings() {
  savingSettings.value = true
  try {
    await financeApi.updateTaxSettings(selectedYear.value, {
      zelfstandigenaftrek: settingsForm.value.zelfstandigenaftrek,
      startersaftrek_enabled: settingsForm.value.startersaftrek_enabled,
      startersaftrek: settingsForm.value.startersaftrek,
      mkb_vrijstelling_rate: settingsForm.value.mkb_vrijstelling_rate,
      zvw_rate: settingsForm.value.zvw_rate,
      zvw_max_inkomen: settingsForm.value.zvw_max_inkomen,
      ib_rate_1: settingsForm.value.ib_rate_1,
      ib_rate_2: settingsForm.value.ib_rate_2,
      ib_rate_3: settingsForm.value.ib_rate_3,
      ib_bracket_1: settingsForm.value.ib_bracket_1,
      ib_bracket_2: settingsForm.value.ib_bracket_2,
    })
    showSuccess('Opgeslagen')
    await loadAll()
    showSettings.value = false
  } catch (err: any) { showError(err) }
  savingSettings.value = false
}

async function downloadMonthly() {
  try { const { data } = await financeApi.monthlyReport(selectedYear.value, reportMonth.value, 'pdf'); downloadBlob(data, `rapport-${selectedYear.value}-${String(reportMonth.value).padStart(2,'0')}.pdf`) }
  catch (err: any) { showError(err, 'Downloaden mislukt') }
}
async function downloadYearly() {
  try { const { data } = await financeApi.yearlyReport(selectedYear.value, 'pdf'); downloadBlob(data, `jaarrapport-${selectedYear.value}.pdf`) }
  catch (err: any) { showError(err, 'Downloaden mislukt') }
}
async function downloadYearlyCsv() {
  try { const { data } = await financeApi.yearlyReport(selectedYear.value, 'csv'); downloadBlob(new Blob([data], { type: 'text/csv' }), `jaarrapport-${selectedYear.value}.csv`) }
  catch (err: any) { showError(err, 'Downloaden mislukt') }
}

onMounted(loadAll)
</script>

<!-- WvRow used as inline render via v-html alternative — rendered as plain divs in template above -->
<script lang="ts">
// WvRow helper used in template via component tag
import { defineComponent, h, computed } from 'vue'

export const WvRow = defineComponent({
  name: 'WvRow',
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], default: 0 },
    bold: { type: Boolean, default: false },
    sub: { type: Boolean, default: false },
    tooltip: { type: String, default: '' },
  },
  setup(props) {
    return () => {
      const v = parseFloat(props.value as any || 0)
      const formatted = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Math.abs(v))
      const isNeg = v < 0
      return h('div', { class: `px-5 py-3 flex justify-between items-center ${props.sub ? 'bg-gray-50/40' : ''}` }, [
        h('span', { class: `text-xs flex items-center gap-1.5 ${props.bold ? 'font-semibold text-gray-900' : 'text-gray-600'}` }, [
          props.label,
          props.tooltip ? h('span', {
            class: 'info-btn',
            title: props.tooltip,
          }, 'i') : null,
        ]),
        h('span', {
          class: `font-mono text-sm ${props.bold ? 'font-bold text-gray-900' : isNeg ? 'text-red-500' : 'text-gray-800'}`,
        }, formatted),
      ])
    }
  },
})

export default { components: { WvRow } }
</script>

<style scoped>
.kpi-label { @apply text-[10px] font-mono text-gray-500 uppercase tracking-widest; }
.kpi-value { @apply text-2xl font-semibold mt-2 font-mono; }
.settings-label { @apply block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider; }
.info-btn {
  @apply inline-flex w-4 h-4 rounded-full bg-gray-200 text-gray-500 items-center justify-center cursor-help font-bold flex-shrink-0;
  font-size: 9px;
  line-height: 1;
}
:deep(.finance-tabs .p-tabview-nav) {
  background: transparent;
  border-bottom: 1px solid #e5e7eb;
}
:deep(.finance-tabs .p-tabview-nav li .p-tabview-nav-link) {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  padding: 0.625rem 1rem;
}
:deep(.finance-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  color: #111827;
  border-bottom: 2px solid #111827;
}
:deep(.finance-tabs .p-tabview-panels) {
  padding: 0;
  background: transparent;
}
</style>
