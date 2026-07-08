'use client'

import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export type KpiTone = 'blue' | 'green' | 'amber' | 'violet' | 'rose' | 'sky' | 'slate'

const TONES: Record<KpiTone, { chip: string; bar: string }> = {
  blue: { chip: 'bg-blue-50 text-[#1565D8]', bar: 'bg-[#1565D8]' },
  green: { chip: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  amber: { chip: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' },
  violet: { chip: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500' },
  rose: { chip: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500' },
  sky: { chip: 'bg-sky-50 text-sky-600', bar: 'bg-sky-500' },
  slate: { chip: 'bg-slate-100 text-slate-500', bar: 'bg-slate-400' }
}

type Props = {
  label: string
  value: string
  /** Fractional delta vs comparison (0.12 = ▲12%). Null hides the chip. */
  delta?: number | null
  /** True when a falling number is good (e.g. outstanding dues). */
  invertDelta?: boolean
  caption?: string
  href?: string
  icon?: LucideIcon
  tone?: KpiTone
}

export function KpiCard({
  label, value, delta, invertDelta, caption, href, icon: Icon, tone = 'blue'
}: Props) {
  const good = delta !== null && delta !== undefined && (invertDelta ? delta < 0 : delta > 0)
  const t = TONES[tone]
  const body = (
    <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full transition-all hover:border-slate-300 hover:shadow-md">
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        {Icon && (
          <span className={`shrink-0 rounded-lg p-1.5 ${t.chip}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
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
            {Math.abs(delta * 100).toFixed(Math.abs(delta * 100) >= 10 ? 0 : 1)}%
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
