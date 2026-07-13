import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  // Parent portal keeps its own collapse flag so a multi-role user's
  // CRM sidebar state never cross-contaminates the parent shell.
  parentSidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
  toggleParentSidebar: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      toggleSidebar: () =>
        set((s) => ({
          sidebarCollapsed: !s.sidebarCollapsed
        })),
      setSidebarCollapsed: (v) =>
        set({ sidebarCollapsed: v }),
      toggleMobileSidebar: () =>
        set((s) => ({
          mobileSidebarOpen: !s.mobileSidebarOpen
        })),
      closeMobileSidebar: () =>
        set({ mobileSidebarOpen: false }),
      parentSidebarCollapsed: false,
      toggleParentSidebar: () =>
        set((s) => ({
          parentSidebarCollapsed: !s.parentSidebarCollapsed
        }))
    }),
    {
      name: 'vidhyaan_ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        parentSidebarCollapsed: s.parentSidebarCollapsed
      })
    }
  )
)
