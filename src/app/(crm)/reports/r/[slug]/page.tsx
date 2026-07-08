'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { KpiCard, KpiCardSkeleton } from '@/components/reports/KpiCard'
import { ChartCard, ChartCardSkeleton, WidgetError } from '@/components/reports/ChartCard'
import { ReportFilterBar, FilterConfig } from '@/components/reports/ReportFilterBar'
import { ReportTable, Column } from '@/components/reports/ReportTable'
import {
  FeeTrendChart, FunnelChart, SourceBars, CapacityBars,
  AgeingChart, MethodDonut, SimpleBars, PerfScatter
} from '@/components/reports/charts'
import { formatINR, formatPct } from '@/components/reports/format'
import { ArrowLeft, Star, Download, Lightbulb } from 'lucide-react'

type ReportMeta = {
  key: string
  title: string
  decision: string
  category: string
  filters: FilterConfig[]
  exports: string[]
}

type Kpi = {
  key: string
  label: string
  value: number | string | null
  format: 'int' | 'inr' | 'pct' | 'hours' | 'text' | 'date'
  caption?: string
}

type Summary = { kpis: Kpi[]; insight: string | null; charts: Record<string, unknown> }
type Rows = { columns: Column[]; rows: Record<string, unknown>[]; nextCursor: string | null }

function kpiValue(k: Kpi): string {
  if (k.value === null) return '—'
  if (typeof k.value === 'string') return k.value
  switch (k.format) {
    case 'inr': return formatINR(k.value)
    case 'pct': return formatPct(k.value)
    case 'hours': return `${k.value}h`
    default: return k.value.toLocaleString('en-IN')
  }
}

function ReportCharts({ slug, charts }: { slug: string; charts: Record<string, unknown> }) {
  switch (slug) {
    case 'lead-funnel':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Funnel">
            <FunnelChart data={charts.funnel as never} />
          </ChartCard>
          <ChartCard title="Weekly Lead Inflow" empty={(charts.weeklyInflow as unknown[]).length === 0}>
            <SimpleBars data={charts.weeklyInflow as never} xKey="week" yKey="count" yLabel="Leads" />
          </ChartCard>
        </div>
      )
    case 'lead-source-effectiveness':
      return (
        <ChartCard title="Sources by Conversion" empty={(charts.sources as unknown[]).length === 0}>
          <SourceBars data={charts.sources as never} />
        </ChartCard>
      )
    case 'counsellor-performance':
      return (
        <ChartCard title="Response Time vs Conversion" subtitle="Coaching quadrants: fast + converting is the goal" empty={(charts.scatter as unknown[]).length === 0}>
          <PerfScatter data={charts.scatter as never} />
        </ChartCard>
      )
    case 'admission-pipeline':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Applications by Stage" empty={(charts.stages as unknown[]).length === 0}>
            <SimpleBars data={charts.stages as never} xKey="stage" yKey="count" yLabel="Applications" />
          </ChartCard>
          <ChartCard title="Grade Capacity" empty={(charts.capacity as unknown[]).length === 0}>
            <CapacityBars data={charts.capacity as never} />
          </ChartCard>
        </div>
      )
    case 'fee-collection-summary':
      return (
        <ChartCard title="Billed vs Collected" empty={(charts.feeTrend as unknown[]).length === 0} emptyMessage="Trend data builds up nightly — check back tomorrow">
          <FeeTrendChart data={charts.feeTrend as never} />
        </ChartCard>
      )
    case 'defaulter-ageing':
      return (
        <ChartCard title="Overdue Ageing" empty={(charts.ageing as { amount: number }[]).every(b => b.amount === 0)} emptyMessage="Nothing overdue — clean book">
          <AgeingChart data={charts.ageing as never} />
        </ChartCard>
      )
    case 'concession-audit': {
      const byType = (charts.byType as { type: string; value: number; count: number }[]) ?? []
      return (
        <ChartCard title="Concessions by Type" empty={byType.length === 0}>
          <MethodDonut data={byType.map(t => ({ method: t.type, amount: t.value, count: t.count }))} />
        </ChartCard>
      )
    }
    case 'campaign-effectiveness':
      return (
        <ChartCard title="Leads Attributed by Channel" empty={(charts.channels as unknown[]).length === 0}>
          <SimpleBars data={charts.channels as never} xKey="channel" yKey="leads" yLabel="Leads" />
        </ChartCard>
      )
    case 'course-performance':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Active Enrollments by Course" empty={(charts.courses as unknown[]).length === 0}>
            <SimpleBars data={charts.courses as never} xKey="course" yKey="students" yLabel="Students" />
          </ChartCard>
          <ChartCard title="Batch Fill" subtitle="Students vs capacity" empty={(charts.batches as unknown[]).length === 0}>
            <CapacityBars data={charts.batches as never} />
          </ChartCard>
        </div>
      )
    case 'daily-activity': {
      const byType = (charts.byType as { type: string; count: number }[]) ?? []
      return (
        <ChartCard title="Activity Mix" empty={byType.length === 0}>
          <MethodDonut valueFormat="int" data={byType.map(t => ({ method: t.type, amount: t.count, count: t.count }))} />
        </ChartCard>
      )
    }
    case 'payment-register':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Method Mix" empty={(charts.methodMix as unknown[]).length === 0}>
            <MethodDonut data={charts.methodMix as never} />
          </ChartCard>
          <ChartCard title="Daily Collections" empty={(charts.daily as unknown[]).length === 0}>
            <SimpleBars data={charts.daily as never} xKey="day" yKey="amount" yLabel="Collected" />
          </ChartCard>
        </div>
      )
    case 'enrollment-strength':
      return (
        <ChartCard title="Students by Grade" empty={(charts.grades as unknown[]).length === 0}>
          <SimpleBars data={charts.grades as never} xKey="grade" yKey="students" yLabel="Students" />
        </ChartCard>
      )
    default:
      return null
  }
}

