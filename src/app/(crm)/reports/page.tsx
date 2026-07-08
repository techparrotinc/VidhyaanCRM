'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { KpiCardSkeleton } from '@/components/reports/KpiCard'

const LANDING: Record<string, string> = {
  ORG_ADMIN: '/reports/executive',
  BRANCH_ADMIN: '/reports/executive',
  COUNSELLOR: '/reports/my-desk',
  RECEPTIONIST: '/reports/my-desk',
  ACCOUNTANT: '/reports/finance'
}

export default function ReportsIndex() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return
    const role = session?.user?.role ?? ''
    router.replace(LANDING[role] ?? '/reports/executive')
  }, [status, session, router])

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
