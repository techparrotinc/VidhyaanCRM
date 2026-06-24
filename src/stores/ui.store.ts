import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  mobileSidebarOpen: boolean
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (v: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set: any) => ({
      sidebarCollapsed: false as boolean,
      toggleSidebar: () =>
        set((state: any) => ({
          sidebarCollapsed: !state.sidebarCollapsed
        })),
      setSidebarCollapsed: (v: boolean) =>
        set({ sidebarCollapsed: v }),
      mobileSidebarOpen: false as boolean,
      toggleMobileSidebar: () =>
        set((state: any) => ({
          mobileSidebarOpen: !state.mobileSidebarOpen
        })),
      setMobileSidebarOpen: (v: boolean) =>
        set({ mobileSidebarOpen: v })
    }),
    {
      name: 'vidhyaan_ui_state'
    }
  )
)
