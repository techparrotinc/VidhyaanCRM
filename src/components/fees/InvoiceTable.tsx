'use client'

import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { InvoiceStatusBadge, invoiceStatusConfig } from './InvoiceStatusBadge'

export type InvoiceRow = {
  id: string
  invoiceNumber: string
  invoiceType: string
  status: string
  totalAmount: number
  paidAmount: number
  dueDate: string | null
  createdAt: string
  student: {
    id: string
    name: string
    studentCode: string
    gradeLabel: string | null
    guardianPhone: string | null
  } | null
  term: { id: string; name: string } | null
  course: { id: string; name: string } | null
}

export function invoiceBalance(inv: InvoiceRow) {
  return Number(inv.totalAmount) - Number(inv.paidAmount)
}

export function isInvoiceOverdue(inv: InvoiceRow) {
  return Boolean(
    inv.dueDate &&
    new Date(inv.dueDate) < new Date() &&
    inv.status !== 'PAID' &&
    inv.status !== 'WAIVED'
  )
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-red-500',
  'bg-indigo-500'
]

type InvoiceTableProps = {
  invoices: InvoiceRow[]
  isLoading: boolean
  onRowClick?: (invoice: InvoiceRow) => void
  hideStudentColumn?: boolean
  /** Renders the trailing Action cell; column omitted when absent. */
  renderActions?: (invoice: InvoiceRow) => ReactNode
  minRows?: number
}

export function InvoiceTable({
  invoices,
  isLoading,
  onRowClick,
  hideStudentColumn = false,
  renderActions,
  minRows = 0
}: InvoiceTableProps) {
  const columnCount =
    5 + (hideStudentColumn ? 0 : 2) + (renderActions ? 1 : 0)
  const emptyRowCount = Math.max(0, minRows - invoices.length)

  const headerCell =
    'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500'

  return (
    <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <table className={`w-full ${hideStudentColumn ? 'min-w-[600px]' : 'min-w-[820px]'}`}>

        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className={headerCell}>Invoice</th>
            {!hideStudentColumn && (
              <>
                <th className={headerCell}>Student</th>
                <th className={headerCell}>Connect</th>
              </>
            )}
            <th className={headerCell}>Type / Term</th>
            <th className={headerCell}>Amount</th>
            <th className={headerCell}>Status</th>
            <th className={headerCell}>Due Date</th>
            {renderActions && <th className={headerCell}>Action</th>}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100 animate-pulse">
                <td colSpan={columnCount} className="px-3 py-2.5">
                  <div className="h-8 bg-slate-100 rounded" />
                </td>
              </tr>
            ))
          ) : invoices.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-3 py-16 text-center text-sm text-slate-400">
                No invoices found
              </td>
            </tr>
          ) : (
            <>
              {invoices.map(inv => {
                const config = invoiceStatusConfig(inv.status)
                const balance = invoiceBalance(inv)
                const overdue = isInvoiceOverdue(inv)

                const initials = (inv.student?.name ?? 'NA')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()

                const avatarColor =
                  AVATAR_COLORS[(inv.student?.name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onRowClick?.(inv)}
                    className={`border-b border-slate-100 border-l-2 ${config.border} hover:bg-slate-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>

                    {/* Invoice */}
                    <td className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-slate-800 font-mono">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(inv.createdAt), 'd MMM')}
                      </p>
                    </td>

                    {!hideStudentColumn && (
                      <>
                        {/* Student */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor}`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {inv.student?.name ?? '—'}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {inv.student?.studentCode}
                                {inv.student?.gradeLabel && ` · ${inv.student.gradeLabel}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Connect */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                if (inv.student?.guardianPhone)
                                  window.open(`mailto:${inv.student.guardianPhone}`)
                              }}
                              className="text-slate-400 hover:text-blue-500 transition-colors">
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                if (inv.student?.guardianPhone)
                                  window.open(`https://wa.me/91${inv.student.guardianPhone}`)
                              }}
                              className="text-slate-400 hover:text-green-500 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                if (inv.student?.guardianPhone)
                                  window.open(`tel:${inv.student.guardianPhone}`)
                              }}
                              className="text-slate-400 hover:text-blue-500 transition-colors">
                              <Phone className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    {/* Type / Term */}
                    <td className="px-3 py-2.5 font-sans">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {inv.invoiceType}
                      </span>
                      {(inv.term || inv.invoiceType === 'TERM') && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {inv.term?.name || '—'}
                        </p>
                      )}
                      {inv.course && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {inv.course.name}
                        </p>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2.5">
                      <p className="text-sm font-bold text-slate-900">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </p>
                      {balance > 0 && inv.status !== 'UNPAID' && (
                        <p className="text-xs text-slate-400">
                          Bal: ₹{balance.toLocaleString('en-IN')}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <InvoiceStatusBadge status={inv.status} overdue={overdue} />
                    </td>

                    {/* Due Date */}
                    <td className="px-3 py-2.5">
                      <span className={`text-xs whitespace-nowrap ${overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                        {inv.dueDate
                          ? format(new Date(inv.dueDate), 'd MMM')
                          : '—'
                        }
                      </span>
                    </td>

                    {/* Action */}
                    {renderActions && (
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        {renderActions(inv)}
                      </td>
                    )}
                  </tr>
                )
              })}

              {/* Empty placeholder rows */}
              {Array.from({ length: emptyRowCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-slate-100 border-l-2 border-l-transparent">
                  <td colSpan={columnCount} className="px-3 py-2.5 h-[52px]" />
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
