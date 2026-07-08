"use client"

import React, { useState, useEffect } from 'react'
import { Loader2, IndianRupee } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Metrics {
  lifetimeRevenue: number
  subscriptionRevenue: number
  addonRevenue: Record<string, number>
  mrr: number
  arr: number
  studentCount: number
  activeSubscriptions: {
    id: string
    plan: string
    billingCycle: string
    amount: number
    discountPct: number
    currentPeriodEnd: string | null
  }[]
  wallets: { channel: string; freeRemaining: number; purchasedBalance: number }[]
  trend: { month: string; revenue: number }[]
  transactions: {
    id: string
    amount: number
    status: string
    type: string
    paidAt: string | null
    createdAt: string
  }[]
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function OrgRevenueMetrics({ orgId }: { orgId: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/organizations/${orgId}/metrics`)
        if (!res.ok) throw new Error('Failed to fetch revenue metrics')
        setMetrics(await res.json())
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Error loading metrics')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgId])

  if (loading) {
    return (
      <Card className="p-5 bg-white border-slate-200 shadow-sm flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      </Card>
    )
  }
  if (error || !metrics) {
    return (
      <Card className="p-5 bg-white border-slate-200 shadow-sm">
        <div className="text-xs font-semibold text-red-500">{error || 'No metrics available'}</div>
      </Card>
    )
  }

  const maxTrend = Math.max(...metrics.trend.map((t) => t.revenue), 1)
  const addonTotal = Object.values(metrics.addonRevenue).reduce((a, b) => a + b, 0)

  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <IndianRupee className="w-3.5 h-3.5 text-blue-500" /> Revenue Metrics
      </h3>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Lifetime Revenue', value: formatINR(metrics.lifetimeRevenue) },
          { label: 'MRR', value: formatINR(metrics.mrr) },
          { label: 'ARR (run-rate)', value: formatINR(metrics.arr) },
          { label: 'Active Students', value: metrics.studentCount.toLocaleString('en-IN') }
        ].map((kpi) => (
          <div key={kpi.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[9px] font-bold text-slate-400 uppercase">{kpi.label}</div>
            <div className="text-sm font-black text-slate-900 mt-0.5 tabular-nums">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Split: subscription vs add-ons */}
      <div className="text-xs font-semibold text-slate-600 space-y-1.5 pt-1">
        <div className="flex justify-between">
          <span>Subscription revenue:</span>
          <span className="text-slate-900 font-bold tabular-nums">{formatINR(metrics.subscriptionRevenue)}</span>
        </div>
        <div className="flex justify-between">
          <span>Add-on revenue (SMS / WA / AI):</span>
          <span className="text-slate-900 font-bold tabular-nums">{formatINR(addonTotal)}</span>
        </div>
        {addonTotal > 0 && (
          <div className="flex gap-2 flex-wrap pt-0.5">
            {Object.entries(metrics.addonRevenue)
              .filter(([, v]) => v > 0)
              .map(([channel, v]) => (
                <span key={channel} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 tabular-nums">
                  {channel} {formatINR(v)}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* 12-month trend */}
      <div className="pt-1">
        <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Revenue — last 12 months</div>
        <div className="flex items-end gap-1 h-16">
          {metrics.trend.map((t) => {
            const monthIdx = Number(t.month.split('-')[1]) - 1
            return (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${t.month}: ${formatINR(t.revenue)}`}>
                <div
                  className={`w-full rounded-t-sm ${t.revenue > 0 ? 'bg-blue-500' : 'bg-slate-100'}`}
                  style={{ height: `${Math.max(4, (t.revenue / maxTrend) * 52)}px` }}
                />
                <span className="text-[8px] font-bold text-slate-400 truncate">{MONTH_LABELS[monthIdx]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Wallets */}
      {metrics.wallets.length > 0 && (
        <div className="pt-1">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Credit Wallets</div>
          <div className="grid grid-cols-3 gap-2">
            {metrics.wallets.map((w) => (
              <div key={w.channel} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">{w.channel}</div>
                <div className="text-xs font-black text-slate-900 tabular-nums mt-0.5">{w.purchasedBalance + w.freeRemaining}</div>
                <div className="text-[8px] font-semibold text-slate-400">{w.freeRemaining} free</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="pt-1">
        <div className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Recent Transactions</div>
        {metrics.transactions.length === 0 ? (
          <div className="text-xs font-semibold text-slate-400">No transactions yet.</div>
        ) : (
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            {metrics.transactions.map((t) => (
              <div key={t.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-700 truncate">{t.type}</div>
                  <div className="text-[9px] text-slate-400 font-semibold">
                    {new Date(t.paidAt ?? t.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <div className={`font-black tabular-nums ${t.status === 'SUCCESS' ? 'text-slate-900' : 'text-slate-400'}`}>
                    {formatINR(t.amount)}
                  </div>
                  <div className={`text-[9px] font-bold ${t.status === 'SUCCESS' ? 'text-emerald-600' : t.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>
                    {t.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
