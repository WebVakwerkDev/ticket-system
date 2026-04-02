import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  name: 'expenses',
  label: 'Uitgaven',
  icon: 'pi pi-shopping-cart',
  menuRoles: ['ADMIN', 'FINANCE'],
  menuOrder: 50,
  routes: [
    {
      path: 'expenses',
      name: 'expenses',
      component: () => import('./views/ExpensesView.vue'),
      meta: { roles: ['ADMIN', 'FINANCE'] },
    },
  ],
}

export default manifest
