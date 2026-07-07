'use client'

import { useState } from 'react'
import Script from 'next/script'
import { X, Loader2, Zap } from 'lucide-react'
import type { CreditPack } from './types'

type Props = {
  channelName: string
  packs: CreditPack[]
  onClose: () => void
  onPurchased: (message: string) => void
  onError: (message: string) => void
}

export default function PurchaseCreditsModal({
  channelName,
  packs,
  onClose,
  onPurchased,
  onError
}: Props) {
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const verify = async (orderId: string, paymentId: string, signature: string) => {
    const verifyRes = await fetch('/api/v1/billing/credits/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentId, signature })
    })
    const verifyData = await verifyRes.json()
    if (verifyRes.ok && verifyData.success) {
      onPurchased('Credits added to your wallet!')
    } else {
      onError(verifyData.error || 'Payment verification failed.')
    }
  }

  const handleBuy = async () => {
    const pack = packs.find(p => p.id === selectedPackId)
    if (!pack) return
    setBusy(true)
    try {
      const res = await fetch('/api/v1/billing/credits/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')

      const { orderId, amount, currency, keyId } = data

      // Dev mock: skip the Razorpay overlay entirely
      if (keyId === 'mock_public_key' || keyId.startsWith('mock')) {
        await verify(
          orderId,
          'pay_mock_' + Math.random().toString(36).substring(2, 10),
          'sig_mock_' + Math.random().toString(36).substring(2, 10)
        )
        return
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Vidhyaan CRM',
        description: `${pack.credits} ${channelName} credits`,
        order_id: orderId,
        handler: async (response: any) => {
          setBusy(true)
          try {
            await verify(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )
          } finally {
            setBusy(false)
          }
        },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: '#1565D8' }
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      onError(err.message || 'Checkout failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Purchase {channelName} credits
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Purchased credits never expire and are used after free credits.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {packs.map(pack => (
            <button
              key={pack.id}
              onClick={() => setSelectedPackId(pack.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                selectedPackId === pack.id
                  ? 'border-[#1565D8] bg-blue-50/40'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Zap className={`w-4 h-4 ${selectedPackId === pack.id ? 'text-[#1565D8]' : 'text-slate-300'}`} />
                <span className="text-sm font-bold text-slate-800">
                  {pack.credits.toLocaleString('en-IN')} credits
                </span>
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                ₹{pack.priceInr.toLocaleString('en-IN')}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleBuy}
          disabled={!selectedPackId || busy}
          className="w-full flex items-center justify-center gap-2 h-11 bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? 'Processing...' : 'Proceed to payment'}
        </button>
      </div>
    </div>
  )
}
