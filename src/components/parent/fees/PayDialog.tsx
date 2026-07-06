'use client'

import React, { useState } from 'react'
import { X, Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { loadRazorpay } from './razorpay-loader'

export type PayableInvoice = {
  id: string
  invoiceNumber: string
  studentName: string
  schoolName: string
  balance: number
  allowPartial: boolean
  minPartialAmount: number | null
}

type Props = {
  invoice: PayableInvoice
  onClose: () => void
  onPaid: () => void
}

type Phase = 'amount' | 'launching' | 'confirming' | 'success' | 'error'

export default function PayDialog({ invoice, onClose, onPaid }: Props) {
  const [phase, setPhase] = useState<Phase>('amount')
  const [payFull, setPayFull] = useState(true)
  const [customAmount, setCustomAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null)

  const amount = payFull ? invoice.balance : Number(customAmount)
  const min = invoice.minPartialAmount ?? 1
  const amountValid = payFull || (amount >= min && amount <= invoice.balance)

  const start = async () => {
    setPhase('launching')
    setError(null)
    try {
      const res = await fetch(`/api/v1/parent/fees/invoices/${invoice.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Could not start the payment')
      const data = body.data

      await loadRazorpay()
      const razorpay = new window.Razorpay!({
        key: data.keyId,
        order_id: data.providerOrderId,
        amount: data.amountMinor,
        currency: data.currency,
        name: invoice.schoolName,
        description: `${invoice.invoiceNumber} · ${invoice.studentName}`,
        prefill: data.prefill,
        theme: { color: '#1565D8' },
        modal: {
          ondismiss: () => setPhase('amount')
        },
        handler: async (rzp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setPhase('confirming')
          try {
            const confirm = await fetch(`/api/v1/parent/fees/checkout/${data.gatewayOrderId}/confirm`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                providerOrderId: rzp.razorpay_order_id,
                providerPaymentId: rzp.razorpay_payment_id,
                signature: rzp.razorpay_signature
              })
            })
            const confirmBody = await confirm.json()
            if (!confirm.ok) throw new Error(confirmBody?.error ?? 'Confirmation failed')
            setReceiptNumber(confirmBody.data.receiptNumber)
            setPhase('success')
            onPaid()
          } catch (e) {
            // Money may already be captured — webhook will settle it.
            setError(e instanceof Error ? e.message : 'Confirmation failed')
            setPhase('error')
            onPaid()
          }
        }
      })
      razorpay.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the payment')
      setPhase('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{invoice.invoiceNumber}</h3>
            <p className="text-xs font-normal text-slate-400">{invoice.studentName} · {invoice.schoolName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {phase === 'success' ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Payment successful</p>
            {receiptNumber && <p className="text-xs font-normal text-slate-500">Receipt {receiptNumber}</p>}
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold">
              Done
            </button>
          </div>
        ) : phase === 'error' ? (
          <div className="text-center py-6 space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="text-sm font-medium text-slate-700">{error}</p>
            <p className="text-xs font-normal text-slate-400">
              If you were charged, the payment will be confirmed automatically within a few minutes.
            </p>
            <button onClick={() => setPhase('amount')} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">
              Try again
            </button>
          </div>
        ) : phase === 'confirming' ? (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 text-[#1565D8] mx-auto animate-spin" />
            <p className="text-sm font-medium text-slate-600">Payment received, confirming…</p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between border border-slate-200 rounded-xl p-4">
              <span className="text-sm font-normal text-slate-500">Balance due</span>
              <span className="text-xl font-bold tracking-tight text-slate-900">₹{invoice.balance.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={payFull} onChange={() => setPayFull(true)} className="accent-[#1565D8]" />
                <span className="text-sm font-medium text-slate-700">Pay full amount</span>
              </label>
              {invoice.allowPartial && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!payFull} onChange={() => setPayFull(false)} className="accent-[#1565D8]" />
                  <span className="text-sm font-medium text-slate-700">Pay another amount</span>
                </label>
              )}
              {!payFull && (
                <div className="pl-6">
                  <input
                    type="number"
                    min={min}
                    max={invoice.balance}
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder={`Min ₹${min}`}
                    className="w-40 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                  />
                  <p className="text-xs font-normal text-slate-400 mt-1">Between ₹{min} and ₹{invoice.balance.toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>

            <button
              onClick={start}
              disabled={!amountValid || phase === 'launching'}
              className="w-full py-2.5 rounded-lg bg-[#1565D8] text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {phase === 'launching' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Pay securely {amountValid && amount > 0 ? `· ₹${amount.toLocaleString('en-IN')}` : ''}
            </button>
            <p className="text-center text-xs font-normal text-slate-400">Powered by Razorpay</p>
          </>
        )}
      </div>
    </div>
  )
}
