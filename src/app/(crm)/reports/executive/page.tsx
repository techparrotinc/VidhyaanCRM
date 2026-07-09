'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { KpiCard, KpiCardSkeleton } from '@/components/reports/KpiCard'
import { AttentionStrip, AttentionItem } from '@/components/reports/AttentionStrip'
import { ChartCard, ChartCardSkeleton, WidgetError } from '@/components/reports/ChartCard'
import { FeeTrendChart, FunnelChart, SourceBars, CapacityBars, MethodDonut, SimpleBars } from '@/components/reports/charts'
import { Users, Target, GraduationCap, Wallet, AlertCircle, RefreshCw } from 'lucide-react'
import { WidgetCustomizer, useWidgetPrefs, WidgetDef } from '@/components/reports/WidgetCustomizer'
import { BranchFilter } from '@/components/reports/BranchFilter'
import { useState } from 'react'
import { formatINR, formatPct, deltaPct } from '@/components/reports/format'

type ExecutiveData = {
  institutionType: string
  courseLed: boolean
  year: { id: string; name: string } | null
  compareYear: { id: string; name: string } | null
  kpis: {
    leads: { value: number; prev: number | null }
    conversionPct: { value: number | null; prev: number | null }
    admissions: { value: number; prev: number | null; capacity: number | null }
    collectedThisMonth: { value: number; prev: number }
    outstanding: { value: number; invoices: number }
  }
  funnel: { status: string; count: number; prevCount: number | null }[]
  feeTrend: { month: string; billed: number; collected: number }[]
  sources: { source: string; leads: number; converted: number; conversionPct: number }[]
  capacity: { grade: string; totalSeats: number; filledSeats: number; admitted: number }[]
  courses: { course: string; students: number }[]
  batches: { grade: string; totalSeats: number; filledSeats: number }[]
  attention: AttentionItem[]
}

const WIDGET_DEFS: WidgetDef[] = [
  { key: 'funnel', label: 'Admission Funnel' },
  { key: 'feeTrend', label: 'Fee Collection Trend' },
  { key: 'sources', label: 'Lead Sources by Conversion' },
  { key: 'seats', label: 'Grade Capacity / Courses' },
  { key: 'sourceShare', label: 'Lead Source Share' },
  { key: 'batches', label: 'Batch Fill' }
]

