import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  name: 'tasks',
  label: 'Taken',
  icon: 'pi pi-check-square',
  menuRoles: ['ADMIN', 'EMPLOYEE'],
  menuOrder: 30,
  routes: [
    {
      path: 'tasks',
      name: 'tasks',
      component: () => import('./views/TasksView.vue'),
      meta: { roles: ['ADMIN', 'EMPLOYEE'] },
    },
  ],
}

export default manifest
