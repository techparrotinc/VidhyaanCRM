import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Globally selected academic year (top-right switcher in the CRM layout).
 * null id = "use the org's active year" (server default). Pages that scope
 * data by year read selectedYearId and pass it as the academicYearId query
 * param.
 */
interface AcademicYearStore {
  selectedYearId: string | null
  selectedYearName: string | null
  setYear: (id: string | null, name: string | null) => void
}

export const useAcademicYearStore = create<AcademicYearStore>()(
  persist(
    (set) => ({
      selectedYearId: null,
      selectedYearName: null,
      setYear: (id, name) => set({ selectedYearId: id, selectedYearName: name })
    }),
    { name: 'vidhyaan-academic-year' }
  )
)
