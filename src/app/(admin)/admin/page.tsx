"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  TrendingUp,
  School,
  Users,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Clock,
  RefreshCw,
  ChevronRight,
  Building,
  CheckCircle,
  HelpCircle,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Stats {
  organizations: {
    total: number
    active: number
    trial: number
    suspended: number
    freePlan: number
    paid: number
    newThisMonth: number
    newLastMonth: number
    growthPct: number
  }
  revenue: {
    activeSubscriptionAmount: number
    mrr: number
    arr: number
    thisMonth: number
    lastMonth: number
    growthPct: number
    trend: { label: string; month: string; value: number }[]
  }
  ops: {
    failedPaymentsThisWeek: number
    dbLatencyMs: number
    activeOrgs: number
  }
  marketplace: {
    totalSchools: number
    verifiedSchools: number
    pendingVerification: number
    totalLearningCenters: number
    totalParents: number
    totalEnquiries: number
    totalTrialBookings: number
    schoolViews: number
  }
  crm: {
    totalLeads: number
    totalAdmissions: number
    totalStudents: number
    totalInvoicesAmount: number
    totalPaymentsAmount: number
  }
  recentActivity: {
    organizations: any[]
    parents: any[]
    verifications: any[]
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/stats')
      if (!res.ok) {
        throw new Error('Failed to load platform stats')
      }
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the dashboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Real monthly revenue (successful transactions), last 6 months.
  const chartData = (stats?.revenue.trend ?? []).slice(-6).map((t) => ({ label: t.label, val: t.value }))
  const maxVal = Math.max(...chartData.map((d) => d.val), 1)

  // Requires Action list calculation
  const actionItems = []
  const pendingSchools = stats?.marketplace.pendingVerification || 0
  if (pendingSchools > 0) {
    actionItems.push({
      type: 'pending_schools',
      desc: `${pendingSchools} schools pending verification`,
      btnText: 'Review →',
      link: '/admin/schools',
      color: 'bg-red-500'
    })
  }
  
  // Orgs trials expiring soon
  const trialOrgsCount = stats?.organizations.trial || 0
  if (trialOrgsCount > 0) {
    actionItems.push({
      type: 'trial_expire',
      desc: `${trialOrgsCount} orgs on active trial`,
      btnText: 'Contact →',
      link: '/admin/orgs',
      color: 'bg-amber-500'
    })
  }

  // Failed payments (real, last 7 days) — only surface when there are any
  const failedPayments = stats?.ops.failedPaymentsThisWeek ?? 0
  if (failedPayments > 0) {
    actionItems.push({
      type: 'failed_payments',
      desc: `${failedPayments} failed payment${failedPayments === 1 ? '' : 's'} this week`,
      btnText: 'View →',
      link: '/admin/revenue',
      color: 'bg-red-500'
    })
  }

  const activeActionsCount = actionItems.length

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 select-none animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-md mb-2" />
        <div className="h-4 w-72 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center select-none">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Dashboard Loading Failed</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md">{error}</p>
        <Button onClick={fetchData} className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry Loading
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 select-none font-sans antialiased text-slate-800 animate-fade-in bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
            Platform Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time overview of Vidhyaan platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">
            Last updated: {refreshing ? 'Refreshing...' : 'just now'}
          </span>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 bg-white transition duration-150 shadow-xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Organizations */}
        <Card onClick={() => router.push('/admin/orgs')} className="p-5 flex flex-col justify-between min-h-36 bg-white border-slate-200 hover:shadow-md hover:border-blue-200 transition duration-200 shadow-sm relative group cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Building2 className="w-5 h-5" strokeWidth={1.5} />
            </div>
            {stats && stats.organizations.growthPct > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                +{stats.organizations.growthPct.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Total Organizations
            </span>
            <h3 className="text-2xl font-black text-slate-950 mt-1 tracking-tight font-sans">
              {stats?.organizations.total ?? 0}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              +{stats?.organizations.newThisMonth ?? 0} this month
            </p>
          </div>
        </Card>

        {/* MRR */}
        <Card onClick={() => router.push('/admin/revenue')} className="p-5 flex flex-col justify-between min-h-36 bg-white border-slate-200 hover:shadow-md hover:border-emerald-200 transition duration-200 shadow-sm relative group cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
            </div>
            {stats && stats.revenue.growthPct > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                +{stats.revenue.growthPct.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Monthly Revenue (MRR)
            </span>
            <h3 className="text-2xl font-black text-slate-950 mt-1 tracking-tight font-sans">
              {formatCurrency(stats?.revenue.mrr ?? 0)}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              ARR: {formatCurrency(stats?.revenue.arr ?? 0)}
            </p>
          </div>
        </Card>

        {/* Active Schools */}
        <Card onClick={() => router.push('/admin/schools')} className="p-5 flex flex-col justify-between min-h-36 bg-white border-slate-200 hover:shadow-md hover:border-blue-200 transition duration-200 shadow-sm relative group cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <School className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Active Schools
            </span>
            <h3 className="text-2xl font-black text-slate-950 mt-1 tracking-tight font-sans">
              {stats?.marketplace.totalSchools ?? 0}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {stats?.marketplace.verifiedSchools ?? 0} verified on platform
            </p>
          </div>
        </Card>

        {/* Total Parents */}
        <Card onClick={() => router.push('/admin/parents')} className="p-5 flex flex-col justify-between min-h-36 bg-white border-slate-200 hover:shadow-md hover:border-purple-200 transition duration-200 shadow-sm relative group cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <Users className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Total Parents
            </span>
            <h3 className="text-2xl font-black text-slate-950 mt-1 tracking-tight font-sans">
              {stats?.marketplace.totalParents ?? 0}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {stats?.marketplace.totalEnquiries ?? 0} enquiries sent
            </p>
          </div>
        </Card>
      </section>

      {/* KPI Cards Row 2 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Trial Orgs */}
        <Card onClick={() => router.push('/admin/orgs?status=TRIAL')} className="p-5 flex flex-col justify-between min-h-36 bg-white border-slate-200 hover:shadow-md transition duration-200 shadow-sm relative border-l-4 border-l-amber-500 cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">TRIAL</span>
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Trial Organizations</span>
            <h3 className="text-xl font-bold text-slate-950 tracking-tight mt-1">{stats?.organizations.trial ?? 0}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Expiring this week: {Math.max(0, (stats?.organizations.trial ?? 0) - 1)}</p>
          </div>
        </Card>

        {/* Pending Verification */}
        <Card onClick={() => router.push('/admin/schools')} className="p-5 flex flex-col justify-between min-h-36 bg-white border-slate-200 hover:shadow-md transition duration-200 shadow-sm relative border-l-4 border-l-orange-500 cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <Link href="/admin/schools" onClick={(e) => e.stopPropagation()} className="text-[10px] font-bold text-orange-600 hover:underline">
              Review Now
            </Link>
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Verification</span>
            <h3 className="text-xl font-bold text-slate-950 tracking-tight mt-1">{stats?.marketplace.pendingVerification ?? 0}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Schools awaiting approval</p>
          </div>
        </Card>

        {/* Platform Leads */}
        <Card onClick={() => router.push('/admin/orgs')} className="p-5 flex flex-col justify-between min-h-36 bg-white border-slate-200 hover:shadow-md transition duration-200 shadow-sm relative border-l-4 border-l-blue-500 cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Leads (Platform)</span>
            <h3 className="text-xl font-bold text-slate-950 tracking-tight mt-1">{stats?.crm.totalLeads ?? 0}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Across all schools</p>
          </div>
        </Card>

        {/* Total Admissions */}
        <Card onClick={() => router.push('/admin/orgs')} className="p-5 flex flex-col justify-between min-h-36 bg-white border-slate-200 hover:shadow-md transition duration-200 shadow-sm relative border-l-4 border-l-emerald-500 cursor-pointer">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Admissions</span>
            <h3 className="text-xl font-bold text-slate-950 tracking-tight mt-1">{stats?.crm.totalAdmissions ?? 0}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Across all schools</p>
          </div>
        </Card>
      </section>

      {/* Revenue Trend Chart Section */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
              Revenue Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Successful payments — last 6 months</p>
          </div>
        </div>

        {/* Lightweight responsive SVG Bar Chart */}
        <div className="relative w-full h-64 border-b border-l border-slate-100 pl-2 pb-2">
          <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
            {/* Draw Y-axis gridlines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, index) => {
              const yVal = 220 - ratio * 200
              return (
                <g key={index}>
                  <line x1="0" y1={yVal} x2="600" y2={yVal} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="5" y={yVal - 4} fill="#94a3b8" fontSize="8" fontWeight="bold">
                    {formatCurrency((maxVal * ratio))}
                  </text>
                </g>
              )
            })}

            {/* Draw bars */}
            {chartData.map((d, index) => {
              const numBars = chartData.length
              const spacing = 600 / numBars
              const barWidth = Math.min(32, spacing * 0.5)
              const xPos = index * spacing + (spacing - barWidth) / 2
              const barHeight = (d.val / maxVal) * 190
              const yPos = 220 - barHeight
              const isHovered = hoveredBar === index

              return (
                <g key={index}>
                  <rect
                    x={xPos}
                    y={yPos}
                    width={barWidth}
                    height={barHeight}
                    fill={isHovered ? '#1565D8' : '#60a5fa'}
                    rx="4"
                    ry="4"
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                  {/* Month/label text */}
                  <text x={xPos + barWidth / 2} y="235" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">
                    {d.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Interactive HTML Tooltip overlay */}
          {hoveredBar !== null && (
            <div
              className="absolute bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs font-bold border border-slate-800 z-10"
              style={{
                left: `${(hoveredBar * (100 / chartData.length)) + 5}%`,
                bottom: '50px'
              }}
            >
              <div className="text-slate-400 text-[10px] uppercase font-bold">{chartData[hoveredBar].label}</div>
              <div className="text-sm mt-0.5">{formatCurrency(chartData[hoveredBar].val)}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Two Column Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Column: Recent Signups */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Recently Joined
              </h3>
              <Link href="/admin/orgs" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {stats?.recentActivity.organizations && stats.recentActivity.organizations.length > 0 ? (
                stats.recentActivity.organizations.slice(0, 5).map((org: any) => (
                  <div key={org.id} className="py-3.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        {org.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">{org.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span className="capitalize">{org.institutionType.toLowerCase().replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{getTimeAgo(org.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 uppercase">
                        {org.plan?.slug || 'free'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        org.status === 'ACTIVE' ? 'bg-green-150 text-green-800' : 'bg-amber-150 text-amber-800'
                      }`}>
                        {org.status}
                      </span>
                      <Link href={`/admin/orgs/${org.id}`} className="text-xs font-bold text-blue-600 hover:underline pl-2">
                        View
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">No organizations joined recently</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pending Actions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Requires Action
                {activeActionsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </h3>
            </div>

            <div className="space-y-4">
              {actionItems.length > 0 ? (
                actionItems.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 ${item.color} shrink-0`} />
                      <span className="text-xs font-semibold text-slate-700 leading-tight">{item.desc}</span>
                    </div>
                    <Link href={item.link}>
                      <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 shrink-0 uppercase tracking-wider">
                        {item.btnText}
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">All caught up! 🎉</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Health Row */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Platform Health</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Clock className={`w-5 h-5 ${(stats?.ops.dbLatencyMs ?? 0) < 800 ? 'text-green-500' : 'text-amber-500'}`} />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Data Response Time</div>
              <div className="text-sm font-bold text-slate-900">{stats?.ops.dbLatencyMs ?? 0}ms</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Activity className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Active Organizations</div>
              <div className="text-sm font-bold text-slate-900">{stats?.ops.activeOrgs ?? 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <AlertTriangle className={`w-5 h-5 ${(stats?.ops.failedPaymentsThisWeek ?? 0) === 0 ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Failed Payments (7d)</div>
              <div className="text-sm font-bold text-slate-900">{stats?.ops.failedPaymentsThisWeek ?? 0}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
