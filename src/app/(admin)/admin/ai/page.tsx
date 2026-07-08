'use client'

import useSWR from 'swr'
import { Sparkles, MessageSquare, IndianRupee, ThumbsDown, AlertTriangle } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'

type Row = {
  orgId: string
  orgName: string
  messages: number
  inputTokens: number
  outputTokens: number
  llmCostUsd: number
  conversations: number
  gapSignals: number
  thumbsUp: number
  thumbsDown: number
  lastActivity: string | null
  creditsUsed: number
  creditsPurchased: number
  creditsBalance: number | null
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function AdminAiUsagePage() {
  const { data, isLoading } = useSWR<{ rows: Row[] }>('/api/admin/ai-usage', fetcher)
  const rows = data?.rows ?? []

  const totals = rows.reduce(
    (t, r) => ({
      messages: t.messages + r.messages,
      costUsd: t.costUsd + r.llmCostUsd,
      creditsUsed: t.creditsUsed + r.creditsUsed,
      creditsPurchased: t.creditsPurchased + r.creditsPurchased,
      thumbsDown: t.thumbsDown + r.thumbsDown,
      gaps: t.gaps + r.gapSignals
    }),
    { messages: 0, costUsd: 0, creditsUsed: 0, creditsPurchased: 0, thumbsDown: 0, gaps: 0 }
  )
  // revenue approximation: purchased credits at the blended ₹0.50/credit pack rate
  const approxRevenue = totals.creditsPurchased * 0.5
  const approxCostInr = totals.costUsd * 84

  const cards = [
    { label: 'AI Messages', value: totals.messages.toLocaleString('en-IN'), icon: MessageSquare },
    { label: 'Credits Used', value: totals.creditsUsed.toLocaleString('en-IN'), icon: Sparkles },
    { label: 'Est. Revenue (purchased)', value: inr(approxRevenue), icon: IndianRupee },
    { label: 'LLM Cost', value: inr(approxCostInr), icon: IndianRupee },
    { label: 'Knowledge Gaps', value: totals.gaps.toLocaleString('en-IN'), icon: AlertTriangle },
    { label: 'Negative Feedback', value: totals.thumbsDown.toLocaleString('en-IN'), icon: ThumbsDown }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Copilot Usage</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500">
          Adoption, economics and answer quality per organisation.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <c.icon className="h-3.5 w-3.5" />
              {c.label}
            </div>
            <div className="mt-2 text-[24px] font-bold leading-none tracking-tight text-slate-900">
              {isLoading ? '…' : c.value}
            </div>
          </div>
        ))}
      </div>

      {/* per-org table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3 text-right">Messages</th>
              <th className="px-4 py-3 text-right">Conversations</th>
              <th className="px-4 py-3 text-right">Credits Used</th>
              <th className="px-4 py-3 text-right">Purchased</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-right">LLM Cost</th>
              <th className="px-4 py-3 text-right">👍 / 👎</th>
              <th className="px-4 py-3 text-right">Gaps</th>
              <th className="px-4 py-3 text-right">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  No AI usage yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.orgId} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{r.orgName}</td>
                <td className="px-4 py-3 text-right">{r.messages.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right">{r.conversations.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right">{r.creditsUsed.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right">{r.creditsPurchased.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right">{r.creditsBalance ?? '—'}</td>
                <td className="px-4 py-3 text-right">₹{(r.llmCostUsd * 84).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-green-600">{r.thumbsUp}</span>
                  {' / '}
                  <span className={r.thumbsDown > 0 ? 'text-red-500' : ''}>{r.thumbsDown}</span>
                </td>
                <td className="px-4 py-3 text-right">{r.gapSignals}</td>
                <td className="px-4 py-3 text-right text-xs font-normal text-slate-400">
                  {r.lastActivity
                    ? new Date(r.lastActivity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
