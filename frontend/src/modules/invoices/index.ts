import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  name: 'invoices',
  label: 'Facturen',
  icon: 'pi pi-receipt',
  menuRoles: ['ADMIN', 'FINANCE'],
  menuOrder: 40,
  routes: [
    {
      path: 'invoices',
      name: 'invoices',
      component: () => import('./views/InvoicesView.vue'),
      meta: { roles: ['ADMIN', 'FINANCE'] },
    },
  ],
}

export default manifest
