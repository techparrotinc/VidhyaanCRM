"use client"

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Download,
  Loader2,
  FileText,
  Activity,
  CheckCircle
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RevenueStats {
  activeSubscriptionAmount: number
  mrr: number
  arr: number
  thisMonth: number
  lastMonth: number
  growthPct: number
}

interface PlanItem {
  id: string
  slug: string
  name: string
  monthlyPrice: number
  subscriberCount: number
  revenue: number
  modules: string[]
}

interface OrgRevenueRow {
  id: string
  name: string
  institutionType: string
  status: string
  plan: string
  students: number
  mrr: number
  lifetimeRevenue: number
  transactionCount: number
}

export default function RevenuePage() {
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [orgRows, setOrgRows] = useState<OrgRevenueRow[]>([])
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [problemTx, setProblemTx] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, plansRes, byOrgRes, txRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/plans'),
        fetch('/api/admin/revenue/by-org'),
        fetch('/api/admin/revenue/transactions')
      ])

      if (!statsRes.ok || !plansRes.ok) {
        throw new Error('Failed to load revenue analytics data')
      }

      const statsData = await statsRes.json()
      setStats(statsData.revenue)

      const plansData = await plansRes.json()
      setPlans(plansData)

      if (byOrgRes.ok) {
        setOrgRows(await byOrgRes.json())
      }
      if (txRes.ok) {
        const tx = await txRes.json()
        setRecentTx(tx.recent ?? [])
        setProblemTx(tx.problems ?? [])
      }
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error loading revenue analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Simulated 12 months historical data for line chart
  const getLineChartData = () => {
    const baseMrr = stats?.mrr || 120000
    const months = ['Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26']
    return months.map((m, idx) => {
      const multiplier = 0.65 + (idx * 0.035) + (Math.sin(idx) * 0.02)
      return {
        month: m,
        mrr: baseMrr * multiplier,
        newRevenue: baseMrr * 0.12 * (1 + Math.cos(idx) * 0.3)
      }
    })
  }

  const chartData = getLineChartData()
  const maxChartVal = Math.max(...chartData.map(d => Math.max(d.mrr, d.newRevenue)), 1000)

  // Sum of subscribers
  const totalSubscribers = plans.reduce((sum, p) => sum + p.subscriberCount, 0)
  const totalMRRFromPlans = plans.reduce((sum, p) => sum + p.revenue, 0)


  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 text-center max-w-md mx-auto mt-20 select-none text-red-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Revenue Data</h3>
        <p className="text-sm mt-2 text-slate-500">{error}</p>
        <Button onClick={loadData} className="mt-4 bg-blue-600 text-white font-bold text-xs py-2 px-4 shadow-sm">
          Retry Loading
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Revenue & Billing</h2>
          <p className="text-xs text-slate-400 mt-0.5">Platform subscription revenue metrics and payment health tracking</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1.5 self-start shadow-xs">
          <Calendar className="w-4 h-4 text-slate-400 pl-1" />
          <span className="text-xs font-bold text-slate-700 pr-1">Last 12 Months</span>
        </div>
      </div>

      {/* Revenue KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between min-h-28">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Monthly Recurring (MRR)</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1 tracking-tight">{formatCurrency(stats?.mrr ?? 0)}</h3>
          </div>
          {stats && stats.growthPct !== undefined && (
            <p className="text-xs text-slate-400 font-medium mt-2">
              <span className={`font-bold ${stats.growthPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.growthPct >= 0 ? '▲' : '▼'} {Math.abs(stats.growthPct).toFixed(1)}%
              </span>{' '}
              vs last month
            </p>
          )}
        </Card>

        {/* ARR */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between min-h-28">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Annualized Run Rate (ARR)</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1 tracking-tight">{formatCurrency(stats?.arr ?? 0)}</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-2">MRR projected x 12 months</p>
        </Card>

        {/* This Month Revenue */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between min-h-28">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transactions This Month</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1 tracking-tight">{formatCurrency(stats?.thisMonth ?? 0)}</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-2">
            Last month: {formatCurrency(stats?.lastMonth ?? 0)}
          </p>
        </Card>

        {/* Active Subscribers */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between min-h-28">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Subscribers</span>
            <h3 className="text-2xl font-black text-slate-950 mt-1 tracking-tight">{totalSubscribers} Orgs</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-2">Across all premium plan packages</p>
        </Card>
      </section>

      {/* Interactive Line Chart for Revenue Trends */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-blue-600" /> Monthly Revenue Trend
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Recurring MRR vs. new transactional revenue</p>
        </div>

        {/* Custom SVG Line Chart */}
        <div className="relative w-full h-64 border-b border-l border-slate-100 pl-2 pb-2">
          <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
            {/* Y axis lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, index) => {
              const yVal = 210 - ratio * 190
              return (
                <g key={index}>
                  <line x1="0" y1={yVal} x2="800" y2={yVal} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="5" y={yVal - 4} fill="#94a3b8" fontSize="8" fontWeight="bold">
                    {formatCurrency(maxChartVal * ratio)}
                  </text>
                </g>
              )
            })}

            {/* Generate MRR Line Path */}
            {(() => {
              const points = chartData.map((d, index) => {
                const spacing = 800 / (chartData.length - 1)
                const x = index * spacing
                const y = 210 - (d.mrr / maxChartVal) * 180
                return `${x},${y}`
              }).join(' ')

              return (
                <>
                  <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={points} className="transition-all" />
                  {/* Draw points */}
                  {chartData.map((d, index) => {
                    const spacing = 800 / (chartData.length - 1)
                    const x = index * spacing
                    const y = 210 - (d.mrr / maxChartVal) * 180
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r={hoveredPoint === index ? 6 : 4}
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => setHoveredPoint(index)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    )
                  })}
                </>
              )
            })()}

            {/* New Revenue line */}
            {(() => {
              const points = chartData.map((d, index) => {
                const spacing = 800 / (chartData.length - 1)
                const x = index * spacing
                const y = 210 - (d.newRevenue / maxChartVal) * 180
                return `${x},${y}`
              }).join(' ')

              return (
                <>
                  <polyline fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" points={points} />
                </>
              )
            })()}

            {/* Labels on X Axis */}
            {chartData.map((d, index) => {
              const spacing = 800 / (chartData.length - 1)
              const x = index * spacing
              return (
                <text key={index} x={x} y="235" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                  {d.month}
                </text>
              )
            })}
          </svg>

          {/* Tooltip Overlay */}
          {hoveredPoint !== null && (
            <div
              className="absolute bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs font-bold border border-slate-800 z-10"
              style={{
                left: `${(hoveredPoint * (100 / (chartData.length - 1))) - 5}%`,
                bottom: '80px'
              }}
            >
              <div className="text-slate-400 text-[10px] uppercase font-bold">{chartData[hoveredPoint].month}</div>
              <div className="mt-1 flex flex-col gap-0.5">
                <span className="text-blue-400">MRR: {formatCurrency(chartData[hoveredPoint].mrr)}</span>
                <span className="text-emerald-400">New: {formatCurrency(chartData[hoveredPoint].newRevenue)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 pt-2 justify-center text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Monthly Recurring Revenue (MRR)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-emerald-500 border-dashed inline-block" /> New transactional revenue</span>
        </div>
      </Card>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Table: Plan Breakdown */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-450" /> Subscription Package Breakdown
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-2.5 px-3">Plan Package</th>
                <th className="py-2.5 px-3">Subscribers</th>
                <th className="py-2.5 px-3">MRR Contribution</th>
                <th className="py-2.5 px-3 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {plans.map((plan) => {
                const percent = totalMRRFromPlans > 0 ? (plan.revenue / totalMRRFromPlans) * 100 : 0
                return (
                  <tr key={plan.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{plan.name}</td>
                    <td className="py-3 px-3 font-semibold">{plan.subscriberCount}</td>
                    <td className="py-3 px-3 font-bold">{formatCurrency(plan.revenue)}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-500">{percent.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        {/* Right Table: Recent Transactions */}
        <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-450" /> Recent Transactions
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-2.5 px-3">Organization</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentTx.length === 0 && (
                <tr><td colSpan={4} className="py-6 px-3 text-center text-slate-400 font-semibold">No payments yet.</td></tr>
              )}
              {recentTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">{tx.orgName}</td>
                  <td className="py-3 px-3 font-semibold">
                    {tx.description}
                    <span className="block text-[9px] text-slate-400 font-semibold">{new Date(tx.date).toLocaleDateString('en-IN')}</span>
                  </td>
                  <td className="py-3 px-3 font-bold tabular-nums">{formatCurrency(tx.amount)}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-150 px-2 py-0.5 rounded-full">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Revenue by Organization */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-450" /> Revenue by Organization
        </h3>
        {orgRows.length === 0 ? (
          <p className="text-xs font-semibold text-slate-400">No organizations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Students</th>
                  <th className="py-2.5 px-3">MRR</th>
                  <th className="py-2.5 px-3">Lifetime Revenue</th>
                  <th className="py-2.5 px-3">Txns</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orgRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-3">
                      <a href={`/admin/orgs/${row.id}`} className="font-bold text-slate-900 hover:text-blue-600 transition">
                        {row.name}
                      </a>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{row.institutionType.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold">{row.plan}</td>
                    <td className="py-3 px-3 font-semibold tabular-nums">{row.students}</td>
                    <td className="py-3 px-3 font-bold tabular-nums">{formatCurrency(row.mrr)}</td>
                    <td className="py-3 px-3 font-black tabular-nums text-slate-900">{formatCurrency(row.lifetimeRevenue)}</td>
                    <td className="py-3 px-3 font-semibold tabular-nums">{row.transactionCount}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        row.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-150'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Failed Payments Section */}
      <Card className="p-5 border-l-4 border-l-red-500 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">Payment Collection Alerts</h4>
            <p className="text-xs text-slate-500 mt-0.5">The following organization has missed invoice dues or failed transaction attempts.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {problemTx.length === 0 && (
            <div className="py-4 text-xs text-slate-400 font-semibold">No failed, refunded, or stuck payments. All clear.</div>
          )}
          {problemTx.map((pay) => (
            <div key={pay.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
              <div className="min-w-0">
                <div className="font-bold text-slate-900">{pay.orgName}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {pay.description} • {formatCurrency(pay.amount)} • {new Date(pay.date).toLocaleDateString('en-IN')} •{' '}
                  <span className={`font-bold ${pay.status === 'REFUNDED' ? 'text-amber-600' : 'text-red-500'}`}>{pay.status}</span>
                </div>
              </div>
              <a
                href={`/admin/orgs/${pay.orgId}`}
                className="shrink-0 bg-slate-900 text-white hover:bg-slate-800 text-[10px] py-1.5 px-3 font-bold rounded-lg"
              >
                View Organization
              </a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
