'use client'

import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Receipt, Download, CircleCheck, ArrowRight, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import PayDialog, { type PayableInvoice } from '@/components/parent/fees/PayDialog'

type InvoiceRow = PayableInvoice & {
  items: { head: string; amount: number; quantity: number }[]
  gradeLabel: string | null
  institutionType: 'SCHOOL' | 'LEARNING_CENTER'
  invoiceType: string
  termName: string | null
  courseName: string | null
  createdAt: string
  totalAmount: number
  paidAmount: number
  dueDate: string | null
  status: string
  payable: boolean
}

type PeriodMode = 'month' | 'quarter' | 'year'

const PERIOD_MODES: { value: PeriodMode; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' }
]

function periodLabel(dateStr: string | null, mode: PeriodMode): string {
  if (!dateStr) return 'No date'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'No date'
  const y = d.getFullYear()
  if (mode === 'year') return String(y)
  if (mode === 'quarter') return `Q${Math.floor(d.getMonth() / 3) + 1} ${y}`
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}

function periodTime(dateStr: string | null): number {
  const t = dateStr ? new Date(dateStr).getTime() : 0
  return isNaN(t) ? 0 : t
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
  PAID: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  PARTIALLY_PAID: 'bg-blue-50 text-[#1565D8] border border-blue-100',
  UNPAID: 'bg-slate-50 text-slate-500 border border-slate-200',
  OVERDUE: 'bg-red-50 text-red-600 border border-red-100',
  REFUNDED: 'bg-amber-50 text-amber-600 border border-amber-100'
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ParentFeesPage() {
  const invoicesRes = useSWR<{ data: { invoices: InvoiceRow[] } }>('/api/v1/parent/fees/invoices', fetcher)
  const paymentsRes = useSWR<{ data: { payments: PaymentRow[] } }>('/api/v1/parent/fees/payments', fetcher)
  const [paying, setPaying] = useState<InvoiceRow | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      institutionType: rows[0]?.institutionType ?? 'SCHOOL',
      children: [...new Set(rows.map(r => r.studentName).filter(Boolean))] as string[]
    }))
  }, [invoices])
  const multiInstitution = institutionGroups.length > 1

  // Per-institution child filter (only rendered when >1 child in section)
  const [childFilter, setChildFilter] = useState<Record<string, string>>({})
  // Per-institution period grouping for learning centers (schools group by term)
  const [periodMode, setPeriodMode] = useState<Record<string, PeriodMode>>({})

  const refresh = () => {
    invoicesRes.mutate()
    paymentsRes.mutate()
  }

  const totalDue = invoices.reduce((s, r) => s + r.balance, 0)
  const dueCount = invoices.filter((r) => r.balance > 0).length
  const firstPayable = invoices.find((r) => r.payable && r.balance > 0) ?? null

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[26px] font-black tracking-tight text-slate-900">Fees</h1>
        <p className="text-sm font-semibold text-slate-400 mt-0.5">
          Invoices and payments for your children
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      )}

      {!loading && invoices.length === 0 && (
        <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-blue-50 text-[#1565D8] rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-slate-800 mt-4">No invoices yet</h4>
          <p className="text-sm font-medium leading-relaxed text-slate-400 max-w-sm mx-auto mt-1">
            Fee invoices appear here once your child&apos;s school issues them to your
            registered phone number (the one on your profile).
          </p>
        </div>
      )}

      {!loading && invoices.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-start">

      {/* ===== LEFT: invoices ===== */}
      <div className="lg:col-span-2 space-y-7">
      {institutionGroups.map(group => {
        const selectedChild = childFilter[group.schoolName] ?? 'all'
        const visibleRows = selectedChild === 'all'
          ? group.rows
          : group.rows.filter(r => r.studentName === selectedChild)

        const isLC = group.institutionType === 'LEARNING_CENTER'
        const mode = periodMode[group.schoolName] ?? 'month'

        // Schools group by term when the invoice has one, otherwise by billing
        // month (monthly-fee schools have no terms); learning centers by period.
        const subgroupMap = new Map<string, { rows: InvoiceRow[]; sort: number }>()
        for (const inv of visibleRows) {
          const key = isLC
            ? periodLabel(inv.dueDate ?? inv.createdAt, mode)
            : (inv.termName ?? inv.courseName ?? periodLabel(inv.dueDate ?? inv.createdAt, 'month'))
          const sort = inv.termName && !isLC ? 0 : periodTime(inv.dueDate ?? inv.createdAt)
          const existing = subgroupMap.get(key)
          if (existing) {
            existing.rows.push(inv)
            existing.sort = Math.max(existing.sort, sort)
          } else {
            subgroupMap.set(key, { rows: [inv], sort })
          }
        }
        const subgroups = [...subgroupMap.entries()].map(([label, v]) => ({
          label,
          rows: v.rows,
          due: v.rows.reduce((s, r) => s + r.balance, 0),
          sort: v.sort
        }))
        // Terms first (Term 1, 2, 3… by name), then month buckets newest-first.
        subgroups.sort((a, b) => {
          const aTerm = a.sort === 0 ? 0 : 1
          const bTerm = b.sort === 0 ? 0 : 1
          if (aTerm !== bTerm) return aTerm - bTerm
          if (aTerm === 0) return a.label.localeCompare(b.label, undefined, { numeric: true })
          return b.sort - a.sort
        })

        const groupDue = visibleRows.reduce((s, r) => s + r.balance, 0)

        return (
        <div key={group.schoolName} className="space-y-4">
          {/* Institution header + outstanding subtotal */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {multiInstitution ? group.schoolName : 'Invoices'}
            </h2>
            <span className={`text-xs font-semibold ${groupDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {groupDue > 0 ? `₹${groupDue.toLocaleString('en-IN')} due` : 'All settled'}
            </span>
          </div>

          {/* Filters row: child pills + LC period toggle */}
          {(group.children.length > 1 || isLC) && (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center flex-wrap gap-1.5">
                {group.children.length > 1 && ['all', ...group.children].map(child => (
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
              {isLC && (
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 select-none">
                  {PERIOD_MODES.map(pm => (
                    <button
                      key={pm.value}
                      onClick={() => setPeriodMode(prev => ({ ...prev, [group.schoolName]: pm.value }))}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        mode === pm.value
                          ? 'bg-white text-[#1565D8] shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}>
                      {pm.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {subgroups.map(sub => (
          <div key={sub.label} className="space-y-3">
            {/* Term / period subheader + subtotal */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <h3 className="text-xs font-bold text-slate-700">
                {sub.label}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {sub.due > 0 ? `₹${sub.due.toLocaleString('en-IN')} due` : 'Paid'}
              </span>
            </div>
          {sub.rows.map(invoice => (
            <div key={invoice.id} className="bg-white border border-slate-100 rounded-3xl p-5 space-y-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    invoice.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-500'
                      : invoice.status === 'OVERDUE'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-amber-50 text-amber-500'
                  }`}>
                    <Receipt className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 flex items-center flex-wrap gap-2">
                      {invoice.invoiceNumber}
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[invoice.status] ?? STATUS_BADGE.UNPAID}`}>
                        {invoice.status.replace('_', ' ')}
                      </span>
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                      {invoice.studentName}{invoice.gradeLabel ? ` · ${invoice.gradeLabel}` : ''}
                      {invoice.courseName ? ` · ${invoice.courseName}` : ''}
                      {!multiInstitution && ` · ${invoice.schoolName}`}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black tracking-tight text-slate-900">₹{invoice.balance.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">of ₹{invoice.totalAmount.toLocaleString('en-IN')} · due {formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              {invoice.totalAmount > 0 && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${invoice.status === 'PAID' ? 'bg-emerald-400' : 'bg-[#1565D8]'}`}
                    style={{ width: `${Math.min(100, (invoice.paidAmount / invoice.totalAmount) * 100)}%` }}
                  />
                </div>
              )}
              {/* Line-item breakup (expandable) */}
              {invoice.items.length > 0 && expandedId === invoice.id && (
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                  {invoice.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs font-semibold text-slate-600">
                        {item.head}
                        {item.quantity > 1 && <span className="text-slate-400"> × {item.quantity}</span>}
                      </span>
                      <span className="text-xs font-black text-slate-700">
                        ₹{(item.amount * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                    <span className="text-xs font-black text-slate-800">Total</span>
                    <span className="text-xs font-black text-slate-900">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center gap-4">
                {invoice.items.length > 0 ? (
                  <button
                    onClick={() => setExpandedId(expandedId === invoice.id ? null : invoice.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#1565D8] transition cursor-pointer"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === invoice.id ? 'rotate-180' : ''}`} />
                    {expandedId === invoice.id ? 'Hide breakup' : `Fee breakup (${invoice.items.length})`}
                  </button>
                ) : <span />}
                <div className="flex items-center gap-4">
                <a
                  href={`/api/v1/parent/fees/invoices/${invoice.id}/pdf`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#1565D8] transition"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </a>
                {invoice.payable && (
                  <button
                    onClick={() => setPaying(invoice)}
                    className="px-5 py-2.5 rounded-2xl bg-[#1565D8] text-white text-sm font-black hover:bg-blue-700 transition shadow-md shadow-blue-200/60 cursor-pointer"
                  >
                    Pay ₹{invoice.balance.toLocaleString('en-IN')}
                  </button>
                )}
                </div>
              </div>
            </div>
          ))}
          </div>
          ))}
        </div>
        )
      })}

      {/* Payment history — under invoices so the rail stays uncramped */}
      {payments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-black text-slate-900">Payment history</h2>
          <div className="bg-white border border-slate-100 rounded-3xl divide-y divide-slate-50 shadow-sm overflow-hidden">
            {payments.map(payment => (
              <div key={payment.id} className="flex items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <CircleCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800">
                      ₹{payment.amount.toLocaleString('en-IN')}
                      <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{payment.method}</span>
                      {payment.status !== 'SUCCESS' && (
                        <span className="ml-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                          {payment.status.replace('_', ' ')}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">
                      {payment.receiptNumber} · {payment.invoiceNumber}{payment.studentName ? ` · ${payment.studentName}` : ''}
                      {multiInstitution && payment.schoolName ? ` · ${payment.schoolName}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400">{formatDate(payment.paidAt)}</span>
                  <a
                    href={`/api/v1/parent/fees/invoices/${payment.invoiceId}/pdf`}
                    className="text-slate-300 hover:text-[#1565D8] transition"
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
      </div>

      {/* ===== RIGHT RAIL: outstanding summary ===== */}
      <div className="space-y-7">
        {totalDue > 0 ? (
          <div className="rounded-3xl bg-slate-900 text-white p-5 shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total outstanding</p>
            <p className="text-3xl font-black tracking-tight mt-1">₹{totalDue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {dueCount} pending invoice{dueCount > 1 ? 's' : ''}
            </p>
            {firstPayable && (
              <button
                onClick={() => setPaying(firstPayable)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 bg-white text-slate-900 text-sm font-black rounded-2xl py-3 hover:bg-slate-100 transition cursor-pointer"
              >
                Pay now <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CircleCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-800">Fees all clear</p>
              <p className="text-[11px] text-emerald-600 font-semibold">No pending payments — great job!</p>
            </div>
          </div>
        )}
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
