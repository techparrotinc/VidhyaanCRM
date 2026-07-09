'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Me = { id: string; name: string; email: string | null; phone: string | null }

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Email change flow
  const [emailMode, setEmailMode] = useState<'idle' | 'entering' | 'coding'>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/v1/account')
      const j = await res.json()
      const data: Me = j.data
      setMe(data)
      setName(data.name ?? '')
      setPhone(data.phone ?? '')
    })()
  }, [])

  const err = (j: any) => j?.details && typeof j.details === 'object' ? (Object.values(j.details)[0] as any)?.[0] : (j?.error || 'Something went wrong')

  const saveProfile = async () => {
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/v1/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(err(j))
      setMe(j.data); setMsg({ ok: true, text: 'Saved' })
    } catch (e: any) {
      setMsg({ ok: false, text: e.message })
    } finally { setSaving(false) }
  }

  const sendCode = async () => {
    setEmailBusy(true); setEmailMsg(null)
    try {
      const res = await fetch('/api/v1/account/email/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(err(j))
      setEmailMode('coding'); setEmailMsg({ ok: true, text: `Code sent to ${newEmail.trim()}` })
    } catch (e: any) {
      setEmailMsg({ ok: false, text: e.message })
    } finally { setEmailBusy(false) }
  }

  const verifyCode = async () => {
    setEmailBusy(true); setEmailMsg(null)
    try {
      const res = await fetch('/api/v1/account/email/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim(), code: code.trim() }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(err(j))
      setMe(j.data); setEmailMode('idle'); setNewEmail(''); setCode('')
      setEmailMsg({ ok: true, text: 'Email updated' })
    } catch (e: any) {
      setEmailMsg({ ok: false, text: e.message })
    } finally { setEmailBusy(false) }
  }

  if (!me) return <p className="text-sm text-slate-400">Loading…</p>

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Account</h1>
        <p className="mt-1 text-sm text-slate-500">Update your own name, phone and login email.</p>
      </div>

      {/* Name + phone */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <Field label="Full Name">
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={phone} inputMode="numeric" placeholder="10-digit mobile" onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <div className="flex items-center gap-3">
          <Button disabled={saving || !name.trim()} onClick={saveProfile} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
          </Button>
          {msg && (
            <span className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
              {msg.ok && <CheckCircle2 className="mr-1 inline h-4 w-4" />}{msg.text}
            </span>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Login Email</p>
            <p className="truncate text-sm font-medium text-slate-800">{me.email || '—'}</p>
          </div>
          {emailMode === 'idle' && (
            <Button variant="outline" className="shrink-0 gap-2" onClick={() => { setEmailMode('entering'); setEmailMsg(null) }}>
              <Mail className="h-4 w-4" /> Change
            </Button>
          )}
        </div>

        {emailMode !== 'idle' && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <Field label="New email">
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={newEmail} disabled={emailMode === 'coding'} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" />
            </Field>

            {emailMode === 'coding' && (
              <Field label="Verification code">
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tracking-widest" value={code} inputMode="numeric" placeholder="4-digit code" onChange={(e) => setCode(e.target.value)} />
              </Field>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {emailMode === 'entering' ? (
                <Button disabled={emailBusy || !newEmail.trim()} onClick={sendCode} className="gap-2">
                  {emailBusy && <Loader2 className="h-4 w-4 animate-spin" />} Send code
                </Button>
              ) : (
                <Button disabled={emailBusy || !code.trim()} onClick={verifyCode} className="gap-2">
                  {emailBusy && <Loader2 className="h-4 w-4 animate-spin" />} Verify & update
                </Button>
              )}
              <Button variant="ghost" onClick={() => { setEmailMode('idle'); setNewEmail(''); setCode(''); setEmailMsg(null) }}>Cancel</Button>
              {emailMsg && <span className={`text-sm ${emailMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{emailMsg.text}</span>}
            </div>
            <p className="text-xs text-slate-400">We send a code to the new address to confirm you own it. Your email only changes after you verify.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</label>
      {children}
    </div>
  )
}
