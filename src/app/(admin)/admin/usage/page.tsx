"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Search, ChevronDown, Activity, AlertTriangle, Gauge, Clock, IndianRupee,
  ArrowUp, ArrowDown, Download, ShieldAlert
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppSelect } from '@/components/ui/app-select'

interface Row {
  orgId: string; name: string; status: string; institutionType: string
  planName: string; planSlug: string; trialEndsAt: string | null
  healthScore: number; adoptionPct: number; seatPct: number
  activeUsers: number; totalUsers: number; enabledModules: number; adoptedModules: number
  activeHours: number; actions: number; costSavings: number
  lastActive: string | null; atRisk: boolean; signals: string[]
}
interface Overview {
  days: number
  totals: { orgs: number; trackedOrgs: number; atRisk: number; avgHealth: number; totalActiveHours: number; totalCostSavings: number }
  rows: Row[]
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
const healthColor = (v: number) => (v >= 70 ? '#059669' : v >= 40 ? '#D97706' : '#DC2626')

type SortKey = 'healthScore' | 'adoptionPct' | 'activeHours' | 'actions' | 'costSavings' | 'name'

export default function UsageOverviewPage() {
  const router = useRouter()
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [riskOnly, setRiskOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('healthScore')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/admin/usage/overview?days=${days}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load overview'))))
      .then((j) => { if (active) { setData(j); setError(null) } })
      .catch((e) => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [days])

  const rows = useMemo(() => {
    let r = data?.rows ?? []
    if (search.trim()) r = r.filter((x) => x.name.toLowerCase().includes(search.trim().toLowerCase()))
    if (planFilter !== 'ALL') r = r.filter((x) => x.planSlug === planFilter)
    if (statusFilter !== 'ALL') r = r.filter((x) => x.status === statusFilter)
    if (riskOnly) r = r.filter((x) => x.atRisk)
    const dir = sortDir === 'asc' ? 1 : -1
    return [...r].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir
      return (a[sortKey] - b[sortKey]) * dir
    })
  }, [data, search, planFilter, statusFilter, riskOnly, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir(k === 'name' ? 'asc' : 'desc') }
  }
  const SortIcon = ({ k }: { k: SortKey }) => sortKey !== k ? null : (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />)

