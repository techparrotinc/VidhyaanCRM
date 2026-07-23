'use client'

import React, { createContext, useContext } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

interface ParentAccessScope {
  /** ≥1 linked ward — undefined while the probe is still loading. */
  hasLinkedStudent: boolean | undefined
  loading: boolean
}

const ParentAccessCtx = createContext<ParentAccessScope>({ hasLinkedStudent: undefined, loading: true })

/**
 * Fetches the parent's portal scope once and shares it with the sidebar,
 * mobile nav, and the layout redirect guard. Revalidates on focus so a
 * school linking a parent mid-session flips the nav to full without re-login.
 */
export function ParentAccessProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useSWR<{ data: { hasLinkedStudent: boolean } }>(
    '/api/v1/parent/access-scope',
    fetcher
  )
  const value: ParentAccessScope = {
    hasLinkedStudent: data?.data?.hasLinkedStudent,
    loading: isLoading
  }
  return <ParentAccessCtx.Provider value={value}>{children}</ParentAccessCtx.Provider>
}

export function useParentAccess(): ParentAccessScope {
  return useContext(ParentAccessCtx)
}
