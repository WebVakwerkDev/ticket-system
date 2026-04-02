import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  name: 'time_entries',
  label: 'Urenregistratie',
  icon: 'pi pi-stopwatch',
  menuRoles: ['ADMIN', 'EMPLOYEE'],
  menuOrder: 35,
  dependsOn: ['projects'],
  routes: [
    {
      path: 'time-entries',
      name: 'time-entries',
      component: () => import('./views/TimeEntriesView.vue'),
      meta: { roles: ['ADMIN', 'EMPLOYEE'] },
    },
  ],
}

export default manifest
