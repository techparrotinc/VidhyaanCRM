'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { KpiCard, KpiCardSkeleton } from '@/components/reports/KpiCard'
import { AttentionStrip, AttentionItem } from '@/components/reports/AttentionStrip'
import { ChartCard, ChartCardSkeleton, WidgetError } from '@/components/reports/ChartCard'
import { FeeTrendChart, FunnelChart, SourceBars, CapacityBars } from '@/components/reports/charts'
import { formatINR, formatPct, deltaPct } from '@/components/reports/format'

type ExecutiveData = {
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
  attention: AttentionItem[]
}

export default function ExecutiveDashboard() {
  const { selectedYearId } = useAcademicYearStore()
  const { data, error, isLoading, mutate } = useSWR<{ data: ExecutiveData }>(
    `/api/v1/reports/dashboards/executive${selectedYearId ? `?academicYearId=${selectedYearId}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  )

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
        <a href="/reports/library" className="inline-flex items-center h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300 shrink-0">
          Report Library
        </a>
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
              label="New Leads"
              value={String(d.kpis.leads.value)}
              delta={deltaPct(d.kpis.leads.value, d.kpis.leads.prev)}
              caption={d.compareYear ? `vs ${d.compareYear.name}` : undefined}
              href="/lead-management"
            />
            <KpiCard
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
              label="Collected"
              value={formatINR(d.kpis.collectedThisMonth.value)}
              delta={deltaPct(d.kpis.collectedThisMonth.value, d.kpis.collectedThisMonth.prev)}
              caption="this month vs last"
              href="/fee-management"
            />
            <KpiCard
              label="Outstanding"
              value={formatINR(d.kpis.outstanding.value)}
              caption={`${d.kpis.outstanding.invoices} open invoices`}
              href="/fee-management?status=OVERDUE"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Admission Funnel"
              subtitle={d.compareYear ? `This year vs ${d.compareYear.name}` : undefined}
              empty={d.funnel.every(f => f.count === 0)}
              emptyMessage="No leads recorded in this academic year yet"
            >
              <FunnelChart data={d.funnel} compareLabel={d.compareYear?.name} />
            </ChartCard>

            <ChartCard
              title="Fee Collection Trend"
              subtitle="Billed vs collected, last 12 months"
              empty={d.feeTrend.length === 0}
              emptyMessage="Trend data builds up nightly — check back tomorrow"
            >
              <FeeTrendChart data={d.feeTrend} />
            </ChartCard>

            <ChartCard
              title="Lead Sources by Conversion"
              empty={d.sources.length === 0}
              emptyMessage="No leads recorded in this academic year yet"
            >
              <SourceBars data={d.sources} />
            </ChartCard>

            <ChartCard
              title="Grade Capacity"
              subtitle="Seats filled per grade"
              empty={d.capacity.length === 0}
              emptyMessage="No seat capacity configured for this year"
            >
              <CapacityBars data={d.capacity} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
