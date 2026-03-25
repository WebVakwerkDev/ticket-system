<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="card p-5 space-y-3">
        <div class="skeleton h-3 w-24"></div>
        <div class="skeleton h-8 w-16"></div>
      </div>
    </div>
    <div class="card p-6">
      <div class="skeleton h-3 w-32 mb-4"></div>
      <div v-for="i in 5" :key="i" class="skeleton h-10 w-full mb-2"></div>
    </div>
  </div>

  <div v-else class="space-y-6 animate-slide-up">
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div v-for="stat in statCards" :key="stat.label" class="card-glow p-5">
        <p class="text-[11px] font-mono text-gray-500 uppercase tracking-wider">{{ stat.label }}</p>
        <div class="flex items-end justify-between mt-2">
          <p class="text-2xl font-semibold" :class="stat.color">{{ stat.value }}</p>
          <div class="w-8 h-8 rounded-md flex items-center justify-center" :class="stat.bgIcon">
            <i :class="stat.icon" class="text-sm" :style="{ color: stat.iconColor }"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-sm font-medium text-gray-800">Recente activiteit</h2>
        <span class="text-[10px] font-mono text-gray-400">LAATSTE 7 DAGEN</span>
      </div>
      <div class="divide-y divide-gray-200">
        <div
          v-for="activity in stats?.recent_activity || []"
          :key="activity.id"
          class="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
        >
          <div
            class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold"
            :class="activityStyle(activity.action)"
          >
            {{ activity.action[0] }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-700">
              <span class="font-mono text-xs text-gray-500">{{ activity.entity_type }}</span>
              <span class="text-gray-400 mx-1.5">&middot;</span>
              <span class="text-gray-500">{{ activity.action.toLowerCase().replace('_', ' ') }}</span>
            </p>
          </div>
          <span class="text-[11px] font-mono text-gray-400 shrink-0">{{ formatDateTime(activity.created_at) }}</span>
        </div>
        <div v-if="!stats?.recent_activity?.length" class="px-5 py-12 text-center">
          <p class="text-sm text-gray-500">Geen activiteit</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { dashboardApi } from '@/api/services'
import { useFormatting } from '@/composables/useFormatting'

const { formatDateTime, formatCurrency } = useFormatting()

const stats = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await dashboardApi.stats()
    stats.value = data
  } catch { /* ignore */ }
  loading.value = false
})

const statCards = computed(() => [
  {
    label: 'Lopend',
    value: stats.value?.projects_in_progress || 0,
    icon: 'pi pi-folder-open',
    color: 'text-gray-900',
    bgIcon: 'bg-amber-500/10',
    iconColor: '#f59e0b',
  },
  {
    label: 'Wachtend',
    value: stats.value?.projects_waiting_for_client || 0,
    icon: 'pi pi-clock',
    color: 'text-gray-900',
    bgIcon: 'bg-orange-500/10',
    iconColor: '#f97316',
  },
  {
    label: 'Achterstallig',
    value: stats.value?.overdue_invoices || 0,
    icon: 'pi pi-exclamation-triangle',
    color: stats.value?.overdue_invoices > 0 ? 'text-red-600' : 'text-gray-900',
    bgIcon: 'bg-red-500/10',
    iconColor: '#ef4444',
  },
  {
    label: 'Openstaand',
    value: formatCurrency(stats.value?.overdue_amount || 0),
    icon: 'pi pi-wallet',
    color: stats.value?.overdue_amount > 0 ? 'text-red-600' : 'text-green-600',
    bgIcon: 'bg-green-500/10',
    iconColor: '#22c55e',
  },
  {
    label: 'Uren dit jaar',
    value: stats.value?.hours_this_year || 0,
    icon: 'pi pi-stopwatch',
    color: 'text-gray-900',
    bgIcon: 'bg-purple-500/10',
    iconColor: '#a855f7',
  },
  {
    label: 'Open taken',
    value: stats.value?.open_tasks || 0,
    icon: 'pi pi-check-square',
    color: stats.value?.overdue_tasks > 0 ? 'text-red-600' : 'text-gray-900',
    bgIcon: 'bg-indigo-500/10',
    iconColor: '#6366f1',
  },
])

function activityStyle(action: string): string {
  if (action === 'CREATE') return 'bg-green-500/10 text-green-600'
  if (action === 'UPDATE' || action === 'STATUS_CHANGE') return 'bg-blue-500/10 text-blue-600'
  if (action === 'DELETE') return 'bg-red-500/10 text-red-600'
  if (action === 'LOGIN') return 'bg-gray-100 text-gray-500'
  return 'bg-gray-100 text-gray-500'
}
</script>
