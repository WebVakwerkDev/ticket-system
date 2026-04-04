<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <!-- Sidebar -->
    <aside
      class="group flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-out overflow-hidden shrink-0"
      :class="sidebarExpanded ? 'w-56' : 'w-16'"
      @mouseenter="sidebarExpanded = true"
      @mouseleave="sidebarExpanded = false"
    >
      <!-- Logo -->
      <div class="h-14 flex items-center px-4 border-b border-gray-200 shrink-0">
        <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <span class="text-blue-600 font-bold text-sm">A</span>
        </div>
        <span
          class="ml-3 text-sm font-semibold text-gray-900 whitespace-nowrap transition-opacity duration-200"
          :class="sidebarExpanded ? 'opacity-100' : 'opacity-0'"
        >Accuro</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <router-link
          v-for="item in visibleMenuItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group/item relative"
          :class="isActive(item.to)
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
        >
          <i :class="item.icon" class="text-[15px] w-5 text-center shrink-0"></i>
          <span
            class="whitespace-nowrap transition-opacity duration-200"
            :class="sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'"
          >{{ item.label }}</span>
          <!-- Active indicator -->
          <div
            v-if="isActive(item.to)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 rounded-r"
          ></div>
        </router-link>
      </nav>

      <!-- User -->
      <div class="p-2 border-t border-gray-200 shrink-0">
        <div class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer" @click="auth.logout()">
          <div class="w-7 h-7 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-mono font-medium text-gray-600 shrink-0">
            {{ initials }}
          </div>
          <div
            class="flex-1 min-w-0 transition-opacity duration-200"
            :class="sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'"
          >
            <p class="text-xs font-medium text-gray-700 truncate">{{ auth.user?.name }}</p>
            <p class="text-[10px] text-gray-400 font-mono">{{ auth.user?.role }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Top bar -->
      <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-2 text-sm">
          <router-link to="/" class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="pi pi-home text-xs"></i>
          </router-link>
          <template v-for="(crumb, i) in breadcrumbs" :key="i">
            <i class="pi pi-angle-right text-gray-300 text-xs"></i>
            <router-link v-if="crumb.to" :to="crumb.to" class="text-gray-400 hover:text-gray-600 transition-colors">{{ crumb.label }}</router-link>
            <span v-else class="text-gray-900 font-medium">{{ crumb.label }}</span>
          </template>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-mono text-gray-400">v1.0</span>
        </div>
      </header>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-6 animate-fade-in">
          <router-view />
        </div>
      </div>
    </main>

    <Toast position="bottom-right" />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { modules } from '@/router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const auth = useAuthStore()
const route = useRoute()
const sidebarExpanded = ref(false)

// Core menu items (always visible)
const coreMenuItems = [
  { to: '/', label: 'Dashboard', icon: 'pi pi-objects-column', roles: ['ADMIN', 'EMPLOYEE'], order: 0 },
]

// All feature menu items are now provided by modules

// Bottom-pinned core items
const settingsMenuItem = { to: '/settings', label: 'Instellingen', icon: 'pi pi-sliders-h', roles: ['ADMIN'], order: 999 }

// Combine: core + module items + settings
const menuItems = [
  ...coreMenuItems,
  ...modules.menuItems,
  settingsMenuItem,
].sort((a, b) => a.order - b.order)

const visibleMenuItems = computed(() =>
  menuItems.filter((item) => auth.hasRole(...item.roles))
)

const breadcrumbConfig: Record<string, { label: string; parent?: { label: string; to: string } }> = {
  dashboard: { label: 'Dashboard' },
  clients: { label: 'Klanten' },
  'client-detail': { label: 'Klantdetail', parent: { label: 'Klanten', to: '/clients' } },
  projects: { label: 'Projecten' },
  'project-detail': { label: 'Projectdetail', parent: { label: 'Projecten', to: '/projects' } },
  tasks: { label: 'Taken' },
  'time-entries': { label: 'Urenregistratie' },
  invoices: { label: 'Facturen' },
  proposals: { label: 'Offertes' },
  expenses: { label: 'Uitgaven' },
  finance: { label: 'Financieel overzicht' },
  settings: { label: 'Instellingen' },
}

const breadcrumbs = computed(() => {
  const config = breadcrumbConfig[route.name as string]
  if (!config) return [{ label: 'Accuro' }]
  const crumbs: { label: string; to?: string }[] = []
  if (config.parent) crumbs.push({ label: config.parent.label, to: config.parent.to })
  crumbs.push({ label: config.label })
  return crumbs
})

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
})

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
