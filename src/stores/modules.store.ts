import { create } from 'zustand'

/**
 * Enabled module slugs for the current org (drives Sidebar lock state and any
 * module-gated UI). Server source of truth is /api/v1/school-profile, which the
 * route composer keeps fresh (billing verify busts the org + module caches).
 *
 * The Sidebar fetches once on mount; any flow that changes the plan
 * (upgrade / downgrade / cancel) must call refresh() so gated items react
 * without a full page reload.
 */
interface ModulesStore {
  enabledModules: string[]
  loaded: boolean
  setModules: (modules: string[]) => void
  refresh: () => Promise<void>
}

export const useModulesStore = create<ModulesStore>()((set) => ({
  enabledModules: [],
  loaded: false,
  setModules: (modules) => set({ enabledModules: modules, loaded: true }),
  refresh: async () => {
    try {
      const res = await fetch('/api/v1/school-profile')
      const data = await res.json()
      if (data?.success && Array.isArray(data.enabledModules)) {
        set({ enabledModules: data.enabledModules, loaded: true })
      }
    } catch {
      // fail-open: keep last-known modules rather than locking everything
    }
  }
}))
