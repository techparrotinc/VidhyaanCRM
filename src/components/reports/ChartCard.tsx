'use client'

import { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function ChartCard({
  title,
  subtitle,
  children,
  empty,
  emptyMessage = 'No data yet for this period'
}: {
  title: string
  subtitle?: string
  children: ReactNode
  empty?: boolean
  emptyMessage?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
      <div className="mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</h3>
        {subtitle && <p className="mt-1 text-xs font-normal text-slate-400">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <p className="text-sm font-normal leading-relaxed text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">{children}</div>
      )}
    </div>
  )
}

export function ChartCardSkeleton({ height = 'h-72' }: { height?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <Skeleton className="h-3 w-32 mb-4" />
      <Skeleton className={`w-full ${height}`} />
    </div>
  )
}

/** Per-widget error state — a failed widget degrades alone, never the page. */
export function WidgetError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center py-12 gap-3">
      <p className="text-sm font-normal text-slate-500">Couldn’t load this section</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-[#1565D8] hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}
