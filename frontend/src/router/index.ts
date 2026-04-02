import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { loadModules } from '@/modules/loader'

// Load feature modules (routes + menu items)
export const modules = loadModules()

// Core routes that are always active
const coreChildren: RouteRecordRaw[] = [
  { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { roles: ['ADMIN'] } },
]

// All feature routes are now provided by modules via modules.routes

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        ...coreChildren,
        ...modules.routes,
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Wait for auth initialization
  if (auth.loading) {
    await new Promise<void>((resolve) => {
      const unwatch = auth.$subscribe(() => {
        if (!auth.loading) {
          unwatch()
          resolve()
        }
      })
      // Fallback timeout
      setTimeout(() => { unwatch(); resolve() }, 3000)
    })
  }

  if (to.meta.public) {
    if (auth.isAuthenticated) return next('/')
    return next()
  }

  if (!auth.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.roles && !auth.hasRole(...(to.meta.roles as string[]))) {
    return next('/')
  }

  next()
})

export default router
