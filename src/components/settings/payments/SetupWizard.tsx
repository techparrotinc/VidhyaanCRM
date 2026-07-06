'use client'

import React, { useState } from 'react'
import {
  CreditCard, Eye, EyeOff, Copy, Check, ExternalLink,
  ShieldCheck, Loader2, AlertCircle
} from 'lucide-react'

type Environment = 'TEST' | 'LIVE'

type Props = {
  environment: Environment
  /** Re-runs for key rotation too — parent decides when to show the wizard. */
  onComplete: () => void
  onCancel?: () => void
}

const STEPS = ['Provider', 'Credentials', 'Webhook', 'Activate'] as const

async function jsonOrThrow(res: Response) {
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error ?? 'Request failed')
  }
  return body
}

export default function SetupWizard({ environment, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const [allowPartial, setAllowPartial] = useState(true)
  const [minPartial, setMinPartial] = useState('500')

  const envLabel = environment === 'TEST' ? 'Test' : 'Live'
  const keyPrefix = environment === 'TEST' ? 'rzp_test_' : 'rzp_live_'

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const saveAndVerify = async () => {
    setBusy(true)
    setError(null)
    try {
      const saved = await jsonOrThrow(await fetch(`/api/v1/payment-gateway/config/${environment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId: keyId.trim(), keySecret: keySecret.trim() })
      }))
      setWebhookUrl(saved.data.webhookUrl)
      setWebhookSecret(saved.data.webhookSecret)

      await jsonOrThrow(await fetch(`/api/v1/payment-gateway/config/${environment}/verify`, {
        method: 'POST'
      }))
      setKeySecret('')
      setStep(2)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const activate = async () => {
    setBusy(true)
    setError(null)
    try {
      await jsonOrThrow(await fetch('/api/v1/payment-gateway/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEnvironment: environment,
          allowPartial,
          minPartialAmount: allowPartial && minPartial ? Number(minPartial) : null
        })
      }))
      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                i < step ? 'bg-[#1565D8] text-white'
                : i === step ? 'border-2 border-[#1565D8] text-[#1565D8]'
                : 'border border-slate-300 text-slate-400'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className={`text-xs ${i === step ? 'font-semibold text-slate-800' : 'font-normal text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm font-medium text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Provider */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="border-2 border-[#1565D8] bg-blue-50/50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg border border-blue-100 flex items-center justify-center text-[#1565D8]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Razorpay</p>
              <p className="text-xs font-normal text-slate-500">UPI, cards, netbanking &amp; wallets. Settles to your own Razorpay account.</p>
            </div>
            <Check className="w-4 h-4 text-[#1565D8]" />
          </div>
          <p className="text-xs font-normal text-slate-400">
            More providers (Cashfree, PayU, Stripe) are on the roadmap.
          </p>
          <div className="flex justify-end gap-3">
            {onCancel && (
              <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">
                Cancel
              </button>
            )}
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Credentials */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Key ID ({envLabel} mode)</label>
              <input
                value={keyId}
                onChange={e => setKeyId(e.target.value)}
                placeholder={`${keyPrefix}…`}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Key Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={keySecret}
                  onChange={e => setKeySecret(e.target.value)}
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs font-normal text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <span>
              Keys are encrypted at rest and never shown again. Find them in Razorpay
              Dashboard → Account &amp; Settings → API Keys.{' '}
              <a href="https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1565D8] inline-flex items-center gap-0.5">
                Razorpay docs <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStep(0)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">
              Back
            </button>
            <button
              onClick={saveAndVerify}
              disabled={busy || !keyId.startsWith(keyPrefix) || keySecret.trim().length < 8}
              className="px-4 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify &amp; Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Webhook */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-normal leading-relaxed text-slate-500">
            Add this webhook in Razorpay Dashboard → Account &amp; Settings → Webhooks,
            subscribed to <span className="font-mono text-xs">payment.captured</span>,{' '}
            <span className="font-mono text-xs">payment.failed</span>,{' '}
            <span className="font-mono text-xs">refund.processed</span> and{' '}
            <span className="font-mono text-xs">order.paid</span>.
          </p>
          {([['Webhook URL', webhookUrl], ['Webhook Secret', webhookSecret]] as const).map(([label, value]) => (
            <div key={label}>
              <label className="text-xs font-semibold text-slate-600 block mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 truncate select-text">
                  {value}
                </code>
                <button
                  onClick={() => copy(label, value)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-[#1565D8]"
                  title={`Copy ${label}`}
                >
                  {copied === label ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs font-medium text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            The secret is shown only once. Copy it now — re-saving your keys generates a new one.
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold">
              I&apos;ve added it
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Policies + activate */}
      {step === 3 && (
        <div className="space-y-4">
          <label className="flex items-center justify-between border border-slate-200 rounded-xl p-4 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-800">Allow partial payments</p>
              <p className="text-xs font-normal text-slate-500">Parents can pay fees in instalments.</p>
            </div>
            <input
              type="checkbox"
              checked={allowPartial}
              onChange={e => setAllowPartial(e.target.checked)}
              className="w-4 h-4 accent-[#1565D8]"
            />
          </label>
          {allowPartial && (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Minimum partial amount (₹)</label>
              <input
                type="number"
                min={1}
                value={minPartial}
                onChange={e => setMinPartial(e.target.value)}
                className="w-40 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">
              Back
            </button>
            <button
              onClick={activate}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Activate {envLabel} payments
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
