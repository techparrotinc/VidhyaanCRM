'use client'

import { useState, useEffect,
  useCallback } from 'react'
import { useParams, useRouter, useSearchParams }
  from 'next/navigation'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { appAlert } from '@/components/ui/app-alert'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { format } from 'date-fns'
import {
  ArrowLeft, Pencil, Trash2,
  CreditCard, CheckCircle,
  Clock, AlertCircle, X,
  Download, Mail, Ban, Percent
} from 'lucide-react'
import { INVOICE_TYPE_LABELS } from '@/lib/fees'
import { AppSelect } from '@/components/ui/app-select'

const STATUS_CONFIG = {
  UNPAID: {
    label: 'Unpaid',
    badge: 'bg-red-50 text-red-700',
    icon: Clock
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    badge: 'bg-amber-50 text-amber-700',
    icon: Clock
  },
  PAID: {
    label: 'Paid',
    badge: 'bg-green-50 text-green-700',
    icon: CheckCircle
  },
  OVERDUE: {
    label: 'Overdue',
    badge: 'bg-red-100 text-red-800',
    icon: AlertCircle
  },
  WAIVED: {
    label: 'Waived',
    badge: 'bg-slate-100 text-slate-500',
    icon: X
  }
} as const

const PAYMENT_METHOD_LABELS:
  Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  DD: 'Demand Draft',
  NEFT: 'NEFT',
  BANK_TRANSFER: 'Bank Transfer',
  RAZORPAY: 'Razorpay',
  CARD: 'Card',
  OTHER: 'Other'
}

type Payment = {
  id: string
  receiptNumber: string
  amount: number
  method: string
  status: string
  instrumentNo: string | null
  bankName: string | null
  utrNumber: string | null
  paidAt: string | null
  createdAt: string
}

type InvoiceDetail = {
  id: string
  invoiceNumber: string
  invoiceType: string
  status: string
  totalAmount: number
  paidAmount: number
  lateFeeAmount: number
  dueDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  student: {
    id: string
    name: string
    studentCode: string
    gradeLabel: string | null
    guardianName: string | null
    guardianPhone: string | null
  } | null
  term: {
    id: string
    name: string
  } | null
  course: {
    id: string
    name: string
    frequency: string
  } | null
  items: {
    id: string
    head: string
    amount: number
    quantity: number
  }[]
  payments: Payment[]
  concessions: Concession[]
}

