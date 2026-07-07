'use client'

import React, { useState } from 'react'
import { Megaphone, Loader2, CheckCircle2, Users, Mail, MessageSquare, Globe } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Audience = 'PARENTS' | 'LEADS' | 'ALL'

const AUDIENCES: { value: Audience; label: string; hint: string }[] = [
  { value: 'PARENTS', label: 'Parents of students', hint: 'Guardians of all active students' },
  { value: 'LEADS', label: 'Open leads', hint: 'Enquiries not yet converted or closed' },
  { value: 'ALL', label: 'Both', hint: 'Parents + open leads (deduplicated)' }
]

export default function AnnounceModal({
  eventId,
  eventTitle,
  open,
  onClose
}: {
  eventId: string
  eventTitle: string
  open: boolean
  onClose: () => void
}) {
  const [audience, setAudience] = useState<Audience>('PARENTS')
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ recipients: number; sent: number; failed: number } | null>(null)

  const send = async () => {
    const channels = ['PORTAL', ...(email ? ['EMAIL'] : []), ...(sms ? ['SMS'] : [])]
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/events/${eventId}/announce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, channels })
      })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || json.error || 'Failed to announce')
      }
      setResult(json.data)
    } catch (e: any) {
      setError(e.message || 'Failed to announce')
    } finally {
      setSending(false)
    }
  }

  const close = () => {
    setResult(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white text-left">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Megaphone className="h-5 w-5 text-[#1565D8]" /> Announce event
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-4 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">Announcement sent</p>
            <p className="text-sm text-slate-500">
              {result.recipients} recipient{result.recipients !== 1 ? 's' : ''} · {result.sent} delivered
              {result.failed > 0 && ` · ${result.failed} failed`}
            </p>
            <button onClick={close} className="mt-2 px-5 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold cursor-pointer">
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-slate-500 -mt-1">“{eventTitle}”</p>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                <Users size={12} /> Who
              </p>
              <div className="space-y-2">
                {AUDIENCES.map((a) => (
                  <label key={a.value} className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-slate-100 p-2.5 hover:border-blue-200">
                    <input type="radio" checked={audience === a.value} onChange={() => setAudience(a.value)} className="mt-0.5 accent-[#1565D8]" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">{a.label}</span>
                      <span className="block text-xs text-slate-400">{a.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Channels</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5">
                  <Globe size={15} className="text-green-600 shrink-0" />
                  <span className="text-sm text-slate-600 flex-1">Parent portal events tab</span>
                  <span className="text-[10px] font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5">Always on · Free</span>
                </div>
                <label className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2.5 cursor-pointer hover:border-blue-200">
                  <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="accent-[#1565D8]" />
                  <Mail size={15} className="text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 flex-1">Email</span>
                  <span className="text-[10px] font-semibold text-slate-400">Free</span>
                </label>
                <label className="flex items-center gap-2.5 rounded-lg border border-slate-100 p-2.5 cursor-pointer hover:border-blue-200">
                  <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="accent-[#1565D8]" />
                  <MessageSquare size={15} className="text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 flex-1">SMS</span>
                  <span className="text-[10px] font-semibold text-amber-600">1 credit / message</span>
                </label>
                <p className="text-[11px] text-slate-400 pl-1">
                  WhatsApp announcements need an approved template — use Campaigns for WhatsApp blasts.
                </p>
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={close} disabled={sending}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 cursor-pointer">
                Not now
              </button>
              <button onClick={send} disabled={sending}
                className="px-5 py-2 rounded-lg bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send announcement'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
