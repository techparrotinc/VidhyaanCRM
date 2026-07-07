'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  MinusCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  GitBranch,
  IndianRupee,
  Upload,
  CreditCard,
  MessageCircle,
  MessageSquare,
  Users,
  PartyPopper
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

type SetupStep = {
  key: string
  label: string
  description: string
  href: string
  optional: boolean
  status: 'done' | 'pending' | 'skipped'
}

type SetupSummary = {
  steps: SetupStep[]
  completedCount: number
  totalCount: number
  pct: number
  bannerDismissed: boolean
  isPaid: boolean
}

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  profile: Building2,
  entity: CalendarDays,
  pipeline: GitBranch,
  fees: IndianRupee,
  migrate: Upload,
  gateway: CreditCard,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  team: Users
}

export default function SetupPage() {
  const [summary, setSummary] = useState<SetupSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/setup/status')
      if (!res.ok) throw new Error('Failed to load setup status')
      const data = await res.json()
      setSummary(data.data)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to load setup status')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleSkip = async (step: SetupStep) => {
    setUpdatingKey(step.key)
    try {
      const res = await fetch('/api/v1/setup/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          step.status === 'skipped' ? { unskipStep: step.key } : { skipStep: step.key }
        )
      })
      if (res.ok) {
        const data = await res.json()
        setSummary(data.data)
      }
    } finally {
      setUpdatingKey(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="p-8">
        <p className="text-sm font-medium text-red-600">{error || 'Something went wrong.'}</p>
      </div>
    )
  }

  const allDone = summary.pct === 100

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Get set up
        </h1>
        <p className="mt-1 text-sm font-normal leading-relaxed text-slate-500">
          A one-time checklist to get everything ready — work through it at your own pace.
          Your progress is saved automatically.
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Setup progress
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {summary.completedCount} of {summary.totalCount} complete
          </span>
        </div>
        <Progress
          value={summary.pct}
          className="mt-3 h-2 bg-slate-100"
          indicatorClassName="bg-[#1565D8]"
        />
        <p className="mt-2 text-xs font-normal text-slate-400">{summary.pct}% done</p>
      </div>

      {/* All done */}
      {allDone && (
        <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6">
          <PartyPopper className="h-8 w-8 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">You&apos;re all set!</p>
            <p className="text-sm font-normal leading-relaxed text-green-700">
              Everything is configured. Head to your dashboard to start working.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-3">
        {summary.steps.map((step) => {
          const Icon = STEP_ICONS[step.key] ?? Circle
          const isDone = step.status === 'done'
          const isSkipped = step.status === 'skipped'
          return (
            <div
              key={step.key}
              className={`flex items-start gap-4 rounded-xl border bg-white p-6 transition-colors ${
                isDone ? 'border-green-200' : 'border-slate-200'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isDone ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isDone || isSkipped ? 'text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isDone && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </span>
                  )}
                  {isSkipped && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      <MinusCircle className="h-3 w-3" /> Skipped
                    </span>
                  )}
                  {!isDone && !isSkipped && step.optional && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      Optional
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-normal leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                {!isDone && (
                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#1565D8] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#1258c0]"
                  >
                    Set up <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {isDone && (
                  <Link
                    href={step.href}
                    className="text-sm font-semibold text-[#1565D8] hover:underline"
                  >
                    Review
                  </Link>
                )}
                {!isDone && step.optional && (
                  <button
                    onClick={() => toggleSkip(step)}
                    disabled={updatingKey === step.key}
                    className="text-xs font-normal text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  >
                    {step.status === 'skipped' ? 'Undo skip' : 'Skip for now'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="pb-8 text-center text-xs font-normal text-slate-400">
        Need help getting set up? Write to us at support@vidhyaan.com — we&apos;ll walk you through it.
      </p>
    </div>
  )
}
