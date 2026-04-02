import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  name: 'finance',
  label: 'Financieel',
  icon: 'pi pi-chart-line',
  menuRoles: ['ADMIN', 'FINANCE'],
  menuOrder: 55,
  dependsOn: ['invoices', 'expenses', 'time_entries'],
  routes: [
    {
      path: 'finance',
      name: 'finance',
      component: () => import('./views/FinanceView.vue'),
      meta: { roles: ['ADMIN', 'FINANCE'] },
    },
  ],
}

export default manifest
