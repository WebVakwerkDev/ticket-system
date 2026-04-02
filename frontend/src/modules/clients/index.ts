import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  name: 'clients',
  label: 'Klanten',
  icon: 'pi pi-building',
  menuRoles: ['ADMIN', 'EMPLOYEE', 'FINANCE'],
  menuOrder: 10,
  routes: [
    {
      path: 'clients',
      name: 'clients',
      component: () => import('./views/ClientsView.vue'),
      meta: { roles: ['ADMIN', 'EMPLOYEE', 'FINANCE'] },
    },
    {
      path: 'clients/:id',
      name: 'client-detail',
      component: () => import('./views/ClientDetailView.vue'),
      meta: { roles: ['ADMIN', 'EMPLOYEE', 'FINANCE'] },
    },
  ],
}

export default manifest
