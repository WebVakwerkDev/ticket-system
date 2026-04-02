import type { ModuleManifest } from '@/modules/types'

const manifest: ModuleManifest = {
  name: 'projects',
  label: 'Projecten',
  icon: 'pi pi-folder',
  menuRoles: ['ADMIN', 'EMPLOYEE'],
  menuOrder: 20,
  dependsOn: ['clients'],
  routes: [
    {
      path: 'projects',
      name: 'projects',
      component: () => import('./views/ProjectsView.vue'),
      meta: { roles: ['ADMIN', 'EMPLOYEE'] },
    },
    {
      path: 'projects/:id',
      name: 'project-detail',
      component: () => import('./views/ProjectDetailView.vue'),
      meta: { roles: ['ADMIN', 'EMPLOYEE'] },
    },
  ],
}

export default manifest