type Concession = {
  id: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  reason: string | null
  createdAt: string
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const confirmDialog = useConfirm()
  const searchParams = useSearchParams()

  const [invoice, setInvoice] =
    useState<InvoiceDetail | null>(null)
  const [isLoading, setIsLoading] =
    useState(true)
  const [showPaymentForm, setShowPaymentForm] =
    useState(searchParams.get('pay') === 'true')
  const [paymentForm, setPaymentForm] =
    useState({
      amount: '',
      method: 'CASH',
      instrumentNo: '',
      bankName: '',
      utrNumber: '',
      paidAt: new Date()
        .toISOString().split('T')[0]
    })
  const [isSavingPayment, setIsSavingPayment] =
    useState(false)
  const [paymentError, setPaymentError] =
    useState<string | null>(null)
  const [showConcessionDialog, setShowConcessionDialog] =
    useState(false)
  const [concessionForm, setConcessionForm] =
    useState({ type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT', value: '', reason: '' })
  const [isSavingConcession, setIsSavingConcession] =
    useState(false)
  const [concessionError, setConcessionError] =
    useState<string | null>(null)

  const fetchInvoice = useCallback(
    async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/v1/fees/invoices/${id}`
        )
        const data = await res.json()
        setInvoice(data.data ?? null)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }, [id]
  )

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  useEffect(() => {
    if (searchParams.get('pay') === 'true') {
      setTimeout(() => {
        document
          .getElementById('payment-form')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
      }, 500)
    }
  }, [])

  const handleRecordPayment = async () => {
    if (!paymentForm.amount ||
        isNaN(Number(paymentForm.amount)) ||
        Number(paymentForm.amount) <= 0) {
      setPaymentError(
        'Enter a valid payment amount'
      )
      return
    }

    const balance =
      Number(invoice?.totalAmount ?? 0) -
      Number(invoice?.paidAmount ?? 0)

    if (Number(paymentForm.amount) >
        balance) {
      setPaymentError(
        `Amount cannot exceed balance ₹${balance.toLocaleString('en-IN')}`
      )
      return
    }

    setIsSavingPayment(true)
    setPaymentError(null)

    try {
      const res = await fetch(
        `/api/v1/fees/invoices/${id}/payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Number(paymentForm.amount),
            method: paymentForm.method,
            instrumentNo:
              paymentForm.instrumentNo
              || undefined,
            bankName:
              paymentForm.bankName
              || undefined,
            utrNumber:
              paymentForm.utrNumber
              || undefined,
            paidAt: paymentForm.paidAt
          })
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(
          data.message ??
          'Failed to record payment'
        )
      }

      setShowPaymentForm(false)
      setPaymentForm({
        amount: '',
        method: 'CASH',
        instrumentNo: '',
        bankName: '',
        utrNumber: '',
        paidAt: new Date()
          .toISOString().split('T')[0]
      })
      await fetchInvoice()
    } catch (err: any) {
      setPaymentError(err.message)
    } finally {
      setIsSavingPayment(false)
    }
  }

  const handleDelete = async () => {
    const okToDelete = await confirmDialog({
      title: 'Delete this invoice?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete Invoice',
      variant: 'danger'
    })
    if (!okToDelete) return
    await fetch(
      `/api/v1/fees/invoices/${id}`,
      { method: 'DELETE' }
    )
    router.push('/fee-management')
  }

  const handleDownloadPdf = () => {
    window.open(`/api/v1/fees/invoices/${id}/pdf`, '_blank')
  }

  const handleEmailInvoice = async () => {
    const res = await fetch(`/api/v1/fees/invoices/${id}/email`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success !== false) {
      appAlert('Invoice emailed to the guardian.')
    } else {
      appAlert(data.error || data.message || 'Could not send the invoice email.')
    }
  }

  const handleWaive = async () => {
    const okToWaive = await confirmDialog({
      title: 'Waive this invoice?',
      message: 'The outstanding balance will be written off and the invoice marked as Waived.',
      confirmLabel: 'Waive Invoice',
      variant: 'danger'
    })
    if (!okToWaive) return
    const res = await fetch(`/api/v1/fees/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'WAIVED' })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success !== false) {
      appAlert('Invoice waived.')
      fetchInvoice()
    } else {
      appAlert(data.error || 'Could not waive the invoice.')
    }
  }

  const handleApplyConcession = async () => {
    if (!concessionForm.value ||
        isNaN(Number(concessionForm.value)) ||
        Number(concessionForm.value) <= 0) {
      setConcessionError('Enter a valid discount value')
      return
    }
    if (concessionForm.type === 'PERCENTAGE' && Number(concessionForm.value) > 100) {
      setConcessionError('Percentage cannot exceed 100')
      return
    }

    setIsSavingConcession(true)
    setConcessionError(null)

    try {
      const res = await fetch(`/api/v1/fees/invoices/${id}/concessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: concessionForm.type,
          value: Number(concessionForm.value),
          reason: concessionForm.reason || undefined
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? 'Failed to apply concession')
      }

      setShowConcessionDialog(false)
      setConcessionForm({ type: 'PERCENTAGE', value: '', reason: '' })
      await fetchInvoice()
      appAlert('Concession applied.')
    } catch (err: any) {
      setConcessionError(err.message)
    } finally {
      setIsSavingConcession(false)
    }
  }

  const balance = invoice
    ? Number(invoice.totalAmount) -
      Number(invoice.paidAmount)
    : 0

  const config = invoice
    ? STATUS_CONFIG[
        invoice.status as
        keyof typeof STATUS_CONFIG
      ] ?? STATUS_CONFIG.UNPAID
    : STATUS_CONFIG.UNPAID

  const isPaid =
    invoice?.status === 'PAID' ||
    invoice?.status === 'WAIVED'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-52 bg-slate-200 rounded-lg" />
            <div className="h-4 w-36 bg-slate-100 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-36 bg-slate-200 rounded-lg" />
            <div className="h-10 w-24 bg-slate-100 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-64 bg-white border border-slate-200 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-56 bg-white border border-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <p className="text-sm text-slate-500">
          Invoice not found.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            onClick={() => router.push('/fee-management')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isPaid && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                <CreditCard className="w-4 h-4" />
                Record Payment
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
              <Download className="w-4 h-4" />
              PDF
            </button>

            <button
              onClick={handleEmailInvoice}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
              <Mail className="w-4 h-4" />
              Email
            </button>

            {!isPaid && invoice?.status !== 'WAIVED' && (
              <button
                onClick={() => setShowConcessionDialog(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
                <Percent className="w-4 h-4" />
                Concession
              </button>
            )}

            {!isPaid && invoice?.status !== 'WAIVED' && (
              <button
                onClick={handleWaive}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors whitespace-nowrap">
                <Ban className="w-4 h-4" />
                Waive
              </button>
            )}

            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Invoice identity */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {invoice.invoiceNumber}
              </h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
                {config.label}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-slate-100 text-slate-600">
                {INVOICE_TYPE_LABELS[invoice.invoiceType] ?? invoice.invoiceType}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {invoice.student && (
                <button
                  onClick={() => router.push(`/student-management/${invoice.student!.id}`)}
                  className="text-sm text-[#1565D8] font-semibold hover:underline">
                  {invoice.student.name}
                </button>
              )}
              {invoice.student?.gradeLabel && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {invoice.student.gradeLabel}
                  </span>
                </>
              )}
              {invoice.term && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">
                    {invoice.term.name}
                  </span>
                </>
              )}
              {invoice.course && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">
                    {invoice.course.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Amount summary */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                Total
              </p>
              <p className="text-2xl font-bold text-slate-900">
                ₹{Number(invoice.totalAmount).toLocaleString('en-IN')}
              </p>
            </div>
            {balance > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                  Balance
                </p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{balance.toLocaleString('en-IN')}
                </p>
              </div>
            )}
            {Number(invoice.paidAmount) > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                  Paid
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{Number(invoice.paidAmount).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="px-4 sm:px-6 py-6 flex-1">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Invoice Items ── */}
          <div className="flex flex-col gap-6 lg:col-span-2">

            {/* Items card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Invoice Items
                </h2>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">
                          {item.head}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-slate-400">
                            × {item.quantity}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          ₹{(item.amount * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td className="px-4 py-3 text-sm font-bold text-slate-700">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      ₹{Number(invoice.totalAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Invoice Info card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Invoice Information
              </h2>

              {[
                {
                  label: 'Invoice Number',
                  value: invoice.invoiceNumber
                },
                {
                  label: 'Invoice Type',
                  value: INVOICE_TYPE_LABELS[invoice.invoiceType] ?? invoice.invoiceType
                },
                {
                  label: 'Due Date',
                  value: invoice.dueDate
                    ? format(new Date(invoice.dueDate), 'd MMM yyyy')
                    : '—'
                },
                {
                  label: 'Created On',
                  value: format(new Date(invoice.createdAt), 'd MMM yyyy')
                },
                {
                  label: 'Notes',
                  value: invoice.notes ?? '—'
                }
              ].map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide flex-shrink-0">
                    {row.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 text-right">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Payment History ── */}
          <div className="flex flex-col gap-6">

            {/* Record Payment Form */}
            {showPaymentForm && (
              <div id="payment-form" className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Record Payment
                  </h2>
                  <button
                    onClick={() => {
                      setShowPaymentForm(false)
                      setPaymentError(null)
                    }}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {paymentError && (
                  <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {paymentError}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {/* Balance info */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-amber-50 rounded-lg">
                    <span className="text-xs font-semibold text-amber-700">
                      Balance Due
                    </span>
                    <span className="text-sm font-bold text-amber-800">
                      ₹{balance.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      Payment Amount (₹)
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={e =>
                        setPaymentForm(prev => ({
                          ...prev,
                          amount: e.target.value
                        }))
                      }
                      placeholder={`Max ₹${balance.toLocaleString('en-IN')}`}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Quick fill button */}
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() =>
                          setPaymentForm(prev => ({
                            ...prev,
                            amount: String(balance)
                          }))
                        }
                        className="text-xs text-blue-600 hover:underline">
                        Pay full balance
                      </button>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      Payment Method
                    </label>
                    <AppSelect
                      value={paymentForm.method}
                      onChange={e =>
                        setPaymentForm(prev => ({
                          ...prev,
                          method: e.target.value
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </AppSelect>
                  </div>

                  {/* Method-specific fields */}
                  {['CHEQUE', 'DD'].includes(paymentForm.method) && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">
                          Instrument Number
                        </label>
                        <input
                          value={paymentForm.instrumentNo}
                          onChange={e =>
                            setPaymentForm(prev => ({
                              ...prev,
                              instrumentNo: e.target.value
                            }))
                          }
                          placeholder="Cheque/DD number"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">
                          Bank Name
                        </label>
                        <input
                          value={paymentForm.bankName}
                          onChange={e =>
                            setPaymentForm(prev => ({
                              ...prev,
                              bankName: e.target.value
                            }))
                          }
                          placeholder="Bank name"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {['NEFT', 'BANK_TRANSFER', 'UPI'].includes(paymentForm.method) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-600">
                        UTR / Reference Number
                      </label>
                      <input
                        value={paymentForm.utrNumber}
                        onChange={e =>
                          setPaymentForm(prev => ({
                            ...prev,
                            utrNumber: e.target.value
                          }))
                        }
                        placeholder="UTR or reference number"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Payment Date */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      Payment Date
                    </label>
                    <DateTimePicker
                      dateOnly
                      clearable={false}
                      value={paymentForm.paidAt}
                      onChange={v =>
                        setPaymentForm(prev => ({
                          ...prev,
                          paidAt: v ? format(new Date(v), 'yyyy-MM-dd') : prev.paidAt
                        }))
                      }
                    />
                  </div>

                  {/* Save button */}
                  <button
                    onClick={handleRecordPayment}
                    disabled={isSavingPayment}
                    className="w-full py-2.5 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {isSavingPayment ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Payment History
                </h2>
                {!isPaid && !showPaymentForm && (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="text-xs font-semibold text-[#1565D8] hover:underline">
                    + Record Payment
                  </button>
                )}
              </div>

              {invoice.payments.length === 0 ? (
                <div className="p-6 text-center">
                  <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    No payments recorded yet
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {invoice.payments.map(payment => (
                    <div key={payment.id} className="px-4 py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">
                              ₹{Number(payment.amount).toLocaleString('en-IN')}
                            </p>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                              {payment.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">
                            {payment.receiptNumber}
                          </p>
                          {payment.instrumentNo && (
                            <p className="text-xs text-slate-400">
                              Instrument: {payment.instrumentNo}
                            </p>
                          )}
                          {payment.utrNumber && (
                            <p className="text-xs text-slate-400">
                              UTR: {payment.utrNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-500">
                            {payment.paidAt
                              ? format(new Date(payment.paidAt), 'd MMM yyyy')
                              : format(new Date(payment.createdAt), 'd MMM yyyy')
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Concessions */}
            {invoice.concessions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Concessions
                  </h2>
                </div>
                <div className="flex flex-col">
                  {invoice.concessions.map(c => (
                    <div key={c.id} className="px-4 py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900">
                          {c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${Number(c.value).toLocaleString('en-IN')}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(c.createdAt), 'd MMM yyyy')}
                        </p>
                      </div>
                      {c.reason && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {c.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Quick Info */}
            {invoice.student && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Student
                </h2>

                {[
                  {
                    label: 'Name',
                    value: invoice.student.name
                  },
                  {
                    label: 'Code',
                    value: invoice.student.studentCode
                  },
                  {
                    label: 'Grade',
                    value: invoice.student.gradeLabel ?? '—'
                  },
                  {
                    label: 'Guardian',
                    value: invoice.student.guardianName ?? '—'
                  },
                  {
                    label: 'Phone',
                    value: invoice.student.guardianPhone ?? '—'
                  }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                      {row.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {row.value}
                    </p>
                  </div>
                ))}

                <button
                  onClick={() => router.push(`/student-management/${invoice.student!.id}`)}
                  className="mt-3 text-xs font-semibold text-[#1565D8] hover:underline">
                  View Student Profile →
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      <Dialog open={showConcessionDialog} onOpenChange={setShowConcessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Concession</DialogTitle>
          </DialogHeader>

          {concessionError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {concessionError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-3 py-2.5 bg-amber-50 rounded-lg">
              <span className="text-xs font-semibold text-amber-700">
                Balance Due
              </span>
              <span className="text-sm font-bold text-amber-800">
                ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Discount Type
              </label>
              <AppSelect
                value={concessionForm.type}
                onChange={e =>
                  setConcessionForm(prev => ({
                    ...prev,
                    type: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT'
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
              </AppSelect>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                {concessionForm.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount (₹)'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="number"
                value={concessionForm.value}
                onChange={e =>
                  setConcessionForm(prev => ({
                    ...prev,
                    value: e.target.value
                  }))
                }
                placeholder={concessionForm.type === 'PERCENTAGE' ? 'e.g. 10' : `Max ₹${balance.toLocaleString('en-IN')}`}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Reason
              </label>
              <input
                value={concessionForm.reason}
                onChange={e =>
                  setConcessionForm(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))
                }
                placeholder="e.g. Sibling discount, staff ward"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={handleApplyConcession}
              disabled={isSavingConcession}
              className="w-full py-2.5 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSavingConcession ? 'Applying...' : 'Apply Concession'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
