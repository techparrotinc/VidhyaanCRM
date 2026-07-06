import { AlertCircle } from 'lucide-react'

export const INVOICE_STATUS_CONFIG = {
  SCHEDULED: {
    label: 'Scheduled',
    badge: 'bg-blue-50 text-blue-700',
    border: 'border-l-blue-500'
  },
  UNPAID: {
    label: 'Unpaid',
    badge: 'bg-red-50 text-red-700',
    border: 'border-l-red-500'
  },
  PARTIALLY_PAID: {
    label: 'Partial',
    badge: 'bg-amber-50 text-amber-700',
    border: 'border-l-amber-500'
  },
  PAID: {
    label: 'Paid',
    badge: 'bg-green-50 text-green-700',
    border: 'border-l-green-500'
  },
  OVERDUE: {
    label: 'Overdue',
    badge: 'bg-red-100 text-red-800',
    border: 'border-l-red-700'
  },
  WAIVED: {
    label: 'Waived',
    badge: 'bg-slate-100 text-slate-500',
    border: 'border-l-slate-300'
  },
  REFUNDED: {
    label: 'Refunded',
    badge: 'bg-purple-50 text-purple-700',
    border: 'border-l-purple-500'
  }
} as const

export function invoiceStatusConfig(status: string) {
  return (
    INVOICE_STATUS_CONFIG[status as keyof typeof INVOICE_STATUS_CONFIG] ??
    INVOICE_STATUS_CONFIG.UNPAID
  )
}

export function InvoiceStatusBadge({
  status,
  overdue = false
}: {
  status: string
  /** Past-due flag computed from dueDate; renders the small overdue hint. */
  overdue?: boolean
}) {
  const config = invoiceStatusConfig(status)
  return (
    <>
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
        {config.label}
      </span>
      {overdue && (
        <p className="text-[11px] text-red-500 font-medium mt-0.5 flex items-center gap-0.5">
          <AlertCircle className="w-3 h-3" />
          Overdue
        </p>
      )}
    </>
  )
}
