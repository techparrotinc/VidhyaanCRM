'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Sparkles, MessageSquare, IndianRupee, ThumbsDown, AlertTriangle, Gauge, Activity } from 'lucide-react'
import { fetcher } from '@/lib/fetcher'

type Trace = {
  traceId: string
  orgName: string
  promptRedacted: string
  retrievedChunkIds: string[]
  routingDecision: {
    provider?: string
    model?: string
    topScore?: number
    toolsCalled?: string[]
    declined?: boolean
    latencyMs?: number
    role?: string
  } | null
  createdAt: string
}

type Metrics = {
  windowDays: number
  answers: number
  latencyMs: { p50: number; p95: number; avg: number }
  feedback: { up: number; down: number; negativeRate: number }
  declineRate: number
  gapSignals: number
  providerMix: { provider: string; count: number }[]
  recentTraces: Trace[]
}

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
  const { data: metrics } = useSWR<Metrics>('/api/admin/ai-metrics', fetcher, { refreshInterval: 60_000 })
  const [openTrace, setOpenTrace] = useState<string | null>(null)
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

      {/* Quality & health (7-day rolling) */}
      {metrics && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#1565D8]" />
            <h2 className="text-sm font-bold text-slate-900">Answer Quality & Health</h2>
            <span className="text-xs font-normal text-slate-400">last {metrics.windowDays} days · {metrics.answers} answers</span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
            <Stat label="Latency P50" value={`${(metrics.latencyMs.p50 / 1000).toFixed(1)}s`} />
            <Stat label="Latency P95" value={`${(metrics.latencyMs.p95 / 1000).toFixed(1)}s`} warn={metrics.latencyMs.p95 > 8000} />
            <Stat label="Negative Rate" value={`${(metrics.feedback.negativeRate * 100).toFixed(0)}%`} warn={metrics.feedback.negativeRate > 0.15} />
            <Stat label="Decline Rate" value={`${(metrics.declineRate * 100).toFixed(0)}%`} warn={metrics.declineRate > 0.25} />
            <Stat label="Gap Signals" value={String(metrics.gapSignals)} />
            <Stat
              label="Provider Mix"
              value={metrics.providerMix.map((p) => `${p.provider}:${p.count}`).join(' ') || '—'}
              small
            />
          </div>

          {/* recent traces */}
          <div className="mt-2">
            <div className="flex items-center gap-2 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <Activity className="h-3.5 w-3.5" /> Recent traces
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-100">
              {metrics.recentTraces.length === 0 && (
                <p className="p-4 text-sm text-slate-400">No traces yet.</p>
              )}
              {metrics.recentTraces.map((t) => {
                const r = t.routingDecision ?? {}
                const open = openTrace === t.traceId
                return (
                  <div key={t.traceId} className="border-b border-slate-50 last:border-0">
                    <button
                      onClick={() => setOpenTrace(open ? null : t.traceId)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="w-14 shrink-0 text-xs font-mono text-slate-400">
                        {r.provider?.slice(0, 6) ?? '—'}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{t.promptRedacted}</span>
                      {r.declined && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          declined
                        </span>
                      )}
                      {r.toolsCalled && r.toolsCalled.length > 0 && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#1565D8]">
                          tools
                        </span>
                      )}
                      <span className="w-12 shrink-0 text-right text-xs text-slate-400">
                        {r.latencyMs ? `${(r.latencyMs / 1000).toFixed(1)}s` : ''}
                      </span>
                    </button>
                    {open && (
                      <div className="space-y-1 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-600">
                        <div><span className="font-semibold text-slate-500">Org:</span> {t.orgName}</div>
                        <div><span className="font-semibold text-slate-500">Model:</span> {r.model ?? '—'} · role {r.role ?? '—'} · top score {r.topScore ?? '—'}</div>
                        <div><span className="font-semibold text-slate-500">Retrieved:</span> {t.retrievedChunkIds.join(', ') || 'none'}</div>
                        {r.toolsCalled && r.toolsCalled.length > 0 && (
                          <div><span className="font-semibold text-slate-500">Tools:</span> {r.toolsCalled.join(', ')}</div>
                        )}
                        <div className="text-slate-400">{new Date(t.createdAt).toLocaleString('en-IN')} · trace {t.traceId.slice(0, 8)}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

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

function Stat({ label, value, warn, small }: { label: string; value: string; warn?: boolean; small?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-450">{label}</div>
      <div
        className={`mt-1 font-bold leading-none tracking-tight ${small ? 'text-xs' : 'text-lg'} ${
          warn ? 'text-red-500' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
