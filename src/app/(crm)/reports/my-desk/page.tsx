'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { Progress } from '@/components/ui/progress'
import { KpiCardSkeleton } from '@/components/reports/KpiCard'
import { ChartCard, ChartCardSkeleton, WidgetError } from '@/components/reports/ChartCard'
import { Phone, Clock } from 'lucide-react'

type FollowUpLead = {
  id: string
  leadCode: string
  parentName: string
  kidName: string | null
  phone: string
  gradeSought: string | null
  priority: string
  nextFollowUpAt: string | null
  status: string
}

type MyDeskData = {
  followups: {
    overdue: { count: number; leads: FollowUpLead[] }
    today: { count: number; leads: FollowUpLead[] }
    upcoming: { count: number; leads: FollowUpLead[] }
  }
  targets: {
    periodStart: string
    periodEnd: string
    leadTarget: number
    leadActual: number
    conversionTarget: number
    conversionActual: number
  } | null
  responseTime: { myMedianHours: number | null; orgMedianHours: number | null }
  pipeline: { status: string; count: number }[]
  goneCold: (FollowUpLead & { updatedAt: string })[]
}

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: 'bg-red-50 text-red-700',
  HIGH: 'bg-amber-50 text-amber-700',
  MEDIUM: 'bg-blue-50 text-blue-700',
  LOW: 'bg-slate-100 text-slate-600'
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up pending',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Not interested'
}

function LeadRow({ lead, tone }: { lead: FollowUpLead; tone?: 'overdue' | 'normal' }) {
  return (
    <Link
      href={`/lead-management?lead=${lead.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5 hover:border-slate-300 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {lead.parentName}
          {lead.kidName ? <span className="text-slate-400 font-normal"> · {lead.kidName}</span> : null}
        </p>
        <p className="text-xs font-normal text-slate-400 truncate">
          {lead.leadCode}
          {lead.gradeSought ? ` · ${lead.gradeSought}` : ''}
          {lead.nextFollowUpAt
            ? ` · due ${new Date(lead.nextFollowUpAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
            : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
          tone === 'overdue' ? 'bg-red-50 text-red-700' : PRIORITY_STYLES[lead.priority] ?? PRIORITY_STYLES.LOW
        }`}>
          {tone === 'overdue' ? 'Overdue' : lead.priority}
        </span>
        <a
          href={`tel:${lead.phone}`}
          onClick={e => e.stopPropagation()}
          className="p-1.5 rounded-md text-[#1565D8] hover:bg-blue-50"
          aria-label={`Call ${lead.parentName}`}
        >
          <Phone className="h-4 w-4" />
        </a>
      </div>
    </Link>
  )
}

export default function MyDeskDashboard() {
  const { selectedYearId } = useAcademicYearStore()
  const { data, error, isLoading, mutate } = useSWR<{ data: MyDeskData }>(
    `/api/v1/reports/dashboards/my-desk${selectedYearId ? `?academicYearId=${selectedYearId}` : ''}`,
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

  if (isLoading || !d) {
    return (
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCardSkeleton height="h-96" />
          <ChartCardSkeleton height="h-96" />
        </div>
      </div>
    )
  }

  const totalPipeline = d.pipeline.reduce((s, p) => s + p.count, 0)

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Desk</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500">
          {d.followups.overdue.count > 0
            ? `${d.followups.overdue.count} overdue follow-up${d.followups.overdue.count === 1 ? '' : 's'} need attention`
            : d.followups.today.count > 0
              ? `${d.followups.today.count} follow-up${d.followups.today.count === 1 ? '' : 's'} due today`
              : 'All caught up on follow-ups'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work queue — the product on this page */}
        <div className="lg:col-span-2 space-y-6">
          <ChartCard
            title={`Overdue (${d.followups.overdue.count})`}
            empty={d.followups.overdue.leads.length === 0}
            emptyMessage="Nothing overdue — nice."
          >
            <div className="space-y-2">
              {d.followups.overdue.leads.map(l => <LeadRow key={l.id} lead={l} tone="overdue" />)}
            </div>
          </ChartCard>

          <ChartCard
            title={`Due Today (${d.followups.today.count})`}
            empty={d.followups.today.leads.length === 0}
            emptyMessage="No follow-ups scheduled for today"
          >
            <div className="space-y-2">
              {d.followups.today.leads.map(l => <LeadRow key={l.id} lead={l} />)}
            </div>
          </ChartCard>

          <ChartCard
            title="Recently Gone Cold"
            subtitle="Interested leads with no activity for 7+ days"
            empty={d.goneCold.length === 0}
            emptyMessage="No leads going cold"
          >
            <div className="space-y-2">
              {d.goneCold.map(l => <LeadRow key={l.id} lead={l} />)}
            </div>
          </ChartCard>
        </div>

        {/* Scoreboard */}
        <div className="space-y-6">
          {d.targets && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                My Targets
              </h3>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">Leads handled</span>
                  <span className="font-semibold text-slate-900">
                    {d.targets.leadActual} / {d.targets.leadTarget}
                  </span>
                </div>
                <Progress
                  value={d.targets.leadTarget > 0 ? Math.min(100, (d.targets.leadActual / d.targets.leadTarget) * 100) : 0}
                  className="h-2 bg-slate-100"
                  indicatorClassName="bg-[#1565D8]"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">Conversions</span>
                  <span className="font-semibold text-slate-900">
                    {d.targets.conversionActual} / {d.targets.conversionTarget}
                  </span>
                </div>
                <Progress
                  value={d.targets.conversionTarget > 0 ? Math.min(100, (d.targets.conversionActual / d.targets.conversionTarget) * 100) : 0}
                  className="h-2 bg-slate-100"
                  indicatorClassName="bg-[#1565D8]"
                />
              </div>
              <p className="text-xs font-normal text-slate-400">
                Period ends {new Date(d.targets.periodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
              Response Time
            </h3>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-[#1565D8]" />
              <div>
                <p className="text-[32px] font-bold tracking-tight text-slate-900 leading-none">
                  {d.responseTime.myMedianHours !== null
                    ? `${d.responseTime.myMedianHours.toFixed(1)}h`
                    : '—'}
                </p>
                <p className="mt-1 text-xs font-normal text-slate-400">
                  median first response
                  {d.responseTime.orgMedianHours !== null
                    ? ` · team median ${d.responseTime.orgMedianHours.toFixed(1)}h`
                    : ''}
                </p>
              </div>
            </div>
          </div>

          <ChartCard
            title="My Pipeline"
            empty={totalPipeline === 0}
            emptyMessage="No leads assigned yet"
          >
            <div className="space-y-3">
              {d.pipeline.map(p => (
                <div key={p.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                    <span className="font-semibold text-slate-900">{p.count}</span>
                  </div>
                  <Progress
                    value={totalPipeline > 0 ? (p.count / totalPipeline) * 100 : 0}
                    className="h-1.5 bg-slate-100"
                    indicatorClassName="bg-[#1565D8]"
                  />
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
