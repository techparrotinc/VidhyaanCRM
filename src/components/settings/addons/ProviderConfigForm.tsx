'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, CheckCircle2, Unplug } from 'lucide-react'
import type { AddonProvider } from './types'

type Props = {
  channel: 'SMS' | 'WHATSAPP'
  provider: AddonProvider
  onMutate: () => void
  onToast: (type: 'success' | 'error', message: string) => void
}

export default function ProviderConfigForm({ channel, provider, onMutate, onToast }: Props) {
  const isSms = channel === 'SMS'
  const [editing, setEditing] = useState(!provider.configured)
  const [authKey, setAuthKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [senderId, setSenderId] = useState(provider.senderId ?? '')
  const [smsFlowId, setSmsFlowId] = useState(provider.smsFlowId ?? '')
  const [whatsappNumber, setWhatsappNumber] = useState(provider.whatsappNumber ?? '')
  const [testPhone, setTestPhone] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const base = `/api/v1/settings/addons/messaging/${channel.toLowerCase()}/provider`

  const call = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try {
      await fn()
    } catch (err: any) {
      onToast('error', err.message || 'Request failed')
    } finally {
      setBusy(null)
    }
  }

  const handleSave = () =>
    call('save', async () => {
      const res = await fetch(base, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'MSG91',
          authKey,
          senderId: isSms ? senderId || null : null,
          smsFlowId: isSms ? smsFlowId || null : null,
          whatsappNumber: !isSms ? whatsappNumber || null : null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save credentials')
      onToast('success', 'Credentials saved. Send a test message to verify.')
      setAuthKey('')
      setEditing(false)
      onMutate()
    })

  const handleVerify = () =>
    call('verify', async () => {
      const res = await fetch(`${base}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhone })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      if (data.data?.verified) {
        onToast('success', 'Verified! Sends now use your own account — Vidhyaan credits are not consumed.')
        onMutate()
      } else {
        onToast('error', data.data?.error || 'Test send failed — check your credentials.')
      }
    })

  const handleDisconnect = () =>
    call('disconnect', async () => {
      if (!window.confirm('Disconnect your own account? Sends will use Vidhyaan credits again.')) return
      const res = await fetch(base, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to disconnect')
      onToast('success', 'Disconnected. Sends fall back to Vidhyaan credits.')
      setEditing(true)
      onMutate()
    })

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            Use your own {isSms ? 'SMS' : 'WhatsApp'} account
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect your MSG91 account — messages then go through it and never consume Vidhyaan credits.
          </p>
        </div>
        {provider.status === 'VERIFIED' && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified · your account in use
          </span>
        )}
        {provider.status === 'DRAFT' && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
            Saved — verification pending
          </span>
        )}
      </div>

      {provider.configured && !editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Auth Key</p>
              <p className="font-mono font-semibold text-slate-700 mt-0.5">••••{provider.authKeyLast4}</p>
            </div>
            {isSms ? (
              <>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sender ID</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{provider.senderId || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">SMS Flow ID</p>
                  <p className="font-mono font-semibold text-slate-700 mt-0.5">{provider.smsFlowId || '—'}</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">WhatsApp Number</p>
                <p className="font-semibold text-slate-700 mt-0.5">{provider.whatsappNumber || '—'}</p>
              </div>
            )}
          </div>

          {provider.status !== 'VERIFIED' && (
            <div className="flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">
                  Test phone (10-digit)
                </label>
                <input
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98XXXXXXXX"
                  className={inputClass}
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={testPhone.length !== 10 || busy === 'verify'}
                className="h-9 px-4 text-xs font-bold bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                {busy === 'verify' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send test & verify
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-bold text-[#1565D8] hover:underline"
            >
              Update credentials
            </button>
            <button
              onClick={handleDisconnect}
              disabled={busy === 'disconnect'}
              className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
            >
              <Unplug className="w-3.5 h-3.5" /> Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">
              MSG91 Auth Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={authKey}
                onChange={e => setAuthKey(e.target.value)}
                placeholder="Paste your MSG91 auth key"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSms ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">
                  DLT Sender ID
                </label>
                <input
                  value={senderId}
                  onChange={e => setSenderId(e.target.value)}
                  placeholder="e.g. SCHOOL"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">
                  SMS Flow / Template ID
                </label>
                <input
                  value={smsFlowId}
                  onChange={e => setSmsFlowId(e.target.value)}
                  placeholder="MSG91 flow id"
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">
                WhatsApp Integrated Number
              </label>
              <input
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="91XXXXXXXXXX"
                className={inputClass}
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={authKey.length < 8 || busy === 'save'}
              className="h-9 px-4 text-xs font-bold bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              {busy === 'save' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save credentials
            </button>
            {provider.configured && (
              <button
                onClick={() => setEditing(false)}
                className="h-9 px-4 text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
