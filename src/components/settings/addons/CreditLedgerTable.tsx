'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { format } from 'date-fns'

type LedgerEntry = {
  id: string
  delta: number
  reason: string
  note: string | null
  createdAt: string
}

type LedgerResponse = {
  success: boolean
  data: LedgerEntry[]
  pagination: { total: number; totalPages: number }
}

const REASON_LABEL: Record<string, { label: string; badge: string }> = {
  FREE_GRANT: { label: 'Free credits', badge: 'bg-green-50 text-green-700' },
  SEND: { label: 'Messages sent', badge: 'bg-slate-100 text-slate-600' },
  SEND_REFUND: { label: 'Failed-send refund', badge: 'bg-amber-50 text-amber-700' },
  PURCHASE: { label: 'Purchase', badge: 'bg-blue-50 text-blue-700' },
  ADMIN_ADJUST: { label: 'Allowance change', badge: 'bg-purple-50 text-purple-700' }
}

export default function CreditLedgerTable({ channel }: { channel: 'SMS' | 'WHATSAPP' | 'AI' }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<LedgerResponse>(
    `/api/v1/settings/addons/messaging/${channel.toLowerCase()}/ledger?page=${page}&limit=10`,
    fetcher
  )

  const entries = data?.data ?? []
  const totalPages = data?.pagination?.totalPages ?? 1

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Credit History
        </h4>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="p-6 text-sm text-slate-400 text-center">No credit activity yet.</p>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {entries.map(e => {
              const reason = REASON_LABEL[e.reason] ?? { label: e.reason, badge: 'bg-slate-100 text-slate-600' }
              return (
                <div key={e.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="min-w-0">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${reason.badge}`}>
                      {reason.label}
                    </span>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {format(new Date(e.createdAt), 'd MMM yyyy, h:mm a')}
                    </p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${e.delta >= 0 ? 'text-green-600' : 'text-slate-800'}`}>
                    {e.delta >= 0 ? '+' : ''}{e.delta.toLocaleString('en-IN')}
                  </span>
                </div>
              )
            })}
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
