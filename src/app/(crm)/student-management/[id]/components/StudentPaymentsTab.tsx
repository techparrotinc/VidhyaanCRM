'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Receipt } from 'lucide-react'

type PaymentRow = {
  id: string
  receiptNumber: string
  amount: number
  method: string
  status: string
  paidAt: string | null
  createdAt: string
  invoice: {
    id: string
    invoiceNumber: string
  } | null
}

type PaymentsResponse = {
  success: boolean
  data: PaymentRow[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const PAYMENT_STATUS_BADGE: Record<string, { label: string; badge: string }> = {
  SUCCESS: { label: 'Success', badge: 'bg-green-50 text-green-700' },
  PENDING: { label: 'Pending', badge: 'bg-amber-50 text-amber-700' },
  FAILED: { label: 'Failed', badge: 'bg-red-50 text-red-700' },
  REFUNDED: { label: 'Refunded', badge: 'bg-purple-50 text-purple-700' }
}

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  ONLINE: 'Online',
  RAZORPAY: 'Razorpay'
}

export default function StudentPaymentsTab({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useSWR<PaymentsResponse>(
    `/api/v1/fees/payments?studentId=${studentId}&page=${page}&limit=25`,
    fetcher
  )

  const payments = data?.data ?? []
  const total = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded animate-pulse mb-2" />
        ))}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 shadow-sm flex flex-col items-center gap-2">
        <Receipt className="w-8 h-8 text-slate-300" />
        <p className="text-sm text-slate-400">No payments recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Receipt', 'Invoice', 'Amount', 'Method', 'Status', 'Paid On'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map(p => {
              const status = PAYMENT_STATUS_BADGE[p.status] ?? {
                label: p.status,
                badge: 'bg-slate-100 text-slate-600'
              }
              return (
                <tr
                  key={p.id}
                  onClick={() => p.invoice && router.push(`/fee-management/${p.invoice.id}`)}
                  className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${p.invoice ? 'cursor-pointer' : ''}`}>
                  <td className="px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-800 font-mono">
                      {p.receiptNumber}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-sm text-slate-600 font-mono">
                      {p.invoice?.invoiceNumber ?? '—'}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-sm font-bold text-slate-900">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {METHOD_LABEL[p.method] ?? p.method}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.badge}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {p.paidAt
                        ? format(new Date(p.paidAt), 'd MMM yyyy, h:mm a')
                        : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500 flex-shrink-0">
          Showing {payments.length === 0
            ? '0'
            : `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)}`
          } of {total} payments
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
            Previous
          </button>
          <span className="w-8 h-8 flex items-center justify-center bg-[#1565D8] text-white text-sm font-semibold rounded-lg">
            {page}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
