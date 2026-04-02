import type { ModuleManifest, ModuleMenuItem, LoadedModules } from './types'

/**
 * Discover all module manifests from subdirectories of `src/modules/`.
 *
 * Uses Vite's `import.meta.glob` to eagerly import every `index.ts` that
 * exports a manifest. Modules are validated for dependency correctness and
 * returned in a safe load order.
 */

// Vite glob import — collects every modules/*/index.ts at build time.
// Each file must `export default <ModuleManifest>`.
const manifestFiles = import.meta.glob<{ default: ModuleManifest }>(
  './*/index.ts',
  { eager: true },
)

function discoverManifests(): ModuleManifest[] {
  const manifests: ModuleManifest[] = []

  for (const [path, mod] of Object.entries(manifestFiles)) {
    const manifest = mod.default
    if (!manifest?.name || !manifest?.routes) {
      console.warn(`[modules] ${path} heeft geen geldig manifest — overgeslagen.`)
      continue
    }
    manifests.push(manifest)
  }

  return manifests
}

function resolveOrder(manifests: ModuleManifest[]): ModuleManifest[] {
  const byName = new Map(manifests.map((m) => [m.name, m]))
  const available = new Set(byName.keys())

  // Check missing dependencies
  for (const manifest of manifests) {
    for (const dep of manifest.dependsOn ?? []) {
      if (!available.has(dep)) {
        console.error(
          `[modules] Module '${manifest.name}' heeft module '${dep}' nodig, ` +
          `maar die is niet gevonden. Controleer of de module bestaat in src/modules/.`,
        )
      }
    }
  }

  // Topological sort (Kahn's algorithm)
  const inDegree = new Map<string, number>()
  const dependents = new Map<string, string[]>()

  for (const name of byName.keys()) {
    inDegree.set(name, 0)
    dependents.set(name, [])
  }

  for (const manifest of manifests) {
    for (const dep of manifest.dependsOn ?? []) {
      if (byName.has(dep)) {
        inDegree.set(manifest.name, (inDegree.get(manifest.name) ?? 0) + 1)
        dependents.get(dep)!.push(manifest.name)
      }
    }
  }

  const queue = [...inDegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([name]) => name)
    .sort()

  const ordered: string[] = []

  while (queue.length > 0) {
    queue.sort()
    const current = queue.shift()!
    ordered.push(current)

    for (const dependent of dependents.get(current) ?? []) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1
      inDegree.set(dependent, newDegree)
      if (newDegree === 0) {
        queue.push(dependent)
      }
    }
  }

  if (ordered.length !== byName.size) {
    const cycleMembers = [...byName.keys()].filter((n) => !ordered.includes(n))
    console.error(
      `[modules] Circulaire afhankelijkheid gevonden tussen: ${cycleMembers.join(', ')}. ` +
      `Controleer de 'dependsOn' velden.`,
    )
  }

  return ordered.filter((n) => byName.has(n)).map((n) => byName.get(n)!)
}

/**
 * Load all modules and return aggregated routes and menu items.
 *
 * Call this once at app startup. The result is used by:
 * - Vue Router (routes)
 * - AppLayout (menuItems)
 */
export function loadModules(): LoadedModules {
  const manifests = discoverManifests()
  const ordered = resolveOrder(manifests)

  const routes = ordered.flatMap((m) => m.routes)

  const menuItems: ModuleMenuItem[] = ordered
    .filter((m) => m.icon && m.menuRoles.length > 0)
    .map((m) => ({
      to: m.routes[0]?.path ?? `/${m.name}`,
      label: m.label,
      icon: m.icon,
      roles: m.menuRoles,
      order: m.menuOrder ?? 50,
    }))
    .sort((a, b) => a.order - b.order)

  const moduleNames = ordered.map((m) => m.name)

  if (moduleNames.length > 0) {
    console.info(`[modules] ${moduleNames.length} modules geladen: ${moduleNames.join(', ')}`)
  }

  return { routes, menuItems, moduleNames }
}
