"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Loader2, Activity, Users, Clock, Zap, TrendingUp, IndianRupee,
  Download, AlertTriangle, CheckCircle2, Gauge
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Detail {
  org: { id: string; name: string; status: string; institutionType: string }
  days: number
  summary: {
    healthScore: number
    subScores: { moduleAdoption: number; seatUtilization: number; recency: number }
    totalActiveHours: number
    totalActions: number
    activeUsers: number
    totalUsers: number
    activeDays: number
    hoursSaved: number
    costSavings: number
    hourlyRate: number
    periodSubscriptionCost: number
    roiMultiple: number | null
    enabledModules: number
    adoptedModules: number
  }
  modules: Array<{
    slug: string; label: string; actions: number; activeUsers: number; activeHours: number
    lastActive: string | null; hoursSaved: number; costSavings: number
    licensable: boolean; enabled: boolean; adopted: boolean; underutilized: boolean
  }>
  users: Array<{ userId: string; name: string; actions: number; activeHours: number; lastActive: string | null; topModule: string }>
  trend: Array<{ date: string; count: number }>
}

const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const ago = (iso: string | null) => {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function scoreColor(v: number) {
  if (v >= 70) return { ring: '#059669', text: 'text-emerald-600', bg: 'bg-emerald-50' }
  if (v >= 40) return { ring: '#D97706', text: 'text-amber-600', bg: 'bg-amber-50' }
  return { ring: '#DC2626', text: 'text-red-600', bg: 'bg-red-50' }
}

export default function OrgUsagePage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/admin/organizations/${id}/usage/detail?days=${days}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load usage'))))
      .then((j) => { if (active) { setData(j); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, days])

  const s = data?.summary
  const health = s ? scoreColor(s.healthScore) : scoreColor(0)
  const maxTrend = Math.max(1, ...(data?.trend.map((t) => t.count) || [1]))
  const maxModule = Math.max(1, ...(data?.modules.map((m) => m.actions + m.activeHours) || [1]))

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen">
      {/* Breadcrumb + header */}
      <nav className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
        <Link href="/admin" className="hover:text-slate-700">Admin</Link><span>&gt;</span>
        <Link href="/admin/orgs" className="hover:text-slate-700">Organizations</Link><span>&gt;</span>
        <Link href={`/admin/orgs/${id}`} className="hover:text-slate-700">{data?.org.name || 'Org'}</Link><span>&gt;</span>
        <span className="text-slate-600">Usage</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href={`/admin/orgs/${id}`} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Usage Metrics</h2>
            <p className="text-xs text-slate-400 mt-0.5">{data?.org.name} — adoption, engagement, time-in-app & ROI</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start">
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${days === d ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
                {d}d
              </button>
            ))}
          </div>
          <Button
            onClick={() => { window.location.href = `/api/admin/organizations/${id}/usage/export?days=${days}` }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-xs">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : error || !data || !s ? (
        <div className="flex h-64 flex-col items-center justify-center text-center text-red-500">
          <AlertTriangle className="w-8 h-8 mb-2" /><p className="font-bold text-sm">{error || 'No data'}</p>
        </div>
      ) : (
        <>
          {/* Hero: health gauge + sub-scores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-white border-slate-200 shadow-sm flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={health.ring} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(s.healthScore / 100) * 264} 264`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${health.text}`}>{s.healthScore}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Health</span>
                </div>
              </div>
              <div className="space-y-2.5 flex-1">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-blue-600" /> Engagement Score
                </div>
                {[
                  { label: 'Module Adoption', v: s.subScores.moduleAdoption },
                  { label: 'Seat Utilization', v: s.subScores.seatUtilization },
                  { label: 'Recency', v: s.subScores.recency },
                ].map((x) => (
                  <div key={x.label}>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-0.5"><span>{x.label}</span><span>{x.v}%</span></div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${x.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* KPI tiles */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Kpi icon={<Clock className="w-4 h-4" />} label="Active Hours" value={`${s.totalActiveHours}h`} hint={`${s.activeDays}/${data.days} active days`} tone="blue" />
              <Kpi icon={<Users className="w-4 h-4" />} label="Seats Active" value={`${s.activeUsers}/${s.totalUsers}`} hint="users engaged" tone="purple" />
              <Kpi icon={<Zap className="w-4 h-4" />} label="Total Actions" value={s.totalActions.toLocaleString()} hint="tracked actions" tone="amber" />
              <Kpi icon={<IndianRupee className="w-4 h-4" />} label="Cost Savings" value={inr(s.costSavings)} hint={`${s.hoursSaved}h saved`} tone="emerald" />
              <Kpi icon={<TrendingUp className="w-4 h-4" />} label="ROI" value={s.roiMultiple != null ? `${s.roiMultiple}×` : '—'} hint={s.periodSubscriptionCost ? `vs ${inr(s.periodSubscriptionCost)} plan` : 'no active plan'} tone="blue" />
              <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Modules Used" value={`${s.adoptedModules}/${s.enabledModules}`} hint="of enabled" tone="emerald" />
            </div>
          </div>

          {/* Trend */}
          {data.trend.length > 1 && (
            <Card className="p-5 bg-white border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Activity className="w-4 h-4 text-blue-600" /> Daily Activity</h3>
              <div className="flex items-end gap-1 h-24">
                {data.trend.map((t) => (
                  <div key={t.date} title={`${t.date}: ${t.count} actions`} className="flex-1 bg-blue-500/70 hover:bg-blue-600 rounded-sm transition-colors" style={{ height: `${Math.max(4, (t.count / maxTrend) * 100)}%` }} />
                ))}
              </div>
            </Card>
          )}

          {/* Per-module matrix */}
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="p-5 border-b border-slate-100"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Module Usage Matrix</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4 pl-6">Module</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                    <th className="py-2.5 px-4 text-right">Active Users</th>
                    <th className="py-2.5 px-4 text-right">Active Hours</th>
                    <th className="py-2.5 px-4 text-right">Hours Saved</th>
                    <th className="py-2.5 px-4 text-right">₹ Saved</th>
                    <th className="py-2.5 px-4">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.modules.map((m) => (
                    <tr key={m.slug} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 pl-6">
                        <div className="font-bold text-slate-800">{m.label}</div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((m.actions + m.activeHours) / maxModule) * 100}%` }} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {m.underutilized ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-700 border border-red-200">Underused</span>
                        ) : m.adopted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                        ) : m.licensable && !m.enabled ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500 border border-slate-200">Not licensed</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500 border border-slate-200">Idle</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{m.actions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600 font-semibold">{m.activeUsers}</td>
                      <td className="py-3 px-4 text-right text-slate-600 font-semibold">{m.activeHours}h</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{m.hoursSaved}h</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">{inr(m.costSavings)}</td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-semibold">{ago(m.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Per-user table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="p-5 border-b border-slate-100"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">User Activity</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4 pl-6">User</th>
                    <th className="py-2.5 px-4 text-right">Active Hours</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                    <th className="py-2.5 px-4">Top Module</th>
                    <th className="py-2.5 px-4">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No user activity in this period.</td></tr>
                  ) : data.users.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 pl-6 font-bold text-slate-800">{u.name}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">{u.activeHours}h</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-700">{u.actions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-500">{u.topModule}</td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-semibold">{ago(u.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="text-[10px] text-slate-400 font-medium">
            Cost savings modelled at {inr(s.hourlyRate)}/hour using per-module minutes-saved (configurable in Platform Settings → Usage &amp; ROI Model).
            Active hours are measured from in-app heartbeats; actions are tracked create/update/delete operations.
          </p>
        </>
      )}
    </div>
  )
}

function Kpi({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint: string; tone: 'blue' | 'purple' | 'amber' | 'emerald' }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</div>
      <div className="mt-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">{value}</div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{hint}</div>
      </div>
    </Card>
  )
}
