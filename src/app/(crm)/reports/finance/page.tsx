'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { KpiCard, KpiCardSkeleton } from '@/components/reports/KpiCard'
import { AttentionStrip, AttentionItem } from '@/components/reports/AttentionStrip'
import { ChartCard, ChartCardSkeleton, WidgetError } from '@/components/reports/ChartCard'
import { FeeTrendChart, AgeingChart, MethodDonut } from '@/components/reports/charts'
import { formatINR, formatINRFull, formatPct, deltaPct } from '@/components/reports/format'
import { BranchFilter } from '@/components/reports/BranchFilter'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Wallet, Receipt, Percent, Hourglass, AlertCircle } from 'lucide-react'

type FinanceData = {
  kpis: {
    billedMTD: { value: number; invoices: number }
    collectedMTD: { value: number; payments: number; prev: number }
    collectionRate: number | null
    outstanding: { value: number }
    overdue: { value: number }
  }
  ageing: { bucket: string; count: number; amount: number }[]
  trend: { month: string; billed: number; collected: number }[]
  methodMix: { method: string; amount: number; count: number }[]
  concessions: { amountMTD: number; countMTD: number }
  todaysReceipts: {
    id: string
    receiptNumber: string
    amount: string
    method: string
    paidAt: string
    student: { name: string; gradeLabel: string | null } | null
    invoice: { invoiceNumber: string }
  }[]
  attention: AttentionItem[]
}

export default function FinanceDashboard() {
  const [branch, setBranch] = useState('')
  const finUrl = `/api/v1/reports/dashboards/finance${branch ? `?branch=${branch}` : ''}`
  const { data, error, isLoading, mutate } = useSWR<{ data: FinanceData }>(finUrl, fetcher, { revalidateOnFocus: false })
  const [refreshing, setRefreshing] = useState(false)
  const refresh = async () => {
    setRefreshing(true)
    try {
      await mutate(async () => (await fetch(`${finUrl}${branch ? '&' : '?'}fresh=1`)).json(), { revalidate: false })
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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance Dashboard</h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500">
            Collections, outstanding dues and today’s receipts
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={refresh} disabled={refreshing} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-300 disabled:opacity-50" aria-label="Refresh" title="Refresh (bypass cache)">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <BranchFilter value={branch} onChange={setBranch} />
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
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              icon={Wallet}
              tone="green"
              label="Collected (MTD)"
              value={formatINR(d.kpis.collectedMTD.value)}
              delta={deltaPct(d.kpis.collectedMTD.value, d.kpis.collectedMTD.prev)}
              caption={`${d.kpis.collectedMTD.payments} payments · vs last month`}
              href="/fee-management"
            />
            <KpiCard
              icon={Receipt}
              tone="blue"
              label="Billed (MTD)"
              value={formatINR(d.kpis.billedMTD.value)}
              caption={`${d.kpis.billedMTD.invoices} invoices`}
              href="/fee-management"
            />
            <KpiCard
              icon={Percent}
              tone="violet"
              label="Collection Rate"
              value={formatPct(d.kpis.collectionRate)}
              caption="collected ÷ billed this month"
            />
            <KpiCard
              icon={Hourglass}
              tone="amber"
              label="Outstanding"
              value={formatINR(d.kpis.outstanding.value)}
              caption="all open invoices"
              href="/fee-management?status=UNPAID"
            />
            <KpiCard
              icon={AlertCircle}
              tone="rose"
              label="Overdue"
              value={formatINR(d.kpis.overdue.value)}
              caption="past due date"
              href="/fee-management?status=OVERDUE"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Overdue Ageing"
              subtitle="Outstanding amount by days overdue"
              empty={d.ageing.every(b => b.amount === 0)}
              emptyMessage="Nothing overdue — clean book"
            >
              <AgeingChart data={d.ageing} />
            </ChartCard>

            <ChartCard
              title="Collection Trend"
              subtitle="Billed vs collected, last 12 months"
              empty={d.trend.length === 0}
              emptyMessage="Trend data builds up nightly — check back tomorrow"
            >
              <FeeTrendChart data={d.trend} />
            </ChartCard>

            <ChartCard
              title="Payment Methods (MTD)"
              empty={d.methodMix.length === 0}
              emptyMessage="No payments recorded this month"
            >
              <MethodDonut data={d.methodMix} />
            </ChartCard>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Concessions (MTD)
                </h3>
                <p className="text-[32px] font-bold tracking-tight text-slate-900 leading-none">
                  {formatINR(d.concessions.amountMTD)}
                </p>
                <p className="mt-2 text-xs font-normal text-slate-400">
                  {d.concessions.countMTD} concession{d.concessions.countMTD === 1 ? '' : 's'} granted this month
                </p>
              </div>

              <ChartCard
                title="Today’s Receipts"
                empty={d.todaysReceipts.length === 0}
                emptyMessage="No payments received yet today"
              >
                <div className="space-y-2 overflow-x-auto">
                  {d.todaysReceipts.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {r.student?.name ?? r.invoice.invoiceNumber}
                          {r.student?.gradeLabel ? (
                            <span className="text-slate-400 font-normal"> · {r.student.gradeLabel}</span>
                          ) : null}
                        </p>
                        <p className="text-xs font-normal text-slate-400">
                          {r.receiptNumber} · {r.method.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 shrink-0">
                        {formatINRFull(Number(r.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
