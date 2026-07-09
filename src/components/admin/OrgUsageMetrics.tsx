"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Activity, Loader2, TrendingUp, ArrowRight } from 'lucide-react'

interface UsageData {
  days: number
  total: number
  activeDays: number
  lastActivityAt: string | null
  lastFeature: string | null
  features: Array<{ feature: string; count: number }>
  series: Array<{ date: string; count: number }>
}

// Friendly labels for feature/module keys emitted by the API composer.
const FEATURE_LABELS: Record<string, string> = {
  leads: 'Lead Management',
  lead_management: 'Lead Management',
  admissions: 'Admissions',
  admission_management: 'Admissions',
  students: 'Student Management',
  student_management: 'Student Management',
  fees: 'Fee Management',
  fee_management: 'Fee Management',
  invoices: 'Invoicing',
  campaigns: 'Campaigns',
  campaign_management: 'Campaigns',
  events: 'Events',
  reports: 'Reports',
  advanced_reports: 'Reports',
  users: 'Team & Users',
  forms: 'Digital Forms',
  onboarding: 'Onboarding',
  files: 'File Uploads',
  account: 'Account',
  other: 'Other',
}

const labelFor = (key: string) =>
  FEATURE_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const BAR_COLORS = ['#1565D8', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#DB2777', '#4F46E5']

export default function OrgUsageMetrics({ orgId }: { orgId: string }) {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/admin/organizations/${orgId}/usage?days=${days}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (active) setData(json) })
      .catch(() => { if (active) setData(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [orgId, days])

  const maxFeature = data?.features?.[0]?.count || 1
  const maxDaily = Math.max(1, ...(data?.series?.map((s) => s.count) || [1]))

  const timeAgo = (iso: string | null) => {
    if (!iso) return 'No activity yet'
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-blue-600" /> Feature Usage
          <Link href={`/admin/orgs/${orgId}/usage`} className="ml-1 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 normal-case tracking-normal">
            Full report <ArrowRight className="w-3 h-3" />
          </Link>
        </h3>
        <div className="flex bg-slate-100 p-0.5 rounded-lg">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                days === d ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : !data || data.total === 0 ? (
        <div className="py-10 text-center">
          <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">No tracked activity in the last {days} days</p>
          <p className="text-[10px] text-slate-400 mt-1">Usage is recorded as the org actively works in each module.</p>
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Total Actions</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{data.total.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Active Days</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{data.activeDays}/{data.days}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Last Active</div>
              <div className="text-xs font-black text-slate-900 mt-1.5">{timeAgo(data.lastActivityAt)}</div>
            </div>
          </div>

          {/* Daily trend sparkline */}
          {data.series.length > 1 && (
            <div className="flex items-end gap-0.5 h-12 pt-1">
              {data.series.map((s) => (
                <div
                  key={s.date}
                  title={`${s.date}: ${s.count}`}
                  className="flex-1 bg-blue-500/70 hover:bg-blue-600 rounded-sm transition-colors"
                  style={{ height: `${Math.max(6, (s.count / maxDaily) * 100)}%` }}
                />
              ))}
            </div>
          )}

          {/* Per-feature breakdown */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">By Feature</div>
            {data.features.map((f, i) => (
              <div key={f.feature}>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>{labelFor(f.feature)}</span>
                  <span className="text-slate-500">{f.count.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${(f.count / maxFeature) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
