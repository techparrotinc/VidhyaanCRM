"use client"

// BYO custom sending domain (Enterprise) — verify a domain in Amazon SES so
// campaigns send From the school's own brand instead of send.vidhyaan.com.

import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, Mail, CheckCircle2, Copy, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { appAlert } from '@/components/ui/app-alert'
import { useConfirm } from '@/components/ui/confirm-dialog'

interface DnsRecord { type: string; name: string; value: string }
interface DomainState {
  eligible: boolean
  configured: boolean
  domain?: string
  fromLocalPart?: string
  fromName?: string | null
  fromEmail?: string
  status?: 'PENDING' | 'VERIFIED' | 'FAILED'
  verifiedAt?: string | null
  lastCheckedAt?: string | null
  dnsRecords?: DnsRecord[]
  dkimStatus?: string
}

export default function SendingDomainPage() {
  const confirm = useConfirm()
  const [state, setState] = useState<DomainState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [domain, setDomain] = useState('')
  const [fromLocalPart, setFromLocalPart] = useState('no-reply')
  const [fromName, setFromName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/settings/sending-domain')
      const json = await res.json()
      if (json.success) setState(json.data)
    } catch {
      appAlert('Failed to load sending domain')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRegister() {
    if (!domain.trim()) { appAlert('Enter a domain'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/v1/settings/sending-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), fromLocalPart: fromLocalPart.trim() || 'no-reply', fromName: fromName.trim() || null }),
      })
      const json = await res.json()
      if (json.success) { setState((s) => ({ ...(s as DomainState), ...json.data })); appAlert('Domain registered — add the DNS records, then verify.') }
      else appAlert(json.error || 'Failed to register domain')
    } finally { setBusy(false) }
  }

  async function handleVerify() {
    setBusy(true)
    try {
      const res = await fetch('/api/v1/settings/sending-domain', { method: 'PATCH' })
      const json = await res.json()
      if (json.success) {
        setState((s) => ({ ...(s as DomainState), ...json.data }))
        appAlert(json.data.status === 'VERIFIED' ? 'Domain verified — campaigns now send from your domain.' : 'Not verified yet. DNS can take up to a few hours to propagate.')
      } else appAlert(json.error || 'Verify failed')
    } finally { setBusy(false) }
  }

  async function handleRemove() {
    if (!(await confirm({ title: 'Remove sending domain?', message: 'Campaigns will revert to sending from the shared Vidhyaan domain.', confirmLabel: 'Remove' }))) return
    setBusy(true)
    try {
      await fetch('/api/v1/settings/sending-domain', { method: 'DELETE' })
      setDomain(''); setFromName('')
      await load()
    } finally { setBusy(false) }
  }

  const copy = (v: string) => { navigator.clipboard.writeText(v); appAlert('Copied') }

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
  }

  if (state && !state.eligible) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Sending Domain</h1>
        <p className="text-sm text-slate-500 mb-6">Send campaigns from your own email domain.</p>
        <Card className="p-6 bg-amber-50 border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Available on the Enterprise plan</p>
            <p className="text-sm text-amber-700 mt-1">
              A custom sending domain lets your campaigns send from your own address (e.g. <span className="font-mono">no-reply@yourschool.edu</span>) with your own deliverability reputation. Upgrade to Enterprise to enable it.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const status = state?.status
  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Sending Domain</h1>
        <p className="text-sm text-slate-500">Send campaigns from your own email domain instead of the shared Vidhyaan domain.</p>
      </div>

      {/* SETUP FORM */}
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-slate-600 block mb-1">Domain</label>
            <input
              value={state?.configured ? state.domain : domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={state?.configured}
              placeholder="mail.yourschool.edu"
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1565D8] disabled:bg-slate-50 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">From (local part)</label>
            <input
              value={state?.configured ? state.fromLocalPart : fromLocalPart}
              onChange={(e) => setFromLocalPart(e.target.value)}
              disabled={state?.configured}
              placeholder="no-reply"
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1565D8] disabled:bg-slate-50 font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-600 block mb-1">From name (optional)</label>
            <input
              value={state?.configured ? (state.fromName ?? '') : fromName}
              onChange={(e) => setFromName(e.target.value)}
              disabled={state?.configured}
              placeholder="Your School Name"
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1565D8] disabled:bg-slate-50"
            />
          </div>
        </div>

        {!state?.configured ? (
          <Button onClick={handleRegister} disabled={busy} className="bg-[#1565D8] hover:bg-[#1254bb] text-white text-sm font-semibold flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Register domain
          </Button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}>
              {status === 'VERIFIED' ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</> : 'Pending verification'}
            </Badge>
            {state.fromEmail && <span className="text-sm text-slate-600 font-mono">{state.fromEmail}</span>}
            {status !== 'VERIFIED' && (
              <Button onClick={handleVerify} disabled={busy} className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1">
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Check verification
              </Button>
            )}
            <Button onClick={handleRemove} disabled={busy} className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Remove
            </Button>
          </div>
        )}
      </Card>

      {/* DNS RECORDS */}
      {state?.configured && state.dnsRecords && (
        <Card className="p-6 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Add these DNS records</p>
            <p className="text-xs text-slate-500 mt-1">
              Publish these at your DNS host. The 3 CNAMEs prove ownership + enable DKIM signing; the TXT records add SPF & DMARC. Then click <span className="font-semibold">Check verification</span>. On Cloudflare set the CNAMEs to <span className="font-semibold">DNS-only (grey cloud)</span>.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-3 font-semibold">Type</th>
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Value</th>
                  <th className="py-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {state.dnsRecords.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 align-top">
                    <td className="py-2 pr-3 text-slate-700">{r.type}</td>
                    <td className="py-2 pr-3 text-slate-700 break-all">{r.name}</td>
                    <td className="py-2 pr-3 text-slate-700 break-all">{r.value}</td>
                    <td className="py-2">
                      <button onClick={() => copy(r.value)} className="text-slate-400 hover:text-[#1565D8]" title="Copy value">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
