import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
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
        set({ mobileSidebarOpen: false })
    }),
    {
      name: 'vidhyaan_ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed
      })
    }
  )
)
