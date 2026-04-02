import type { RouteRecordRaw } from 'vue-router'

/**
 * Metadata for a single feature module.
 *
 * Each module directory exports a default `ModuleManifest` from its `index.ts`.
 * The loader collects these manifests and builds routes + navigation automatically.
 */
export interface ModuleManifest {
  /** Unique identifier — must match the directory name. */
  name: string

  /** Human-readable label shown in the sidebar. */
  label: string

  /** PrimeVue icon class for the sidebar menu item. */
  icon: string

  /** Which roles see this module in the navigation. */
  menuRoles: string[]

  /** Module names this module depends on. */
  dependsOn?: string[]

  /** Vue Router route definitions for this module. */
  routes: RouteRecordRaw[]

  /**
   * Sort order in the sidebar menu (lower = higher).
   * Default: 50. Core items (dashboard) use 0-10.
   */
  menuOrder?: number
}

export interface ModuleMenuItem {
  to: string
  label: string
  icon: string
  roles: string[]
  order: number
}

export interface LoadedModules {
  routes: RouteRecordRaw[]
  menuItems: ModuleMenuItem[]
  moduleNames: string[]
}
