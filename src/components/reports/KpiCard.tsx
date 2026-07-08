'use client'

import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  label: string
  value: string
  /** Fractional delta vs comparison (0.12 = ▲12%). Null hides the chip. */
  delta?: number | null
  /** True when a falling number is good (e.g. outstanding dues). */
  invertDelta?: boolean
  caption?: string
  href?: string
}

export function KpiCard({ label, value, delta, invertDelta, caption, href }: Props) {
  const good = delta !== null && delta !== undefined && (invertDelta ? delta < 0 : delta > 0)
  const body = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full transition-colors hover:border-slate-300">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <div className="mt-3 flex items-end gap-2 flex-wrap">
        <span className="text-[32px] font-bold tracking-tight text-slate-900 leading-none">
          {value}
        </span>
        {delta !== null && delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-1.5 py-0.5 mb-0.5 ${
              good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta * 100).toFixed(delta * 100 >= 10 ? 0 : 1)}%
          </span>
        )}
      </div>
      {caption && <p className="mt-2 text-xs font-normal text-slate-400">{caption}</p>}
    </div>
  )
  return href ? <Link href={href} className="block h-full">{body}</Link> : body
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-28" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  )
}
