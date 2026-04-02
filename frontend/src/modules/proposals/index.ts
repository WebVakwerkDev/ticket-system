import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  name: 'proposals',
  label: 'Offertes',
  icon: 'pi pi-file-edit',
  menuRoles: ['ADMIN', 'EMPLOYEE'],
  menuOrder: 45,
  routes: [
    {
      path: 'proposals',
      name: 'proposals',
      component: () => import('./views/ProposalsView.vue'),
      meta: { roles: ['ADMIN', 'EMPLOYEE'] },
    },
  ],
}

export default manifest
