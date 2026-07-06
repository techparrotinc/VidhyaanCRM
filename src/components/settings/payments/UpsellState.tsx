'use client'

import Link from 'next/link'
import { CreditCard, ExternalLink } from 'lucide-react'

/** Shown when the org's plan does not include the payment_gateway module. */
export default function UpsellState() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-4 my-6">
      <div className="w-12 h-12 bg-blue-50 text-[#1565D8] rounded-xl flex items-center justify-center mx-auto border border-blue-100">
        <CreditCard className="w-6 h-6" />
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-slate-800">Collect fees online</h4>
        <p className="text-sm font-normal leading-relaxed text-slate-500">
          Let parents pay securely via UPI, cards and netbanking — settled straight
          to your school&apos;s own account. Available on the Growth plan and above.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          href="/settings/billing"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold hover:bg-[#1258be] transition-colors"
        >
          Upgrade plan
        </Link>
        <a
          href="https://razorpay.com/docs/payments/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#1565D8]"
        >
          Learn more <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