export default function ExecutiveDashboard() {
  const { selectedYearId } = useAcademicYearStore()
  const { order, hidden, persist } = useWidgetPrefs('vidhyaan:widgets:executive', WIDGET_DEFS)
  const [branch, setBranch] = useState('')
  const execUrl = `/api/v1/reports/dashboards/executive?${new URLSearchParams({ ...(selectedYearId ? { academicYearId: selectedYearId } : {}), ...(branch ? { branch } : {}) })}`
  const { data, error, isLoading, mutate } = useSWR<{ data: ExecutiveData }>(execUrl, fetcher, { revalidateOnFocus: false })
  const [refreshing, setRefreshing] = useState(false)
  const refresh = async () => {
    setRefreshing(true)
    try {
      await mutate(async () => (await fetch(`${execUrl}&fresh=1`)).json(), { revalidate: false })
    } finally { setRefreshing(false) }
  }

  const d = data?.data

  if (error) {
    return (
      <div className="p-6">
        <WidgetError onRetry={() => mutate()} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Dashboard</h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500">
            {d?.year ? `Academic year ${d.year.name}` : 'All academic years'}
            {d?.compareYear ? ` · compared with ${d.compareYear.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={refresh} disabled={refreshing} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-300 disabled:opacity-50" aria-label="Refresh" title="Refresh (bypass cache)">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <BranchFilter value={branch} onChange={setBranch} />
          <WidgetCustomizer defs={WIDGET_DEFS} order={order} hidden={hidden} onChange={persist} />
          <a href="/reports/library" className="inline-flex items-center h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300">
            Report Library
          </a>
        </div>
      </div>

      {d && d.attention.length > 0 && <AttentionStrip items={d.attention} />}

      {isLoading || !d ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              icon={Users}
              tone="blue"
              label="New Leads"
              value={String(d.kpis.leads.value)}
              delta={deltaPct(d.kpis.leads.value, d.kpis.leads.prev)}
              caption={d.compareYear ? `vs ${d.compareYear.name}` : undefined}
              href="/lead-management"
            />
            <KpiCard
              icon={Target}
              tone="violet"
              label="Conversion"
              value={formatPct(d.kpis.conversionPct.value)}
              delta={
                d.kpis.conversionPct.value !== null && d.kpis.conversionPct.prev !== null
                  ? d.kpis.conversionPct.value - d.kpis.conversionPct.prev
                  : null
              }
              caption={d.compareYear ? `vs ${d.compareYear.name}` : undefined}
              href="/lead-management?status=CONVERTED"
            />
            <KpiCard
              icon={GraduationCap}
              tone="sky"
              label="Admissions"
              value={
                d.kpis.admissions.capacity
                  ? `${d.kpis.admissions.value} / ${d.kpis.admissions.capacity}`
                  : String(d.kpis.admissions.value)
              }
              delta={deltaPct(d.kpis.admissions.value, d.kpis.admissions.prev)}
              caption={d.kpis.admissions.capacity ? 'admitted vs capacity' : 'admitted this year'}
              href="/admission-management"
            />
            <KpiCard
              icon={Wallet}
              tone="green"
              label="Collected"
              value={formatINR(d.kpis.collectedThisMonth.value)}
              delta={deltaPct(d.kpis.collectedThisMonth.value, d.kpis.collectedThisMonth.prev)}
              caption="this month vs last"
              href="/fee-management"
            />
            <KpiCard
              icon={AlertCircle}
              tone="rose"
              label="Outstanding"
              value={formatINR(d.kpis.outstanding.value)}
              caption={`${d.kpis.outstanding.invoices} open invoices`}
              href="/fee-management?status=OVERDUE"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {order.filter(k => !hidden.includes(k)).map(key => {
              switch (key) {
                case 'funnel':
                  return (
                    <ChartCard
                      key={key}
                      title="Admission Funnel"
                      subtitle={d.compareYear ? `This year vs ${d.compareYear.name}` : undefined}
                      empty={d.funnel.every(f => f.count === 0)}
                      emptyMessage="No leads recorded in this academic year yet"
                    >
                      <FunnelChart data={d.funnel} compareLabel={d.compareYear?.name} />
                    </ChartCard>
                  )
                case 'feeTrend':
                  return (
                    <ChartCard
                      key={key}
                      title="Fee Collection Trend"
                      subtitle="Billed vs collected, last 12 months"
                      empty={d.feeTrend.length === 0}
                      emptyMessage="Trend data builds up nightly — check back tomorrow"
                    >
                      <FeeTrendChart data={d.feeTrend} />
                    </ChartCard>
                  )
                case 'sources':
                  return (
                    <ChartCard
                      key={key}
                      title="Lead Sources by Conversion"
                      empty={d.sources.length === 0}
                      emptyMessage="No leads recorded in this academic year yet"
                    >
                      <SourceBars data={d.sources} />
                    </ChartCard>
                  )
                case 'seats':
                  return d.courseLed ? (
                    <ChartCard
                      key={key}
                      title="Active Enrollments by Course"
                      empty={d.courses.length === 0}
                      emptyMessage="No active course enrollments yet"
                    >
                      <SimpleBars data={d.courses} xKey="course" yKey="students" yLabel="Students" />
                    </ChartCard>
                  ) : (
                    <ChartCard
                      key={key}
                      title="Grade Capacity"
                      subtitle="Seats filled per grade"
                      empty={d.capacity.length === 0}
                      emptyMessage="No seat capacity configured for this year"
                    >
                      <CapacityBars data={d.capacity} />
                    </ChartCard>
                  )
                case 'sourceShare':
                  return (
                    <ChartCard
                      key={key}
                      title="Lead Source Share"
                      subtitle="Where enquiries come from"
                      empty={d.sources.length === 0}
                      emptyMessage="No leads recorded in this academic year yet"
                    >
                      <MethodDonut
                        valueFormat="int"
                        data={d.sources.slice(0, 8).map(s => ({
                          method: s.source, amount: s.leads, count: s.leads
                        }))}
                      />
                    </ChartCard>
                  )
                case 'batches':
                  return d.courseLed ? (
                    <ChartCard
                      key={key}
                      title="Batch Fill"
                      subtitle="Students vs batch capacity"
                      empty={d.batches.length === 0}
                      emptyMessage="No batches configured yet"
                    >
                      <CapacityBars data={d.batches} />
                    </ChartCard>
                  ) : null
                default:
                  return null
              }
            })}
          </div>
        </>
      )}
    </div>
  )
}
