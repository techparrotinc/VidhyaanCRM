import { signOut } from 'next-auth/react'
import { useBranchStore } from '@/stores/branch.store'

let isSigningOut = false

export const fetcher = async (
  url: string
) => {
  // Branch switcher preference; server clamps it in compose.ts. Read outside
  // React on purpose — SWR calls this from anywhere.
  const branchId = useBranchStore.getState().selectedBranchId
  const res = await fetch(url, {
    headers: branchId ? { 'x-branch-id': branchId } : undefined
  })
  if (!res.ok) {
    if (res.status === 401 && !isSigningOut) {
      try {
        const body = await res.clone().json()
        if (body?.code === 'UNAUTHENTICATED') {
          isSigningOut = true
          signOut({ callbackUrl: '/login' })
        }
      } catch {
        // response body wasn't valid JSON — ignore, fall through to
        // normal error throw below
      }
    }
    const error = new Error(
      'API request failed'
    ) as any
    error.status = res.status
    throw error
  }
  return res.json()
}