  const exportCsv = () => {
    const headers = ['Organization', 'Plan', 'Status', 'Health', 'Adoption%', 'ActiveUsers', 'TotalUsers', 'ActiveHours', 'Actions', 'CostSavings', 'LastActive', 'Signals']
    const lines = rows.map((r) => [
      r.name, r.planName, r.status, r.healthScore, r.adoptionPct, r.activeUsers, r.totalUsers,
      r.activeHours, r.actions, r.costSavings, r.lastActive ? new Date(r.lastActive).toISOString().slice(0, 10) : '', r.signals.join('; '),
    ])
    const csv = [headers, ...lines].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = encodeURI('data:text/csv;charset=utf-8,' + csv)
    link.download = `vidhyaan_usage_overview_${days}d_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const t = data?.totals

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Usage & Health</h2>
          <p className="text-xs text-slate-400 mt-0.5">Adoption, engagement and churn risk across every organization</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)} className={`px-3 py-1 text-xs font-bold rounded-md transition ${days === d ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>{d}d</button>
            ))}
          </div>
          <Button onClick={exportCsv} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-xs">
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : error || !data || !t ? (
        <div className="flex h-64 flex-col items-center justify-center text-red-500"><AlertTriangle className="w-8 h-8 mb-2" /><p className="font-bold text-sm">{error || 'No data'}</p></div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi icon={<Activity className="w-4 h-4" />} label="Tracked Orgs" value={`${t.trackedOrgs}/${t.orgs}`} tone="blue" />
            <Kpi icon={<Gauge className="w-4 h-4" />} label="Avg Health" value={`${t.avgHealth}%`} tone={t.avgHealth >= 70 ? 'emerald' : t.avgHealth >= 40 ? 'amber' : 'red'} />
            <Kpi icon={<ShieldAlert className="w-4 h-4" />} label="At Risk" value={String(t.atRisk)} tone="red" />
            <Kpi icon={<Clock className="w-4 h-4" />} label="Active Hours" value={`${t.totalActiveHours}h`} tone="purple" />
            <Kpi icon={<IndianRupee className="w-4 h-4" />} label="Value Delivered" value={inr(t.totalCostSavings)} tone="emerald" />
          </div>

          {/* Filters */}
          <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organization..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <AppSelect value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="appearance-none bg-white rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500">
                <option value="ALL">All Plans</option><option value="free">Free</option><option value="starter">Starter</option><option value="growth">Growth</option><option value="enterprise">Enterprise</option>
              </AppSelect>
              <ChevronDown className="absolute right-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <AppSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none bg-white rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500">
                <option value="ALL">All Statuses</option><option value="ACTIVE">Active</option><option value="TRIAL">Trial</option><option value="SUSPENDED">Suspended</option>
              </AppSelect>
              <ChevronDown className="absolute right-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => setRiskOnly((v) => !v)} className={`text-xs font-bold px-3 py-2 rounded-lg border transition ${riskOnly ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              At-risk only
            </button>
            <span className="text-xs font-semibold text-slate-400 md:ml-auto">{rows.length} shown</span>
          </Card>

          {/* Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4 pl-6 cursor-pointer" onClick={() => toggleSort('name')}><span className="flex items-center gap-1">Organization <SortIcon k="name" /></span></th>
                    <th className="py-2.5 px-4">Plan</th>
                    <th className="py-2.5 px-4 cursor-pointer" onClick={() => toggleSort('healthScore')}><span className="flex items-center gap-1">Health <SortIcon k="healthScore" /></span></th>
                    <th className="py-2.5 px-4 text-right cursor-pointer" onClick={() => toggleSort('adoptionPct')}><span className="flex items-center gap-1 justify-end">Adoption <SortIcon k="adoptionPct" /></span></th>
                    <th className="py-2.5 px-4 text-right">Seats</th>
                    <th className="py-2.5 px-4 text-right cursor-pointer" onClick={() => toggleSort('activeHours')}><span className="flex items-center gap-1 justify-end">Hours <SortIcon k="activeHours" /></span></th>
                    <th className="py-2.5 px-4 text-right cursor-pointer" onClick={() => toggleSort('actions')}><span className="flex items-center gap-1 justify-end">Actions <SortIcon k="actions" /></span></th>
                    <th className="py-2.5 px-4 text-right cursor-pointer" onClick={() => toggleSort('costSavings')}><span className="flex items-center gap-1 justify-end">₹ Saved <SortIcon k="costSavings" /></span></th>
                    <th className="py-2.5 px-4">Last Active</th>
                    <th className="py-2.5 px-4 pr-6">Signals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length === 0 ? (
                    <tr><td colSpan={10} className="py-10 text-center text-slate-400 text-xs">No organizations match your filters.</td></tr>
                  ) : rows.map((r) => (
                    <tr key={r.orgId} onClick={() => router.push(`/admin/orgs/${r.orgId}/usage`)} className="hover:bg-slate-50/70 transition cursor-pointer">
                      <td className="py-3 px-4 pl-6">
                        <div className="font-bold text-slate-800">{r.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{r.status.toLowerCase()}</div>
                      </td>
                      <td className="py-3 px-4"><span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 capitalize">{r.planName}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black tabular-nums" style={{ color: healthColor(r.healthScore) }}>{r.healthScore}%</span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${r.healthScore}%`, backgroundColor: healthColor(r.healthScore) }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600">{r.adoptionPct}% <span className="text-[10px] text-slate-400">({r.adoptedModules}/{r.enabledModules})</span></td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600">{r.activeUsers}/{r.totalUsers}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600">{r.activeHours}h</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600">{r.actions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">{inr(r.costSavings)}</td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-semibold">{ago(r.lastActive)}</td>
                      <td className="py-3 px-4 pr-6">
                        <div className="flex flex-wrap gap-1">
                          {r.signals.slice(0, 2).map((sg) => (
                            <span key={sg} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-50 text-red-600 border border-red-100 whitespace-nowrap">{sg}</span>
                          ))}
                          {r.signals.length === 0 && <span className="text-[10px] text-emerald-600 font-bold">✓</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-[10px] text-slate-400 font-medium">Click any row for the full org usage report. Health = 40% module adoption + 30% seat utilization + 30% recency. Value delivered is modelled (Settings → Usage &amp; ROI Model).</p>
        </>
      )}
    </div>
  )
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'blue' | 'purple' | 'amber' | 'emerald' | 'red' }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600',
  }
  return (
    <Card className="p-4 bg-white border-slate-200 shadow-sm">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</div>
      <div className="mt-2.5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">{value}</div>
      </div>
    </Card>
  )
}
