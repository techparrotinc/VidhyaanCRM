'use client'

import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, Loader2, KeyRound, Power, Copy, Eye, RefreshCw } from 'lucide-react'
import type { MaskedGatewayConfig } from '@/lib/payments/config'

type Props = {
  configs: MaskedGatewayConfig[]
  webhookUrl: string
  onMutate: () => void
  /** Open the wizard for a given environment (fresh setup or key rotation). */
  onRotate: (environment: 'TEST' | 'LIVE') => void
}

function timeAgo(date: string | Date | null): string {
  if (!date) return 'never'
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VERIFIED: 'bg-blue-50 text-blue-700 border-blue-200',
  DRAFT: 'bg-slate-50 text-slate-500 border-slate-200',
  DISABLED: 'bg-slate-100 text-slate-400 border-slate-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200'
}

export default function GatewayOverview({ configs, webhookUrl, onMutate, onRotate }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const current = configs.find(c => c.isCurrent)
  const policySource = current ?? configs[0]
  const secretEnv = policySource?.environment

  const secretAction = async (method: 'GET' | 'POST') => {
    if (!secretEnv) return
    if (method === 'GET' && revealedSecret) {
      setRevealedSecret(null)
      return
    }
    setBusy('secret')
    setError(null)
    try {
      const res = await fetch(`/api/v1/payment-gateway/config/${secretEnv}/webhook-secret`, { method })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Request failed')
      setRevealedSecret(body.data.webhookSecret)
      if (method === 'POST') onMutate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const call = async (key: string, fn: () => Promise<Response>) => {
    setBusy(key)
    setError(null)
    try {
      const res = await fn()
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? 'Request failed')
      onMutate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const switchEnv = (environment: 'TEST' | 'LIVE') =>
    call(`switch-${environment}`, () => fetch('/api/v1/payment-gateway/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentEnvironment: environment })
    }))

  const updatePolicy = (patch: Record<string, unknown>) =>
    call('policy', () => fetch('/api/v1/payment-gateway/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    }))

  const disable = (environment: 'TEST' | 'LIVE') => {
    if (!window.confirm(`Disable ${environment.toLowerCase()} payments? Parents will no longer be able to pay online. In-flight payments still settle.`)) return
    call(`disable-${environment}`, () => fetch(`/api/v1/payment-gateway/config/${environment}`, { method: 'DELETE' }))
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm font-medium text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Environment cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {(['TEST', 'LIVE'] as const).map(environment => {
          const config = configs.find(c => c.environment === environment)
          return (
            <div key={environment} className={`border rounded-xl p-5 space-y-3 ${config?.isCurrent ? 'border-[#1565D8] bg-blue-50/30' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{environment === 'TEST' ? 'Test mode' : 'Live mode'}</span>
                  {config?.isCurrent && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1565D8] text-white">Current</span>
                  )}
                </div>
                {config && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[config.status] ?? STATUS_BADGE.DRAFT}`}>
                    {config.status}
                  </span>
                )}
              </div>

              {config ? (
                <>
                  <dl className="text-xs font-normal text-slate-500 space-y-1.5">
                    <div className="flex justify-between">
                      <dt>Key</dt>
                      <dd className="font-mono text-slate-700">rzp_{environment.toLowerCase()}_••••{config.keyIdLast4}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Credentials</dt>
                      <dd className="inline-flex items-center gap-1">
                        {config.verifiedAt
                          ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified</>
                          : <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Not verified</>}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Webhook</dt>
                      <dd className="inline-flex items-center gap-1">
                        {config.lastWebhookAt
                          ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Healthy · {timeAgo(config.lastWebhookAt)}</>
                          : <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> No events yet</>}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex items-center gap-2 pt-1">
                    {!config.isCurrent && config.verifiedAt && config.status !== 'SUSPENDED' && (
                      <button
                        onClick={() => switchEnv(environment)}
                        disabled={busy !== null}
                        className="text-xs font-semibold text-[#1565D8] inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        {busy === `switch-${environment}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                        Make current
                      </button>
                    )}
                    <button
                      onClick={() => onRotate(environment)}
                      className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Rotate keys
                    </button>
                    <button
                      onClick={() => disable(environment)}
                      disabled={busy !== null}
                      className="text-xs font-semibold text-red-500 ml-auto disabled:opacity-50"
                    >
                      Disable
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs font-normal text-slate-400">Not configured</p>
                  <button
                    onClick={() => onRotate(environment)}
                    className="text-xs font-semibold text-[#1565D8]"
                  >
                    Set up {environment.toLowerCase()} keys
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Webhook URL */}
      <div className="border border-slate-200 rounded-xl p-5 space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Webhook endpoint</h4>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 overflow-x-auto select-text">
            {webhookUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(webhookUrl)
              setCopiedUrl(true)
              setTimeout(() => setCopiedUrl(false), 2000)
            }}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-[#1565D8] shrink-0"
            title="Copy webhook URL"
          >
            {copiedUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        {revealedSecret && (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono text-slate-700 overflow-x-auto select-text">
              {revealedSecret}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(revealedSecret)
                setCopiedSecret(true)
                setTimeout(() => setCopiedSecret(false), 2000)
              }}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-[#1565D8] shrink-0"
              title="Copy webhook secret"
            >
              {copiedSecret ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => secretAction('GET')}
            disabled={busy !== null || !secretEnv}
            className="text-xs font-semibold text-[#1565D8] inline-flex items-center gap-1 disabled:opacity-50"
          >
            {busy === 'secret' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            {revealedSecret ? 'Hide secret' : 'Reveal secret'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Rotate the webhook secret? You must update it in the Razorpay dashboard, or webhooks will stop verifying.')) {
                secretAction('POST')
              }
            }}
            disabled={busy !== null || !secretEnv}
            className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Rotate secret
          </button>
        </div>
        <p className="text-xs font-normal text-slate-400">
          The signing secret stays stable when you rotate API keys. Rotating it here requires
          updating the webhook in your Razorpay dashboard.
        </p>
      </div>

      {/* Policies */}
      {policySource && (
        <div className="border border-slate-200 rounded-xl p-5 space-y-4">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Policies</h4>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-800">Allow partial payments</p>
              <p className="text-xs font-normal text-slate-500">Parents can pay fees in instalments.</p>
            </div>
            <input
              type="checkbox"
              checked={policySource.allowPartial}
              disabled={busy !== null}
              onChange={e => updatePolicy({ allowPartial: e.target.checked })}
              className="w-4 h-4 accent-[#1565D8]"
            />
          </label>
          {policySource.allowPartial && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Minimum partial amount (₹)</label>
              <input
                type="number"
                min={1}
                defaultValue={policySource.minPartialAmount ?? ''}
                disabled={busy !== null}
                onBlur={e => {
                  const value = e.target.value ? Number(e.target.value) : null
                  if (value !== (policySource.minPartialAmount ? Number(policySource.minPartialAmount) : null)) {
                    updatePolicy({ minPartialAmount: value })
                  }
                }}
                className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
              />
              {busy === 'policy' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
