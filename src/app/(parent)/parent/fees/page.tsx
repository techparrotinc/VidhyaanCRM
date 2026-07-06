'use client'

import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Receipt, FileText, Download } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import PayDialog, { type PayableInvoice } from '@/components/parent/fees/PayDialog'

type InvoiceRow = PayableInvoice & {
  gradeLabel: string | null
  totalAmount: number
  paidAmount: number
  dueDate: string | null
  status: string
  payable: boolean
}

type PaymentRow = {
  id: string
  receiptNumber: string
  invoiceId: string
  invoiceNumber: string
  studentName: string | null
  schoolName: string | null
  amount: number
  refundedAmount: number
  method: string
  status: string
  paidAt: string | null
}

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PARTIALLY_PAID: 'bg-blue-50 text-blue-700',
  UNPAID: 'bg-slate-100 text-slate-600',
  OVERDUE: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-amber-50 text-amber-700'
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ParentFeesPage() {
  const invoicesRes = useSWR<{ data: { invoices: InvoiceRow[] } }>('/api/v1/parent/fees/invoices', fetcher)
  const paymentsRes = useSWR<{ data: { payments: PaymentRow[] } }>('/api/v1/parent/fees/payments', fetcher)
  const [paying, setPaying] = useState<InvoiceRow | null>(null)

  const invoices = invoicesRes.data?.data.invoices ?? []
  const payments = paymentsRes.data?.data.payments ?? []
  const loading = invoicesRes.isLoading

  // Section per institution — a parent's kids may span a school AND a
  // learning center under the same login. Single-institution parents see
  // one unlabelled section (page unchanged for them).
  const institutionGroups = useMemo(() => {
    const map = new Map<string, InvoiceRow[]>()
    for (const invoice of invoices) {
      const key = invoice.schoolName ?? 'Your school'
      const list = map.get(key)
      if (list) list.push(invoice)
      else map.set(key, [invoice])
    }
    return [...map.entries()].map(([schoolName, rows]) => ({
      schoolName,
      rows,
      children: [...new Set(rows.map(r => r.studentName).filter(Boolean))] as string[]
    }))
  }, [invoices])
  const multiInstitution = institutionGroups.length > 1

  // Per-institution child filter (only rendered when >1 child in section)
  const [childFilter, setChildFilter] = useState<Record<string, string>>({})

  const refresh = () => {
    invoicesRes.mutate()
    paymentsRes.mutate()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fees</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500">
          Invoices and payments for your children.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )}

      {!loading && invoices.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-[#1565D8] rounded-xl flex items-center justify-center mx-auto border border-blue-100">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No invoices yet</h4>
          <p className="text-sm font-normal leading-relaxed text-slate-500 max-w-sm mx-auto">
            Fee invoices appear here once your child&apos;s school issues them to your
            registered phone number ({/* matched via guardian phone */}the one on your profile).
          </p>
        </div>
      )}

      {invoices.length > 0 && institutionGroups.map(group => {
        const selectedChild = childFilter[group.schoolName] ?? 'all'
        const visibleRows = selectedChild === 'all'
          ? group.rows
          : group.rows.filter(r => r.studentName === selectedChild)

        return (
        <div key={group.schoolName} className="space-y-3">
          {multiInstitution && (
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {group.schoolName}
            </h2>
          )}
          {group.children.length > 1 && (
            <div className="flex items-center flex-wrap gap-1.5">
              {['all', ...group.children].map(child => (
                <button
                  key={child}
                  onClick={() => setChildFilter(prev => ({ ...prev, [group.schoolName]: child }))}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    selectedChild === child
                      ? 'bg-[#1565D8] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  {child === 'all' ? 'All children' : child}
                </button>
              ))}
            </div>
          )}
          {visibleRows.map(invoice => (
            <div key={invoice.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {invoice.invoiceNumber}
                    <span className={`ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[invoice.status] ?? STATUS_BADGE.UNPAID}`}>
                      {invoice.status.replace('_', ' ')}
                    </span>
                  </p>
                  <p className="text-xs font-normal text-slate-400">
                    {invoice.studentName}{invoice.gradeLabel ? ` · ${invoice.gradeLabel}` : ''}
                    {!multiInstitution && ` · ${invoice.schoolName}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold tracking-tight text-slate-900">₹{invoice.balance.toLocaleString('en-IN')}</p>
                  <p className="text-xs font-normal text-slate-400">of ₹{invoice.totalAmount.toLocaleString('en-IN')} · due {formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              {invoice.totalAmount > 0 && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1565D8] rounded-full"
                    style={{ width: `${Math.min(100, (invoice.paidAmount / invoice.totalAmount) * 100)}%` }}
                  />
                </div>
              )}
              <div className="flex justify-end items-center gap-4">
                <a
                  href={`/api/v1/parent/fees/invoices/${invoice.id}/pdf`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#1565D8]"
                >
                  <Download className="w-4 h-4" /> Invoice PDF
                </a>
                {invoice.payable && (
                  <button
                    onClick={() => setPaying(invoice)}
                    className="px-4 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold hover:bg-[#1258be] transition-colors"
                  >
                    Pay ₹{invoice.balance.toLocaleString('en-IN')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        )
      })}

      {payments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Payment history</h2>
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {payments.map(payment => (
              <div key={payment.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-300" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      ₹{payment.amount.toLocaleString('en-IN')} · {payment.method}
                      {payment.status !== 'SUCCESS' && (
                        <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          {payment.status.replace('_', ' ')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-normal text-slate-400">
                      {payment.receiptNumber} · {payment.invoiceNumber}{payment.studentName ? ` · ${payment.studentName}` : ''}
                      {multiInstitution && payment.schoolName ? ` · ${payment.schoolName}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-normal text-slate-400">{formatDate(payment.paidAt)}</span>
                  <a
                    href={`/api/v1/parent/fees/invoices/${payment.invoiceId}/pdf`}
                    className="text-slate-400 hover:text-[#1565D8]"
                    title="Download invoice PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {paying && (
        <PayDialog
          invoice={paying}
          onClose={() => setPaying(null)}
          onPaid={refresh}
        />
      )}
    </div>
  )
}