export default function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedYearId } = useAcademicYearStore()
  const [favourite, setFavourite] = useState(false)
  const [extraRows, setExtraRows] = useState<Record<string, unknown>[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const { data: metaData } = useSWR<{ data: ReportMeta[] }>('/api/v1/reports/meta', fetcher, {
    revalidateOnFocus: false
  })
  const meta = metaData?.data.find(r => r.key === slug)

  const filters = useMemo(() => {
    const f: Record<string, string> = {}
    searchParams.forEach((v, k) => { f[k] = v })
    return f
  }, [searchParams])

  const qs = useMemo(() => {
    const p = new URLSearchParams(filters)
    if (selectedYearId) p.set('academicYearId', selectedYearId)
    return p.toString()
  }, [filters, selectedYearId])

  const { data: summaryData, error: summaryError, isLoading: summaryLoading, mutate } =
    useSWR<{ data: Summary }>(
      meta ? `/api/v1/reports/r/${slug}/summary?${qs}` : null,
      fetcher,
      { revalidateOnFocus: false }
    )
  const { data: rowsData, isLoading: rowsLoading } = useSWR<{ data: Rows }>(
    meta ? `/api/v1/reports/r/${slug}/rows?${qs}&limit=50` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Reset pagination when filters change; record the view + favourite state.
  useEffect(() => { setExtraRows([]); setCursor(null) }, [qs])
  useEffect(() => {
    if (!meta) return
    fetch(`/api/v1/reports/usage/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewed: true })
    }).catch(() => {})
    fetch('/api/v1/reports/usage')
      .then(r => (r.ok ? r.json() : null))
      .then(json => json && setFavourite(json.data.favourites.includes(slug)))
      .catch(() => {})
  }, [meta, slug])

  const toggleFavourite = () => {
    setFavourite(f => !f)
    fetch(`/api/v1/reports/usage/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favourite: !favourite })
    }).catch(() => setFavourite(f => !f))
  }

  const loadMore = async () => {
    const next = cursor ?? rowsData?.data.nextCursor
    if (!next) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/v1/reports/r/${slug}/rows?${qs}&limit=50&cursor=${next}`)
      const json = await res.json()
      setExtraRows(r => [...r, ...json.data.rows])
      setCursor(json.data.nextCursor)
    } finally {
      setLoadingMore(false)
    }
  }

  const setFilters = (next: Record<string, string>) => {
    const p = new URLSearchParams(next)
    router.replace(`/reports/r/${slug}${p.size > 0 ? `?${p}` : ''}`, { scroll: false })
  }

  if (metaData && !meta) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">This report doesn’t exist or your role can’t view it.</p>
          <Link href="/reports/library" className="mt-3 inline-block text-sm font-semibold text-[#1565D8]">
            Back to Library
          </Link>
        </div>
      </div>
    )
  }

  const summary = summaryData?.data
  const allRows = [...(rowsData?.data.rows ?? []), ...extraRows]
  const hasMore = (cursor ?? rowsData?.data.nextCursor) !== null && rowsData?.data.nextCursor !== null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link
            href="/reports/library"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3 w-3" /> Library
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {meta?.title ?? 'Report'}
          </h1>
          {summary?.insight && (
            <p className="mt-1.5 inline-flex items-start gap-1.5 text-sm font-medium text-slate-600">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              {summary.insight}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFavourite}
            className={`p-2 rounded-lg border ${favourite ? 'border-amber-200 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600'}`}
            aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Star className="h-4 w-4" fill={favourite ? 'currentColor' : 'none'} />
          </button>
          {meta && meta.exports.length > 0 && (
            <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
              {meta.exports.map(fmt => (
                <a
                  key={fmt}
                  href={`/api/v1/reports/r/${slug}/export?${qs}&format=${fmt}`}
                  className="inline-flex items-center gap-1 px-3 h-9 text-sm font-semibold text-slate-600 hover:bg-slate-50 border-r border-slate-100 last:border-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  {fmt.toUpperCase()}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {meta && (
        <ReportFilterBar
          reportKey={slug}
          configs={meta.filters}
          values={filters}
          onChange={setFilters}
        />
      )}

      {summaryError ? (
        <WidgetError onRetry={() => mutate()} />
      ) : summaryLoading || !summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
          </div>
          <ChartCardSkeleton />
        </>
      ) : (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${summary.kpis.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            {summary.kpis.map(k => (
              <KpiCard key={k.key} label={k.label} value={kpiValue(k)} caption={k.caption} />
            ))}
          </div>
          <ReportCharts slug={slug} charts={summary.charts} />
        </>
      )}

      <ReportTable
        columns={rowsData?.data.columns ?? []}
        rows={allRows}
        loading={rowsLoading}
        hasMore={!!hasMore}
        onLoadMore={loadMore}
        loadingMore={loadingMore}
      />
    </div>
  )
}
