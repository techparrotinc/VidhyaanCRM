"use client"

import React, { useState } from 'react'
import { Megaphone, Send, Loader2, Users, Mail, Bell, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [channel, setChannel] = useState<'IN_APP' | 'EMAIL' | 'BOTH'>('IN_APP')
  const [sending, setSending] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [result, setResult] = useState<{ sent: number; emailsSent: number } | null>(null)

  const submit = async () => {
    if (!title.trim() || !message.trim()) { alert('Title and message are required'); return }
    try {
      setSending(true)
      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: 'all', title, message, type: 'PLATFORM_ANNOUNCEMENT', channel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Broadcast failed')
      setResult({ sent: json.sent, emailsSent: json.emailsSent })
      setConfirm(false)
      setTitle(''); setMessage('')
    } catch (e: any) {
      alert(e.message || 'Broadcast failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen max-w-3xl">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-blue-600" /> Announcements
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Broadcast a message to every organization on the platform</p>
      </div>

      {result && (
        <Card className="p-4 bg-emerald-50 border-emerald-200 shadow-sm">
          <p className="text-sm font-bold text-emerald-800">✓ Sent to {result.sent} organizations{result.emailsSent ? `, ${result.emailsSent} emails delivered` : ''}.</p>
        </Card>
      )}

      <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
            placeholder="e.g. Scheduled maintenance this weekend"
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-semibold text-slate-700 outline-hidden focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} rows={6}
            placeholder="Write your announcement…"
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 outline-hidden focus:border-blue-500 resize-none leading-relaxed" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Channel</label>
          <div className="flex gap-2">
            {([['IN_APP', 'In-app', Bell], ['EMAIL', 'Email', Mail], ['BOTH', 'Both', Users]] as const).map(([val, label, Icon]) => (
              <button key={val} onClick={() => setChannel(val)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition ${channel === val ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs font-semibold text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          This goes to <strong>all organizations</strong>{channel !== 'IN_APP' ? ' and emails their primary contact' : ''}. This cannot be undone.
        </div>

        {!confirm ? (
          <Button onClick={() => { if (title.trim() && message.trim()) setConfirm(true); else alert('Title and message are required') }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 flex items-center gap-1.5">
            <Send className="w-4 h-4" /> Review &amp; Send
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={sending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 flex items-center gap-1.5 disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Confirm broadcast to all orgs
            </Button>
            <Button onClick={() => setConfirm(false)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold py-2.5 px-4 text-sm">Cancel</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
