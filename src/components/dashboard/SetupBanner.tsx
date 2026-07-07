'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ListChecks, ArrowRight, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

type SetupSummary = {
  completedCount: number
  totalCount: number
  pct: number
  bannerDismissed: boolean
  isPaid: boolean
}

/**
 * Dashboard entry point for the one-time setup checklist.
 * Shown only for paid/trialing orgs with an incomplete checklist;
 * dismissal is persisted server-side in org settings.
 */
export function SetupBanner() {
  const [summary, setSummary] = useState<SetupSummary | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    fetch('/api/v1/setup/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSummary(data?.data ?? null))
      .catch(() => {})
  }, [])

  if (!summary || hidden) return null
  if (!summary.isPaid || summary.bannerDismissed || summary.pct >= 100) return null

  const dismiss = () => {
    setHidden(true)
    fetch('/api/v1/setup/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dismissBanner: true })
    }).catch(() => {})
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 md:px-8 flex flex-col md:flex-row gap-3 md:gap-4 items-center w-full mb-6">
      <div className="flex items-start md:items-center gap-2.5 w-full md:w-auto">
        <ListChecks className="w-5 h-5 text-[#1565D8] shrink-0 mt-0.5 md:mt-0" strokeWidth={1.5} />
        <div className="space-y-0.5">
          <p className="text-xs md:text-sm text-blue-900 font-bold leading-none">
            Finish setting up — {summary.pct}% complete
          </p>
          <p className="text-[11px] md:text-xs text-blue-600 font-medium">
            {summary.completedCount} of {summary.totalCount} steps done. Payments, messaging and fee plans await.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto md:ml-auto shrink-0 mt-2 md:mt-0">
        <div className="hidden md:block w-32">
          <Progress value={summary.pct} className="h-1.5 bg-blue-100" indicatorClassName="bg-[#1565D8]" />
        </div>
        <Link
          href="/setup"
          className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition duration-200 text-center inline-flex items-center gap-1 whitespace-nowrap"
        >
          Continue setup <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={dismiss}
          className="p-1 rounded text-blue-400 hover:text-blue-700 ml-auto md:ml-0 transition shrink-0 cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
