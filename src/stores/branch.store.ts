import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Globally selected branch (top-right switcher in the CRM layout, shown only
 * when the org has 2+ branches). null id = nothing chosen yet — the layout
 * defaults it to the org's default (main) branch; 'all' = the user explicitly
 * picked "All Branches" (compose.ts treats the literal 'all' as unscoped).
 * The selection is a client preference sent as the x-branch-id header (see
 * fetcher.ts) — the server clamps it against the user's actual branch access
 * in compose.ts.
 */
interface BranchStore {
  selectedBranchId: string | null
  selectedBranchName: string | null
  setBranch: (id: string | null, name: string | null) => void
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      selectedBranchName: null,
      setBranch: (id, name) => set({ selectedBranchId: id, selectedBranchName: name })
    }),
    { name: 'vidhyaan-branch' }
  )
)
